import 'server-only';
import {redirect} from 'next/navigation';
import {db, configured} from './supabase';
export async function session() {
 if(!configured()) redirect('/setup');
 const client=await db();
 const {data:{user},error}=await client.auth.getUser();
 if(error || !user) redirect('/login');
 const {data:member,error:memberError}=await client.from('members').select('*').eq('id',user.id).eq('active',true).single();
 if(memberError || !member) redirect('/login?error=Acceso%20inactivo%20o%20sin%20perfil');
 return {client,user,member:member as {id:string;name:string;role:string;active:boolean},manager:member.role!=='operador'};
}
