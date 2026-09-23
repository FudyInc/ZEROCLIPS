import {all} from '@/lib/data';import {exportCsv} from '@/lib/csv';
export async function GET(){const rows=await all('devices');return new Response('\uFEFF'+exportCsv(rows.map(r=>({...r,tags:(r.tags as string[]).join(',')}))),{headers:{'Content-Type':'text/csv;charset=utf-8','Content-Disposition':'attachment; filename="zeroclips-dispositivos.csv"','Cache-Control':'private, no-store'}});}
