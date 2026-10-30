import { useEffect, useState } from 'react'
import type { GeoProjection } from 'd3-geo'
import terrainUrl from '../../public/earth-blue-marble.jpg?inline'

// NASA Blue Marble composite, not live satellite imagery. Solar shading is approximate.
export function TerrainImage({projection,width,height,night=true}:{projection:GeoProjection;width:number;height:number;night?:boolean}){
 const [url,setUrl]=useState('')
 useEffect(()=>{
  let cancelled=false
  const image=new Image()
  const paint=()=>{
   const source=document.createElement('canvas');source.width=image.width;source.height=image.height
   const sc=source.getContext('2d');if(!sc)return;sc.drawImage(image,0,0)
   const raw=sc.getImageData(0,0,image.width,image.height).data
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
   const ctx=canvas.getContext('2d');if(!ctx)return
   const out=ctx.createImageData(width,height),now=new Date(),r=Math.PI/180
   const day=(now.getTime()-Date.UTC(now.getUTCFullYear(),0,0))/86400000
   const decl=23.44*Math.sin(2*Math.PI*(day-80)/365.2422)*r
   const sunLon=180-(now.getUTCHours()+now.getUTCMinutes()/60)*15
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=projection.invert?.([x,y]);if(!p||!Number.isFinite(p[0])||Math.abs(p[1])>90)continue
    const back=projection(p);if(!back||Math.hypot(back[0]-x,back[1]-y)>2)continue
    const sx=Math.min(image.width-1,Math.max(0,Math.floor((p[0]+180)/360*image.width)))
    const sy=Math.min(image.height-1,Math.max(0,Math.floor((90-p[1])/180*image.height)))
    const a=(sy*image.width+sx)*4,b=(y*width+x)*4
    const light=Math.sin(p[1]*r)*Math.sin(decl)+Math.cos(p[1]*r)*Math.cos(decl)*Math.cos((p[0]-sunLon)*r)
    const shade=night?.28+.72*Math.max(0,Math.min(1,(light+.12)/.3)):1
    out.data[b]=raw[a]*shade;out.data[b+1]=raw[a+1]*shade;out.data[b+2]=raw[a+2]*shade;out.data[b+3]=255
   }
   ctx.putImageData(out,0,0);if(!cancelled)setUrl(canvas.toDataURL())
  }
  image.onload=paint;image.src=terrainUrl
  const timer=setInterval(()=>{if(image.complete&&image.naturalWidth)paint()},60000)
  return()=>{cancelled=true;clearInterval(timer)}
 },[projection,width,height,night])
 return url?<image href={url} width={width} height={height} pointerEvents="none"/>:null
}
