-- ZEROCLIPS. All operational writes go through authorized transactional functions.
create schema if not exists private;
revoke all on schema private from public;
create table public.members (
 id uuid primary key references auth.users(id), name text not null check(length(name)>0),
 role text not null default 'operador' check(role in ('administrador','supervisor','operador')), active boolean not null default true
);
create table public.settings (id boolean primary key default true check(id), currency text not null default 'CLP' check(currency in ('CLP','USD','EUR')), timezone text not null default 'America/Santiago');
insert into public.settings default values;
create table public.projects (id uuid primary key default gen_random_uuid(), name text not null check(length(name)>0), client text not null default '', created_at timestamptz not null default now());
create table public.project_members (project_id uuid references public.projects on delete restrict, user_id uuid references public.members on delete restrict, primary key(project_id,user_id));
create table public.devices (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code=upper(trim(code)) and length(code)>0), brand text not null, model text not null,
 os text not null check(os in ('iOS','Android')), serial text unique check(serial=upper(trim(serial)) and length(serial)>0), imei text unique check(imei ~ '^[0-9]{15}$'),
 storage_gb integer not null check(storage_gb>0), purchased_on date, supplier text not null default '', warranty_until date, location text not null default '',
 status text not null default 'disponible' check(status in ('disponible','asignado','mantenimiento','baja')), tags text[] not null default '{}', notes text not null default '',
 battery integer check(battery between 0 and 100), free_gb numeric check(free_gb>=0), telemetry_source text check(telemetry_source in ('manual','integracion')), telemetry_at timestamptz,
 created_at timestamptz not null default now(), check((battery is null and free_gb is null) or (telemetry_source is not null and telemetry_at is not null)), check(free_gb<=storage_gb)
);
create table public.assignments (id uuid primary key default gen_random_uuid(), device_id uuid not null references public.devices, user_id uuid not null references public.members, project_id uuid not null references public.projects, delivered_at timestamptz not null default now(), returned_at timestamptz, created_by uuid references public.members, check(returned_at is null or returned_at>=delivered_at));
create unique index one_active_assignment on public.assignments(device_id) where returned_at is null;
create table public.purchases (id uuid primary key default gen_random_uuid(), supplier text not null, brand text not null, model text not null, os text not null check(os in ('iOS','Android')), storage_gb integer not null check(storage_gb>0), quantity integer not null check(quantity>0), received integer not null default 0 check(received>=0 and received<=quantity), unit_estimate numeric(14,2) not null check(unit_estimate>=0), currency text not null check(currency in ('CLP','USD','EUR')), created_at timestamptz not null default now());
create table public.receipts (id uuid primary key, purchase_id uuid not null references public.purchases, payload jsonb not null, created_at timestamptz not null default now());
create table public.accounts (id uuid primary key default gen_random_uuid(), name text not null, platform text not null, url text not null check(url ~ '^https://'), project_id uuid not null references public.projects, device_id uuid references public.devices, owner_id uuid not null references public.members);
create table public.tasks (id uuid primary key default gen_random_uuid(), title text not null check(length(title)>0), project_id uuid not null references public.projects, device_id uuid references public.devices, owner_id uuid not null references public.members, priority text not null check(priority in ('baja','media','alta')), due_at timestamptz not null, status text not null default 'pendiente' check(status in ('pendiente','en curso','completada')), created_at timestamptz not null default now());
create table public.clips (id uuid primary key default gen_random_uuid(), title text not null check(length(title)>0), project_id uuid not null references public.projects, account_id uuid not null references public.accounts, owner_id uuid not null references public.members, material_url text not null check(material_url ~ '^https://'), publication_url text check(publication_url ~ '^https://'), scheduled_at timestamptz, published_at timestamptz, status text not null default 'pendiente' check(status in ('pendiente','en edición','en revisión','aprobado','publicado')), check(status<>'publicado' or (publication_url is not null and published_at is not null)));
create table public.metrics (id uuid primary key default gen_random_uuid(), clip_id uuid not null references public.clips, views bigint not null check(views>=0), measured_at timestamptz not null, source text not null check(length(source)>0));
create table public.incidents (id uuid primary key default gen_random_uuid(), device_id uuid not null references public.devices, title text not null check(length(title)>0), severity text not null check(severity in ('baja','media','alta','crítica')), owner_id uuid not null references public.members, status text not null default 'abierta' check(status in ('abierta','en reparación','resuelta')), resolution text not null default '', created_at timestamptz not null default now(), check(status<>'resuelta' or length(trim(resolution))>0));
-- Financial data is separate so an authorized device read never leaks costs.
create table public.expenses (id uuid primary key default gen_random_uuid(), device_id uuid not null references public.devices, purchase_id uuid references public.purchases, receipt_id uuid references public.receipts, incident_id uuid references public.incidents unique, kind text not null check(kind in ('adquisición','reparación','accesorios','conectividad')), amount numeric(14,2) not null check(amount>=0), currency text not null check(currency in ('CLP','USD','EUR')), description text not null default '', created_at timestamptz not null default now());
create unique index one_acquisition on public.expenses(device_id) where kind='adquisición';
create table public.audit (id bigint generated always as identity primary key, actor_id uuid, action text not null, entity text not null, record_id text, changes jsonb, created_at timestamptz not null default now());
create function private.current_role() returns text language sql stable security definer set search_path='' as $$select role from public.members where id=auth.uid() and active$$;
create function private.manager() returns boolean language sql stable security definer set search_path='' as $$select coalesce(private.current_role() in ('administrador','supervisor'),false)$$;
create function private.project_access(p uuid) returns boolean language sql stable security definer set search_path='' as $$select private.manager() or (private.current_role() is not null and exists(select 1 from public.project_members where project_id=p and user_id=auth.uid()))$$;
create function private.device_access(d uuid) returns boolean language sql stable security definer set search_path='' as $$select private.manager() or (private.current_role() is not null and exists(select 1 from public.assignments where device_id=d and user_id=auth.uid() and returned_at is null))$$;
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.audit(actor_id,action,entity,record_id,changes) values(auth.uid(),TG_OP,TG_TABLE_NAME,coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'project_id'),jsonb_build_object('before',to_jsonb(old),'after',to_jsonb(new))); return new; end$$;
do $$declare t text; begin foreach t in array array['members','settings','projects','project_members','devices','assignments','purchases','receipts','accounts','tasks','clips','metrics','incidents','expenses'] loop execute format('alter table public.%I enable row level security',t); execute format('create trigger log_change after insert or update on public.%I for each row execute function private.audit_change()',t); end loop; end$$;
alter table public.audit enable row level security;
grant usage on schema private to authenticated;
grant execute on function private.current_role(), private.manager(), private.project_access(uuid), private.device_access(uuid) to authenticated;
create policy read_members on public.members for select to authenticated using(private.manager() or (id=auth.uid() and active));
create policy read_settings on public.settings for select to authenticated using(private.current_role() is not null);
create policy read_projects on public.projects for select to authenticated using(private.project_access(id));
create policy read_project_members on public.project_members for select to authenticated using(private.manager() or (user_id=auth.uid() and private.current_role() is not null));
create policy read_devices on public.devices for select to authenticated using(private.device_access(id));
create policy read_assignments on public.assignments for select to authenticated using(private.manager() or (user_id=auth.uid() and private.current_role() is not null));
create policy read_accounts on public.accounts for select to authenticated using(private.manager() or (owner_id=auth.uid() and private.project_access(project_id)));
create policy read_tasks on public.tasks for select to authenticated using(private.manager() or (owner_id=auth.uid() and private.project_access(project_id)));
create policy read_clips on public.clips for select to authenticated using(private.manager() or (owner_id=auth.uid() and private.project_access(project_id) and exists(select 1 from public.accounts a where a.id=account_id)));
create policy read_metrics on public.metrics for select to authenticated using(exists(select 1 from public.clips c where c.id=clip_id));
create policy read_incidents on public.incidents for select to authenticated using(private.manager() or (owner_id=auth.uid() and private.device_access(device_id)));
do $$declare t text; begin foreach t in array array['purchases','receipts','expenses','audit'] loop execute format('create policy manager_read on public.%I for select to authenticated using(private.manager())',t); end loop; end$$;
revoke all on all tables in schema public from anon, authenticated;
grant select on public.members,public.settings,public.projects,public.project_members,public.devices,public.assignments,public.purchases,public.receipts,public.accounts,public.tasks,public.clips,public.metrics,public.incidents,public.expenses,public.audit to authenticated;
-- No authenticated direct writes. SECURITY DEFINER entrypoints validate roles and relationships.
create function public.operate(op text, data jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare r text:=private.current_role(); result uuid; d public.devices; p public.purchases; a public.accounts; c public.clips; t public.tasks; i public.incidents; target uuid; amount numeric; cur text;
begin
 if r is null then raise exception 'Sesión no autorizada'; end if;
 if op not in ('task_status','clip_status','incident','metric') and not private.manager() then raise exception 'Permisos insuficientes'; end if;
 case op
 when 'project' then
  insert into public.projects(name,client) values(trim(data->>'name'),coalesce(data->>'client','')) returning id into result;
 when 'project_member' then
  if not exists(select 1 from public.members where id=(data->>'user_id')::uuid and active) then raise exception 'Usuario no disponible'; end if;
  insert into public.project_members values((data->>'project_id')::uuid,(data->>'user_id')::uuid) on conflict do nothing; result:=(data->>'project_id')::uuid;
 when 'member' then
  if r<>'administrador' then raise exception 'Solo administradores'; end if;
  target:=(data->>'id')::uuid;
  perform 1 from public.members where id=target for update;
  if target=auth.uid() then raise exception 'No puedes modificar tu propio rol o acceso'; end if;
  if not (data->>'active')::boolean and exists(select 1 from public.assignments where user_id=target and returned_at is null) then raise exception 'Devuelve los equipos antes de desactivar'; end if;
  update public.members set role=data->>'role',active=(data->>'active')::boolean where id=target returning id into result;
 when 'settings' then
  if r<>'administrador' then raise exception 'Solo administradores'; end if;
  if not exists(select 1 from pg_timezone_names where name=data->>'timezone') then raise exception 'Zona horaria inválida'; end if;
  update public.settings set currency=data->>'currency',timezone=data->>'timezone';
 when 'purchase' then
  insert into public.purchases(supplier,brand,model,os,storage_gb,quantity,unit_estimate,currency) values(data->>'supplier',data->>'brand',data->>'model',data->>'os',(data->>'storage_gb')::integer,(data->>'quantity')::integer,(data->>'unit_estimate')::numeric,data->>'currency') returning id into result;
 when 'device' then
  insert into public.devices(code,brand,model,os,serial,imei,storage_gb,purchased_on,supplier,warranty_until,location,tags,notes) values(upper(trim(data->>'code')),data->>'brand',data->>'model',data->>'os',nullif(upper(trim(data->>'serial')),''),nullif(trim(data->>'imei'),''),(data->>'storage_gb')::integer,nullif(data->>'purchased_on','')::date,coalesce(data->>'supplier',''),nullif(data->>'warranty_until','')::date,coalesce(data->>'location',''),array(select jsonb_array_elements_text(coalesce(data->'tags','[]'))),coalesce(data->>'notes','')) returning id into result;
  if nullif(data->>'cost','') is not null then
   if nullif(data->>'purchased_on','') is null then raise exception 'Indica la fecha de compra'; end if;
   insert into public.expenses(device_id,kind,amount,currency) values(result,'adquisición',(data->>'cost')::numeric,data->>'currency');
  end if;
 when 'edit_device' then
  target:=(data->>'id')::uuid; select * into strict d from public.devices where id=target for update;
  if (d.status='asignado' and data->>'status'<>'asignado') or (d.status<>'asignado' and data->>'status'='asignado') then raise exception 'Devuelve el equipo antes de cambiar su estado'; end if;
  update public.devices set code=upper(trim(data->>'code')),brand=data->>'brand',model=data->>'model',os=data->>'os',serial=nullif(upper(trim(data->>'serial')),''),imei=nullif(trim(data->>'imei'),''),storage_gb=(data->>'storage_gb')::integer,supplier=coalesce(data->>'supplier',''),warranty_until=nullif(data->>'warranty_until','')::date,location=coalesce(data->>'location',''),status=data->>'status',tags=array(select jsonb_array_elements_text(coalesce(data->'tags','[]'))),notes=coalesce(data->>'notes','') where id=target returning id into result;
 when 'location' then
  update public.devices set location=data->>'location',tags=array(select jsonb_array_elements_text(coalesce(data->'tags','[]'))) where id=(data->>'id')::uuid returning id into result;
 when 'telemetry' then
  update public.devices set battery=nullif(data->>'battery','')::integer,free_gb=nullif(data->>'free_gb','')::numeric,telemetry_source='manual',telemetry_at=now() where id=(data->>'id')::uuid returning id into result;
 when 'assign' then
  target:=(data->>'device_id')::uuid; select * into strict d from public.devices where id=target for update;
  if d.status<>'disponible' then raise exception 'Equipo no disponible'; end if;
  perform 1 from public.members where id=(data->>'user_id')::uuid and active for update;
  if not found then raise exception 'Operador inactivo'; end if;
  if not exists(select 1 from public.project_members where project_id=(data->>'project_id')::uuid and user_id=(data->>'user_id')::uuid) then raise exception 'Agrega al operador al proyecto primero'; end if;
  insert into public.assignments(device_id,user_id,project_id,created_by) values(target,(data->>'user_id')::uuid,(data->>'project_id')::uuid,auth.uid()) returning id into result;
  update public.devices set status='asignado' where id=target;
 when 'return' then
  target:=(data->>'device_id')::uuid; perform 1 from public.devices where id=target for update;
  update public.assignments set returned_at=now() where device_id=target and returned_at is null returning id into result;
  if result is null then raise exception 'No existe entrega activa'; end if;
  update public.devices set status='disponible' where id=target;
 when 'account' then
  if not exists(select 1 from public.project_members pm join public.members m on m.id=pm.user_id where pm.project_id=(data->>'project_id')::uuid and pm.user_id=(data->>'owner_id')::uuid and m.active) then raise exception 'Responsable fuera del proyecto'; end if;
  if nullif(data->>'device_id','') is not null and not exists(select 1 from public.assignments where device_id=(data->>'device_id')::uuid and project_id=(data->>'project_id')::uuid and user_id=(data->>'owner_id')::uuid and returned_at is null) then raise exception 'El equipo debe estar asignado al responsable y proyecto'; end if;
  insert into public.accounts(name,platform,url,project_id,device_id,owner_id) values(data->>'name',data->>'platform',data->>'url',(data->>'project_id')::uuid,nullif(data->>'device_id','')::uuid,(data->>'owner_id')::uuid) returning id into result;
 when 'task' then
  if not exists(select 1 from public.project_members pm join public.members m on m.id=pm.user_id where pm.project_id=(data->>'project_id')::uuid and pm.user_id=(data->>'owner_id')::uuid and m.active) then raise exception 'Responsable fuera del proyecto'; end if;
  if nullif(data->>'device_id','') is not null and not exists(select 1 from public.assignments where device_id=(data->>'device_id')::uuid and project_id=(data->>'project_id')::uuid and user_id=(data->>'owner_id')::uuid and returned_at is null) then raise exception 'Equipo no asignado al responsable'; end if;
  insert into public.tasks(title,project_id,device_id,owner_id,priority,due_at) values(data->>'title',(data->>'project_id')::uuid,nullif(data->>'device_id','')::uuid,(data->>'owner_id')::uuid,data->>'priority',(data->>'due_at')::timestamptz) returning id into result;
 when 'task_status' then
  select * into strict t from public.tasks where id=(data->>'id')::uuid for update;
  if not private.manager() and not(t.owner_id=auth.uid() and private.project_access(t.project_id)) then raise exception 'Permisos insuficientes'; end if;
  update public.tasks set status=data->>'status' where id=t.id returning id into result;
 when 'clip' then
  select * into strict a from public.accounts where id=(data->>'account_id')::uuid;
  if not exists(select 1 from public.project_members where user_id=a.owner_id and project_id=a.project_id) then raise exception 'Responsable fuera del proyecto'; end if;
  insert into public.clips(title,project_id,account_id,owner_id,material_url,scheduled_at) values(data->>'title',a.project_id,a.id,a.owner_id,data->>'material_url',nullif(data->>'scheduled_at','')::timestamptz) returning id into result;
 when 'clip_status','metric' then
  select * into strict c from public.clips where id=(data->>'id')::uuid for update;
  if not private.manager() and not(c.owner_id=auth.uid() and private.project_access(c.project_id) and exists(select 1 from public.accounts where id=c.account_id and owner_id=auth.uid())) then raise exception 'Permisos insuficientes'; end if;
  if op='metric' then insert into public.metrics(clip_id,views,measured_at,source) values(c.id,(data->>'views')::bigint,(data->>'measured_at')::timestamptz,data->>'source') returning id into result;
  else update public.clips set status=data->>'status',publication_url=nullif(data->>'publication_url',''),published_at=nullif(data->>'published_at','')::timestamptz where id=c.id returning id into result; end if;
 when 'incident' then
  target:=(data->>'device_id')::uuid;
  if not private.device_access(target) then raise exception 'Equipo no autorizado'; end if;
  if not private.manager() and (data->>'owner_id')::uuid<>auth.uid() then raise exception 'Responsable no autorizado'; end if;
  if not exists(select 1 from public.members where id=(data->>'owner_id')::uuid and active) then raise exception 'Responsable inactivo'; end if;
  insert into public.incidents(device_id,title,severity,owner_id) values(target,data->>'title',data->>'severity',(data->>'owner_id')::uuid) returning id into result;
 when 'incident_status' then
  select * into strict i from public.incidents where id=(data->>'id')::uuid for update;
  if i.status='resuelta' or data->>'status' not in ('abierta','en reparación') then raise exception 'Transición no permitida'; end if;
  if data->>'status'='en reparación' then
   select * into strict d from public.devices where id=i.device_id for update;
   if d.status in ('asignado','baja') then raise exception 'Devuelve o reactiva el equipo antes de iniciar la reparación'; end if;
   update public.devices set status='mantenimiento' where id=i.device_id;
  end if;
  update public.incidents set status=data->>'status' where id=i.id returning id into result;
 when 'resolve_incident' then
  select * into strict i from public.incidents where id=(data->>'id')::uuid for update;
  if i.status='resuelta' then raise exception 'La incidencia ya está resuelta'; end if;
  update public.incidents set status='resuelta',resolution=data->>'resolution' where id=i.id returning id into result;
  if nullif(data->>'amount','') is not null then insert into public.expenses(device_id,incident_id,kind,amount,currency,description) values(i.device_id,i.id,'reparación',(data->>'amount')::numeric,data->>'currency',data->>'resolution'); end if;
 when 'expense' then
  if data->>'kind'='adquisición' then raise exception 'Registra adquisiciones mediante compras o alta'; end if;
  insert into public.expenses(device_id,kind,amount,currency,description) values((data->>'device_id')::uuid,data->>'kind',(data->>'amount')::numeric,data->>'currency',coalesce(data->>'description','')) returning id into result;
 else raise exception 'Operación desconocida';
 end case;
 return result;
end$$;
create function public.receive_purchase(purchase uuid, request_id uuid, units jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare p public.purchases; receipt public.receipts; u jsonb; d uuid;
begin
 if not private.manager() then raise exception 'Permisos insuficientes'; end if;
 select * into strict p from public.purchases where id=purchase for update;
 select * into receipt from public.receipts where id=request_id;
 if found then
  if receipt.purchase_id<>purchase or receipt.payload<>units then raise exception 'Identificador de recepción reutilizado con otros datos'; end if;
  return request_id;
 end if;
 if jsonb_typeof(units)<>'array' or jsonb_array_length(units)<1 or p.received+jsonb_array_length(units)>p.quantity then raise exception 'Cantidad recibida inválida'; end if;
 insert into public.receipts(id,purchase_id,payload) values(request_id,purchase,units);
 for u in select * from jsonb_array_elements(units) loop
  insert into public.devices(code,brand,model,os,storage_gb,serial,imei,purchased_on,supplier,location) values(upper(trim(u->>'code')),p.brand,p.model,p.os,p.storage_gb,nullif(upper(trim(u->>'serial')),''),nullif(trim(u->>'imei'),''),(u->>'purchased_on')::date,p.supplier,coalesce(u->>'location','')) returning id into d;
  if nullif(u->>'purchased_on','') is null then raise exception 'Fecha de compra requerida'; end if;
  insert into public.expenses(device_id,purchase_id,receipt_id,kind,amount,currency) values(d,purchase,request_id,'adquisición',(u->>'cost')::numeric,p.currency);
 end loop;
 update public.purchases set received=received+jsonb_array_length(units) where id=purchase;
 return request_id;
end$$;
revoke all on function public.operate(text,jsonb),public.receive_purchase(uuid,uuid,jsonb) from public,anon;
grant execute on function public.operate(text,jsonb),public.receive_purchase(uuid,uuid,jsonb) to authenticated;
-- Provisioning requires an existing auth.users entry; role changes never trust user_metadata.
create function private.new_auth_user() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.members(id,name) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'name',''),split_part(new.email,'@',1))); return new; end$$;
create trigger auth_user_created after insert on auth.users for each row execute function private.new_auth_user();
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;
alter table public.purchases add constraint purchase_currency_precision check(currency<>'CLP' or unit_estimate=trunc(unit_estimate));
alter table public.expenses add constraint expense_currency_precision check(currency<>'CLP' or amount=trunc(amount));
-- Revokes refresh sessions; RLS also denies already-issued access tokens immediately.
create function private.revoke_inactive_sessions() returns trigger language plpgsql security definer set search_path='' as $$begin
 if old.active and not new.active then
  delete from auth.refresh_tokens where user_id=new.id::text;
  delete from auth.sessions where user_id=new.id;
 end if; return new;
end$$;
create trigger revoke_disabled_user after update of active on public.members for each row execute function private.revoke_inactive_sessions();
create index assignments_operator_active on public.assignments(user_id,device_id) where returned_at is null;
create index tasks_owner_project on public.tasks(owner_id,project_id);
create index accounts_owner_project on public.accounts(owner_id,project_id);
create index clips_owner_project on public.clips(owner_id,project_id);
create index incidents_device on public.incidents(device_id);
create index expenses_device on public.expenses(device_id);
create index metrics_clip on public.metrics(clip_id);
create index project_members_user on public.project_members(user_id,project_id);
