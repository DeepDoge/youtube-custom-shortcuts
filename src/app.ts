import { Component, defineComponent } from "master-ts/library/component"
import { html } from "master-ts/library/template"
import { css } from "master-ts/library/template/css"
import { $ } from "master-ts/library/signal/$"
import { removeShortcut, setShortcut, shortcuts } from "./shortcuts"
import appCss from "@/styles/app.css"
import { SvgIcon } from "./svgs/icon"

const keysPressed = $.readable("", (set) => {
	const keys: string[] = []

	function down(event: KeyboardEvent) {
		if (event.key === keys[keys.length - 1]) return
		keys.push(event.key)
		set(keys.join("+"))
	}
	function up(_: KeyboardEvent) {
		while (keys.pop());
		set("")
	}

	addEventListener("keydown", down)
	addEventListener("keyup", up)

	return () => {
		removeEventListener("keydown", down)
		removeEventListener("keyup", up)
	}
})

if (document.body.hasAttribute("-extension-popup")) {
	const appStyle = new CSSStyleSheet()
	appStyle.replaceSync(appCss)
	Component.globalCssSheets.push(appStyle)

	const AppComponent = defineComponent()
	function App() {
		const component = new AppComponent()

		const shortcutsEntries = $.derive(() => Object.entries(shortcuts.ref).sort((a, b) => a[1].sortIndex - b[1].sortIndex))
		const editingKeysOf = $.writable<string | null>(null)

		component.$subscribe(keysPressed, async (keys) => {
			if (!keys) return
			if (!editingKeysOf.ref) return
			const shortcut = shortcuts.ref[editingKeysOf.ref]
			if (!shortcut) return
			shortcut.keys = keys
			await setShortcut(editingKeysOf.ref, shortcut)
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
			await setShortcut(editingLabelOf.ref, shortcut)
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
			await setShortcut(editingSelectorOf.ref, shortcut)
			editingSelectorOf.ref = null
		}

		component.$html = html`<div class="popup">
			<header>
				${SvgIcon()}
				<h1>YouTube Custom Shortcuts</h1>
			</header>
			<div class="shortcuts">
				${$.each(shortcutsEntries)
					.key(([id]) => id)
					.$(
						([id, shortcut]) => html`<div class="shortcut" class:active=${() => editingKeysOf.ref === id}>
							<div class="edit-label">
								${$.switch(editingLabelOf)
									.case(
										id,
										() => html` <form on:submit=${(event: SubmitEvent, _ = event.preventDefault()) => saveLabel()}>
											<input type="text" bind:value=${currentLabel} />
											<button class="btn">Save Label</button>
										</form>`
									)
									.$(() => html`<label>${shortcut.label} <a on:click=${() => editLabelOf(id)}>Edit</a></label>`)}
							</div>
							<div class="actions">
								<button class="btn edit" on:click=${() => editKeysOf(id)}>${shortcut.keys}</button>
								<button class="btn remove" on:click=${() => removeShortcut(id)}>Remove</button>
							</div>
							<div class="edit-selector">
								${$.switch(editingSelectorOf)
									.case(
										id,
										() => html` <form on:submit=${(event: SubmitEvent, _ = event.preventDefault()) => saveSelector()}>
											<textarea bind:value=${currentSelector}></textarea>
											<button class="btn">Save Selector</button>
										</form>`
									)
									.$(() => html`<a on:click=${() => editSelectorOf(id)}>Edit Selector</a></label>`)}
							</div>
						</div>`
					)}
				<button
					class="btn"
					on:click=${() =>
						setShortcut(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36), {
							clickQuerySelector: "body",
							keys: "None",
							label: "New Shortcut",
							sortIndex: Date.now(),
						})}>
					Add Shortcut
				</button>
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

		.shortcut .actions {
			display: grid;
			gap: 0.1rem;
			grid-template-columns: 1fr auto;
		}

		.shortcut.active button.edit {
			outline: solid #e7a12e 1px;
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
} else {
	const shortcutsIndexedByKeys = $.derive(() => Object.fromEntries(Object.entries(shortcuts.ref).map(([_, shortcut]) => [shortcut.keys, shortcut])))

	keysPressed.subscribe((keys) => {
		const currentShortcut = shortcutsIndexedByKeys.ref[keys]
		if (!currentShortcut) return
		const element = document.querySelector<HTMLElement>(currentShortcut.clickQuerySelector)
		if (!element) return
		element.focus()
		element.click()
	})
}
