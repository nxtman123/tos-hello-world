import './Settings.css'

import { useEffect, useState } from 'react'
import { store } from '@telemetryos/sdk'

export function Settings() {
  const [subtitleText, setSubtitleText] = useState('')
  const [weatherCity, setWeatherCity] = useState('')
  const [isLoadingValue, setIsLoadingValue] = useState(true)

  const fetchSubtitleEffect = () => {
    (async () => {
      let subtitle = await store().instance.get<string>('subtitle')
      if (subtitle !== undefined) {
        setSubtitleText(subtitle)
      } else {
        const defaultSubtitle = "Change this line in settings ⚙️ ↗️"
        await store().instance.set('subtitle', defaultSubtitle)
        setSubtitleText(defaultSubtitle)
      }

      let city = await store().instance.get<string>('weatherCity')
      if (city !== undefined) {
        setWeatherCity(city)
      } else {
        const defaultCity = "New York"
        await store().instance.set('weatherCity', defaultCity)
        setWeatherCity(defaultCity)
      }

      setIsLoadingValue(false)
    })().catch(console.error)
  }

  useEffect(fetchSubtitleEffect, [])

  const handleSubtitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSubtitleText(event.target.value)
    store().instance.set('subtitle', event.target.value).catch(console.error)
  }

  const handleWeatherCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWeatherCity(event.target.value)
    store().instance.set('weatherCity', event.target.value).catch(console.error)
  }

  return (
    <div className="settings">
      <div className="form-field">
        <div className="form-field-label">Subtitle Text</div>
        <div className="form-field-frame">
          <input className="form-field-input" type="text" value={subtitleText} onChange={handleSubtitleChange} disabled={isLoadingValue} />
        </div>
      </div>
      <div className="form-field">
        <div className="form-field-label">Weather City</div>
        <div className="form-field-frame">
          <input className="form-field-input" type="text" value={weatherCity} onChange={handleWeatherCityChange} disabled={isLoadingValue} />
        </div>
      </div>
    </div>
  )
}
