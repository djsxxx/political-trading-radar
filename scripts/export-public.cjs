// 从本机项目导出公开仓库副本：node scripts/export-public.cjs <目标目录>
// 公开版不含福布斯富豪榜数据、版权保留的人物头像和内部测试截图；目标目录中的 .git 保留，其余文件按本次导出重建。
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process')
const root=path.resolve(__dirname,'..'),target=path.resolve(process.argv[2]||'')
if(!process.argv[2]||target===root||target.startsWith(root+path.sep))throw new Error('请指定项目目录之外的目标目录')

const excluded=[
  /^test-artifacts\//,
  /^frontend\/public\/billionaire-portraits\//,
  /^research\/political-trades\/billionaire-snapshots\//,
]
const placeholder=(file,note)=>{const data=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));return {...data,...note}}
const notice='公开版不含福布斯富豪榜数据（版权原因），仅桌面本机版保留。'
const replacements={
  'frontend/public/billionaires-us.json':placeholder('frontend/public/billionaires-us.json',{scope:notice,people:[]}),
  'frontend/public/billionaire-states.json':placeholder('frontend/public/billionaire-states.json',{scope:notice,people:[]}),
  'frontend/public/billionaire-comparison.json':placeholder('frontend/public/billionaire-comparison.json',{population:notice,entries:[]}),
  'frontend/public/billionaire-portraits.json':{retrievedAt:null,people:{},missing:[]},
}
// 富豪榜审计依赖完整数据，公开版从 audit 中移除。
const dropAudits=['audit_billionaires.cjs','audit_billionaire_states.cjs']
const home=require('node:os').homedir()

const files=cp.execFileSync('git',['ls-files','-co','--exclude-standard','-z'],{cwd:root}).toString().split('\0').filter(Boolean)
  .filter(f=>fs.existsSync(path.join(root,f))&&!excluded.some(r=>r.test(f)))
fs.mkdirSync(target,{recursive:true})
for(const entry of fs.readdirSync(target))if(entry!=='.git')fs.rmSync(path.join(target,entry),{recursive:true,force:true})
let count=0
for(const f of files){
  const out=path.join(target,f);fs.mkdirSync(path.dirname(out),{recursive:true})
  if(replacements[f]){fs.writeFileSync(out,JSON.stringify(replacements[f],null,1)+'\n')}
  else if(f==='package.json'){const pkg=JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));pkg.scripts.audit=pkg.scripts.audit.split(' && ').filter(s=>!dropAudits.some(a=>s.endsWith(a))).join(' && ');fs.writeFileSync(out,JSON.stringify(pkg,null,2)+'\n')}
  else if(/\.(md|json|cjs|js|ts|tsx|py|txt|yml|yaml|csv)$/.test(f)){const text=fs.readFileSync(path.join(root,f),'utf8');fs.writeFileSync(out,text.split(home).join('~'))}
  else fs.copyFileSync(path.join(root,f),out)
  count++
}
// 最后核对：公开副本里不得出现本机用户目录。
const leak=cp.spawnSync('grep',['-rlI','--exclude-dir=.git',home,target]).stdout.toString().trim()
if(leak)throw new Error('导出副本仍含本机路径：\n'+leak)
console.log(`exported ${count} files to ${target}（排除 ${excluded.length} 类目录，替换 ${Object.keys(replacements).length} 个富豪数据文件）`)
