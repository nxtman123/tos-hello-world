import { useEffect, useState } from 'react'
import { store, weather } from '@telemetryos/sdk'
import './Render.css'
import wordMarkPath from '../../assets/telemetryos-wordmark.svg'

interface WeatherData {
  Temp: number
  WeatherText: string
  CityEnglish: string
}

export function Render() {
  const [subtitle, setSubtitle] = useState('')
  const [weatherCity, setWeatherCity] = useState('')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)


  const subscribeSubtitleEffect = () => {
    store().instance.subscribe<string>('subtitle', (value) => {
      const fallbackSubtitle = "Change this line in settings ⚙️ ↗️"
      setSubtitle(value ?? fallbackSubtitle)
    }).catch(console.error)
  }
  useEffect(subscribeSubtitleEffect, [])

  const subscribeWeatherCityEffect = () => {
    store().instance.subscribe<string>('weatherCity', (value) => {
      const city = value ?? "New York"
      setWeatherCity(city)
    }).catch(console.error)
  }
  useEffect(subscribeWeatherCityEffect, [])

  const fetchWeather = async (city: string) => {
    if (!city) return

    setWeatherLoading(true)
    setWeatherError(null)

    try {
      const data = await weather().getConditions({ city, units: 'metric' })
      setWeatherData({
        Temp: data.Temp,
        WeatherText: data.WeatherText,
        CityEnglish: data.CityEnglish
      })
    } catch (error) {
      setWeatherError('Failed to fetch weather data')
      console.error(error)
    } finally {
      setWeatherLoading(false)
    }
  }

  useEffect(() => {
    if (weatherCity) {
      fetchWeather(weatherCity)
    }
  }, [weatherCity])

  return (
    <div className="render">
      <img src={wordMarkPath} alt="TelemetryOS" className="render__logo" />
      <div className="render__hero">
        <div className="render__hero-title">Welcome to TelemetryOS SDK</div>
        <div className="render__hero-subtitle">{subtitle}</div>
      </div>
      <div className="render__weather">
        {weatherLoading && <div className="render__weather-loading">Loading weather...</div>}
        {weatherError && <div className="render__weather-error">{weatherError}</div>}
        {weatherData && !weatherLoading && (
          <>
            <div className="render__weather-temp">{Math.round(weatherData.Temp)}°C</div>
            <div className="render__weather-conditions">{weatherData.WeatherText}</div>
            <div className="render__weather-city">{weatherData.CityEnglish}</div>
          </>
        )}
      </div>
    </div>
  )
}
