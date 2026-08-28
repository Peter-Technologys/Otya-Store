'use client'

import {useEffect,useState} from 'react'

type Mode='system'|'light'|'dark'
const order:Mode[]=['system','light','dark']

function isMode(value:string|null):value is Mode{
  return value==='system'||value==='light'||value==='dark'
}

function apply(mode:Mode){
  const root=document.documentElement
  if(mode==='system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme',mode)
  root.style.colorScheme=mode==='system'?'light dark':mode
}

export default function ThemeControl(){
  const[mode,setMode]=useState<Mode>('system')
  useEffect(()=>{const saved=localStorage.getItem('otya_theme');const next:Mode=isMode(saved)?saved:'system';setMode(next);apply(next)},[])
  function cycle(){const next=order[(order.indexOf(mode)+1)%order.length];setMode(next);localStorage.setItem('otya_theme',next);apply(next)}
  const icon=mode==='light'?'☀':mode==='dark'?'☾':'◐'
  return <button type="button" onClick={cycle} aria-label={`Theme: ${mode}. Click to change.`} title={`Theme: ${mode}`} className="fixed z-[100] bottom-4 right-4 rounded-full border w-11 h-11 grid place-items-center text-lg shadow-lg" style={{background:'var(--cosmos-card)',borderColor:'var(--cosmos-divider)',color:'var(--cosmos-text-primary)'}}>{icon}</button>
}
