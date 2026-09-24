'use client';
import Link from 'next/link';
import {ExternalLink} from 'lucide-react';
import {Badge,Empty} from '@/components/ui';
import {named,str,type Row} from '@/lib/rows';
import {ScreenShare} from '@/components/screen-share';
function deviceLabel(device:Row){return `${str(device,'brand')} ${str(device,'model')}`.trim()||'Dispositivo';}
export function ControlRoomCards({devices,assignments,projects,accounts,members}:{devices:Row[];assignments:Row[];projects:Row[];accounts:Row[];members:Row[]}){
 const active=assignments.filter(a=>!a.returned_at);
 if(!devices.length)return <section className="card"><Empty text="Registra un dispositivo para verlo en la sala de control."/></section>;
 return <div className="control-room-grid">{devices.map(device=>{const assignment=active.find(a=>a.device_id===device.id);const project=assignment?named(projects,assignment.project_id):'';const account=accounts.find(a=>a.device_id===device.id&&(!assignment||a.project_id===assignment.project_id));return <section className="control-card card" key={str(device,'id')}><div className="control-card-head"><div><span className="eyebrow">{str(device,'code')}</span><h2>{deviceLabel(device)}</h2></div><Badge>{str(device,'status')}</Badge></div><ScreenShare deviceCode={str(device,'code')}/><dl className="control-facts"><div><dt>Responsable</dt><dd>{assignment?named(members,assignment.user_id):'Sin asignar'}</dd></div><div><dt>Proyecto</dt><dd>{project||'Sin proyecto'}</dd></div><div><dt>Perfil</dt><dd>{account?`${str(account,'platform')} · ${str(account,'name')}`:'Sin perfil asociado'}</dd></div><div><dt>Datos técnicos</dt><dd>{device.battery===null?'Sin lectura registrada':`${device.battery}% batería`}</dd></div></dl><div className="control-card-actions"><Link className="secondary button" href={`/devices/${str(device,'id')}`}>Abrir ficha <ExternalLink size={14}/></Link><span className="muted small">Vista remota: pendiente</span></div></section>;})}</div>;
}
