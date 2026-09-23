export type Capability='telemetry'|'installApp'|'remoteControl'|'wipe';
export type CapabilityState='disponible'|'pendiente de configuración'|'no compatible';
export interface DeviceProvider { name:string; capability(os:'iOS'|'Android',action:Capability):CapabilityState; execute(deviceId:string,action:Capability):Promise<never|{requestId:string}>; }
export class UnconfiguredProvider implements DeviceProvider {
 name='Sin proveedor conectado';
 capability():CapabilityState{return 'pendiente de configuración';}
 async execute():Promise<never>{throw new Error('Gestión técnica pendiente de configurar un proveedor MDM real.');}
}
export const mdm:DeviceProvider=new UnconfiguredProvider();
