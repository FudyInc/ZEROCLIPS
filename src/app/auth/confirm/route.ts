import {previewEnabled} from '@/lib/preview';
import {type EmailOtpType} from '@supabase/supabase-js';
import {NextRequest,NextResponse} from 'next/server';import {db} from '@/lib/supabase';
export async function GET(request:NextRequest){if(previewEnabled())return NextResponse.redirect(new URL('/',request.url));const token_hash=request.nextUrl.searchParams.get('token_hash');const type=request.nextUrl.searchParams.get('type');if(token_hash&&['invite','recovery'].includes(type||'')){const client=await db();const {error}=await client.auth.verifyOtp({token_hash,type:type as EmailOtpType});if(!error)return NextResponse.redirect(new URL('/auth/password',request.url));}return NextResponse.redirect(new URL('/login?error=Enlace%20inválido%20o%20expirado',request.url));}
