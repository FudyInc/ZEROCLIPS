'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {db,configured} from '@/lib/supabase';
import {previewEnabled,previewMessage} from '@/lib/preview';
import {googleAvailable,appOrigin,establishAccess} from '@/lib/sign-in';
import {session} from '@/lib/auth';
import {schemas,receiveSchema,errorMessage,type Operation} from '@/lib/validation';
export type Result={ok:boolean;message:string;id?:string};
export async function login(form:FormData) {
 if(!configured())redirect('/setup');
 const client=await db();
 const {error}=await client.auth.signInWithPassword({email:String(form.get('email')||''),password:String(form.get('password')||'')});
 if(error)redirect('/login?error=Correo%20o%20contraseña%20incorrectos');
 const message=await establishAccess(client);
 if(message)redirect('/login?error='+encodeURIComponent(message));
 if(previewEnabled())redirect('/login?notice='+encodeURIComponent('Sesión iniciada. La vista previa sin login sigue activa.'));
 redirect('/');
}
export async function loginWithGoogle(){
 if(!configured()||!(await googleAvailable()))redirect('/login?error='+encodeURIComponent('Google está pendiente de habilitación en Supabase.'));
 const client=await db();const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('/auth/callback',appOrigin()).href,queryParams:{prompt:'select_account'}}});
 if(error||!data.url)redirect('/login?error='+encodeURIComponent('No se pudo iniciar el acceso con Google.'));
 redirect(data.url);
}
export async function logout(){if(previewEnabled())redirect('/');if(configured()){const client=await db();await client.auth.signOut();}redirect('/login');}
export async function mutate(op:Operation,input:unknown):Promise<Result>{
 const {client,manager}=await session();if(!client)return {ok:false,message:previewMessage};
 if(!Object.hasOwn(schemas,op))return {ok:false,message:'Operación desconocida'};
 if(!manager&&!['task_status','clip_status','metric','incident'].includes(op))return {ok:false,message:'Permisos insuficientes'};
 const checked=schemas[op].safeParse(input);
 if(!checked.success)return {ok:false,message:checked.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join(' · ')};
 const {data,error}=await client.rpc('operate',{op,data:checked.data});
 if(error)return {ok:false,message:errorMessage(error)};
 revalidatePath('/','layout');return {ok:true,message:'Guardado correctamente',id:data};
}
export async function receive(input:unknown):Promise<Result>{
 const {client,manager}=await session();if(!client)return {ok:false,message:previewMessage};if(!manager)return {ok:false,message:'Permisos insuficientes'};
 const checked=receiveSchema.safeParse(input);if(!checked.success)return {ok:false,message:checked.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join(' · ')};
 const {data,error}=await client.rpc('receive_purchase',checked.data);
 if(error)return {ok:false,message:errorMessage(error)};
 revalidatePath('/','layout');return {ok:true,message:'Recepción registrada',id:data};
}
