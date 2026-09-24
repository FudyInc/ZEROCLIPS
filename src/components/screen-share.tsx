'use client';
import {useEffect,useRef} from 'react';
import {WifiOff} from 'lucide-react';
import {useScreenShare} from './screen-share-context';

export function ScreenShare({deviceCode}:{deviceCode:string}){
 const video=useRef<HTMLVideoElement>(null);const {stream,deviceCode:activeDevice,source,connect,connectCamera,disconnect,error}=useScreenShare();const live=Boolean(stream&&activeDevice===deviceCode);
 useEffect(()=>{if(video.current&&live&&stream){video.current.srcObject=stream;void video.current.play().catch(()=>{});}},[live,stream]);
 return <div className="remote-screen-wrap"><div className={`remote-screen ${live?'remote-screen-live':''}`}>{live?<video ref={video} muted playsInline aria-label={`Pantalla compartida de ${deviceCode}`}/>:<><WifiOff size={24}/><strong>{stream?'Otra pantalla está conectada':'Sin conexión remota'}</strong><span>{stream?'Desconecta la actual para compartir este equipo':'Conecta OBS Virtual Camera para verla aquí'}</span></>}</div><div className="screen-share-actions">{live&&<button className="secondary button" onClick={disconnect}>Desconectar pantalla</button>}{!stream&&<><button className="secondary button" onClick={()=>void connectCamera(deviceCode)}>Conectar OBS Virtual Camera</button><button className="text-button" onClick={()=>void connect(deviceCode)}>Compartir ventana</button></>}{live&&<span className="live-screen-label"><i/> {source==='camera'?'OBS Virtual Camera':'Transmisión local'} activa</span>}</div>{error&&<p className="error" role="status">{error}</p>}<small className="muted">La fuente se mantiene al cambiar de página; se cierra al desconectar.</small></div>;
}
