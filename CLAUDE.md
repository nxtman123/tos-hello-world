# TelemetryOS SDK Reference

**Application:** [Your App Name]
**Purpose:** [What this application does]

## Platform Architecture

TelemetryOS applications are web apps that run on digital signage devices. Applications have up to 4 components:

1. **Render** (`/render`) - Content displayed on devices (runs on device in Chrome/iframe)
2. **Settings** (`/settings`) - Config UI in Studio admin portal (runs in Studio browser)
3. **Workers** (optional) - Background JavaScript (runs on device, no DOM)
4. **Containers** (optional) - Docker containers for backend services (runs on device)

**Runtime Environment:**
- Chrome browser (platform-controlled version)
- Iframe sandbox execution
- Client-side only (no SSR, no Node.js APIs)
- Modern web APIs available (Fetch, WebSockets, WebGL, Canvas)
- External APIs require CORS proxy

**Communication:**
- Settings and Render share instance storage
- Settings saves config → Render subscribes to config
- Device storage only available in Render (not Settings)

## Project Structure

```
project-root/
├── telemetry.config.json       # Platform configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx                # Entry point (configure SDK here)
    ├── App.tsx                 # Routing logic
    ├── views/
    │   ├── Settings.tsx        # /settings mount point
    │   └── Render.tsx          # /render mount point
    ├── components/             # Reusable components
    ├── hooks/                  # Custom React hooks
    ├── types/                  # TypeScript interfaces
    └── utils/                  # Helper functions
```

## Configuration Files

### telemetry.config.json (project root)
```json
{
  "name": "app-name",
  "version": "1.0.0",
  "mountPoints": {
    "render": "/render",
    "settings": "/settings"
  },
  "devServer": {
    "runCommand": "vite --port 3000",
    "url": "http://localhost:3000"
  }
}
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@telemetryos/sdk": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "typescript": "latest",
    "vite": "latest"
  }
}
```

## Complete File Implementations

### src/main.tsx (Entry Point)
```typescript
import { configure } from '@telemetryos/sdk';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Configure SDK ONCE before React renders
// Name must match telemetry.config.json
configure('app-name');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### src/App.tsx (Routing)
```typescript
import Settings from './views/Settings';
import Render from './views/Render';

export default function App() {
  const path = window.location.pathname;

  if (path === '/settings') return <Settings />;
  if (path === '/render') return <Render />;

  return <div>Invalid mount point: {path}</div>;
}
```

### src/views/Settings.tsx (Complete Reference)
```typescript
import { useEffect, useState, FormEvent } from 'react';
import { store } from '@telemetryos/sdk';

interface Config {
  city: string;
  units: 'celsius' | 'fahrenheit';
}

export default function Settings() {
  const [config, setConfig] = useState<Config>({ city: '', units: 'celsius' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing config on mount
  useEffect(() => {
    store().instance.get<Config>('config')
      .then(saved => { if (saved) setConfig(saved); })
      .catch(err => setError(err.message));
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const success = await store().instance.set('config', config);
      if (!success) throw new Error('Storage operation failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Settings</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSave}>
        <div>
          <label htmlFor="city">City:</label>
          <input
            id="city"
            value={config.city}
            onChange={(e) => setConfig({ ...config, city: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor="units">Units:</label>
          <select
            id="units"
            value={config.units}
            onChange={(e) => setConfig({ ...config, units: e.target.value as Config['units'] })}
          >
            <option value="celsius">Celsius</option>
            <option value="fahrenheit">Fahrenheit</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
```

### src/views/Render.tsx (Complete Reference)
```typescript
import { useEffect, useState } from 'react';
import { store, proxy } from '@telemetryos/sdk';

interface Config {
  city: string;
  units: 'celsius' | 'fahrenheit';
}

interface WeatherData {
  temperature: number;
  conditions: string;
}

export default function Render() {
  const [config, setConfig] = useState<Config | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to config changes from Settings
  useEffect(() => {
    store().instance.get<Config>('config').then(setConfig);

    const unsubscribe = store().instance.subscribe('config', (newConfig: Config) => {
      setConfig(newConfig);
    });

    return () => unsubscribe();
  }, []);

  // Fetch weather when config changes
  useEffect(() => {
    if (!config?.city) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await proxy().fetch(
          `https://api.example.com/weather?city=${config.city}&units=${config.units}`
        );

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        setWeather({ temperature: data.temp, conditions: data.conditions });

        // Cache for offline
        await store().device.set('cached', { data, timestamp: Date.now() });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');

        // Try cached data
        const cached = await store().device.get<any>('cached');
        if (cached) setWeather(cached.data);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [config]);

  // States
  if (!config) return <div>Configure in Settings</div>;
  if (loading && !weather) return <div>Loading...</div>;
  if (error && !weather) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{config.city}</h1>
      <div>{weather?.temperature}°{config.units === 'celsius' ? 'C' : 'F'}</div>
      <div>{weather?.conditions}</div>
      {error && <div style={{ color: 'orange' }}>Showing cached data</div>}
    </div>
  );
}
```

## SDK API Reference

Import from `@telemetryos/sdk`.

### Initialization

```typescript
configure(applicationName: string): void
```
- Call once in main.tsx before React renders
- Name must match telemetry.config.json
- Throws if called multiple times

### Storage API

**Type Signatures:**
```typescript
store().application.set(key: string, value: any): Promise<boolean>
store().application.get<T>(key: string): Promise<T | null>
store().application.subscribe(key: string, handler: (value: any) => void): () => void
store().application.delete(key: string): Promise<boolean>
store().application.keys(): Promise<string[]>

// Same methods for instance, device, shared(namespace)
```

**Four Scopes:**

1. **application** - Shared across all instances of app in account
```typescript
await store().application.set('companyLogo', 'https://...');
const logo = await store().application.get<string>('companyLogo');
```

2. **instance** - This specific app instance (Settings ↔ Render communication)
```typescript
// Settings saves
await store().instance.set('config', { city: 'NYC' });

// Render subscribes
const unsubscribe = store().instance.subscribe('config', (newConfig) => {
  updateDisplay(newConfig);
});
// Later: unsubscribe();
```

3. **device** - This physical device only (NOT available in Settings)
```typescript
// Only in Render mount point
await store().device.set('cache', data);
const cached = await store().device.get<CacheType>('cache');
```

4. **shared(namespace)** - Inter-app communication
```typescript
// App A publishes
await store().shared('weather').set('temp', '72°F');

// App B subscribes
store().shared('weather').subscribe('temp', (temp) => console.log(temp));
```

**Constraints:**
- All operations timeout after 30 seconds (throws Error)
- Returns Promise<boolean> for set/delete (true = success)
- Returns Promise<T | null> for get
- subscribe() returns unsubscribe function
- Device scope throws Error in Settings mount point

### Proxy API

```typescript
proxy().fetch(url: string, options?: RequestInit): Promise<Response>
```

- Same interface as standard fetch()
- Use for ALL external API calls to avoid CORS errors
- Returns standard Response object
- Handles CORS server-side

**Example:**
```typescript
import { proxy } from '@telemetryos/sdk';

const response = await proxy().fetch('https://api.example.com/data');
const json = await response.json();
```

### Media API

```typescript
media().getAllByTag(tag: string): Promise<MediaContent[]>
media().getById(id: string): Promise<MediaContent | null>

interface MediaContent {
  id: string;
  url: string;
  type: 'image' | 'video';
  tags: string[];
  metadata: Record<string, any>;
}
```

### Playlist API

```typescript
playlist().nextPage(): Promise<boolean>
playlist().previousPage(): Promise<boolean>
playlist().jumpToPage(index: number): Promise<boolean>
```

### Overrides API

```typescript
overrides().setOverride(id: string): Promise<boolean>
overrides().clearOverride(): Promise<boolean>
```

Note: Override IDs must be pre-configured in Freeform Editor.

### Platform Information

```typescript
accounts().getCurrent(): Promise<Account>
users().getCurrent(): Promise<User>
devices().getCurrent(): Promise<Device>  // Render only
```

## Hard Constraints

**These cause runtime errors:**

1. **Device storage in Settings**
   - Settings runs in Studio browser, not on devices
   - `store().device.*` throws Error in Settings
   - Use `store().instance` or `store().application` instead

2. **External API without proxy**
   - Direct `fetch()` to external domains fails with CORS error
   - Must use `proxy().fetch()` for all external requests

3. **Missing configure()**
   - SDK methods throw "SDK not configured" Error
   - Call `configure()` once in main.tsx before React renders

4. **Subscription memory leaks**
   - `subscribe()` returns unsubscribe function
   - Must call unsubscribe on component unmount
   - Return unsubscribe from useEffect cleanup

5. **Timeout errors**
   - All SDK operations timeout after 30 seconds
   - Throws Error with message containing 'timeout'
   - Handle with try/catch

## TypeScript Patterns

**Define interfaces for all configs and data:**
```typescript
interface AppConfig {
  city: string;
  units: 'celsius' | 'fahrenheit';
  refreshInterval: number;
}

const config = await store().instance.get<AppConfig>('config');
if (config) {
  console.log(config.city);  // TypeScript knows this exists
}
```

**Component with proper types:**
```typescript
interface Props {
  data: WeatherData;
  onRefresh: () => void;
}

export default function WeatherCard({ data, onRefresh }: Props) {
  return <div>{data.temperature}</div>;
}
```

## React Patterns

**Error handling:**
```typescript
const [error, setError] = useState<string | null>(null);

try {
  await store().instance.set('key', value);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

**Loading states:**
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await someAsyncOperation();
  } finally {
    setLoading(false);
  }
};
```

**Subscription cleanup:**
```typescript
useEffect(() => {
  const unsubscribe = store().instance.subscribe('key', handler);
  return () => unsubscribe();
}, []);
```

**Empty deps for mount-only effects:**
```typescript
useEffect(() => {
  // Runs once on mount
  store().instance.get('config').then(setConfig);
}, []); // Empty deps array
```

## Code Style

**Naming:**
- Components: PascalCase (`WeatherCard.tsx`)
- Functions: camelCase (`fetchWeatherData`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Interfaces: PascalCase (`WeatherData`, `AppConfig`)

**Imports order:**
```typescript
// 1. SDK imports
import { configure, store, proxy } from '@telemetryos/sdk';

// 2. React imports
import { useEffect, useState } from 'react';

// 3. Local imports
import WeatherCard from '@/components/WeatherCard';
import type { WeatherData } from '@/types';
```

**TypeScript:**
- Use strict mode
- Define interfaces for all configs and data
- Use generics with storage: `get<Type>(key)`
- Prefer `interface` over `type` for objects

**React:**
- Functional components only
- Use hooks (useState, useEffect, useMemo, useCallback)
- Implement loading, error, empty states
- Clean up subscriptions in useEffect return

## Development Commands

```bash
# Install dependencies
npm install

# Start local dev server
tos serve
# Or: npm run dev

# Build for production
npm run build

# Type check
tsc --noEmit
```

**Local testing:**
- Settings: http://localhost:3000/settings
- Render: http://localhost:3000/render

**Deployment:**
```bash
git add .
git commit -m "Description"
git push origin main
# GitHub integration auto-deploys
```

## Common Errors

**"SDK not configured"**
→ Call `configure('app-name')` in main.tsx before React renders

**"device storage not available"**
→ Using `store().device` in Settings - use `store().instance` instead

**CORS error**
→ Using direct `fetch()` - use `proxy().fetch()` instead

**"Request timeout"**
→ SDK operation exceeded 30 seconds - handle with try/catch

**Render not updating**
→ Missing subscription - use `store().instance.subscribe()` in Render

**Memory leak**
→ Not returning unsubscribe from useEffect

## Project-Specific Context

[Add your project details here:]

**Application Name:** [Your app name]
**External APIs:**
- [API name]: [endpoint]
  - Authentication: [method]
  - Rate limits: [limits]

**Custom Components:**
- [ComponentName]: [purpose]
  - Location: [path]
  - Props: [interface]

**Business Logic:**
- [Key algorithms or calculations]
- [Data transformation rules]

## Technical References

**SDK API Documentation:**
- [Storage API](https://docs.telemetryos.com/docs/storage-methods) - Complete storage scope reference
- [Platform API](https://docs.telemetryos.com/docs/platform-methods) - Proxy, media, accounts, users, devices
- [Playlist API](https://docs.telemetryos.com/docs/playlist-methods) - Page navigation methods
- [Overrides API](https://docs.telemetryos.com/docs/overrides-methods) - Dynamic content control
- [Client API](https://docs.telemetryos.com/docs/client-methods) - Device client interactions
- [Media API](https://docs.telemetryos.com/docs/media-methods) - Media content queries

**Critical Context:**
- [CORS Guide](https://docs.telemetryos.com/docs/cors) - Why proxy().fetch() is required
- [Mount Points](https://docs.telemetryos.com/docs/mount-points) - /render vs /settings execution
- [Languages Supported](https://docs.telemetryos.com/docs/languages-supported) - Runtime environment constraints
- [Configuration](https://docs.telemetryos.com/docs/configuration) - telemetry.config.json schema
- [Workers](https://docs.telemetryos.com/docs/workers) - Background JavaScript patterns
- [Containers](https://docs.telemetryos.com/docs/containers) - Docker integration patterns

**Code Examples:**
- [Code Examples](https://docs.telemetryos.com/docs/code-examples) - Real-world implementations
- [LLMS.txt](https://docs.telemetryos.com/llms.txt) - Complete documentation index