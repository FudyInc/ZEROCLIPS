'use client';
import {useEffect,useRef,useState} from 'react';
import {Monitor,WifiOff} from 'lucide-react';

export function ScreenShare({deviceCode}:{deviceCode:string}){
 const video=useRef<HTMLVideoElement>(null);const [stream,setStream]=useState<MediaStream|null>(null);const [error,setError]=useState('');
 useEffect(()=>{if(video.current&&stream){video.current.srcObject=stream;void video.current.play().catch(()=>{});const track=stream.getVideoTracks()[0];const ended=()=>setStream(null);track?.addEventListener('ended',ended);return()=>track?.removeEventListener('ended',ended);}},[stream]);
 useEffect(()=>()=>stream?.getTracks().forEach(track=>track.stop()),[stream]);
 async function connect(){setError('');try{if(!navigator.mediaDevices?.getDisplayMedia)throw new Error('Tu navegador no permite compartir pantalla.');const next=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:15,max:30}},audio:false});stream?.getTracks().forEach(track=>track.stop());setStream(next);}catch(e){if(e instanceof DOMException&&e.name==='AbortError')return;setError(e instanceof Error?e.message:'No se pudo conectar la pantalla.');}}
 function disconnect(){stream?.getTracks().forEach(track=>track.stop());setStream(null);}
 return <div className="remote-screen-wrap"><div className={`remote-screen ${stream?'remote-screen-live':''}`}>{stream?<video ref={video} muted playsInline aria-label={`Pantalla compartida de ${deviceCode}`}/>:<><WifiOff size={24}/><strong>Sin conexión remota</strong><span>Selecciona la ventana de AirServer para verla aquí</span></>}</div><div className="screen-share-actions"><button className="secondary button" onClick={stream?disconnect:connect}>{stream?'Desconectar pantalla':'Conectar pantalla local'}</button>{stream&&<span className="live-screen-label"><i/> Transmisión local activa</span>}</div>{error&&<p className="error" role="status">{error}</p>}<small className="muted">Solo visible en este navegador. No se guarda ni se envía a otros usuarios.</small></div>;
}
