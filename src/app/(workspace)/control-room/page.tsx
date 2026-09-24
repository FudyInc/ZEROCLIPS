import Link from 'next/link';
import {Monitor} from 'lucide-react';
import {session} from '@/lib/auth';
import {all} from '@/lib/data';
import {Heading} from '@/components/ui';
import {ControlRoomCards} from '@/components/control-room-cards';

export default async function ControlRoom(){
 const {member}=await session();
 const [devices,assignments,projects,accounts,members]=await Promise.all([all('devices'),all('assignments'),all('projects'),all('accounts'),all('members')]);
 return <>
  <Heading eyebrow="OPERACIÓN / VISTA REMOTA" title="Sala de control" description={`Vista operativa de los equipos autorizados para ${member.name.split(' ')[0]}.`}>
   <Link className="secondary button" href="/devices">Gestionar inventario ↗</Link>
  </Heading>
  <section className="control-room-notice card"><div className="control-room-notice-icon"><Monitor size={20}/></div><div><strong>Monitoreo remoto pendiente de conexión</strong><p>Esta vista usa únicamente los registros reales de tu inventario. Las pantallas en vivo aparecerán cuando conectes un proveedor compatible; no se muestran emulaciones ni reproducciones automáticas.</p></div></section>
  <ControlRoomCards devices={devices} assignments={assignments} projects={projects} accounts={accounts} members={members}/>
 </>;
}
