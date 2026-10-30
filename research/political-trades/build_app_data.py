"""Build the local app snapshot; no inferred holdings or financial estimates."""
import calendar
import datetime as dt
import hashlib
import json
from pathlib import Path
import duckdb

root = Path(__file__).resolve().parent
snapshot = json.loads((root / 'raw/snapshot.json').read_text())
for manifest in snapshot['tables']['political_trades']['manifests']:
    for item in manifest['files']:
        path = root / 'raw' / (str(manifest['year']) + '.parquet')
        if hashlib.sha256(path.read_bytes()).hexdigest() != item['sha256']:
            raise ValueError('Snapshot checksum mismatch: ' + str(path))
db = duckdb.connect()
db.read_parquet(str(root / 'raw/*.parquet')).create_view('records')
today = dt.date(2026, 10, 26)
start = dt.date(2026, 4, 26)
query = '''SELECT chamber, docId, rowIndex, memberId, displayName, owner, action,
transactionDate, filingDate, notificationDate, resolvedTicker, printedTicker,
assetDescription, amountBracket, amountLow, amountHigh, assetTypeLabel,
filingStatus, sourceUrl FROM records WHERE transactionDate >= ? AND transactionDate <= ?'''
rows = db.execute(query, [start, today]).fetchall()
crypto_rows = db.execute(query.split(' WHERE')[0] + " WHERE regexp_matches(lower(assetDescription), 'bitcoin|ethereum|crypto|digital currency')").fetchall()
keys = ['chamber','doc','row','person','name','owner','action','date','filed','notified','ticker','printedTicker','asset','amount','low','high','instrument','status','source']
trades = []
for row in rows + crypto_rows:
    trade = dict(zip(keys, row))
    for key in ['date', 'filed', 'notified']:
        trade[key] = str(trade[key]) if trade[key] else None
    trade['person'] = trade['person'] or 'name:' + trade['name']
    trade['lag'] = (dt.date.fromisoformat(trade['filed']) - dt.date.fromisoformat(trade['date'])).days if trade['filed'] else None
    trades.append(trade)
crypto_history = trades[len(rows):]
trades = trades[:len(rows)]
directory = json.loads((root / 'raw/legislators-current.json').read_text())
people = {}
for item in directory:
    term = item['terms'][-1]
    key = item['id']['bioguide']
    people[key] = dict(id=key, name=item['name'].get('official_full', item['name']['first'] + ' ' + item['name']['last']), party=term.get('party','Unknown'), state=term['state'], district=term.get('district'), chamber='senate' if term['type']=='sen' else 'house', current=True, photo='https://unitedstates.github.io/images/congress/225x275/' + key + '.jpg')
for trade in trades + crypto_history:
    key = trade['person']
    if key not in people:
        people[key] = dict(id=key,name=trade['name'],party='Unknown',state='待核实',district=None,chamber=trade['chamber'],current=False,photo='')
payload = dict(start=str(start), end=str(today), generated=snapshot['generatedAt'], latestTrade=snapshot['freshness']['latestTransactionDate'], latestFiling='2026-10-22', totalArchive=snapshot['totals']['trades'], people=list(people.values()), trades=trades, cryptoHistory=crypto_history, source='https://huggingface.co/datasets/austin-starks/congressional-stock-trades')
dest = root.parents[1] / 'frontend/public/political-data.json'
dest.write_text(json.dumps(payload, ensure_ascii=False, default=str, separators=(',',':')))
print(f'Verified checksums; wrote {len(people)} people and {len(trades)} disclosure rows to {dest}')
