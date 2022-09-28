import { useEffect, useReducer } from "preact/hooks"

export interface Button
{
  label: string
  clickQuerySelector: string
}

const button: (button: Button) => Button = (button) => button

export const buttons = {
  like: button({
    label: 'Like',
    clickQuerySelector: `
      ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#like-button a:not([aria-pressed="true"]), /* Shorts Classic */
      ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#like-button button:not([aria-pressed="true"]), /* Shorts New Layout */
      ytd-watch-metadata #top-level-buttons-computed #segmented-like-button button:not([aria-pressed="true"]), /* New Layout */
      ytd-watch-metadata #top-level-buttons-computed > ytd-toggle-button-renderer:nth-of-type(1n) button:not([aria-pressed="true"]) /* Classic YT Layout */
    `
  }),
  dislike: button({
    label: 'Dislike',
    clickQuerySelector: `
      ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#dislike-button a:not([aria-pressed="true"]), /* Shorts */
      ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#dislike-button button:not([aria-pressed="true"]), /* Shorts New Layout */
      ytd-watch-metadata #top-level-buttons-computed #segmented-dislike-button button:not([aria-pressed="true"]), /* New Layout */
      ytd-watch-metadata #top-level-buttons-computed > ytd-toggle-button-renderer:nth-of-type(2n) button:not([aria-pressed="true"]) /* Classic YT Layout */
    `
  }),
  neutral: button({
    label: 'Neutral',
    clickQuerySelector: `
      ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#like-button a[aria-pressed="true"], /* Shorts Like Classic */
      ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#dislike-button a[aria-pressed="true"], /* Shorts Dislike Classic */
      ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#like-button button[aria-pressed="true"], /* Shorts Like New Layout */
      ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#dislike-button button[aria-pressed="true"], /* Shorts Dislike New Layout */
      ytd-watch-metadata #top-level-buttons-computed ytd-segmented-like-dislike-button-renderer button[aria-pressed="true"], /* New Layout Like/Dislike */
      ytd-watch-metadata #top-level-buttons-computed > ytd-toggle-button-renderer:nth-of-type(1n) button[aria-pressed="true"], /* Classic YT Layout Like */
      ytd-watch-metadata #top-level-buttons-computed > ytd-toggle-button-renderer:nth-of-type(2n) button[aria-pressed="true"] /* Classic YT Layout Dislike */
    `
  })
}

export type ExtensionSettings = Record<keyof typeof buttons, string>

export const DEFAULT_SETTINGS: ExtensionSettings = {
  like: `ShiftLeft,Enter`,
  dislike: `ShiftLeft,Backslash`,
  neutral: `ShiftLeft,Digit0`
}




export function getExtensionSettingsAsync(): Promise<ExtensionSettings>
{
  return new Promise(resolve => chrome.storage.local.get(o => resolve(o as any)))
}

export const setExtensionSetting = <K extends keyof ExtensionSettings>(setting: K, value: ExtensionSettings[K]) => chrome.storage.local.set({ [setting]: value })


function useSettings(defaultSettings: ExtensionSettings)
{
  const [state, dispatch] = useReducer((state, nstate: Partial<ExtensionSettings>) => ({ ...state, ...nstate }), defaultSettings)
  const settingsKeys = Object.keys(defaultSettings)
  useEffect(() =>
  {
    const changeListener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) =>
    {
      if (areaName !== 'local') return
      const changeEntries = Object.keys(changes).filter((key) => settingsKeys.includes(key)).map((key) => [key, changes[key].newValue])
      if (changeEntries.length === 0) return // no changes; no use dispatching
      dispatch(Object.fromEntries(changeEntries))
    }

    chrome.storage.onChanged.addListener(changeListener)
    chrome.storage.local.get(settingsKeys, async (settings) => dispatch(settings))

    return () => chrome.storage.onChanged.removeListener(changeListener)
  }, [])

  return state
}

export const useExtensionSettings = () => useSettings(DEFAULT_SETTINGS)