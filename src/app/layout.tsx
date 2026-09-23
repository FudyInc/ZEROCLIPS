import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'ZEROCLIPS · Operaciones',description:'Tu flota y tu producción, en un solo lugar.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
