export type Shortcut = {
	label: string
	keys: string
	clickQuerySelector: string
	sortIndex: number
}
export type Shortcuts = Record<string, Shortcut>

const DEFAULT_SHORTCUTS: Shortcuts = {
	like: {
		label: "Like",
		keys: "ALT+Z",
		clickQuerySelector: `
     			ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#like-button a:not([aria-pressed="true"]), /* Shorts Classic */
      			ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#like-button button:not([aria-pressed="true"]), /* Shorts New Layout */
      			ytd-watch-metadata #top-level-buttons-computed #segmented-like-button button:not([aria-pressed="true"]), /* New Layout */
      			ytd-watch-metadata #top-level-buttons-computed > ytd-toggle-button-renderer:nth-of-type(1n) button:not([aria-pressed="true"]) /* Classic Layout */
    		`,
		sortIndex: 0.01,
	},
	dislike: {
		label: "Dislike",
		keys: "ALT+C",
		clickQuerySelector: `
      			ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#dislike-button a:not([aria-pressed="true"]), /* Shorts */
      			ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#dislike-button button:not([aria-pressed="true"]), /* Shorts New Layout */
      			ytd-watch-metadata #top-level-buttons-computed #segmented-dislike-button button:not([aria-pressed="true"]), /* New Layout */
      			ytd-watch-metadata #top-level-buttons-computed > ytd-toggle-button-renderer:nth-of-type(2n) button:not([aria-pressed="true"]) /* Classic Layout */
    		`,
		sortIndex: 0.02,
	},
	neutral: {
		label: "Neutral",
		keys: `ALT+X`,
		clickQuerySelector: `
      			ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#like-button a[aria-pressed="true"], /* Shorts Like Classic */
      			ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#dislike-button a[aria-pressed="true"], /* Shorts Dislike Classic */
      			ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#like-button button[aria-pressed="true"], /* Shorts Like New Layout */
      			ytd-reel-player-overlay-renderer ytd-toggle-button-renderer#dislike-button button[aria-pressed="true"], /* Shorts Dislike New Layout */
      			ytd-watch-metadata #top-level-buttons-computed ytd-segmented-like-dislike-button-renderer button[aria-pressed="true"], /* New Layout Like/Dislike */
      			ytd-watch-metadata #top-level-buttons-computed > ytd-toggle-button-renderer:nth-of-type(1n) button[aria-pressed="true"], /* Classic Layout Like */
      			ytd-watch-metadata #top-level-buttons-computed > ytd-toggle-button-renderer:nth-of-type(2n) button[aria-pressed="true"] /* Classic Layout Dislike */
    		`,
		sortIndex: 0.03,
	},
	subscribe: {
		label: "Subscribe",
		keys: "ALT+S",
		clickQuerySelector: `
			#subscribe-button ytd-subscribe-button-renderer:not([subscribed])
  		`,
		sortIndex: 0.04
	}
}

export type BackgroundMethod<Params extends any[], Returns> = (...params: Params) => Promise<Returns>

async function emitGlobalEvent(eventName: string) {
	await chrome.storage.session.set({ [eventName]: Date.now() })
}

const backgroundMethods = {
	async getShortcuts() {
		if (!(await shortcutsStorage.count())) await backgroundMethods.restoreDefaults()
		return Object.fromEntries(
			Object.entries((await shortcutsStorage.getAll()) as Record<string, Shortcut>).map(
				([key, shortcut]) => ((shortcut.keys = shortcut.keys.toUpperCase()), [key, shortcut])
			)
		)
	},
	async restoreDefaults() {
		await Promise.all(Object.entries(DEFAULT_SHORTCUTS).map(([id, shortcut]) => shortcutsStorage.set(id, shortcut)))
		await emitGlobalEvent("update-shortcuts")
	},
	async setShortcut(id: string, shortcut: Shortcut) {
		await shortcutsStorage.set(id, shortcut)
		await emitGlobalEvent("update-shortcuts")
	},
	async removeShortcut(id: string) {
		await shortcutsStorage.remove(id)
		await emitGlobalEvent("update-shortcuts")
	},
} satisfies Record<string, BackgroundMethod<any[], any>>
export type BackgroundMethods = typeof backgroundMethods

export type BackgroundCallData = {
	method: keyof BackgroundMethods
	data: unknown[]
}

chrome.runtime.onMessage.addListener((json: string, _, sendResponse) => {
	try {
		const { method, data } = JSON.parse(json) as BackgroundCallData
		const call = backgroundMethods[method] as BackgroundMethod<unknown[], unknown>
		if (!call) return false
		call(...data).then((result) => sendResponse(JSON.stringify({ data: result ?? null })))
		return true
	} catch (error) {
		console.error(error)
		if (error instanceof Error) sendResponse(JSON.stringify({ error: error.toString() }))
		return false
	}
})

class Storage {
	db!: IDBDatabase
	ready: Promise<void>

	constructor(private name: string) {
		this.ready = new Promise<void>((resolve, reject) => {
			const request = indexedDB.open(name, 1)
			request.onupgradeneeded = (_: IDBVersionChangeEvent) => request.result.createObjectStore("store")
			request.onsuccess = (_: Event) => {
				this.db = request.result
				resolve()
			}
			request.onerror = reject
		})
	}

	private getStore() {
		return this.db.transaction(["store"], "readwrite").objectStore("store")
	}

	async get<T = unknown>(key: string) {
		await this.ready
		return new Promise<T>(async (resolve, reject) => {
			const request = this.getStore().get(key)
			request.onsuccess = (e: Event) => resolve((e.target as IDBRequest).result)
			request.onerror = reject
		})
	}

	async set(key: string, value: unknown) {
		await this.ready
		return new Promise<void>((resolve, reject) => {
			const request = this.getStore().put(value, key)
			request.onsuccess = () => resolve()
			request.onerror = reject
		})
	}

	async remove(key: string) {
		await this.ready
		return new Promise<void>((resolve, reject) => {
			const request = this.getStore().delete(key)
			request.onsuccess = () => resolve()
			request.onerror = reject
		})
	}

	async getAll() {
		await this.ready
		return new Promise<{ [key: string]: unknown }>((resolve, reject) => {
			const request = this.getStore().getAllKeys()
			request.onsuccess = async () =>
				resolve(Object.fromEntries(await Promise.all(request.result.map(async (key) => [key, await this.get(key.toString())]))))
			request.onerror = reject
		})
	}

	async count() {
		await this.ready
		return new Promise<number>((resolve, reject) => {
			const request = this.getStore().count()
			request.onsuccess = () => resolve(request.result)
			request.onerror = reject
		})
	}

	delete() {
		indexedDB.deleteDatabase(this.name)
	}
}

const shortcutsStorage = new Storage("shortcuts")
