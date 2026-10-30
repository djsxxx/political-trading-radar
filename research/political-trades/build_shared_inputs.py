"""Build sourced Nasdaq classifications and a strictly partial Trump Part 6 extract.
Inputs are publicly downloaded originals; never treat income or transactions as assets.
"""
import json, re, hashlib, datetime
from pathlib import Path
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'frontend/public'
RAW=ROOT/'research/political-trades/annual-executive-raw'
RAW.mkdir(exist_ok=True)
pdf=Path('/private/tmp/radar-trump-2025.pdf').read_bytes()
(RAW/'trump-2025-official.pdf').write_bytes(pdf)
nasdaq=json.loads(Path('/private/tmp/radar-nasdaq-sectors.json').read_text())
stamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
stocks={r['symbol']:dict(name=r['name'],sector=r['sector'] or 'Unclassified',industry=r['industry']) for r in nasdaq['data']['rows']}
output=dict(source='https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&download=true',fetchedAt=stamp,asOf=nasdaq['data'].get('asOf'),stocks=stocks)
(OUT/'stock-sectors.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
def key(s):
    s=re.sub(r'\b(COMMON STOCK|CLASS [ABC]|ORDINARY SHARES|CORPORATION|CORP|INCORPORATED|INC|COMPANY|CO|PLC|LTD|LIMITED|NEW)\b','',s.upper())
    return re.sub('[^A-Z0-9]','',s)
names={}
for ticker,r in stocks.items(): names.setdefault(key(r['name']),[]).append(ticker)
rows=[];unmatched=0;pages=[]
reader=PdfReader('/private/tmp/radar-trump-2025.pdf')
cover=reader.pages[0].extract_text()
assert len(reader.pages)==927 and 'Trump Donald J' in cover and '2025' in cover and 'Report Type: Annual' in cover
pattern=re.compile(r'^(\d+)\s+(.+?)\s+(?:N/A|Yes|No)\s+(\$[\d,]+\s*-\s*\$[\d,]+|Over\s*\$[\d,]+|None \(or less than \$1,001\))',re.M)
for i in range(6,len(reader.pages)):
    text=reader.pages[i].extract_text()
    if 'Part 6: Other Assets and Income' not in text: break
    pages.append(i+1)
    # Join continuation lines within a numbered table row, while retaining row boundaries.
    text=re.sub(r'\n(?!\d+\s|INVESTMENT ACCOUNT|Page |Donald |OGE |Filer|Part |#|Instructions|If |Note:)', ' ',text)
    matched=pattern.findall(text)
    for num,name,value in matched:
        nums=[int(x.replace(',','')) for x in re.findall(r'\$([\d,]+)',value)]
        if value.startswith('None'): low,high,opened=0,1000,False
        elif value.startswith('Over'): low,high,opened=nums[0]+1,nums[0]+1,True
        else: low,high,opened=nums[0],nums[1],False
        name=name.strip().lstrip('*')
        options=names.get(key(name),[])
        bond=bool(re.search(r'\b(DUE|BND|BOND|NOTES?|DEBS|MUNI|INT PYMT|NTS|SER|CMMN)\b|\d\.\d{2,}',name,re.I))
        fund=bool(re.search(r'\b(ETF|FUND|ISHARES|SPDR|PORTFOLIO)\b',name,re.I))
        # Name matching alone cannot distinguish equity from corporate debt.
        ticker=None
        cash=bool(re.search(r'\bCASH\b|MONEY MARKET ACCOUNT',name,re.I))
        category='CASH' if cash else 'BONDS' if bond else 'FUNDS' if fund else 'UNCLASSIFIED'
        rows.append(dict(assetName=name,account=f'Part 6 · PDF第{i+1}页 · 行{num}',ticker=ticker,assetType='OGE Part 6 asset',category=category,categoryLabel=category,owner='未注明',valueText=value,valueLow=low,valueHigh=high,valueOpenEnded=opened,sourcePage=i+1))
assert rows and pages[-1]==158
assert any(h['assetName']=='APPLE INC' and h['valueLow']==1000001 for h in rows)
report=dict(available=True,parsed=True,reportLabel='2025 annual report · OGE Part 6 部分解析',asOfDate='2025-12-31',filedDate='2026-06-29',sourceUrl='https://extapps2.oge.gov/201/Presiden.nsf/PAS%2BIndex/69AEAA9D7455ACD585258E27002DDEE1/$FILE/Donald-J-Trump-2026-278ANNUAL.pdf',holdingsCount=len(rows),holdings=rows,unvaluedCount=0,totalLow=sum(h['valueLow'] for h in rows),totalHigh=sum(h['valueHigh'] for h in rows),totalOpenEnded=any(h['valueOpenEnded'] for h in rows),categories=[],total=len(rows),totalPages=1,laterFilingLabel=None,laterFilingUrl=None,unreadableReason=None,partial=True,coverageNote='仅提取Part 6（PDF第7–158页）中可可靠识别的资产价值栏；不含Part 2企业/信托附表、配偶及其他未核完部分。不是完整个人资产。收入栏和交易流水未计入。',sha256=hashlib.sha256(pdf).hexdigest())
entry=dict(member=dict(id='US-PRESIDENT',slug='donald-trump',name='Donald J. Trump',party='Republican',state='US',chamber='executive',identity='official-name-position-year'),report=report)
extra=[entry]
vance_pdf=Path('/private/tmp/radar-vance-2025.pdf').read_bytes()
(RAW/'vance-2025-official.pdf').write_bytes(vance_pdf)
vance_reader=PdfReader('/private/tmp/radar-vance-2025.pdf')
assert len(vance_reader.pages)==17 and 'Vance JD' in vance_reader.pages[0].extract_text()
# Manually transcribed Part 6 value column, independently checked against page 10.
# Do not add the transaction table on page 11 or income column.
vance_values=[
 ('1.1','Vanguard Ohio Target Enrollment 2034/2035 Portfolio','FUNDS',15001,50000,'child',None),
 ('2.1','Vanguard Ohio Target Enrollment 2040 Portfolio','FUNDS',1001,15000,'child',None),
 ('3.1','Vanguard Ohio Target Enrollment 2038 Portfolio','FUNDS',15001,50000,'child',None),
 ('4.1','QQQ - Invesco QQQ Trust, Series 1','FUNDS',1000001,5000000,'未注明','QQQ'),
 ('4.2','TLT - iShares 20+ Year Treasury Bond','FUNDS',100001,250000,'未注明','TLT'),
 ('4.3','DIA - SPDR Dow Jones Industrial Average ETF','FUNDS',1000001,5000000,'未注明','DIA'),
 ('4.4','SPY - SPDR S&P 500 ETF','FUNDS',1000001,5000000,'未注明','SPY'),
 ('4.5','GLD - SPDR Gold Trust','FUNDS',250001,500000,'未注明','GLD'),
 ('5','Charles Schwab (cash)','CASH',100001,250000,'未注明',None),
 ('6.1','Bitcoin / Coinbase Account','CRYPTO',250001,500000,'未注明',None),
 ('7','Real Estate, residential (Washington, DC)','REAL_ESTATE',500001,1000000,'未注明',None),
 ('8','Real Estate, commercial (Jackson, KY)','REAL_ESTATE',50001,100000,'未注明',None),
 ('9','Real Estate, residential (Middletown, OH)','REAL_ESTATE',100001,250000,'未注明',None),
 ('10','USAA Checking Accounts','CASH',15001,50000,'未注明',None),
 ('11','Marcus by Goldman Sachs Savings Account','CASH',100001,250000,'未注明',None),
 ('12','Promissory Note - Narya Capital Management, LLC','BONDS',500001,1000000,'未注明',None),
 ('13','Navy Federal Credit Union Cash Account','CASH',1001,15000,'未注明',None),
]
vance_holdings=[dict(assetName=name,account=f'Part 6 · PDF第10页 · 行{num}',ticker=ticker,assetType='OGE Part 6 verified value column',category=category,categoryLabel=category,owner=owner,valueText=f'${low:,} - ${high:,}',valueLow=low,valueHigh=high,valueOpenEnded=False,sourcePage=10) for num,name,category,low,high,owner,ticker in vance_values]
vance_report={**report,'reportLabel':'2025 annual report · OGE Part 6 部分解析','sourceUrl':'https://oge.box.com/shared/static/o3xuu4cumw5a2pi39ij4jauekltvax4u.pdf','holdingsCount':17,'holdings':vance_holdings,'total':17,'totalLow':sum(h['valueLow'] for h in vance_holdings),'totalHigh':sum(h['valueHigh'] for h in vance_holdings),'totalOpenEnded':False,'coverageNote':'仅展示Part 6（PDF第10页）的17项资产价值栏；本人退休账户、企业权益、版权等Part 2及配偶Part 5尚未合并。不含收入、交易或负债，非完整总资产。','sha256':hashlib.sha256(vance_pdf).hexdigest()}
extra.append(dict(member=dict(id='US-VICE-PRESIDENT',slug='jd-vance',name='JD Vance',party='Republican',state='US',chamber='executive',identity='official-name-position-year'),report=vance_report))
annual=json.loads((OUT/'annual-assets.json').read_text())
history=json.loads((OUT/'annual-history.json').read_text())
for e in history['entries']:
    latest=next((a for a in annual['reports'] if a['member']['id']==e['member']['id']),None)
    r=e.get('previous')
    if not r or not r.get('verified') or not r.get('holdings') or (latest and latest['report'].get('parsed')): continue
    holdings=[dict(assetName=h['assetName'],account=None,ticker=h.get('ticker'),assetType='Historical asset — category unverified',category='UNCLASSIFIED',categoryLabel='待核实类别',owner=h.get('owner',''),valueText='原件价值栏',valueLow=h['low'],valueHigh=h['high'],valueOpenEnded=False) for h in r['holdings']]
    prior=dict(available=True,parsed=True,reportLabel=f"{r['year']} annual report · 最近可靠单年",asOfDate=r['asOfDate'],filedDate=r.get('filedDate'),sourceUrl=r['sourceUrl'],holdingsCount=len(holdings),holdings=holdings,unvaluedCount=r.get('unvaluedCount',0),totalLow=r.get('totalLow',0),totalHigh=r.get('totalHigh',0),totalOpenEnded=r.get('totalOpenEnded',False),categories=[],total=len(holdings),totalPages=1,laterFilingLabel=latest['report'].get('reportLabel') if latest else None,laterFilingUrl=latest['report'].get('sourceUrl') if latest else None,unreadableReason=None,sha256=r.get('sha256'))
    extra.append(dict(member={**e['member'],'slug':'','identity':'verified-historical-fallback'},report=prior))
(OUT/'executive-assets.json').write_text(json.dumps(dict(provider='US OGE / official House historical fallback',fetchedAt=stamp,reports=extra),ensure_ascii=False,separators=(',',':')))
print(json.dumps(dict(extracted=len(rows),pages=[pages[0],pages[-1]],matchedStocks=sum(bool(h['ticker']) for h in rows),sha256=report['sha256'])))
