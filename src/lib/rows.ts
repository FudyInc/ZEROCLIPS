export type Row=Record<string,string|number|boolean|null|string[]>;
export function str(row:Row,key:string){return String(row[key]??'');}
export function options(rows:Row[],label='name'){return rows.map(r=>({value:str(r,'id'),label:str(r,label)}));}
export function named(rows:Row[],id:unknown,label='name'){return rows.find(r=>r.id===id)?.[label]?.toString()??String(id??'—').slice(0,8);}
