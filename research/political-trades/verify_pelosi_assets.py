"""Independent asset-value-column reconciliation; does not use income/trades."""
from pathlib import Path
from pypdf import PdfReader
import collections, hashlib, json, re
ROOT=Path(__file__).resolve().parents[2]
source=ROOT/'research/political-trades/annual-executive-raw/pelosi-2025-official.pdf'
if not source.exists(): source.write_bytes(Path('/private/tmp/radar-pelosi-2025.pdf').read_bytes())
r=PdfReader(source)
text='\n'.join(p.extract_text().replace('\x00','') for p in r.pages[:7])
marks=list(re.finditer(r'\[[A-Z]{2}\]',text));values=[];unvalued=0;transactions=0
for i,m in enumerate(marks):
 x=text[m.end():marks[i+1].start() if i+1<len(marks) else len(text)].strip()
 x=re.sub(r'^(SP|JT|DC)\s*','',x)
 if re.match(r'\d{2}/\d{2}/\d{4}',x):transactions+=1;continue
 z=re.match(r'\$([\d,]+)\s*-\s*\$([\d,]+)',x)
 if z: values.append(tuple(int(z[j].replace(',','')) for j in [1,2]))
 elif x.startswith('None'): values.append((0,0))
 elif x.startswith('$100,001 - None\nAsset Owner') and '$250,000' in x:
  # Financial Leasing Services row splits at the page boundary; income type None
  # is interleaved in extracted text. Official pages3–4 show the continuation.
  values.append((100001,250000))
 elif x.startswith('Undetermined'):unvalued+=1
 else:raise ValueError('Unrecognized value-column segment: '+x[:120])
data=json.loads((ROOT/'frontend/public/annual-assets.json').read_text())
e=next(e for e in data['reports'] if e['member']['id']=='P000197')
expected=[(h['valueLow'],h['valueHigh']) for h in e['report']['holdings'] if h['valueLow'] is not None]
assert collections.Counter(values)==collections.Counter(expected)
assert len(values)==67 and unvalued==1
result=dict(member=e['member']['name'],sourceUrl=e['report']['sourceUrl'],sha256=hashlib.sha256(source.read_bytes()).hexdigest(),assetRows=68,valuedRows=len(values),unvaluedRows=unvalued,excludedTransactionRows=transactions,low=sum(a for a,b in values),high=sum(b for a,b in values),result='OFFICIAL_VALUE_BANDS_MATCH')
(ROOT/'test-artifacts/pelosi-asset-reconciliation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False))
