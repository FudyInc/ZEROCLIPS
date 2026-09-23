'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="setup"><h1>No pudimos cargar los datos</h1><p>Comprueba la conexión con Supabase y que las migraciones estén aplicadas.</p><button className="primary" onClick={reset}>Volver a intentar</button></main>;}
