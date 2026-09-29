import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowUpRight, Cloud, Droplets, Layers, LocateFixed, Map as MapIcon, Minus, Plus, Radio, Thermometer, Wind } from 'lucide-react'
import { temp, type Settings, type WeatherData } from '../lib/weather'
const layers = [{ name:'Temperature', icon:Thermometer },{ name:'Rain', icon:Droplets },{ name:'Wind', icon:Wind },{ name:'Clouds', icon:Cloud },{ name:'Radar', icon:Radio }]
export function WeatherMap({ data, settings, full = false, onExpand }: { data: WeatherData; settings: Settings; full?: boolean; onExpand?: () => void }) {
  const element = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const [layer, setLayer] = useState('Temperature')
  const [selector, setSelector] = useState(false)
  useEffect(() => {
    if (!element.current || map.current) return
    const instance = L.map(element.current,{zoomControl:false,scrollWheelZoom:full,attributionControl:true })
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a> — HERE, Garmin, &copy; OpenStreetMap',maxZoom:16}).addTo(instance)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',{maxZoom:16,opacity:.75}).addTo(instance)
    map.current = instance
    const resize = new ResizeObserver(() => instance.invalidateSize()); resize.observe(element.current)
    return () => { resize.disconnect(); instance.remove(); map.current = null; marker.current = null }
  }, [full])
  useEffect(() => {
    const instance = map.current
    if (!instance) return
    instance.setView([data.location.latitude,data.location.longitude],full ? 7 : 8)
    marker.current?.remove()
    const icon = L.divIcon({className:'weather-map-pin',html:`<span class="map-pin-label">${temp(data.current.temperature,settings)}</span><span class="map-pin-dot"></span>`,iconSize:[54,51],iconAnchor:[27,45]})
    marker.current = L.marker([data.location.latitude,data.location.longitude],{icon}).addTo(instance)
    const label = document.createElement('span'); label.textContent = data.location.name
    marker.current.bindTooltip(label,{direction:'bottom',offset:[0,8],permanent:true,className:'city-tooltip'})
  }, [data, settings, full])
  return <section className={`panel weather-map-panel ${full ? 'full-map' : ''}`}><div className="panel-heading"><h2><MapIcon size={16}/>{full ? 'Explore the atmosphere' : 'Weather map'}</h2>{onExpand && <button className="text-button" onClick={onExpand}>Explore map <ArrowUpRight size={14}/></button>}{full && <span className="subtle-label">PAN. ZOOM. DISCOVER.</span>}</div><div className={`map-canvas layer-${layer.toLowerCase()}`}><div ref={element} className="leaflet-host" aria-label={`Interactive ${layer.toLowerCase()} map of ${data.location.name}`}/><div className="map-atmosphere"/><div className="map-control-top"><button className="map-layer-button" onClick={() => setSelector(!selector)} aria-expanded={selector}><Layers size={14}/>{layer}<span>⌄</span></button><span className="map-preview">ILLUSTRATIVE LAYER</span>{selector && <div className="map-layer-menu">{layers.map(l => <button key={l.name} className={layer === l.name ? 'active' : ''} onClick={() => { setLayer(l.name); setSelector(false) }}><l.icon size={15}/>{l.name}{layer === l.name && <span>✓</span>}</button>)}</div>}</div><div className="map-zoom"><button aria-label="Zoom in" onClick={() => map.current?.zoomIn()}><Plus size={17}/></button><button aria-label="Zoom out" onClick={() => map.current?.zoomOut()}><Minus size={17}/></button><button aria-label="Center on selected city" onClick={() => map.current?.flyTo([data.location.latitude,data.location.longitude],full ? 8 : 9)}><LocateFixed size={16}/></button></div><div className="map-legend"><span>{layer === 'Temperature' ? 'Cold' : 'Low'}</span><span className={`map-legend-bar ${layer.toLowerCase()}`}/><span>{layer === 'Temperature' ? 'Warm' : 'High'}</span></div>{full && <div className="map-info"><strong>{data.location.name}</strong><span>Interactive base map · Illustrative weather overlay</span><small>Layer colors demonstrate weather patterns, not observed weather. The city marker uses {data.isDemo ? 'preview' : 'live forecast'} data.</small></div>}</div></section>
}
