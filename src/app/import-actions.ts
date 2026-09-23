'use server';
import {session} from '@/lib/auth';
import {all,str} from '@/lib/data';
import {validateCsv} from '@/lib/csv';
import {mutate} from '@/app/actions';
export async function checkImport(csv:string){const {manager}=await session();if(!manager)throw new Error('Permisos insuficientes');if(csv.length>1000000)throw new Error('Archivo demasiado grande (máximo 1 MB)');const rows=await all('devices');return validateCsv(csv,rows.map(r=>({code:str(r,'code'),serial:str(r,'serial'),imei:str(r,'imei')})));}
export async function commitImport(csv:string){const checked=await checkImport(csv);const results=[...checked.errors.map(e=>({...e,ok:false}))];for(const item of checked.valid){const r=await mutate('device',item.data);results.push({row:item.row,ok:r.ok,message:r.message});}return results.sort((a,b)=>a.row-b.row);}
