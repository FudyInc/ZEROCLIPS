import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {db,configured} from './supabase';
import {isDesignatedAdmin} from './admin-eligibility';
export async function googleAvailable(){
 if(!configured())return false;
 try{const response=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!},cache:'no-store',signal:AbortSignal.timeout(5000)});if(!response.ok)return false;const settings=await response.json();return settings.external?.google===true;}catch{return false;}
}
export function appOrigin(){return new URL(process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000').origin;}
export async function establishAccess(client:Awaited<ReturnType<typeof db>>):Promise<string|null>{
 // Identity and email verification come from Auth, never submitted fields or user_metadata.
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user)return 'No se pudo verificar tu sesión.';
 const {data:member,error:profileError}=await client.from('members').select('id,role,active').eq('id',user.id).single();
 if(profileError||!member)return 'Identidad verificada. Falta inicializar la base de datos y tu perfil de ZEROCLIPS.';
 if(!member.active)return 'Tu acceso está desactivado. Contacta al administrador.';
 if(!isDesignatedAdmin(user,process.env.ZEROCLIPS_ADMIN_EMAIL)||member.role==='administrador')return null;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key)return 'Identidad verificada. Tu asignación de administrador está pendiente de configuración.';
 // This privileged client is scoped to this one role assignment, after a verified identity match.
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error:grantError}=await admin.from('members').update({role:'administrador'}).eq('id',user.id).eq('active',true).select('id').single();
 if(grantError||!data)return 'No se pudo completar tu asignación de administrador.';
 return null;
}
