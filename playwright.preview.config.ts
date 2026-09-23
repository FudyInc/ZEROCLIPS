import {defineConfig} from '@playwright/test';
import base from './playwright.config';
const servers=base.webServer as {command:string;url:string;timeout?:number;reuseExistingServer:boolean;env?:Record<string,string>}[];
export default defineConfig({...base,testMatch:'preview.spec.ts',webServer:servers.map((server,index)=>index===1?{...server,url:'http://127.0.0.1:3100',env:{...server.env,ZEROCLIPS_PREVIEW_MODE:'true'}}:server)});
