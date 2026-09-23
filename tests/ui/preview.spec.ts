import {test,expect} from '@playwright/test';
test('Acceso directo sin login y demostración aislada de Supabase',async({page,request},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Tu operación, al día.'})).toBeVisible();
 await expect(page.getByText('Demostración · acceso sin login')).toBeVisible();
 await expect(page.getByRole('button',{name:'Cerrar sesión'})).toHaveCount(0);
 await page.screenshot({path:`test-results/preview-${info.project.name}.png`,fullPage:true});
 await page.goto('/login');await expect(page.getByRole('button',{name:'Continuar con Google'})).toBeVisible();await expect(page.getByRole('button',{name:'Continuar con Google'})).toBeDisabled();await page.getByRole('link',{name:'Continuar sin iniciar sesión'}).click();await expect(page).toHaveURL('http://127.0.0.1:3100/');
 await page.goto('/devices');await page.getByRole('link',{name:'Abrir DEMO-001'}).click();
 await expect(page.getByRole('heading',{name:'Identificación QR'})).toBeVisible();
 for(const [route,title] of [['purchases','Compras y costos.'],['assignments','Asignaciones.'],['projects','Proyectos.'],['accounts','Perfiles de publicación.'],['clips','Pipeline de clips.'],['incidents','Incidencias.'],['members','Tu equipo.'],['settings','Configuración.'],['tasks','Tareas.']]){await page.goto('/'+route);await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();}
 const button=page.getByRole('button',{name:'Actualizar estado'}).first();await expect(button).toBeDisabled();
 // Even a visitor who enables the button in DevTools cannot write real data.
 await button.evaluate((el:HTMLButtonElement)=>{el.disabled=false;});await button.click();
 await expect(page.getByText('Vista previa de demostración: los cambios se habilitarán al conectar la base de datos.')).toBeVisible();
 const csv=await request.get('/api/devices/export');expect(csv.status()).toBe(200);expect(await csv.text()).toContain('DEMO-001');
 const mdm=await request.post('/api/mdm');expect(mdm.status()).toBe(409);
 const diagnostics=await request.get('http://127.0.0.1:54329/diagnostics');expect((await diagnostics.json()).providerRequests).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});
