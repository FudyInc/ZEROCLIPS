import Papa from 'papaparse';
import {schemas} from './validation';
export const columns=['code','brand','model','os','serial','imei','storage_gb','purchased_on','cost','currency','supplier','warranty_until','location','tags','notes'];
export function exportCsv(rows:Record<string,unknown>[]){return Papa.unparse(rows,{escapeFormulae:true});}
export function validateCsv(source:string,existing:{code:string;serial:string;imei:string}[]){
 const parsed=Papa.parse<Record<string,string>>(source,{header:true,skipEmptyLines:'greedy'});
 const errors=parsed.errors.map(e=>({row:(e.row??0)+2,message:e.message}));
 const seen={code:new Set(existing.map(e=>e.code.trim().toUpperCase()).filter(Boolean)),serial:new Set(existing.map(e=>e.serial.trim().toUpperCase()).filter(Boolean)),imei:new Set(existing.map(e=>e.imei.trim()).filter(Boolean))};
 const valid:{row:number;data:Record<string,unknown>}[]=[];
 if(parsed.data.length>500)return {valid:[],errors:[{row:0,message:'Máximo 500 filas por archivo.'}]};
 parsed.data.forEach((row,index)=>{
  if(parsed.errors.some(e=>(e.row??-1)===index))return;
  const result=schemas.device.safeParse({...row,currency:row.currency||'CLP',tags:(row.tags||'').split(',').map(t=>t.trim()).filter(Boolean)});
  if(!result.success){errors.push({row:index+2,message:result.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join(' · ')});return;}
  const normalized={code:result.data.code,serial:(result.data.serial||'').trim().toUpperCase(),imei:(result.data.imei||'').trim()};
  const duplicates=(Object.keys(seen) as (keyof typeof seen)[]).filter(k=>normalized[k]&&seen[k].has(normalized[k]));
  if(duplicates.length){errors.push({row:index+2,message:`Duplicado: ${duplicates.join(', ')}`});return;}
  for(const k of Object.keys(seen) as (keyof typeof seen)[])if(normalized[k])seen[k].add(normalized[k]);
  valid.push({row:index+2,data:result.data});
 });return {valid,errors};
}
