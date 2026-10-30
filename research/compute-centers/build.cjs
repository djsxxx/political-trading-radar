// 生成 frontend/public/compute-centers.json：全球万卡级算力中心与超算。
// 输入：raw/ 下的 Epoch AI 快照（CC BY 4.0）与地理编码缓存；离线运行，不访问网络。
const fs=require('node:fs'),path=require('node:path')
const {readCsv}=require('./csv.cjs')
const root=path.resolve(__dirname,'../..'),raw=path.join(__dirname,'raw')
const AS_OF='2026-10-30',THRESHOLD=10000

const num=x=>{const s=String(x??'').replace(/,/g,'').trim();if(!s)return null;const n=Number(s);return Number.isFinite(n)?n:null}
const round=n=>n==null||n<=0?null:Math.round(n)
const month=d=>/^\d{4}-\d{2}/.test(d||'')?d.slice(0,7):null
const clean=s=>String(s||'').replace(/#\w+/g,'').replace(/\s+/g,' ').replace(/^"|"$/g,'').trim().replace(/,$/,'')
const slug=s=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const markdownLinks=s=>[...String(s||'').matchAll(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g)].map(m=>({title:m[1],url:m[2]}))
function km(a,b){const r=Math.PI/180,dl=(b.lat-a.lat)*r,dn=(b.lon-a.lon)*r,h=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dn/2)**2;return 12742*Math.asin(Math.sqrt(h))}

// 地理编码失败或落点错误（如被解析到美属维尔京群岛）的园区：人工给出城市级坐标。
const manualCoords={
  'Meta Rosemount':{lat:44.739,lon:-93.126,query:'Rosemount, Minnesota'},
  'Meta Montgomery':{lat:32.377,lon:-86.3,query:'Montgomery, Alabama'},
  'Google Papillion':{lat:41.154,lon:-96.042,query:'Papillion, Nebraska'},
  'Meta Sarpy':{lat:41.082,lon:-96.134,query:'Springfield, Nebraska'},
  'Huawei Horinger':{lat:40.38,lon:111.822,query:'Horinger County, Inner Mongolia'},
  'Meta Aiken':{lat:33.74,lon:-81.84,query:'Trenton, South Carolina'},
}
// 坐标与园区不一致、需按名称并入园区的集群记录。
const clusterMerge={'OpenAI/Microsoft Goodyear Arizona':'Microsoft Goodyear','Google Oklahoma TPU v4 Pods':'Google Pryor (North)'}
// TOP500 2026 年 6 月榜单（见 frontend 数据中的来源）。
const top500={'Lawrence Livermore NL El Capitan Phase 2':{rank:2,rmax:1809},'Jupiter, Jülich':{rank:5,rmax:null},'Eni HPC6':{rank:8,rmax:477.9},'Alps Supercomputer Phase 2':{rank:10,rmax:434.9}}
const top500Source={title:'TOP500 · 2026 年 6 月榜单',url:'https://top500.org/lists/top500/2026/06/highs'}
const countryAlias={'United States':'United States of America'}

;(async()=>{
  const {feature}=await import('topojson-client'),{geoContains}=await import('d3-geo')
  const world=JSON.parse(fs.readFileSync(path.join(root,'frontend/public/world-countries.json'),'utf8'))
  const countries=feature(world,world.objects.countries).features
  const countryByName=new Map(countries.map(f=>[f.properties.name,f]))
  const countryOf=name=>countryByName.get(countryAlias[name]||name)
  const inCountry=(f,lat,lon)=>{const c=f&&countryOf(f);if(!c)return false;if(geoContains(c,[lon,lat]))return true;
    // 110m 国界较粗且缺小岛（如巴淡岛），沿海与岛屿场址允许 120 km 容差；错误落点通常偏离上千公里。
    let best=Infinity;const walk=a=>typeof a[0]==='number'?best=Math.min(best,km({lat,lon},{lat:a[1],lon:a[0]})):a.forEach(walk);walk(c.geometry.coordinates);return best<=120}

  const cache=JSON.parse(fs.readFileSync(path.join(raw,'geocode-cache.json'),'utf8'))
  const timelines=readCsv(path.join(raw,'epoch_data_center_timelines.csv'))
  const centers=readCsv(path.join(raw,'epoch_data_centers.csv'))
  const clusters=readCsv(path.join(raw,'epoch_gpu_clusters.csv'))
  const facilities=[],unplaced=[],problems=[]

  for(const c of centers){
    const rows=timelines.filter(t=>t['Data center']===c.Name&&t.Date).sort((a,b)=>a.Date.localeCompare(b.Date))
    const past=rows.filter(t=>t.Date<=AS_OF),future=rows.filter(t=>t.Date>AS_OF),now=past.at(-1)
    const current=num(now?.['H100 equivalents'])??num(c['Current H100 equivalents'])??0
    const planned=Math.max(0,...future.map(t=>num(t['H100 equivalents'])||0))
    if(Math.max(current,planned)<THRESHOLD)continue
    const power=num(now?.['IT power (MW)'])??num(now?.['Power (MW)'])??num(c['Current power (MW)'])
    const plannedPower=Math.max(0,...future.map(t=>num(t['IT power (MW)'])??num(t['Power (MW)'])??0))
    const firstLive=rows.find(t=>(num(t['H100 equivalents'])||0)>0)
    const status=current>0?'operating':past.length?'building':'announced'
    const geo=manualCoords[c.Name]?{...manualCoords[c.Name],precision:'city'}:cache[c.Name]
    const record={
      id:'epoch-dc-'+slug(c.Name),name:clean(c.Name),type:'ai-gpu',status,origin:'epoch-data-centers',
      operator:clean(c.Owner)||'未公开',users:clean(c.Users)||null,country:c.Country,countryId:String(countryOf(c.Country)?.id??''),
      location:clean(c.Address)||geo?.query||c.Country,coordPrecision:geo?.precision||'unknown',
      h100eCurrent:round(current)||null,h100ePlanned:planned>current?round(planned):null,chips:null,chipTypes:clean(c['Current chip types'])||null,
      powerMW:power?round(power):null,plannedPowerMW:plannedPower>(power||0)?round(plannedPower):null,
      commissioned:month(firstLive&&firstLive.Date<=AS_OF?firstLive.Date:null),plannedOnline:status==='operating'?null:month(rows.find(t=>t.Date>AS_OF&&(num(t['H100 equivalents'])||0)>0)?.Date),
      sourceLevel:'dataset',sources:[{title:'Epoch AI · AI Data Centers（CC BY 4.0）',url:'https://epoch.ai/data/ai-data-centers'},...markdownLinks(c['Selected Sources']).slice(0,2)],
      relatedClusters:[],checkedAt:AS_OF,
    }
    if(geo?.lat==null){unplaced.push(record);continue}
    if(!inCountry(c.Country,geo.lat,geo.lon)){problems.push(`${c.Name}: ${geo.lat},${geo.lon} 不在 ${c.Country}`);continue}
    facilities.push({...record,lat:+geo.lat.toFixed(3),lon:+geo.lon.toFixed(3)})
  }

  const centroid=new Set(['39.381','35.487'])
  for(const e of clusters){
    const chips=num(e['Total number of AI chips'])??((num(e['Chip quantity (primary)'])||0)+(num(e['Chip quantity (secondary)'])||0))
    if(!(chips>=THRESHOLD)||e.Exclude||e['Decommissioned Date (if applicable)']||clean(e['Superseded by']))continue
    const name=clean(e.Name),lat=num(e.latitude),lon=num(e.longitude)
    const anonymous=/^Anonymized/.test(name),supercomputer=(e.Sector==='Public'&&!anonymous)||name==='Eni HPC6'
    const known=lat!=null&&lon!=null&&e.latitude!==''&&!centroid.has(lat.toFixed(3))&&clean(e.Location)&&clean(e.Location)!==e.Country
    const rank=top500[name]
    const record={
      id:'epoch-cluster-'+slug(name)+(anonymous?'-'+slug(e['First Operational Date']||String(chips)):''),
      name:anonymous?'中国匿名集群（Epoch 公开版未披露名称）':name,type:supercomputer?'supercomputer':'ai-gpu',status:'operating',origin:'epoch-gpu-clusters',
      operator:anonymous?'未公开':clean(e.Owner)||'未公开',users:clean(e.Users)||null,country:e.Country||'未公开',countryId:String(countryOf(e.Country)?.id??''),
      location:anonymous?e.Country:clean(e.Location)||'未公开',coordPrecision:known?'site':'unknown',
      h100eCurrent:round(num(e['H100 equivalents'])),h100ePlanned:null,chips:round(chips),chipTypes:clean(e['Chip type (primary)'])||null,
      powerMW:round(num(e['Power Capacity (MW)'])),plannedPowerMW:null,commissioned:month(e['First Operational Date']),plannedOnline:null,
      top500Rank:rank?.rank??null,rmaxPF:rank?.rmax??null,
      sourceLevel:'dataset',sources:[{title:'Epoch AI · GPU Clusters（CC BY 4.0）',url:'https://epoch.ai/data/gpu-clusters'},...(rank?[top500Source]:[]),...['Source 1','Source 2'].map(k=>e[k]).filter(u=>/^https:\/\//.test(u)).map((url,i)=>({title:`原始来源 ${i+1}`,url}))],
      relatedClusters:[],checkedAt:AS_OF,
    }
    if(!known){unplaced.push(record);continue}
    const host=clusterMerge[name]?facilities.find(f=>f.name===clusterMerge[name]):facilities.find(f=>f.origin==='epoch-data-centers'&&km(f,{lat,lon})<=5)
    if(host&&!supercomputer){host.relatedClusters.push(`${name}（${round(chips).toLocaleString('en-US')} 卡${record.commissioned?'，'+record.commissioned:''}）`);continue}
    if(!inCountry(e.Country,lat,lon)){problems.push(`${name}: ${lat},${lon} 不在 ${e.Country}`);continue}
    facilities.push({...record,lat:+lat.toFixed(3),lon:+lon.toFixed(3)})
  }

  // TOP500 前十中 Epoch 未收录的系统，沿用此前逐条核实的记录。
  const curated=[
    {id:'top500-lineshine',name:'LineShine',operator:'National Supercomputing Centre in Shenzhen',country:'China',location:'Shenzhen',lat:22.54,lon:114.06,top500Rank:1,rmaxPF:2198,chipTypes:'中国自研处理器'},
    {id:'top500-fugaku',name:'Fugaku',operator:'RIKEN',country:'Japan',location:'Kobe',lat:34.65,lon:135.22,top500Rank:9,rmaxPF:442,chipTypes:'A64FX CPU（无加速卡）'},
  ]
  for(const c of curated)facilities.push({...c,type:'supercomputer',status:'operating',origin:'curated',users:null,countryId:String(countryOf(c.country).id),coordPrecision:'city',
    h100eCurrent:null,h100ePlanned:null,chips:null,powerMW:null,plannedPowerMW:null,commissioned:null,plannedOnline:null,sourceLevel:'official',
    sources:[top500Source],relatedClusters:[],checkedAt:AS_OF})

  if(problems.length){console.error('坐标校验失败：\n'+problems.join('\n'));process.exit(1)}
  facilities.sort((a,b)=>(b.h100eCurrent||b.h100ePlanned||b.chips||0)-(a.h100eCurrent||a.h100ePlanned||a.chips||0))
  const out={
    asOf:AS_OF,threshold:THRESHOLD,
    scope:'单个园区或集群达到 1 万张 AI 加速卡（或 1 万 H100 当量，含规划）即收录；另收 TOP500 前十超算。',
    coverage:'主要来源 Epoch AI（CC BY 4.0），其自述仅覆盖全球集群算力的一部分；中国条目在公开版中匿名，位置未公开。H100 当量是算力折算值，不是实际卡数。',
    attribution:'Epoch AI, ‘AI data centers’ 与 ‘GPU clusters’, epoch.ai, CC BY 4.0；TOP500.org',
    facilities,unplaced,
  }
  fs.writeFileSync(path.join(root,'frontend/public/compute-centers.json'),JSON.stringify(out,null,1)+'\n')
  const count=k=>facilities.filter(f=>(f.type==='supercomputer'?'super':f.status)===k).length
  console.log(`placed ${facilities.length} (operating ${count('operating')}, building ${count('building')}, announced ${count('announced')}, super ${count('super')}); unplaced ${unplaced.length}; merged clusters ${facilities.reduce((s,f)=>s+f.relatedClusters.length,0)}`)
})().catch(e=>{console.error(e);process.exit(1)})
