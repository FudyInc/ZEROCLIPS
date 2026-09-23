import Link from 'next/link';
import {Monitor,WifiOff,ExternalLink} from 'lucide-react';
import {session} from '@/lib/auth';
import {all,named,str,type Row} from '@/lib/data';
import {Heading,Badge,Empty} from '@/components/ui';

function deviceLabel(device:Row){return `${str(device,'brand')} ${str(device,'model')}`.trim()||'Dispositivo';}

export default async function ControlRoom(){
 const {member}=await session();
 const [devices,assignments,projects,accounts,members]=await Promise.all([all('devices'),all('assignments'),all('projects'),all('accounts'),all('members')]);
 const active=assignments.filter(a=>!a.returned_at);
 return <>
  <Heading eyebrow="OPERACIÓN / VISTA REMOTA" title="Sala de control" description={`Vista operativa de los equipos autorizados para ${member.name.split(' ')[0]}.`}>
   <Link className="secondary button" href="/devices">Gestionar inventario ↗</Link>
  </Heading>
  <section className="control-room-notice card">
   <div className="control-room-notice-icon"><Monitor size={20}/></div>
   <div><strong>Monitoreo remoto pendiente de conexión</strong><p>Esta vista usa únicamente los registros reales de tu inventario. Las pantallas en vivo aparecerán cuando conectes un proveedor compatible; no se muestran emulaciones ni reproducciones automáticas.</p></div>
  </section>
  {!devices.length?<section className="card"><Empty text="Registra un dispositivo para verlo en la sala de control."/></section>:<div className="control-room-grid">
   {devices.map(device=>{
    const assignment=active.find(a=>a.device_id===device.id);
    const project=assignment?named(projects,assignment.project_id):'';
    const account=accounts.find(a=>a.device_id===device.id&&(!assignment||a.project_id===assignment.project_id));
    return <section className="control-card card" key={str(device,'id')}>
     <div className="control-card-head"><div><span className="eyebrow">{str(device,'code')}</span><h2>{deviceLabel(device)}</h2></div><Badge>{str(device,'status')}</Badge></div>
     <div className="remote-screen" aria-label={`Vista remota de ${str(device,'code')}`}><WifiOff size={24}/><strong>Sin conexión remota</strong><span>La pantalla del dispositivo no está disponible</span></div>
     <dl className="control-facts"><div><dt>Responsable</dt><dd>{assignment?named(members,assignment.user_id):'Sin asignar'}</dd></div><div><dt>Proyecto</dt><dd>{project||'Sin proyecto'}</dd></div><div><dt>Perfil</dt><dd>{account?`${str(account,'platform')} · ${str(account,'name')}`:'Sin perfil asociado'}</dd></div><div><dt>Datos técnicos</dt><dd>{device.battery===null?'Sin lectura registrada':`${device.battery}% batería`}</dd></div></dl>
     <div className="control-card-actions"><Link className="secondary button" href={`/devices/${str(device,'id')}`}>Abrir ficha <ExternalLink size={14}/></Link><span className="muted small">Vista remota: pendiente</span></div>
    </section>;
   })}
  </div>}
 </>;
}
