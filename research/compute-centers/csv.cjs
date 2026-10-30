// 最小 CSV 解析：支持双引号转义和字段内换行，供本目录脚本共用。
const fs=require('node:fs')
function parseCsv(text){
  const rows=[];let row=[],field='',quoted=false
  for(let i=0;i<text.length;i++){
    const c=text[i]
    if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c;continue}
    if(c==='"')quoted=true
    else if(c===','){row.push(field);field=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field=''}
    else field+=c
  }
  if(field||row.length){row.push(field);rows.push(row)}
  const [head,...body]=rows.filter(r=>r.length>1||r[0])
  return body.map(r=>Object.fromEntries(head.map((h,i)=>[h.replace(/^﻿/,''),r[i]??''])))
}
const readCsv=file=>parseCsv(fs.readFileSync(file,'utf8'))
module.exports={parseCsv,readCsv}
