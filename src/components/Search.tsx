import { useEffect, useRef, useState } from 'react'
import { ArrowUpLeft, Clock3, LoaderCircle, LocateFixed, MapPin, Search as SearchIcon, X } from 'lucide-react'
import { popularLocations, readStorage, searchLocations, writeStorage, type Location } from '../lib/weather'
export function Search({ onSelect, onLocate, locating }: { onSelect: (location: Location) => void; onLocate: () => void; locating: boolean }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Location[]>([])
  const [recent, setRecent] = useState<Location[]>(() => readStorage('aeris-recent', []))
  const [searching, setSearching] = useState(false)
  const [offline, setOffline] = useState(false)
  const [active, setActive] = useState(-1)
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const changeQuery = (value: string) => { setQuery(value); setResults([]); setSearching(value.trim().length >= 2); setOffline(false); setActive(-1) }
  useEffect(() => {
    const listener = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const shortcut = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); input.current?.focus() } }
    document.addEventListener('mousedown', listener); document.addEventListener('keydown', shortcut)
    return () => { document.removeEventListener('mousedown', listener); document.removeEventListener('keydown', shortcut) }
  }, [])
  useEffect(() => {
    if (query.trim().length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchLocations(query.trim(), controller.signal).then(setResults).catch(error => {
        if (error.name !== 'AbortError') { setResults(popularLocations.filter(l => `${l.name} ${l.country}`.toLowerCase().includes(query.toLowerCase()))); setOffline(true) }
      }).finally(() => { if (!controller.signal.aborted) setSearching(false) })
    }, 300)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query])
  const suggestions = query.length >= 2 ? results : recent.length ? recent.slice(0, 4) : popularLocations.slice(0, 4)
  const select = (location: Location) => { const next = [location, ...recent.filter(l => l.id !== location.id)].slice(0,5); setRecent(next); writeStorage('aeris-recent', next); changeQuery(''); setOpen(false); input.current?.blur(); onSelect(location) }
  return <div className="search-container" ref={root}>
    <div className={`search-field ${open ? 'focused' : ''}`}>
      <SearchIcon size={18}/>
      <input ref={input} id="location-search" autoComplete="off" placeholder="Search city or location..." aria-label="Search city or location" role="combobox" aria-expanded={open} aria-controls="search-suggestions" aria-autocomplete="list" aria-activedescendant={open && active >= 0 && active < suggestions.length ? `suggestion-${active}` : undefined} value={query} onFocus={() => setOpen(true)} onChange={e => { setOpen(true); changeQuery(e.target.value) }} onKeyDown={e => {
        if (e.key === 'Escape') setOpen(false)
        if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a+1,suggestions.length-1)) }
        if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a-1,0)) }
        if (e.key === 'Enter' && suggestions.length) { e.preventDefault(); select(suggestions[Math.max(0, active)]) }
      }}/>
      {searching ? <LoaderCircle className="spin" size={16}/> : query ? <button className="icon-button clear-search" aria-label="Clear search" onClick={() => changeQuery('')}><X size={16}/></button> : <kbd>⌘ K</kbd>}
      <span className="search-divider"/>
      <button className="location-button" onClick={() => { setOpen(false); onLocate() }} disabled={locating} aria-label="Use my location" title="Use my location">{locating ? <LoaderCircle size={18} className="spin"/> : <LocateFixed size={18}/>}</button>
    </div>
    {open && <div className="search-dropdown">
      <div className="search-heading">{query.length >= 2 ? offline ? 'Offline suggestions' : 'Locations' : recent.length ? 'Recent searches' : 'Explore a little further'}{recent.length > 0 && query.length < 2 && <button onClick={() => { setRecent([]); writeStorage('aeris-recent', []) }}>Clear</button>}</div>
      <div id="search-suggestions" role="listbox" aria-label="Location suggestions">{suggestions.map((location, i) => <button role="option" aria-selected={active === i} id={`suggestion-${i}`} className={`search-result ${active === i ? 'selected' : ''}`} key={location.id} onMouseEnter={() => setActive(i)} onClick={() => select(location)}>{query.length < 2 && recent.length ? <Clock3 size={17}/> : <MapPin size={17}/>}<span><strong>{location.name}</strong><small>{[location.admin1, location.country].filter(Boolean).filter((x,i,a) => a.indexOf(x) === i).join(', ')}</small></span><ArrowUpLeft size={16}/></button>)}</div>
      {query.length >= 2 && !searching && !suggestions.length && <div className="search-empty">{offline ? 'Search is temporarily offline. Try London, Paris, or Tokyo.' : 'No locations found. Try another city name.'}</div>}
      {searching && !suggestions.length && <div className="search-empty">Finding your corner of the world…</div>}
      <div className="search-footer"><span>↑ ↓ to navigate</span><span>↵ to explore</span><span>esc to close</span></div>
    </div>}
  </div>
}
