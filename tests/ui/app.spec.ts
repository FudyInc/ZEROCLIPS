import {test,expect} from '@playwright/test';
test('Navegación, filtros, ficha y cierre de sesión con fixture aislado',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page).toHaveURL(/login/);
 await page.getByLabel('Correo electrónico').fill('admin@example.test');await page.getByLabel('Contraseña').fill('test-password-only');await page.getByRole('button',{name:'Iniciar sesión'}).click();
 await expect(page.getByRole('heading',{name:'Tu operación, al día.'})).toBeVisible();
 await page.screenshot({path:`test-results/dashboard-${info.project.name}.png`,fullPage:true});
 await page.goto('/devices');await expect(page.getByText('iPhone de prueba',{exact:false})).toBeVisible();
 await page.getByLabel('Buscar un dispositivo').fill('inexistente');await expect(page.getByText('No hay dispositivos que coincidan')).toBeVisible();await page.getByLabel('Buscar un dispositivo').fill('');
 await page.screenshot({path:`test-results/inventory-${info.project.name}.png`,fullPage:true});
 await page.getByRole('link',{name:'Abrir TEST-001'}).click();await expect(page.getByRole('heading',{name:'Identificación QR'})).toBeVisible();await expect(page.getByAltText('QR de TEST-001')).toBeVisible();
 for(const [route,title] of [['projects','Proyectos.'],['purchases','Compras y costos.'],['assignments','Asignaciones.'],['accounts','Perfiles de publicación.'],['tasks','Tareas.'],['clips','Pipeline de clips.'],['incidents','Incidencias.'],['members','Tu equipo.'],['settings','Configuración.']]){await page.goto('/'+route);await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();}
 await expect(page.getByText('Sin proveedor MDM conectado.',{exact:false})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 // Mobile keeps logout accessible in a compact header menu.
 await page.getByRole('button',{name:'Cerrar sesión'}).filter({visible:true}).first().click();await expect(page).toHaveURL(/login/);expect(errors).toEqual([]);
});
