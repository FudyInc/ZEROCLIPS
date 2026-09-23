'use server';
import {session} from '@/lib/auth';import {redirect} from 'next/navigation';
export async function setPassword(form:FormData){const {client}=await session();if(!client)redirect('/');const password=String(form.get('password')||'');if(password.length<12)redirect('/auth/password?error=Usa%20al%20menos%2012%20caracteres');const {error}=await client.auth.updateUser({password});if(error)redirect('/auth/password?error=No%20se%20pudo%20actualizar%20la%20contraseña');redirect('/');}
