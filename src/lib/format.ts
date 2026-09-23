export function money(value:string|number,currency='CLP') { const [whole,fraction='']=String(value).split('.');const digits=currency==='CLP'?0:2;return new Intl.NumberFormat('es-CL',{style:'currency',currency,minimumFractionDigits:digits,maximumFractionDigits:digits}).formatToParts(BigInt(whole)).map(part=>part.type==='fraction'?fraction.padEnd(2,'0'):part.value).join(''); }
export function time(value:string|null,zone='America/Santiago') { return value?new Intl.DateTimeFormat('es-CL',{dateStyle:'medium',timeStyle:'short',timeZone:zone}).format(new Date(value)):'—'; }
export function sumMoney(rows:{amount:string|number;currency:string}[]) {
 const sums:Record<string,bigint>={};
 for(const r of rows){const [whole,decimal='']=String(r.amount).split('.');const cents=BigInt(whole)*100n+BigInt(decimal.padEnd(2,'0'));sums[r.currency]=(sums[r.currency]??0n)+cents;}
 return Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,`${v/100n}.${String(v%100n).padStart(2,'0')}`]));
}

export function multiplyMoney(value:string|number,quantity:number){const [whole,decimal='']=String(value).split('.');const cents=(BigInt(whole)*100n+BigInt(decimal.padEnd(2,'0')))*BigInt(quantity);return `${cents/100n}.${String(cents%100n).padStart(2,'0')}`;}
