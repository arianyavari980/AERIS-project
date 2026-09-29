import { useId } from 'react'
import * as SunCalc from 'suncalc'
import { Activity, ArrowUpRight, Leaf, Moon, Sunrise, Sunset } from 'lucide-react'
import { aqiLabel, type Settings, type WeatherData } from '../lib/weather'
export function AirQuality({ data, expanded = false, onExpand }: { data: WeatherData; expanded?: boolean; onExpand?: () => void }) {
  const a = data.air
  const color = !a || a.aqi <= 40 ? '#8ad9bf' : a.aqi <= 60 ? '#e9ca7f' : '#efa08a'
  return <section className={`panel air-panel ${expanded ? 'air-expanded' : ''}`}><div className="panel-heading"><h2><Leaf size={16}/>Air quality</h2>{onExpand && <button className="icon-button" onClick={onExpand} aria-label="Air quality details"><ArrowUpRight size={16}/></button>}{expanded && <span className="subtle-label">EUROPEAN AQI</span>}</div>{a ? <><div className="air-content"><div className="aqi-ring"><svg viewBox="0 0 130 120"><path d="M25 100A52 52 0 1 1 105 100" stroke="#ffffff0e" fill="none" strokeWidth="7" strokeLinecap="round"/><path d="M25 100A52 52 0 1 1 105 100" stroke={color} fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${Math.min(a.aqi,100)*2.35} 250`}/></svg><div><strong>{a.aqi}</strong><span>EUROPEAN AQI</span></div></div><div className="air-copy"><span className="quality-badge" style={{color}}><span style={{background:color}}/>{aqiLabel(a.aqi)}</span><p>{a.aqi <= 40 ? 'A breath of fresh air.' : a.aqi <= 60 ? 'Take it a little easier outside.' : 'Consider spending more time indoors.'}</p><small>{a.aqi <= 40 ? 'Enjoy your time outdoors.' : 'Sensitive groups should limit prolonged outdoor exertion.'}</small></div></div>{expanded && <div className="pollutant-grid">{[{label:'PM2.5',value:a.pm25,detail:'Fine particulate matter'},{label:'PM10',value:a.pm10,detail:'Coarse particulate matter'},{label:'O₃',value:a.ozone,detail:'Ground-level ozone'},{label:'NO₂',value:a.nitrogen,detail:'Nitrogen dioxide'},{label:'CO',value:a.co,detail:'Carbon monoxide'}].map(p => <div key={p.label}><Activity size={17}/><span>{p.label}</span><strong>{p.value}<small>μg/m³</small></strong><p>{p.detail}</p></div>)}</div>}<div className="air-scale"><span/><span/><span/><span/><span/><span/></div><div className="air-scale-labels"><span>Good</span><span>Moderate</span><span>Poor</span></div></> : <div className="air-unavailable"><Leaf size={28}/><h3>Air quality is taking a breather.</h3><p>The air quality service is temporarily unavailable for this location. Weather forecasts are still available.</p></div>}</section>
}
export function SunCard({ data, settings }: { data: WeatherData; settings: Settings }) {
  const id = useId().replace(/:/g,'')
  const day = data.daily[0]
  const rise = Number(day.sunrise?.slice(11,13))*60+Number(day.sunrise?.slice(14,16))
  const set = Number(day.sunset?.slice(11,13))*60+Number(day.sunset?.slice(14,16))
  const current = Number(data.current.time.slice(11,13))*60+Number(data.current.time.slice(14,16))
  const fraction = Number.isFinite(rise) && set > rise ? Math.max(0,Math.min(1,(current-rise)/(set-rise))) : .5
  const x = 24+fraction*272
  const y = 96-280*fraction*(1-fraction)
  const duration = set-rise
  const sunTime = (time: string) => {
    const hour = Number(time.slice(11,13)); const minute = time.slice(14,16)
    return settings.clock === '24h' ? `${String(hour).padStart(2,'0')}:${minute}` : `${hour%12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`
  }
  return <section className="panel sun-panel"><div className="panel-heading"><h2><Sunrise size={16}/>Sunrise & sunset</h2><span className="daylight-badge">{duration > 0 ? `${Math.floor(duration/60)}h ${duration%60}m of daylight` : 'Polar day / night'}</span></div><div className="sun-chart"><svg viewBox="0 0 320 130" aria-label="Sun’s position between sunrise and sunset"><defs><linearGradient id={`${id}-sunfill`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ddb879" stopOpacity=".17"/><stop offset="1" stopColor="#ddb879" stopOpacity="0"/></linearGradient></defs><path d="M24 96Q160-44 296 96V105H24Z" fill={`url(#${id}-sunfill)`}/><path d="M24 96Q160-44 296 96" fill="none" stroke="#d6b47e" strokeWidth="1.5" strokeDasharray="3 4"/><line x1="10" x2="310" y1="96" y2="96" stroke="#ffffff1c"/><circle cx={x} cy={y} r="15" fill="#efd19a" opacity=".07"/><circle cx={x} cy={y} r="10" fill="#efd19a" opacity=".12"/><circle cx={x} cy={y} r="5" fill="#f7dba2"/><circle cx="24" cy="96" r="3" fill="#d6b47e"/><circle cx="296" cy="96" r="3" fill="#d6b47e"/></svg></div><div className="sun-times"><div><Sunrise size={16}/><span>Sunrise<strong>{day.sunrise ? sunTime(day.sunrise) : 'No sunrise'}</strong></span></div><div><Sunset size={16}/><span>Sunset<strong>{day.sunset ? sunTime(day.sunset) : 'No sunset'}</strong></span></div></div></section>
}
export function MoonCard({ data, settings }: { data: WeatherData; settings: Settings }) {
  const date = new Date()
  const illumination = SunCalc.getMoonIllumination(date)
  const phase = illumination.phase
  const phaseName = phase < .03 || phase > .97 ? 'New moon' : phase < .22 ? 'Waxing crescent' : phase < .28 ? 'First quarter' : phase < .47 ? 'Waxing gibbous' : phase < .53 ? 'Full moon' : phase < .72 ? 'Waning gibbous' : phase < .78 ? 'Last quarter' : 'Waning crescent'
  const times = SunCalc.getMoonTimes(date, data.location.latitude, data.location.longitude)
  const format = (time?: Date) => time ? time.toLocaleTimeString('en-US',{timeZone:data.timezone,hour:'numeric',minute:'2-digit',hour12:settings.clock === '12h'}) : 'Below horizon'
  return <section className="panel moon-panel"><div className="panel-heading"><h2><Moon size={16}/>Moon phase</h2><span className="subtle-label">TONIGHT’S SKY</span></div><div className="moon-content"><div className="moon-visual" style={{'--moon-shadow': `${(1-illumination.fraction)*58*(phase < .5 ? 1 : -1)}px`} as React.CSSProperties}><span/><i/><b/></div><div><h3>{phaseName}</h3><p><strong>{Math.round(illumination.fraction*100)}%</strong> illuminated</p><span className="moon-note">A little perspective, after dark.</span></div></div><div className="moon-times"><span>Moonrise <strong>{format(times.rise)}</strong></span><span>Moonset <strong>{format(times.set)}</strong></span></div></section>
}
