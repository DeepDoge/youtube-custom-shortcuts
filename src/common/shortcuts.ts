import type { BackgroundCallData, BackgroundMethods, Shortcut } from "@/scripts/background"
import { $ } from "master-ts/library/$"

export const keysPressed = $.readable<string>((set) => {
	const keys: string[] = []

	function down(event: KeyboardEvent) {
		if (event.key === keys[keys.length - 1]) return
		keys.push(event.key)
		set(keys.map((key) => key.toUpperCase()).join("+"))
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

export const shortcuts = $.writable<Record<string, Shortcut>>({})
callBackgroundMethod("getShortcuts").then(shortcuts.set)

export function callBackgroundMethod<K extends keyof BackgroundMethods>(method: K, ...data: Parameters<BackgroundMethods[K]>) {
	return new Promise<Awaited<ReturnType<BackgroundMethods[K]>>>((resolve, reject) => {
		const calldata: BackgroundCallData = { method, data }
		chrome.runtime.sendMessage(JSON.stringify(calldata), (response) => {
			try {
				if (!response) throw new Error("Empty response from background")
				const responseParsed = JSON.parse(response)
				if (responseParsed.error) reject(responseParsed.error)
				else resolve(responseParsed.data)
			} catch (error) {
				reject(error)
			}
		})
	})
}

chrome.storage.session.onChanged.addListener((changes) => {
	const eventNames = Object.keys(changes)
	for (let eventName of eventNames) {
		switch (eventName) {
			case "update-shortcuts":
				callBackgroundMethod("getShortcuts").then(shortcuts.set)
				break
		}
	}
})
