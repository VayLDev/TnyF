'use client';
import { useEffect } from 'react';
export default function GamePage() {
  useEffect(() => { let cancelled=false; import('../game/runtime').then(()=>{ if(cancelled)return; }); return ()=>{cancelled=true;}; }, []);
  return <main id="game" aria-label="Tiny Frontier game" />;
}
