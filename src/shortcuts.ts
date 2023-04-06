import { $ } from "master-ts/library/$"
import type { BackgroundCallData, BackgroundMethods, Shortcut } from "../scripts/background"

export const shortcuts = $.writable<Record<string, Shortcut>>({})
callBackgroundMethod("getShortcuts").then(shortcuts.set)
export async function setShortcut(...params: Parameters<BackgroundMethods["setShortcut"]>) {
	await callBackgroundMethod("setShortcut", ...params)
}
export async function removeShortcut(...params: Parameters<BackgroundMethods["removeShortcut"]>) {
	await callBackgroundMethod("removeShortcut", ...params)
}
export async function restoreDefaults() {
	await callBackgroundMethod("restoreDefaults")
}

function callBackgroundMethod<K extends keyof BackgroundMethods>(method: K, ...data: Parameters<BackgroundMethods[K]>) {
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
