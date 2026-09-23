import {z} from 'zod';
const text=z.string().trim().min(1,'Campo obligatorio').max(500);
const id=z.uuid();
const optionalId=z.union([id,z.literal('')]).optional();
const money=z.string().regex(/^\d{1,12}(\.\d{1,2})?$/,'Usa un importe positivo con hasta dos decimales');
const date=z.iso.date();
const optionalDate=z.union([date,z.literal('')]).optional();
const timestamp=z.iso.datetime({offset:true});
const optionalTime=z.union([timestamp,z.literal('')]).optional();
const currency=z.enum(['CLP','USD','EUR']);
const os=z.enum(['iOS','Android']);
const tags=z.array(z.string().trim().min(1).max(50)).max(30);
const device={code:text.transform(v=>v.toUpperCase()),brand:text,model:text,os,serial:z.string().trim().max(100).optional(),imei:z.union([z.string().regex(/^\d{15}$/,'IMEI: 15 dígitos'),z.literal('')]).optional(),storage_gb:z.coerce.number().int().positive().max(16384),supplier:z.string().max(500).optional(),purchased_on:optionalDate,warranty_until:optionalDate,location:z.string().max(500).optional(),tags:tags.default([]),notes:z.string().max(5000).optional()};
export const schemas={
 device:z.object({...device,cost:z.union([money,z.literal('')]).optional(),currency}),
 edit_device:z.object({...device,id,status:z.enum(['disponible','asignado','mantenimiento','baja'])}),
 project:z.object({name:text,client:text}),project_member:z.object({project_id:id,user_id:id}),
 member:z.object({id,role:z.enum(['administrador','supervisor','operador']),active:z.boolean()}),
 settings:z.object({currency,timezone:text}),
 purchase:z.object({supplier:text,brand:text,model:text,os,storage_gb:z.coerce.number().int().positive(),quantity:z.coerce.number().int().min(1).max(10000),unit_estimate:money,currency}),
 location:z.object({id,location:text,tags}),telemetry:z.object({id,battery:z.union([z.literal(''),z.coerce.number().int().min(0).max(100)]),free_gb:z.union([z.literal(''),z.coerce.number().nonnegative()])}),
 assign:z.object({device_id:id,user_id:id,project_id:id}),return:z.object({device_id:id}),
 account:z.object({name:text,platform:z.enum(['TikTok','Instagram','YouTube','Facebook','Otra']),url:z.url().startsWith('https://'),project_id:id,device_id:optionalId,owner_id:id}),
 task:z.object({title:text,project_id:id,device_id:optionalId,owner_id:id,priority:z.enum(['baja','media','alta']),due_at:timestamp}),
 task_status:z.object({id,status:z.enum(['pendiente','en curso','completada'])}),
 clip:z.object({title:text,account_id:id,material_url:z.url().startsWith('https://'),scheduled_at:optionalTime}),
 clip_status:z.object({id,status:z.enum(['pendiente','en edición','en revisión','aprobado','publicado']),publication_url:z.union([z.url().startsWith('https://'),z.literal('')]).optional(),published_at:optionalTime}),
 metric:z.object({id,views:z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),measured_at:timestamp,source:text}),
 incident:z.object({device_id:id,title:text,severity:z.enum(['baja','media','alta','crítica']),owner_id:id}),
 incident_status:z.object({id,status:z.enum(['abierta','en reparación'])}),
 resolve_incident:z.object({id,resolution:text,amount:z.union([money,z.literal('')]).optional(),currency}),
 expense:z.object({device_id:id,kind:z.enum(['reparación','accesorios','conectividad']),amount:money,currency,description:text})
};
export const receiveSchema=z.object({purchase:id,request_id:id,units:z.array(z.object({code:text,serial:z.string().optional(),imei:z.union([z.string().regex(/^\d{15}$/),z.literal('')]).optional(),cost:money,purchased_on:date,location:z.string().max(500).optional()})).min(1).max(500)});
export type Operation=keyof typeof schemas;
export function errorMessage(error:{message:string;code?:string}) {
 if(error.code==='23505')return 'Registro duplicado: revisa código, serie, IMEI o asignación activa.';
 if(error.code==='23503')return 'La referencia seleccionada no existe o cambió. Actualiza la página.';
 if(error.code==='23514'||error.code==='23502')return 'Datos incompletos o incompatibles. Revisa campos y estados.';
 return error.message;
}
