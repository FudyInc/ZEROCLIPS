import {session} from '@/lib/auth';
export async function POST(){await session();return Response.json({error:'Pendiente de configuración: no hay proveedor MDM conectado.'},{status:409});}
