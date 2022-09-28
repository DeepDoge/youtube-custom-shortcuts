import { buttons, ExtensionSettings, getExtensionSettingsAsync } from '../settings'

(async () =>
{
  const settings = await getExtensionSettingsAsync()
  // Listen Settings Change
  chrome.storage.onChanged.addListener(async (changes, areaName) =>
  {
    if (areaName !== 'local') return
    Object.assign(settings, Object.fromEntries(Object.entries(changes).map(([key, change]) => [key, change.newValue])))
  })

  let keysPressed = ""
  addEventListener('keyup', () => keysPressed = "")
  addEventListener('keydown', (event) =>
  {
    if (keysPressed) keysPressed += ','
    keysPressed += event.code
    
    const settingsEntries = Object.entries(settings)
    const pressedAt = settingsEntries.find((entry) => entry[1] === keysPressed)
    if (!pressedAt) return

    const button = buttons[pressedAt[0] as keyof ExtensionSettings];
    const buttonElement = document.querySelector<HTMLButtonElement>(button.clickQuerySelector)
    if (!buttonElement) return
    
    buttonElement.click()
  })
})()