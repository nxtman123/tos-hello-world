import { createUseStoreState } from '@telemetryos/sdk/react'

export const useUiScaleStoreState = createUseStoreState<number>('ui-scale', 1)

export const useSubtitleStoreState = createUseStoreState<string>('subtitle', 'Change this line in settings ⚙️ ↗️')
