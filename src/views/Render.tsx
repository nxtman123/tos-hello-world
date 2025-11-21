import { useEffect, useState } from 'react'
import { store } from '@telemetryos/sdk'
import './Render.css'
import wordMarkPath from '../../assets/telemetryos-wordmark.svg'

export function Render() {
  const [subtitle, setSubtitle] = useState('')

  const subscribeSubtitleEffect = () => {
    store().instance.subscribe<string>('subtitle', (value) => {
      const fallbackSubtitle = "Change this line in settings ⚙️ ↗️"
      setSubtitle(value ?? fallbackSubtitle)
    }).catch(console.error)
  }
  useEffect(subscribeSubtitleEffect, [])

  return (
    <div className="render">
      <img src={wordMarkPath} alt="TelemetryOS" className="render__logo" />
      <div className="render__hero">
        <div className="render__hero-title">Welcome to TelemetryOS SDK</div>
        <div className="render__hero-subtitle">{subtitle}</div>
      </div>
      <div className="render__docs-information">
        <div className="render__docs-information-title">To get started, edit the Render.tsx and Settings.tsx files</div>
        <div className="render__docs-information-text">
          Visit our documentation on building applications to learn more
        </div>
        <a
          className="render__docs-information-button"
          href="https://docs.telemetryos.com/docs/sdk-getting-started"
          target="_blank"
          rel="noreferrer"
        >
          Documentation
        </a>
      </div>
    </div>
  )
}
