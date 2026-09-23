import 'server-only';
import {session} from './auth';
import type {Row} from './rows';
export {str,options,named} from './rows';
export type {Row} from './rows';
export async function all(table:string){const {client}=await session();const rows:Row[]=[];for(let from=0;;from+=1000){const {data,error}=await client.from(table).select('*').order('id').range(from,from+999);if(error)throw new Error(error.message);rows.push(...data);if(data.length<1000)break;}return rows;}
