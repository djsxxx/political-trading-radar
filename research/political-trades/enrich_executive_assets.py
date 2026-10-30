"""Read OGE value columns, preserve ownership/context, exclude parent overlap.
Run after build_shared_inputs.py. Original PDFs and extracted table cells retained.
No income values, ownership-percentage multipliers, or guessed valuations.
"""
import collections, datetime, hashlib, json, re
from pathlib import Path
import pdfplumber

ROOT=Path(__file__).resolve().parents[2]
PUBLIC=ROOT/'frontend/public'
RAW=ROOT/'research/political-trades/annual-executive-raw'
dest=PUBLIC/'executive-assets.json'
base=RAW/'executive-assets-v10.json'
if not base.exists(): base.write_bytes(dest.read_bytes())
data=json.loads(base.read_text())

def clean(x): return re.sub(r'\s+',' ',x or '').strip()
def value(x):
    s=clean(x).replace(', ', ',')
    if re.fullmatch(r'None \(or less than \$1,001\)',s,re.I): return 0,1000,False
    m=re.fullmatch(r'Over\s*\$([\d,]+)',s,re.I)
    if m: return int(m[1].replace(',',''))+1,int(m[1].replace(',',''))+1,True
    m=re.fullmatch(r'\$([\d,]+)\s*(?:-|to)\s*\$([\d,]+)',s,re.I)
    if m: return int(m[1].replace(',','')),int(m[2].replace(',','')),False
    return None,None,False

def category(name,note):
    if re.search(r'cryptocurrency wallet|\bBitcoin\b|\bEthereum\b|\bUSDC\b|Etherium staked',name,re.I): return 'CRYPTO'
    if re.search(r'\bNFT|license agreement|publishing|carried interest',name,re.I): return 'BUSINESS'
    if re.search(r'bank account|cash|money market|savings|checking',name,re.I): return 'CASH'
    if re.search(r'\bETF\b|\bSPY\b|Fund [I1V]|Seed Fund|Portfolio',name,re.I): return 'FUNDS'
    if 'stock' in name.lower() and 'option' not in name.lower(): return 'STOCKS'
    if 'real estate' in name.lower(): return 'REAL_ESTATE'
    return 'BUSINESS'

def read_rows(pdf_path,pages,section,columns,owner):
    result=[];raw=[]
    with pdfplumber.open(pdf_path) as pdf:
      for page in pages:
        for table in pdf.pages[page-1].extract_tables():
          for row in table:
            if not row or not re.fullmatch(r'\d+(?:\.\d+)*(?:[a-z])?\.?',clean(row[0])): continue
            num=clean(row[0]).rstrip('.')
            if len(row)<=max(columns.values()): continue
            cells={k:clean(row[i]) for k,i in columns.items()}
            if not cells['name']: continue
            raw.append(dict(page=page,row=num,cells=cells))
            low,high,opened=value(cells['value'])
            cat=category(cells['name'],cells.get('note',''))
            parent=re.sub(r'\.[^.]+$','',num) if '.' in num else None
            result.append(dict(assetName=cells['name'],account=f'{section} · PDF第{page}页 · 行{num}',sourceSection=section,sourcePage=page,sourceRow=num,sourceId=f'{section}:{num}',parentId=f'{section}:{parent}' if parent else None,ownershipText=cells.get('ownership',''),disclosureNote=cells.get('note',''),ticker=None,assetType='OGE original value-column extraction',category=cat,categoryLabel=cat,owner=owner,valueText=cells['value'] or '原件价值栏未列明',valueLow=low,valueHigh=high,valueOpenEnded=opened,includedInTotal=low is not None))
    (RAW/(pdf_path.stem+'-'+section.replace(' ','-')+'-cells.json')).write_text(json.dumps(raw,ensure_ascii=False,indent=2))
    return result

def resolve(rows):
    ids=collections.Counter(h['sourceId'] for h in rows)
    children=collections.defaultdict(list)
    for h in rows:
        if h.get('parentId'): children[h['parentId']].append(h)
    for h in rows:
        refs=bool(re.search(r'\bsee\s+lines?\b|pass.thr',h.get('disclosureNote','')+' '+h['assetName'],re.I))
        own_scope=bool(re.search(r'(?:value[^.]{0,110}(?:bank account only|only from bank account|only from real estate|from real estate))',h.get('disclosureNote',''),re.I))
        owned_children=[]
        identity=re.sub(r'\s*\(.*','',h['assetName']).strip().lower()
        if len(identity)>12:
            owned_children=[c for c in rows if c is not h and identity in c.get('ownershipText','').lower() and c['valueLow'] is not None]
        valued_children=[c for c in children[h['sourceId']] if c['valueLow'] is not None]
        reason=None
        if ids[h['sourceId']]>1: reason='原件行号跨页重复或续行，待复核，不重复计入'
        elif (valued_children or owned_children) and not own_scope: reason='父级企业/账户；底层资产另列，不叠加父级估值'
        elif refs and not own_scope: reason='引用其他申报行；重叠范围未核实，不重复计入'
        elif h['valueLow'] is None: reason='原件资产价值未列明/不可可靠确定；收入不替代资产价值'
        if reason: h['includedInTotal']=False;h['exclusionReason']=reason
        else: h['includedInTotal']=True;h['exclusionReason']=None
        if own_scope: h['valuationScope']='原件明确：仅该行自有银行账户/房地产价值，不含所引用的其他资产'
    by_id={h['sourceId']:h for h in rows}
    for h in rows:
        parent=by_id.get(h.get('parentId'))
        if parent and not h.get('ownershipText') and parent.get('ownershipText'):
            h['ownershipText']='父级 '+parent['assetName']+' 的原件持有关系：'+parent['ownershipText']+'；仅作关系披露，不确认最终经济权益或再乘比例。'
    return rows

trump=next(e for e in data['reports'] if e['member']['id']=='US-PRESIDENT')
trump_pdf=RAW/'trump-2025-official.pdf'
t2=read_rows(trump_pdf,range(848,871),'OGE Part 2',{'name':1,'note':2,'value':4,'ownership':7},'self')
t5=read_rows(trump_pdf,[6],'OGE Part 5',{'name':1,'value':3},'spouse')
assert {str(i) for i in range(1,453)}.issubset({h['sourceRow'] for h in t2})
t2=[h for h in t2 if h['assetName'].lower()!='intentionally left blank']
resolve(t2);resolve(t5)

# The scanned Vance form's OCR row numbers are not reliable. Transcribe the
# small asset-value sections only; page and actual row ID retained for review.
vance=next(e for e in data['reports'] if e['member']['id']=='US-VICE-PRESIDENT')
v2_specs=[
 ('1','Charles Schwab SEP IRA',None,None,'RETIREMENT'),
 ('1.1','SPY - SPDR S&P 500 ETF',100001,250000,'FUNDS'),
 ('2','Charles Schwab IRA',None,None,'RETIREMENT'),
 ('2.1','U.S. Brokerage account (cash)',1001,15000,'CASH'),
 ('3','JD Vance Enterprises LLC',None,None,'BUSINESS'),
 ('3.1','Huntington National Bank (cash account)',1000001,5000000,'CASH'),
 ('3.2','Narya Capital Fund I, LP',500001,1000000,'FUNDS'),
 ('3.3','Rise of the Rest Seed Fund, LP',0,1000,'FUNDS'),
 ('3.4','Rise of the Rest Seed Fund AIV GP, LLC — carried interest',None,None,'BUSINESS'),
 ('3.5','Narya Capital, GP I, LLC',None,None,'BUSINESS'),
 ('3.5.1','Carried interest in Narya Capital Fund I, LP',None,None,'BUSINESS'),
 ('3.5.2','Management Fee Set Off Contribution receivable',500001,1000000,'BUSINESS'),
 ('3.5.3','Net Fee Proceeds receivable',None,None,'BUSINESS'),
 ('3.6','Narya Capital Fund II, LP',15001,50000,'FUNDS'),
]
def manual(section,specs,page,owner):
 out=[]
 for num,name,low,high,cat in specs:
  parent=re.sub(r'\.[^.]+$','',num) if '.' in num else None
  out.append(dict(assetName=name,account=f'{section} · PDF第{page}页 · 行{num}',sourceSection=section,sourcePage=page,sourceRow=num,sourceId=f'{section}:{num}',parentId=f'{section}:{parent}' if parent else None,ownershipText='',disclosureNote='',ticker='SPY' if name.startswith('SPY - ') else None,assetType='OGE visually reviewed value column',category=cat,categoryLabel=cat,owner=owner,valueText=f'${low:,} - ${high:,}' if low is not None else '原件价值未列明/不可确定',valueLow=low,valueHigh=high,valueOpenEnded=False,includedInTotal=low is not None))
 return out
v2=manual('OGE Part 2',v2_specs,3,'self')
for h in v2:
 if h['sourceRow'] in ['3.5.3','3.6']: h['sourcePage']=4;h['account']=h['account'].replace('第3页','第4页')
 if h['sourceRow'] in ['3.2','3.3','3.5.1','3.5.2','3.5.3','3.6']: h['disclosureNote']='原件备注：申报人依据最近资料作善意估计；这是原件披露金额档，并非本工具独立估值。'
# Copyright agreements are disclosed assets with unascertainable values, not
# the income/advance numbers printed beside them.
for n in range(4,30):
 page=4 if n<=10 else 5 if n<=19 else 6
 row=manual('OGE Part 2',[(str(n),'Hillbilly Elegy · copyright / publishing agreement '+str(n),None,None,'BUSINESS')],page,'self')[0]
 row['disclosureNote']='原件注明value not readily ascertainable；版税/预付款是收入，未作为资产价值'
 v2.append(row)
v5=manual('OGE Part 5',[
 ('1','Fidelity Traditional IRA',None,None,'RETIREMENT'),
 ('1.1','Fidelity Investments money market account',100001,250000,'CASH'),
 ('2','Fidelity Roth IRA',None,None,'RETIREMENT'),
 ('2.1','Fidelity Investments brokerage sweep account',1001,15000,'CASH'),
 ('2.2','SPY - SPDR S&P 500 ETF',15001,50000,'FUNDS'),
],9,'spouse')
resolve(v2);resolve(v5)

# Reconcile the previous text-only Part6 extractor against table coordinates.
# A Value cell and an adjacent Income Amount cell must never be interchangeable.
part6_cache=RAW/'trump-part6-value-cells.json'
trump_hash=hashlib.sha256(trump_pdf.read_bytes()).hexdigest()
if part6_cache.exists(): part6_proof=json.loads(part6_cache.read_text())
else:
    cells=[]
    with pdfplumber.open(trump_pdf) as doc:
      for page in range(7,159):
        for table in doc.pages[page-1].extract_tables():
          for row in table:
            if len(row)<4 or not re.fullmatch(r'\d+',clean(row[0])) or not clean(row[1]): continue
            lo,hi,op=value(row[3])
            cells.append(dict(page=page,row=clean(row[0]),name=clean(row[1]),low=lo,high=hi,open=op,valueText=clean(row[3])))
        if page%25==0:print('PART6_VALUE_COLUMN',page,flush=True)
    part6_proof=dict(sha256=trump_hash,cells=cells)
    part6_cache.write_text(json.dumps(part6_proof,ensure_ascii=False))
assert part6_proof['sha256']==trump_hash
namekey=lambda s:re.sub('[^a-z0-9]','',s.lower())
proof=collections.Counter((c['page'],c['row'],namekey(c['name']),c['low'],c['high']) for c in part6_proof['cells'])

for entry,new_rows in [(trump,t2+t5),(vance,v2+v5)]:
 r=entry['report']
 old=[]
 for i,h in enumerate(r['holdings']):
  h={**h,'sourceSection':'OGE Part 6','sourceId':f'OGE Part 6:{h.get("sourcePage",0)}:{i}','includedInTotal':True}
  if entry is trump:
   source_row=re.search(r'行(\d+)',h.get('account',''))
   h['sourceRow']=source_row[1] if source_row else ''
   key=(h.get('sourcePage'),h['sourceRow'],namekey(h['assetName']),h['valueLow'],h['valueHigh'])
   if proof[key]>0:proof[key]-=1;h['disclosureNote']='已按原件表格Value列坐标核对，未使用Income Amount列。'
   else:h['includedInTotal']=False;h['exclusionReason']='旧文本提取未通过表格价值栏坐标复核，保留原行但暂不计入';h['disclosureNote']='需逐页复核名称、行号及价值格，不以收入金额补齐。'
  old.append(h)
 r['holdings']=new_rows+old
 r['holdingsCount']=len(r['holdings']);r['total']=len(r['holdings'])
 included=[h for h in r['holdings'] if h.get('includedInTotal') and h['valueLow'] is not None]
 r.update(totalLow=sum(h['valueLow'] for h in included),totalHigh=sum(h['valueHigh'] for h in included),totalOpenEnded=any(h['valueOpenEnded'] for h in included),unvaluedCount=sum(h['valueLow'] is None for h in r['holdings']),excludedCount=len(r['holdings'])-len(included),reportLabel='2025 annual report · OGE Parts 2 / 5 / 6 已扩展核验',partial=True,categories=[])
 r['coverageNote']='已接入Part 2企业/信托与账户、Part 5配偶、Part 6其他资产；按原件资产价值栏展示。父级/引用不重复计入；不可计价、范围重叠或续行不明者仅展示原件，不计入小计。不把版税、收入、交易及负债作为资产；仍非完整净资产。'
 r['aggregationNote']=f"{r['excludedCount']}行父级、引用或不可计价项目保留展示，未纳入小计。持有比例只作关系披露，不自行再乘除或将信托额外加一遍。"
annual=json.loads((PUBLIC/'annual-assets.json').read_text())
stefanik=next(e for e in annual['reports'] if e['member']['name']=='Elise M. Stefanik')
scan=Path('/private/tmp/radar-stefanik-2025.pdf')
if scan.exists(): (RAW/'stefanik-2025-official.pdf').write_bytes(scan.read_bytes())
# Read the value-block checkbox columns visually, not the adjacent income boxes.
s_specs=[('1','Adirondack Trust Checking Account',15001,50000,'CASH'),('2','Goldman Sachs Marcus Online Savings Account',15001,50000,'CASH'),('3','EMS DC Properties (underlying asset below)',None,None,'BUSINESS'),('3.1','Residential Rental Property (Washington DC)',500001,1000000,'REAL_ESTATE'),('4','NY 529 Account (underlying asset below)',None,None,'RETIREMENT'),('4.1','Vanguard New York Target Enrollment 2041',50001,100000,'FUNDS'),('5','Ballston Spa National Bank Savings Account',15001,50000,'CASH'),('6','Newtown Bank Health Savings Account',15001,50000,'CASH'),('7','Empower Retirement 401(k) (underlying asset below)',None,None,'RETIREMENT'),('7.1','American Funds 2045 Target Retirement (AAHTX)',100001,250000,'FUNDS')]
sh=manual('House Schedule A',s_specs,2,'未注明')
for h in sh:
 n=h['sourceRow'];h['sourcePage']=3 if n in ['5','6','7','7.1'] else 2;h['account']=f"House Schedule A · PDF第{h['sourcePage']}页 · 审阅编号{n}";h['disclosureNote']='扫描件Schedule A：人工逐格核对资产价值栏，非收入栏；上方Example示例行未录入。'
 if n=='1':h['owner']='joint'
 if n in ['4','4.1','5']:h['owner']='child'
 if n in ['6','7','7.1']:h['owner']='spouse'
resolve(sh)
sr={**stefanik['report'],'available':True,'parsed':True,'partial':True,'reportLabel':'2025 annual report · 扫描资产附表已核对','asOfDate':'2025-12-31','holdings':sh,'holdingsCount':len(sh),'total':len(sh),'totalPages':1,'categories':[],'unvaluedCount':3,'totalLow':sum(h['valueLow'] or 0 for h in sh if h['includedInTotal']),'totalHigh':sum(h['valueHigh'] or 0 for h in sh if h['includedInTotal']),'totalOpenEnded':False,'unreadableReason':None,'sha256':hashlib.sha256((RAW/'stefanik-2025-official.pdf').read_bytes()).hexdigest(),'coverageNote':'扫描件PDF第2–3页Schedule A逐格复核；3个账户/企业父级不另加金额，7项底层资产计入。其他未核实项目不补零。','aggregationNote':'示例行不计入；账户父级与底层房地产/基金不重复相加。','excludedCount':3}
data['reports'].append(dict(member=stefanik['member'],report=sr))
raskin=next(e for e in annual['reports'] if e['member']['name']=='Jamie Raskin')
rr={**raskin['report'],'reportLabel':'历史申报修订扫描信（涉及2021–2024），非完整2025年报','asOfDate':None,'unreadableReason':'已核对该扫描件为历史修订说明；完整2025年度资产仍待补，不填零','coverageNote':'PDF第一页提及2021–2024年度修订，不能用作完整2025资产合计。'}
data['reports'].append(dict(member=raskin['member'],report=rr))
data['fetchedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
dest.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print(json.dumps([dict(name=e['member']['name'],rows=e['report']['holdingsCount'],excluded=e['report'].get('excludedCount'),crypto=sum(h['category']=='CRYPTO' for h in e['report']['holdings']),spouse=sum(h['owner']=='spouse' for h in e['report']['holdings'])) for e in [trump,vance]],ensure_ascii=False))
