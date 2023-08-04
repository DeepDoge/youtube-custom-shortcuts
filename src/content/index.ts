import { $ } from "master-ts/library/$"
import { css, html } from "master-ts/library/template"
import { uniqueId } from "master-ts/library/utils/id"
import { keysPressed, shortcuts } from "../common/shortcuts"

const shortcutsIndexedByKeys = $.derive(() => Object.fromEntries(Object.entries(shortcuts.ref).map(([_, shortcut]) => [shortcut.keys, shortcut])))
const currentShortcut = $.derive(() => shortcutsIndexedByKeys.ref[keysPressed.ref] ?? null)
const lastShortcut = $.writable(currentShortcut.ref)

currentShortcut.subscribe((shorcut) => {
  if (!shorcut) return
  lastShortcut.ref = null
  setTimeout(() => (lastShortcut.ref = shorcut))
  const element = document.querySelector<HTMLElement>(shorcut.clickQuerySelector)
  if (!element) return

  element.focus()
  element.click()
})

const id = `x-${uniqueId()}`

const nodes = html`
	<div class="overlay ${id}">
		${() =>
    lastShortcut.ref &&
    html`<div class="shortcut">
				<div class="label">${lastShortcut.ref.label}</div>
				<div class="keys">${lastShortcut.ref.keys}</div>
			</div>`}
	</div>
`

const styleSheet = css`
	.${id}.overlay {
		position: fixed;
		inset: 0;
		pointer-events: none;
		user-select: none;
		z-index: 100000000;
	}

	.${id}.overlay {
		display: grid;
		place-content: center;
	}

	.${id} .shortcut {
		display: grid;
		place-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		color: #fff;
		font-size: 3rem;
		background: hsl(0deg 0% 10% / 85%);
		border-radius: 2rem;
	}

	.${id} .shortcut .keys {
		font-size: 0.5em;
		opacity: 0.5em;
	}

	.${id} .shortcut {
		animation-name: ${id}-show;
		animation-duration: 2s;
		animation-timing-function: ease-out;
		animation-direction: alternate;
		animation-fill-mode: forwards;
	}

	@keyframes ${id}-show {
		0% {
			filter: opacity(0);
			transform: scale(0.25);
		}
		10%,
		75% {
			filter: opacity(1);
			transform: scale(1);
		}
		100% {
			filter: opacity(0);
			transform: scale(1);
		}
	}
`
const styleText = new Array(styleSheet.cssRules.length)
  .fill(null)
  .map((_, index) => styleSheet.cssRules.item(index)!)
  .map((rule) => rule.cssText)
  .join("\n")
const style = document.createElement("style")
style.textContent = styleText
document.body.append(style, ...nodes)
