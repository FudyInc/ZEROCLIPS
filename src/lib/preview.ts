// Explicit public, read-only sample data. Never reads the operational database.
import type {Row} from './rows';
export function previewEnabled(){return process.env.ZEROCLIPS_PREVIEW_MODE==='true';}
export const previewMessage='Vista previa de demostración: los cambios se habilitarán al conectar la base de datos.';
export const previewMember={id:'00000000-0000-4000-8000-000000000001',name:'Visitante',role:'administrador',active:true};
const operator='00000000-0000-4000-8000-000000000002';
const project='00000000-0000-4000-8000-000000000010';
const phone='00000000-0000-4000-8000-000000000101';
const account='00000000-0000-4000-8000-000000000201';
const clip='00000000-0000-4000-8000-000000000301';
const created='2026-09-22T15:00:00Z';
const devices:Row[]=[
 {id:phone,code:'DEMO-001',brand:'Apple',model:'iPhone 15',os:'iOS',storage_gb:128,status:'asignado',location:'Estudio',tags:['DEMO','Producción']},
 {id:'00000000-0000-4000-8000-000000000102',code:'DEMO-002',brand:'Samsung',model:'Galaxy S24',os:'Android',storage_gb:256,status:'disponible',location:'Bodega',tags:['DEMO','Reserva']},
 {id:'00000000-0000-4000-8000-000000000103',code:'DEMO-003',brand:'Apple',model:'iPhone 14',os:'iOS',storage_gb:128,status:'mantenimiento',location:'Servicio técnico',tags:['DEMO']}
].map(d=>({...d,serial:null,imei:null,purchased_on:'2026-09-01',supplier:'Proveedor de ejemplo',warranty_until:'2027-09-01',notes:'Dispositivo ficticio de demostración.',battery:null,free_gb:null,telemetry_source:null,telemetry_at:null,created_at:created}));
const tables:Record<string,Row[]>={
 members:[previewMember,{id:operator,name:'Operador de ejemplo',role:'operador',active:true}],
 settings:[{id:true,currency:'CLP',timezone:'America/Santiago'}],devices,
 projects:[{id:project,name:'Lanzamiento · DEMO',client:'Marca de ejemplo',created_at:created}],
 project_members:[{project_id:project,user_id:operator}],
 assignments:[{id:'00000000-0000-4000-8000-000000000401',device_id:phone,user_id:operator,project_id:project,delivered_at:created,returned_at:null,created_by:previewMember.id}],
 purchases:[{id:'00000000-0000-4000-8000-000000000501',supplier:'Proveedor de ejemplo',brand:'Samsung',model:'Galaxy S24',os:'Android',storage_gb:256,quantity:3,received:0,unit_estimate:'450000',currency:'CLP',created_at:created}],
 receipts:[],
 accounts:[{id:account,name:'Perfil de demostración',platform:'Instagram',url:'https://example.com/perfil-demo',project_id:project,device_id:phone,owner_id:operator}],
 tasks:[{id:'00000000-0000-4000-8000-000000000601',title:'Revisar primer corte · DEMO',project_id:project,device_id:phone,owner_id:operator,priority:'alta',due_at:'2026-09-24T18:00:00Z',status:'en curso',created_at:created},{id:'00000000-0000-4000-8000-000000000602',title:'Preparar calendario de publicación · DEMO',project_id:project,device_id:phone,owner_id:operator,priority:'media',due_at:'2026-09-22T18:00:00Z',status:'pendiente',created_at:created}],
 clips:[{id:clip,title:'Lanzamiento de campaña · DEMO',project_id:project,account_id:account,owner_id:operator,material_url:'https://example.com/material-demo',publication_url:null,scheduled_at:'2026-09-25T18:00:00Z',published_at:null,status:'en revisión'}],
 metrics:[],
 incidents:[{id:'00000000-0000-4000-8000-000000000701',device_id:'00000000-0000-4000-8000-000000000103',title:'Revisión del conector · DEMO',severity:'media',owner_id:operator,status:'en reparación',resolution:'',created_at:created}],
 expenses:[{id:'00000000-0000-4000-8000-000000000801',device_id:phone,purchase_id:null,receipt_id:null,incident_id:null,kind:'adquisición',amount:'650000',currency:'CLP',description:'Importe ficticio de demostración',created_at:created}],
 audit:[]
};
export function previewRows(table:string):Row[]{return structuredClone(tables[table]??[]);}
