export type Location = { id: string; name: string; country: string; latitude: number; longitude: number; admin1?: string }
export type Hour = { time: string; temperature: number; rain: number; wind: number; humidity: number; uv: number; code: number; isDay: boolean }
export type Day = { date: string; code: number; high: number; low: number; rain: number; sunrise: string; sunset: string; uv: number; wind: number }
export type Air = { aqi: number; pm25: number; pm10: number; ozone: number; nitrogen: number; co: number }
export type WeatherData = {
  location: Location; timezone: string; isDemo: boolean; updated: Date;
  current: { temperature: number; feelsLike: number; humidity: number; wind: number; windDirection: number; pressure: number; visibility: number; uv: number; code: number; isDay: boolean; time: string };
  hourly: Hour[]; daily: Day[]; air: Air | null
}
export type Settings = { temperature: 'celsius' | 'fahrenheit'; wind: 'kmh' | 'mph'; motion: boolean; clock: '12h' | '24h' }
export const defaultSettings: Settings = { temperature: 'celsius', wind: 'kmh', motion: true, clock: '12h' }
export const stockholm: Location = { id: 'stockholm', name: 'Stockholm', country: 'Sweden', latitude: 59.3293, longitude: 18.0686 }
export const popularLocations: Location[] = [stockholm,
  { id: 'london', name: 'London', country: 'United Kingdom', latitude: 51.5085, longitude: -0.1257 },
  { id: 'new-york', name: 'New York', country: 'United States', latitude: 40.7143, longitude: -74.006 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', latitude: 35.6895, longitude: 139.6917 },
  { id: 'paris', name: 'Paris', country: 'France', latitude: 48.8534, longitude: 2.3488 },
  { id: 'tromso', name: 'Tromsø', country: 'Norway', latitude: 69.6496, longitude: 18.956 }]
const isoDate = (date: Date) => date.toISOString().slice(0, 10)
export function createDemo(): WeatherData {
  const date = new Date(); date.setHours(12, 0, 0, 0)
  const temperatures = [18, 19, 20, 21, 20, 19, 17, 16, 15, 14, 13, 13, 12, 12, 13, 14, 15, 16, 18, 19, 20, 20, 19, 18]
  const hourly: Hour[] = temperatures.map((temperature, i) => {
    const d = new Date(date); d.setHours(15 + i)
    return { time: `${isoDate(d)}T${String(d.getHours()).padStart(2, '0')}:00`, temperature, rain: i < 6 ? [5, 5, 0, 0, 5, 10][i] : 10, wind: 12 + Math.round(Math.sin(i / 3) * 5), humidity: 64 + Math.round(Math.sin(i / 4) * 15), uv: Math.max(0, 4 - i), code: i < 2 ? 2 : i < 5 ? 0 : 2, isDay: d.getHours() >= 7 && d.getHours() <= 18 }
  })
  const dayValues = [[2,21,12,5],[0,23,13,0],[2,20,12,10],[61,17,11,85],[3,18,10,20],[2,19,11,10],[0,22,12,0]]
  const daily: Day[] = dayValues.map((v, i) => { const d = new Date(date); d.setDate(d.getDate()+i); return { date: isoDate(d), code: v[0], high: v[1], low: v[2], rain: v[3], sunrise: `${isoDate(d)}T06:47`, sunset: `${isoDate(d)}T18:28`, uv: 3+i%3, wind: 14+i*2 } })
  return { location: stockholm, timezone: 'Europe/Stockholm', isDemo: true, updated: new Date(), current: { temperature: 18, feelsLike: 17, humidity: 64, wind: 14, windDirection: 225, pressure: 1018, visibility: 24, uv: 3, code: 2, isDay: true, time: `${isoDate(date)}T15:00` }, hourly, daily, air: { aqi: 24, pm25: 4.2, pm10: 8.6, ozone: 48, nitrogen: 12, co: 180 } }
}
async function getJson(url: string, signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(14000)
  const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout })
  if (!response.ok) throw new Error(`Weather service returned ${response.status}. Please try again shortly.`)
  return response.json()
}
export async function searchLocations(query: string, signal?: AbortSignal): Promise<Location[]> {
  const data = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`, signal)
  return (data.results || []).map((r: { id: number; name: string; country?: string; latitude: number; longitude: number; admin1?: string }) => ({ id: String(r.id), name: r.name, country: r.country || '', latitude: r.latitude, longitude: r.longitude, admin1: r.admin1 }))
}
export async function getWeather(location: Location): Promise<WeatherData> {
  const coords = `latitude=${location.latitude}&longitude=${location.longitude}`
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?${coords}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,visibility,wind_speed_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=7`
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${coords}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone&timezone=auto`
  const [weatherResult, airResult] = await Promise.allSettled([getJson(forecastUrl), getJson(airUrl)])
  if (weatherResult.status === 'rejected') throw new Error('We couldn’t reach the weather satellites. Check your connection and try again.')
  const w = weatherResult.value
  if (!w.current || !w.hourly || !w.daily) throw new Error('This location’s forecast is temporarily unavailable. Please try another location.')
  const c = w.current
  const h = w.hourly
  let start = h.time.findIndex((t: string) => t.slice(0, 13) >= c.time.slice(0, 13))
  if (start < 0) start = 0
  const hourly: Hour[] = h.time.slice(start, start+24).map((time: string, index: number) => { const i = index+start; return { time, temperature: h.temperature_2m[i], humidity: h.relative_humidity_2m[i], rain: h.precipitation_probability[i] ?? 0, wind: h.wind_speed_10m[i], code: h.weather_code[i], uv: h.uv_index[i] ?? 0, isDay: !!h.is_day[i] } })
  const d = w.daily
  const daily: Day[] = d.time.map((date: string, i: number) => ({ date, code: d.weather_code[i], high: d.temperature_2m_max[i], low: d.temperature_2m_min[i], rain: d.precipitation_probability_max[i] ?? 0, sunrise: d.sunrise[i], sunset: d.sunset[i], uv: d.uv_index_max[i], wind: d.wind_speed_10m_max[i] }))
  const a = airResult.status === 'fulfilled' ? airResult.value.current : null
  return { location, timezone: w.timezone, isDemo: false, updated: new Date(), current: { temperature: c.temperature_2m, feelsLike: c.apparent_temperature, humidity: c.relative_humidity_2m, wind: c.wind_speed_10m, windDirection: c.wind_direction_10m, pressure: c.pressure_msl, visibility: (h.visibility[start] ?? 10000)/1000, uv: h.uv_index[start] ?? 0, code: c.weather_code, isDay: !!c.is_day, time: c.time }, hourly, daily, air: a ? { aqi: a.european_aqi, pm25: a.pm2_5, pm10: a.pm10, ozone: a.ozone, nitrogen: a.nitrogen_dioxide, co: a.carbon_monoxide } : null }
}
export function weatherKind(code: number): 'sun' | 'cloud' | 'partly' | 'rain' | 'snow' | 'storm' {
  if (code >= 95) return 'storm'
  if ([71,73,75,77,85,86].includes(code)) return 'snow'
  if (code >= 51) return 'rain'
  if (code >= 3) return 'cloud'
  if (code >= 1) return 'partly'
  return 'sun'
}
export function condition(code: number) { return { sun: 'Clear skies', partly: 'Partly cloudy', cloud: code >= 45 ? 'Foggy' : 'Cloudy', rain: 'Rain showers', snow: 'Snow showers', storm: 'Thunderstorms' }[weatherKind(code)] }
export function recommendation(code: number, temp: number) {
  const kind = weatherKind(code)
  if (kind === 'storm') return 'A good time to stay cozy indoors.'
  if (kind === 'rain') return 'A little rain. Take your favorite umbrella.'
  if (kind === 'snow') return 'Layer up. A winter wonderland awaits.'
  if (temp > 29) return 'Find some shade and stay hydrated.'
  if (temp < 5) return 'Bring a warm layer for your adventure.'
  return 'Perfect weather for a walk.'
}
export function temp(value: number, settings: Settings, suffix = false) { return `${Math.round(settings.temperature === 'fahrenheit' ? value*9/5+32 : value)}°${suffix ? settings.temperature === 'fahrenheit' ? 'F' : 'C' : ''}` }
export function wind(value: number, settings: Settings) { return Math.round(settings.wind === 'mph' ? value * 0.621371 : value) }
export function hourLabel(time: string, settings: Settings) { const hour = Number(time.slice(11,13)); return settings.clock === '24h' ? `${String(hour).padStart(2,'0')}:00` : `${hour%12 || 12} ${hour >= 12 ? 'PM' : 'AM'}` }
export function readStorage<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback } }
export function writeStorage(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Private browsing may disable persistence. */ } }
export function aqiLabel(value: number) { return value <= 20 ? 'Good' : value <= 40 ? 'Fair' : value <= 60 ? 'Moderate' : value <= 80 ? 'Poor' : value <= 100 ? 'Very poor' : 'Extremely poor' }
