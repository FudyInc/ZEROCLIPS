'use client';
import {createContext,useContext} from 'react';
const PreviewContext=createContext(false);
export function PreviewProvider({enabled,children}:{enabled:boolean;children:React.ReactNode}){return <PreviewContext.Provider value={enabled}>{children}</PreviewContext.Provider>;}
export function usePreview(){return useContext(PreviewContext);}
