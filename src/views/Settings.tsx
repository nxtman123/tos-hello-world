import './Settings.css'
import { useEffect, useState } from 'react'
import { store } from '@telemetryos/sdk'

export function Settings() {
  const [city, setCity] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const effect = async () => {
      let savedCity = await store().instance.get<string>('city')
      if (savedCity !== undefined) {
        setCity(savedCity)
      } else {
        await store().instance.set('city', 'Vancouver')
        setCity('Vancouver')
      }
      setIsLoading(false)
    }
    effect().catch(console.error)
  }, [])

  const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCity(event.target.value)
    store().instance.set('city', event.target.value).catch(console.error)
  }

  return (
    <div className="settings">
      <div className="form-field">
        <div className="form-field-label">City</div>
        <div className="form-field-frame">
          <input className="form-field-input" type="text" value={city} onChange={handleCityChange} disabled={isLoading} />
        </div>
      </div>
    </div>
  )
}
