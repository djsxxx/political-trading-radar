// 为 Epoch AI 数据中心地址补坐标，结果写入 raw/geocode-cache.json；已缓存的条目不再请求。
// 使用 OpenStreetMap Nominatim（每秒 1 次，遵守其使用政策），只发送公开的园区地址。
const fs=require('node:fs'),path=require('node:path')
const {readCsv}=require('./csv.cjs')
const raw=path.join(__dirname,'raw'),cacheFile=path.join(raw,'geocode-cache.json')
const cache=fs.existsSync(cacheFile)?JSON.parse(fs.readFileSync(cacheFile,'utf8')):{}

// 地址为空或不完整的园区：按名称中的地名人工给出城市级查询词。
const queryOverrides={
  'DayOne Nusajaya':'Iskandar Puteri, Johor, Malaysia',
  'Google Mesa':'Mesa, Arizona, USA',
  'Google Kansas City East':'Kansas City, Missouri, USA',
  'Google Storey County':'Storey County, Nevada, USA',
  'Nebius Mantsala':'Mäntsälä, Finland',
  'Southgate Melbourne':'Melbourne, Victoria, Australia',
  'Oracle Batam':'Batam, Indonesia',
  'OpenAI Stargate Michigan':'Saline Township, Michigan, USA',
  'OpenAI Stargate Milam':'Milam County, Texas, USA',
  'OpenAI Stargate New Mexico':'Doña Ana County, New Mexico, USA',
  'OpenAI Stargate Wisconsin':'Port Washington, Wisconsin, USA',
  'Microsoft Narvik Norway':'Narvik, Norway',
  'Envision Galaxy Ulanqab':'Ulanqab, Inner Mongolia, China',
  'AWS New Albany':'New Albany, Ohio, USA',
  'Stream Phoenix':'Goodyear, Arizona, USA',
  'Amazon Madison Mega Site':'Canton, Mississippi, USA',
  'OpenAI Stargate UAE':'Al Dhafra, Abu Dhabi, United Arab Emirates',
  'Alibaba Zhangbei':'Zhangbei County, Hebei, China',
  'Start Campus Sines Data Campus':'Sines, Portugal',
  'Google Waltham Cross':'Waltham Cross, United Kingdom',
  'Bridge Data Centres MY06':'Sedenak, Johor, Malaysia',
  'YTL Johor':'Kulai, Johor, Malaysia',
  'Meta Hyperion':'Holly Ridge, Louisiana, USA',
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
async function lookup(q){
  const url='https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q)
  const res=await fetch(url,{headers:{'User-Agent':'political-trading-radar/1.0 (local research build)','Accept-Language':'en'}})
  if(!res.ok)throw new Error(`HTTP ${res.status} for ${q}`)
  const [hit]=await res.json();await sleep(1100)
  return hit?{lat:Number(hit.lat),lon:Number(hit.lon),displayName:hit.display_name}:null
}
;(async()=>{
  const centers=readCsv(path.join(raw,'epoch_data_centers.csv'))
  for(const c of centers){
    if(cache[c.Name])continue
    const address=c.Address.replace(/\s+/g,' ').trim(),override=queryOverrides[c.Name]
    const attempts=override?[[override,'city']]:address?[[address,'address'],[address.split(',').slice(-2).join(',').trim()+', '+c.Country,'city']]:[]
    let found=null
    for(const [q,precision] of attempts){const hit=await lookup(q);if(hit){found={query:q,precision,...hit};break}}
    cache[c.Name]=found||{query:attempts.map(a=>a[0]).join(' | ')||null,precision:'unknown',lat:null,lon:null}
    console.log(found?'ok  ':'MISS',c.Name,'->',found?`${found.lat.toFixed(3)},${found.lon.toFixed(3)} (${found.precision})`:'')
    fs.writeFileSync(cacheFile,JSON.stringify(cache,null,1)+'\n')
  }
  console.log('cached',Object.keys(cache).length)
})().catch(e=>{console.error(e);process.exit(1)})
