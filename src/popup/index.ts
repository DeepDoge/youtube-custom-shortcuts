import "./import-styles"

import { $ } from "master-ts/library/$"
import { defineComponent } from "master-ts/library/component"
import { css, html } from "master-ts/library/template"
import { callBackgroundMethod, keysPressed, shortcuts } from "../common/shortcuts"
import { SvgIcon } from "./svgs/icon"

const AppComponent = defineComponent()
function App() {
	const component = new AppComponent()

	const shortcutsArr = $.derive(() =>
		Object.entries(shortcuts.ref)
			.map(([id, shortcut]) => ({ id, shortcut }))
			.sort((a, b) => a.shortcut.sortIndex - b.shortcut.sortIndex)
	)
	const editingKeysOf = $.writable<string | null>(null)

	keysPressed.subscribe$(component, async (keys) => {
		if (!keys) return
		if (!editingKeysOf.ref) return
		const shortcut = shortcuts.ref[editingKeysOf.ref]
		if (!shortcut) return
		shortcut.keys = keys
		await callBackgroundMethod("setShortcut", editingKeysOf.ref, shortcut)
	})

	function editKeysOf(id: string) {
		if (editingKeysOf.ref === id) editingKeysOf.ref = null
		else editingKeysOf.ref = id
	}

	const editingLabelOf = $.writable<string | null>(null)
	const currentLabel = $.writable("")

	function editLabelOf(id: string) {
		const shortcut = shortcuts.ref[id]
		if (!shortcut) return
		editingLabelOf.ref = id
		currentLabel.ref = shortcut.label ?? ""
	}

	async function saveLabel() {
		if (!editingLabelOf.ref) return
		const shortcut = shortcuts.ref[editingLabelOf.ref]
		if (!shortcut) return
		shortcut.label = currentLabel.ref
		await callBackgroundMethod("setShortcut", editingLabelOf.ref, shortcut)
		editingLabelOf.ref = null
	}

	const editingSelectorOf = $.writable<string | null>(null)
	const currentSelector = $.writable("")

	function editSelectorOf(id: string) {
		const shortcut = shortcuts.ref[id]
		if (!shortcut) return
		editingSelectorOf.ref = id
		currentSelector.ref = shortcut.clickQuerySelector ?? ""
	}

	async function saveSelector() {
		if (!editingSelectorOf.ref) return
		const shortcut = shortcuts.ref[editingSelectorOf.ref]
		if (!shortcut) return
		shortcut.clickQuerySelector = currentSelector.ref
		await callBackgroundMethod("setShortcut", editingSelectorOf.ref, shortcut)
		editingSelectorOf.ref = null
	}

	component.$html = html`<div class="popup">
		<header>
			${SvgIcon()}
			<h1>YouTube Custom Shortcuts</h1>
		</header>
		<div class="shortcuts">
			${$.each(shortcutsArr)
				.key((item) => item.id)
				.as(
					(item) => html`<div class="shortcut" class:active=${() => editingKeysOf.ref === item.ref.id}>
						<div class="edit-label">
							${() =>
								editingLabelOf.ref === item.ref.id
									? html` <form on:submit=${(event) => (event.preventDefault(), saveLabel())}>
											<input type="text" bind:value=${currentLabel} />
											<button class="btn">Save Label</button>
									  </form>`
									: html`<label> ${() => item.ref.shortcut.label} <a on:click=${() => editLabelOf(item.ref.id)}>Edit</a> </label>`}
						</div>
						<div class="actions">
							<button class="btn edit" title="Change shortcut key" on:click=${() => editKeysOf(item.ref.id)}>
								${() => item.ref.shortcut.keys}
							</button>
							<button class="btn remove" on:click=${() => callBackgroundMethod("removeShortcut", item.ref.id)}>Remove</button>
						</div>
						<div class="edit-selector">
							${() =>
								editingSelectorOf.ref === item.ref.id
									? html` <form on:submit=${(event) => (event.preventDefault(), saveSelector())}>
											<textarea bind:value=${currentSelector}></textarea>
											<button class="btn">Save Selector</button>
									  </form>`
									: html`<a on:click=${() => editSelectorOf(item.ref.id)}>Edit Selector</a>`}
						</div>
					</div>`
				)}
			<div class="actions">
				<button
					class="btn"
					on:click=${() =>
						callBackgroundMethod("setShortcut", Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36), {
							clickQuerySelector: "body",
							keys: "None",
							label: "New Shortcut",
							sortIndex: Date.now(),
						})}>
					Add Shortcut
				</button>
				<button class="btn" on:click=${() => callBackgroundMethod("restoreDefaults")}>Restore Defaults</button>
			</div>
		</div>
	</div>`

	return component
}

AppComponent.$css = css`
	.popup {
		width: 500px;
		padding: 2rem;
		display: grid;
		gap: 1.5rem;
	}

	header {
		display: grid;
		grid-template-columns: 2rem 1fr;
		gap: 0.5rem;
		align-items: center;
	}

	h1 {
		font-size: 1.5rem;
		line-height: 1.1;
	}

	.shortcuts {
		display: grid;
		gap: 1rem;
	}

	.shortcut {
		display: grid;
		gap: 0.1rem;
	}

	.actions {
		display: grid;
		gap: 0.25rem;
		grid-template-columns: 1fr auto;
	}

	.shortcut.active button.edit {
		outline: solid hsl(37, 79%, 50%) 0.15rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.edit-selector form {
		display: grid;
		gap: 0.2rem;
	}

	.edit-selector textarea {
		resize: vertical;
		min-height: 5rem;
		height: 10rem;
		font-size: 0.95em;
	}
`

document.querySelector("#app")!.replaceWith(App())
