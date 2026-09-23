import {NextResponse,type NextRequest} from 'next/server';
import {db,configured} from '@/lib/supabase';
import {appOrigin,establishAccess} from '@/lib/sign-in';
import {previewEnabled} from '@/lib/preview';
export async function GET(request:NextRequest){
 const destination=new URL('/login',appOrigin());
 const code=request.nextUrl.searchParams.get('code');
 if(!configured()||!code){destination.searchParams.set('error','No se pudo completar el acceso con Google.');return NextResponse.redirect(destination);}
 const client=await db();const {error}=await client.auth.exchangeCodeForSession(code);
 if(error){destination.searchParams.set('error','El enlace de acceso expiró o no es válido. Vuelve a intentarlo.');return NextResponse.redirect(destination);}
 const message=await establishAccess(client);
 if(message){destination.searchParams.set('error',message);return NextResponse.redirect(destination);}
 if(previewEnabled()){destination.searchParams.set('notice','Sesión iniciada. La vista previa sin login sigue activa.');return NextResponse.redirect(destination);}
 return NextResponse.redirect(new URL('/',appOrigin()));
}
