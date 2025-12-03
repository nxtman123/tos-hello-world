import { useEffect, useState } from 'react'
import { store, weather } from '@telemetryos/sdk'
import './Render.css'

interface WeatherData {
  city: string
  temp: number
  conditions: string
  humidity: number
  windSpeed: number
  windDirection: string
  visibility: number
  pressure: number
}

export function Render() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)

  useEffect(() => {
    const fetchWeather = async (city?: string) => {
      if (city) {
        weather().getConditions({ city, units: 'metric' }).then((conditions) => {
          console.log(conditions)
          setWeatherData({
            city: conditions.CityLocalized,
            temp: conditions.Temp,
            conditions: conditions.WeatherText,
            humidity: conditions.RelativeHumidity,
            windSpeed: conditions.WindSpeed,
            windDirection: conditions.WindDirectionEnglish,
            visibility: conditions.Visibility,
            pressure: conditions.Pressure,
          })
        })
        weather().getDailyForecast({city, days: 7, units:'metric'}).then(console.log).catch(console.error)
        weather().getHourlyForecast({city, hours: 12, units:'metric'}).then(console.log).catch(console.error)
      }
    }

    store().instance.subscribe<string>('city', fetchWeather).catch(console.error)

    fetchWeather('Vancouver')

    return ()=> {
      store().instance.unsubscribe('city', fetchWeather).catch(console.error)
    }
  }, [])

  if (!weatherData) {
    return <div className="render"><div className="weather__loading">Loading weather...</div></div>
  }

  return (
    <div className="render">
      <div className="weather">
        <div className="weather__city">{weatherData.city}</div>
        <div className="weather__temp">{Math.round(weatherData.temp)}°C</div>
        <div className="weather__conditions">{weatherData.conditions}</div>
        <div className="weather__details">
          <div className="weather__detail">
            <span className="weather__detail-label">Humidity</span>
            <span className="weather__detail-value">{weatherData.humidity}%</span>
          </div>
          <div className="weather__detail">
            <span className="weather__detail-label">Wind</span>
            <span className="weather__detail-value">{weatherData.windSpeed} km/h {weatherData.windDirection}</span>
          </div>
          <div className="weather__detail">
            <span className="weather__detail-label">Visibility</span>
            <span className="weather__detail-value">{weatherData.visibility} km</span>
          </div>
          <div className="weather__detail">
            <span className="weather__detail-label">Pressure</span>
            <span className="weather__detail-value">{weatherData.pressure} hPa</span>
          </div>
        </div>
      </div>
    </div>
  )
}
