import { useId } from 'react'
import { weatherKind } from '../lib/weather'
export function WeatherIcon({ code = 2, isDay = true, size = 48, className = '' }: { code?: number; isDay?: boolean; size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const kind = weatherKind(code)
  const hasCloud = kind !== 'sun'
  return <svg className={`weather-icon ${className}`} width={size} height={size} viewBox="0 0 120 110" aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-sun`} cx="36%" cy="28%"><stop offset="0" stopColor="#ffe8a3"/><stop offset=".6" stopColor="#ffcb65"/><stop offset="1" stopColor="#eaa53b"/></radialGradient>
      <linearGradient id={`${id}-cloud`} x1="0" y1="0" x2=".35" y2="1"><stop stopColor="#fafbff"/><stop offset=".45" stopColor="#d5e1f0"/><stop offset="1" stopColor="#8eabc9"/></linearGradient>
      <linearGradient id={`${id}-moon`}><stop stopColor="#e8f0ff"/><stop offset="1" stopColor="#91a8d5"/></linearGradient>
      <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id={`${id}-shadow`} x="-25%" y="-25%" width="160%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#061426" floodOpacity=".27"/></filter>
    </defs>
    {(kind === 'sun' || kind === 'partly') && (isDay ? <g className="icon-sun"><circle cx={hasCloud ? 74 : 60} cy={hasCloud ? 36 : 50} r={hasCloud ? 26 : 31} fill="#ffbc49" opacity=".25" filter={`url(#${id}-glow)`}/><circle cx={hasCloud ? 74 : 60} cy={hasCloud ? 36 : 50} r={hasCloud ? 24 : 28} fill={`url(#${id}-sun)`}/></g> : <path d={hasCloud ? 'M87 12a29 29 0 1 0 19 47A30 30 0 0 1 87 12' : 'M71 15a35 35 0 1 0 24 58A36 36 0 0 1 71 15'} fill={`url(#${id}-moon)`}/>)}
    {hasCloud && <g filter={`url(#${id}-shadow)`}><path d="M26 82c-13 0-20-8-20-18 0-10 8-19 18-19 2-17 14-28 29-28 18 0 30 12 31 29 16-3 29 5 29 17 0 11-8 19-20 19Z" transform={kind === 'partly' ? 'translate(3 12) scale(.88)' : 'translate(3 0) scale(.96)'} fill={`url(#${id}-cloud)`}/><path d="M27 64c0-10 7-18 18-18 4-12 13-15 22-13" stroke="white" strokeWidth="2" opacity=".2" fill="none"/></g>}
    {(kind === 'rain' || kind === 'storm') && <g stroke="#79c8ff" strokeWidth="4" strokeLinecap="round" className="icon-rain"><path d="m32 91-4 9m25-9-4 9m25-9-4 9m25-9-4 9"/></g>}
    {kind === 'storm' && <path d="m61 64-13 25h12l-5 18 23-29H64l8-14" fill="#ffd17b"/>}
    {kind === 'snow' && <g fill="#d8edff"><circle cx="30" cy="97" r="3"/><circle cx="55" cy="90" r="3"/><circle cx="77" cy="100" r="3"/><circle cx="94" cy="91" r="3"/></g>}
  </svg>
}
