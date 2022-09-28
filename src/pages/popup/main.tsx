import { h, render } from 'preact'
import { useEffect, useReducer, useState } from 'preact/hooks'
import { createDialogManager, Dialogs } from '../../components/dialogs'
import { buttons, ExtensionSettings, setExtensionSetting, useExtensionSettings } from '../../settings'

function Popup(params: {})
{
  const settings = useExtensionSettings()
  let [loading, updateLoading] = useState(() => false)
  let [route, updateRoute] = useState<string>(() => '')
  let [keysPressed, updateKeys] = useState<string>(() => '')
  let [edit, updateEdit] = useState<keyof ExtensionSettings | null>(() => null)

  useEffect(() =>
  {
    function update()
    {
      if (edit && keysPressed) setExtensionSetting(edit, keysPressed)
    }

    function reset()
    {
      updateKeys('')
      update()
    }

    function add(event: KeyboardEvent)
    {
      let toAdd = ''
      if (keysPressed) toAdd += ','
      toAdd += event.code
      updateKeys((prev) => `${prev}${toAdd}`)
      update()
    }

    addEventListener('keyup', reset)
    addEventListener('keydown', add)

    return () =>
    {
      removeEventListener('keyup', reset)
      removeEventListener('keydown', add)
    }
  })

  const dialogManager = createDialogManager()


  async function loads<T>(operation: Promise<T>)
  {
    try
    {
      updateLoading(true)
      await operation
    } catch (error)
    {
      console.error(error)
    }
    finally
    {
      updateLoading(false)
    }
  }

  return <div id='popup'>
    <Dialogs manager={dialogManager} />
    {

      <header>
        
      </header>
    }
    {
      <main>
        <section>
          <label>Edit Shortcuts</label>
          {(Object.entries(settings)).map((entry) =>
          {
            const buttonType: keyof ExtensionSettings = entry[0] as any
            const buttonKey = entry[1] 
            const button = buttons[buttonType as keyof typeof buttons]
            return <div className='options'>
              <div class="toggle-option">
                <span class="left">{button.label} Shortcut:</span>
                <a onClick={() => updateEdit(edit !== buttonType ? buttonType : null)} className={`button ${edit === buttonType ? 'active' : ''}`}>
                  {buttonKey}
                </a>
              </div>
            </div>
          })}
        </section>
      </main>
    }
    {loading && <div class="overlay">
      <span>Loading...</span>
    </div>}
  </div>
}

function renderPopup()
{
  render(<Popup />, document.getElementById('root')!)
}

renderPopup()
