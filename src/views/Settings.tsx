import './Settings.css'

import { useEffect, useState } from 'react'
import { store } from '@telemetryos/sdk'

export function Settings() {
  const [subtitleText, setSubtitleText] = useState('')
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
      setIsLoadingValue(false)
    })().catch(console.error)
  }

  useEffect(fetchSubtitleEffect, [])

  const handleSubtitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSubtitleText(event.target.value)
    store().instance.set('subtitle', event.target.value).catch(console.error)
  }

  return (
    <div className="settings">
      <div className="form-field">
        <div className="form-field-label">Subtitle Text</div>
        <div className="form-field-frame">
          <input className="form-field-input" type="text" value={subtitleText} onChange={handleSubtitleChange} disabled={isLoadingValue} />
        </div>
      </div>
    </div>
  )
}
