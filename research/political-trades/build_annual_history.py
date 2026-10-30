"""Verify public historical House Schedule A rows against original annual PDFs.
Only full, finite-valued reports qualify for comparison. Others retain evidence
and a named gap; they are never treated as zero or as investment returns.
Run with bundled Python and PYTHONPATH=/private/tmp/political-trades-python.
"""
import concurrent.futures, collections, datetime as dt, hashlib, json, re, subprocess, threading, time
from pathlib import Path
import duckdb
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parent
DEST=ROOT.parents[1]/'frontend/public/annual-history.json'
RAW=ROOT/'annual-history-raw'; RAW.mkdir(exist_ok=True)
START=2024; END=2025
lock=threading.Lock(); next_request=0.0

def fetch(url,path):
    global next_request
    if path.exists() and path.stat().st_size>100:return
    with lock:
        wait=max(0,next_request-time.monotonic());next_request=max(time.monotonic(),next_request)+0.65
    if wait:time.sleep(wait)
    result=subprocess.run(['curl','-fsSL','--max-time','40','--retry','1','--retry-delay','3','-A','Mozilla/5.0 Financial-AI-OS public-disclosure-research',url,'-o',str(path)+'.download'],capture_output=True,text=True)
    if result.returncode:raise ValueError('原件下载失败：'+result.stderr.strip()[-180:])
    temp=Path(str(path)+'.download')
    if not temp.read_bytes().startswith(b'%PDF'):raise ValueError('原件不是PDF')
    temp.replace(path)

def key(s):return re.sub('[^a-z]','',s.lower())
def money(s):
    nums=[int(v.replace(',','')) for v in re.findall(r'\$([\d,]+)',s)]
    if not nums:return (None,None)
    return (nums[0],nums[1] if len(nums)>1 else None)

def existing_annual(report,year):
    if report.get('asOfDate')!=f'{year}-12-31' or not re.search(r'annual report',report.get('reportLabel') or '',re.I):return None
    return dict(year=year,asOfDate=report['asOfDate'],sourceUrl=report['sourceUrl'],docId=(report.get('sourceUrl') or '').rstrip('/').split('/')[-1],filedDate=report['filedDate'],totalLow=report['totalLow'],totalHigh=report['totalHigh'],totalOpenEnded=report['totalOpenEnded'],unvaluedCount=report['unvaluedCount'],holdingsCount=report['holdingsCount'],verified=report['available'] and report['parsed'] and len(report['holdings'])==report['holdingsCount'],provider='Civitas Research (CC BY 4.0)',holdings=[dict(assetName=h['assetName'],owner=h['owner'],ticker=h['ticker'],low=h['valueLow'],high=h['valueHigh']) for h in report['holdings']])

def verify_document(item):
    member,doc,rows,meta=item
    target_year=member.get('year',START)
    path=RAW/f'{doc}.pdf';cache=RAW/f'{doc}.verified.json'
    if cache.exists():
        cached=json.loads(cache.read_text())
        if cached.get('year')==target_year and cached.get('sourceUrl')==rows[0]['report_url']:return member['id'],cached
    result=dict(year=target_year,asOfDate=f'{target_year}-12-31',sourceUrl=rows[0]['report_url'],docId=doc,provider='public holdings / official House PDF',filedDate=meta.get('filedDate'),holdingsCount=len(rows),verified=False,unvaluedCount=0,issues=[])
    try:
        fetch(result['sourceUrl'],path)
        digest=hashlib.sha256(path.read_bytes()).hexdigest();result['sha256']=digest
        reader=PdfReader(path);first=reader.pages[0].extract_text().replace('\0','')
        year=re.search(r'Filing Year:\s*(\d{4})',first)
        if not year or int(year[1])!=target_year:raise ValueError(f'官方首页覆盖年份不是{target_year}')
        if not re.search(r'Filing Type:\s*Annual Report',first,re.I):raise ValueError('不是年度申报（可能为候选/入职/离任文件）')
        name=re.search(r'Name:\s*([^\n]+)',first)
        surname=member['lastName'];given=member['firstName']
        if not name or key(surname) not in key(name[1]) or key(given)[:1] not in key(name[1]):raise ValueError('官方首页人物身份不匹配')
        area=re.search(r'State/District:\s*([A-Z]{2})',first)
        if not area or area[1]!=member['state']:raise ValueError('官方首页州不匹配')
        filed=re.search(r'Filing Date:\s*(\d{2}/\d{2}/\d{4})',first)
        if filed:result['filedDate']=dt.datetime.strptime(filed[1],'%m/%d/%Y').date().isoformat()
        parts=[]
        for page in reader.pages:
            part=page.extract_text().replace('\0','');parts.append(part)
            if re.search(r'(?:^S [B-I]:|^SCHEDULE [B-I]\s*:)',part,re.M|re.I):break
        text='\n'.join(parts)
        begin=re.search(r'(?:S A:|SCHEDULE A\s*:)',text,re.I)
        if not begin:raise ValueError('资产Schedule A不可可靠识别')
        stop=re.search(r'(?:^S [B-I]:|^SCHEDULE [B-I]\s*:)',text[begin.end():],re.M|re.I)
        section=text[begin.end():begin.end()+stop.start()] if stop else text[begin.end():]
        markers=list(re.finditer(r'\[([A-Z]{1,3})\]',section))
        if len(markers)!=len(rows):raise ValueError(f'资产明细不完整：原件{len(markers)}行、数据{len(rows)}行')
        bands=[]
        for i,m in enumerate(markers):
            tail=section[m.end():markers[i+1].start() if i+1<len(markers) else len(section)]
            token=re.match(r'\s*(?:(?:SP|JT|DC|SELF|SPOUSE)\s*)?(\$[\d,]+\s*(?:[-–]\s*\$[\d,]+|\+)?|(?:Over|More than)\s*\$[\d,]+|None|Undetermined|Not\s+Determined)',tail,re.I)
            if not token:raise ValueError('存在无法核验的资产价值行')
            bands.append(money(token[1]))
        source_bands=[(r['value_min_usd'],r['value_max_usd']) for r in rows]
        # Unknown/None values in the source are not silently replaced with zero.
        if collections.Counter(bands)!=collections.Counter(source_bands):raise ValueError('资产价值逐档核验不一致，待人工核对')
        result['verified']=True
        result['unvaluedCount']=sum(a is None or b is None for a,b in bands)
        result['totalLow']=sum(a or 0 for a,b in bands)
        result['totalHigh']=sum(b or 0 for a,b in bands)
        result['totalOpenEnded']=any(a is not None and b is None for a,b in bands)
        result['holdings']=[dict(assetName=r['asset_name'],owner=r['owner'],ticker=r['ticker'],low=r['value_min_usd'],high=r['value_max_usd']) for r in rows]
        if result['unvaluedCount']:result['issues'].append('原件包含未标价或无上限资产，不能作为完整可比总额')
        if meta.get('sha256') and digest!=meta['sha256']:result['issues'].append('下载原件哈希与历史索引不同，需人工复核版本');result['verified']=False
    except Exception as e:result['issues'].append(str(e))
    cache.write_text(json.dumps(result,ensure_ascii=False))
    return member['id'],result

def main():
    current=json.loads((ROOT.parents[1]/'frontend/public/annual-assets.json').read_text())
    roster=json.loads((ROOT/'raw/legislators-current.json').read_text())
    by_id={p['id']['bioguide']:p for p in roster}
    people=json.loads((ROOT.parents[1]/'frontend/public/political-data.json').read_text())['people']
    con=duckdb.connect()
    cols=['bioguide_id','doc_id','report_url','asset_name','owner','ticker','value_min_usd','value_max_usd','value_quality']
    raw=con.execute('select '+','.join(cols)+" from read_parquet(?) where report_url like '%/2024/%'",[str(ROOT/'annual-raw/holdings-house.parquet')]).fetchall()
    docs={}
    for row in raw:
        r=dict(zip(cols,row));docs.setdefault((r['bioguide_id'],r['doc_id']),[]).append(r)
    meta={r[0]:dict(filedDate=r[1],sha256=r[2],filingType=r[3]) for r in con.execute("select doc_id,cast(filing_date as varchar),source_sha256,filing_type from read_parquet(?) where source_url like '%/2024/%'",[str(ROOT/'annual-raw/filings.parquet')]).fetchall()}
    candidates=[]
    for (pid,doc),rows in docs.items():
        p=by_id.get(pid)
        if not p:continue
        term=p['terms'][-1]
        if meta.get(doc,{}).get('filingType') not in ['annual','amendment']:continue
        member=dict(id=pid,state=term['state'],lastName=p['name']['last'],firstName=p['name']['first'])
        candidates.append((member,doc,rows,meta.get(doc,{})))
    candidates.sort(key=lambda x:(x[0]['id'],x[3].get('filedDate') or '',x[1]))
    # A later indexed annual/amendment with no extracted rows must not disappear.
    # Exclude the person until that later file can be resolved, rather than
    # presenting the older parsed version as their latest report.
    later_unparsed={}
    for pid,doc,filed,url,status in con.execute("select bioguide_id,doc_id,cast(filing_date as varchar),source_url,extract_status from read_parquet(?) where source_url like '%financial-pdfs/2024/%' and filing_type in ('annual','amendment')",[str(ROOT/'annual-raw/filings.parquet')]).fetchall():
        if pid not in by_id or (pid,doc) in docs:continue
        later_unparsed.setdefault(pid,[]).append(dict(docId=doc,filedDate=filed,sourceUrl=url,status=status))
    results={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for i,(pid,report) in enumerate(pool.map(verify_document,candidates),1):
            results.setdefault(pid,[]).append(report)
            if i%20==0:print(f'OFFICIAL_PDF {i}/{len(candidates)} verified={sum(r["verified"] for rs in results.values() for r in rs)}',flush=True)
    entries=[];current_by={e['member']['id']:e for e in current['reports']}
    for p in people:
        if p['party'] not in ['Republican','Democrat','Independent']:continue
        original=by_id.get(p['id']);party=p['party'];issues=[]
        if original:
            affiliations=[]
            for y in [START,END]:
                terms=[t for t in original['terms'] if t['start']<=f'{y}-12-31'<t['end']]
                affiliations.append(terms[-1].get('party') if terms else None)
            if not all(affiliations):issues.append('两年年末未同时任职，不进入固定在任队列')
            elif affiliations[0]!=affiliations[1]:issues.append('两年党派变化，不进入稳定党派队列')
            if affiliations[-1]:party=affiliations[-1]
        else:issues.append('缺少两年任期与党派资料')
        history=sorted(results.get(p['id'],[]),key=lambda r:(r.get('filedDate') or '',r['docId']))
        # Latest filed version wins, even if unreadable; never silently use an older amendment.
        old=history[-1] if history else None
        entry=current_by.get(p['id'])
        if not old and entry:
            old=existing_annual(entry['report'],START)
            if old:history=[old]
        newer=[r for r in later_unparsed.get(p['id'],[]) if not old or (r.get('filedDate') or '',r['docId'])>(old.get('filedDate') or '',old['docId'])]
        if newer:issues.append('2024索引存在较新未解析文件，旧报告不进入可比队列')
        if not old:issues.append('2024年报尚未取得'+('（参议院历史源未接入）' if p['chamber']=='senate' else ''))
        elif not old['verified']:issues.append('2024原件/明细核验未通过')
        elif old['unvaluedCount']:issues.append('2024含未标价或无上限资产')
        new=None
        if entry:
            r=entry['report']
            if r.get('asOfDate')=='2025-12-31' and re.search(r'annual report',r.get('reportLabel') or '',re.I):
                new=dict(year=END,asOfDate=r['asOfDate'],sourceUrl=r['sourceUrl'],filedDate=r['filedDate'],totalLow=r['totalLow'],totalHigh=r['totalHigh'],totalOpenEnded=r['totalOpenEnded'],unvaluedCount=r['unvaluedCount'],holdingsCount=r['holdingsCount'],verified=r['available'] and r['parsed'] and len(r['holdings'])==r['holdingsCount'],provider='Civitas Research (CC BY 4.0)',holdings=[dict(assetName=h['assetName'],owner=h['owner'],ticker=h['ticker'],low=h['valueLow'],high=h['valueHigh']) for h in r['holdings']])
        if not new:issues.append('2025年度申报尚未取得或年度不符')
        elif not new['verified']:issues.append('2025年报未解析或明细不完整')
        elif new['unvaluedCount']:issues.append('2025含未标价资产')
        # Conservative initial implementation: open-ended bands excluded from finite amount comparison.
        if new and new['totalOpenEnded']:issues.append('2025含无上限资产，不能生成有限差值区间')
        if old and old.get('totalOpenEnded'):issues.append('2024含无上限资产，不能生成有限差值区间')
        entries.append(dict(member={k:p[k] for k in ['id','name','state','party','chamber']}|{'party':party},previous=old,current=new,issues=issues,versions=history,pendingVersions=newer))
    final_candidates=[]
    for e in entries:
        if e['issues']:continue
        r=e['current'];p=by_id[e['member']['id']]
        doc=r['sourceUrl'].rstrip('/').split('/')[-1].removesuffix('.pdf')
        member=dict(id=e['member']['id'],state=e['member']['state'],lastName=p['name']['last'],firstName=p['name']['first'],year=END)
        rows=[dict(report_url=r['sourceUrl'],asset_name=h['assetName'],owner=h['owner'],ticker=h['ticker'],value_min_usd=h['low'],value_max_usd=h['high']) for h in r['holdings']]
        final_candidates.append((member,doc,rows,dict(filedDate=r['filedDate'])))
    verified_current={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for i,(pid,proof) in enumerate(pool.map(verify_document,final_candidates),1):
            verified_current[pid]=proof
            if i%10==0:print(f'CURRENT_OFFICIAL_PDF {i}/{len(final_candidates)}',flush=True)
    for e in entries:
        proof=verified_current.get(e['member']['id'])
        if proof:
            e['current']['sha256']=proof.get('sha256')
            e['current']['officialVerified']=proof['verified']
            e['current']['providerFiledDate']=e['current']['filedDate']
            if proof['verified']:
                e['current']['filedDate']=proof['filedDate']
            else:
                e['current']['verified']=False;e['current']['issues']=proof['issues']
                e['issues'].append('2025官方原件逐档复核未通过：'+'；'.join(proof['issues']))
    payload=dict(previousYear=START,currentYear=END,partyAsOf='2025-12-31',generatedAt=dt.datetime.now(dt.timezone.utc).isoformat(),method='fixed-members-stable-party-fully-valued-finite-bands',sources=[dict(name='Civitas Research',url='https://civitas-research.org/developers',license='CC BY 4.0'),dict(name='ZipLime public House holdings; checked against original PDF',url='https://huggingface.co/datasets/ZipLime/congress-trading',license='US Government public-domain source records')],entries=entries)
    if DEST.exists():
        archive=RAW/'snapshots';archive.mkdir(exist_ok=True)
        old_bytes=DEST.read_bytes();(archive/(hashlib.sha256(old_bytes).hexdigest()+'.json')).write_bytes(old_bytes)
    DEST.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')))
    valid=[e for e in entries if not e['issues']]
    print('HISTORY_DONE',json.dumps(dict(people=len(entries),candidates=len(candidates),verified=sum(r['verified'] for rs in results.values() for r in rs),comparable=len(valid),parties=dict(collections.Counter(e['member']['party'] for e in valid))),ensure_ascii=False),flush=True)

if __name__=='__main__':main()
