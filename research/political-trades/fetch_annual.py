"""Download the public Civitas holdings API with attribution and a global 50/min limit.
Run again to resume; raw responses are retained, not interpreted as instructions.
"""
import concurrent.futures
import datetime as dt
import json
from pathlib import Path
import re
import subprocess
import threading
import time
import unicodedata

ROOT = Path(__file__).resolve().parent
RAW = ROOT / 'annual-raw/civitas'
RAW.mkdir(parents=True, exist_ok=True)
lock = threading.Lock()
next_request = 0.0
BASE = 'https://civitas-research.org'

def get(url):
    global next_request
    with lock:
        wait = max(0, next_request - time.monotonic())
        next_request = max(time.monotonic(), next_request) + 1.21
    if wait:
        time.sleep(wait)
    result = subprocess.run(['curl', '-fsSL', '--max-time', '35', url], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout)

def name_key(name):
    return re.sub(r'[^a-z]', '', unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower())

def directory():
    original = json.loads((ROOT/'raw/legislators-current.json').read_text())
    aliases = {}
    fallback = {}
    for person in original:
        name, term = person['name'], person['terms'][-1]
        chamber = 'senate' if term['type'] == 'sen' else 'house'
        key = person['id']['bioguide']
        for n in [name.get('official_full',''), name['first']+' '+name['last'], name.get('nickname',name['first'])+' '+name['last']]:
            aliases[(chamber, term['state'], name_key(n))] = key
        fallback.setdefault((chamber,term['state'],name_key(name['last']),name['first'][0].lower()),[]).append(key)
    rows=[]
    for chamber, endpoint in [('senate','senators'),('house','representatives')]:
        page=1
        while True:
            cache=RAW/f'{endpoint}-list-{page}.json'
            data=json.loads(cache.read_text()) if cache.exists() else get(f'{BASE}/api/public/v1/{endpoint}?per_page=100&page={page}')
            cache.write_text(json.dumps(data, ensure_ascii=False))
            for member in data['entries']:
                key=aliases.get((chamber,member['state'],name_key(member['name'])))
                method='exact-name-state-chamber'
                if not key:
                    parts=member['name'].replace('.','').split()
                    choices=fallback.get((chamber,member['state'],name_key(parts[-1]),parts[0][0].lower()),[])
                    if len(choices)==1:
                        key=choices[0];method='unique-surname-first-initial-state-chamber'
                rows.append(dict(id=key or 'annual:'+member['id'],slug=member['id'],name=member['name'],party={'R':'Republican','D':'Democrat','I':'Independent'}.get(member['party'],'Unknown'),state=member['state'],chamber=chamber,identity=method if key else 'unmatched'))
            if page>=data['totalPages']:break
            page+=1
    return rows

def download(member):
    endpoint='senators' if member['chamber']=='senate' else 'representatives'
    cache=RAW/f"{endpoint}-{member['slug']}.json"
    if cache.exists():return member, json.loads(cache.read_text()),None
    try:
        data=get(f"{BASE}/api/{endpoint}/{member['slug']}/holdings?per_page=100")
        if 'available' not in data:raise ValueError('Invalid response schema')
        cache.write_text(json.dumps(data,ensure_ascii=False))
        return member,data,None
    except Exception as error:
        return member,None,str(error)

def main():
    members=directory()
    print(f'ROSTER {len(members)}; unmatched {sum(m["identity"]=="unmatched" for m in members)}',flush=True)
    (RAW/'roster.json').write_text(json.dumps(members,ensure_ascii=False))
    reports=[];errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for i,(member,data,error) in enumerate(pool.map(download,members),1):
            if error:errors.append(dict(member=member,error=error))
            else:reports.append(dict(member=member,report=data))
            if i%25==0:print(f'ANNUAL {i}/{len(members)} available={sum(x["report"].get("available",False) for x in reports)} errors={len(errors)}',flush=True)
            # Partial results are reviewable while the batch continues.
            if i%25==0 or i==len(members):
                output=dict(provider='Civitas Research',providerUrl=BASE,license='CC BY 4.0',fetchedAt=dt.datetime.now(dt.timezone.utc).isoformat(),reports=reports,errors=errors,rosterCount=len(members))
                (ROOT.parents[1]/'frontend/public/annual-assets.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
    print(f'ANNUAL_DONE reports={len(reports)} errors={len(errors)}',flush=True)

def complete_pages():
    dest=ROOT.parents[1]/'frontend/public/annual-assets.json'
    bundle=json.loads(dest.read_text())
    for i,entry in enumerate(bundle['reports'],1):
        member,report=entry['member'],entry['report']
        endpoint='senators' if member['chamber']=='senate' else 'representatives'
        holdings=list(report['holdings'][:100])
        for page in range(2,report.get('totalPages',1)+1):
            cache=RAW/f"{endpoint}-{member['slug']}-page{page}.json"
            data=json.loads(cache.read_text()) if cache.exists() else get(f"{BASE}/api/{endpoint}/{member['slug']}/holdings?per_page=100&page={page}")
            if data['sourceUrl']!=report['sourceUrl'] or data['holdingsCount']!=report['holdingsCount']:
                raise ValueError('Source changed during pagination: '+member['slug'])
            cache.write_text(json.dumps(data,ensure_ascii=False))
            holdings.extend(data['holdings'])
        report['holdings']=holdings
        report['allHoldingsLoaded']=len(holdings)==report['holdingsCount']
        if i%25==0:print(f'PAGES {i}/{len(bundle["reports"])}',flush=True)
        if i%25==0 or i==len(bundle['reports']):dest.write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')))
    print('PAGINATION_DONE',flush=True)

if __name__=='__main__':
    import sys
    complete_pages() if '--complete-pages' in sys.argv else main()
