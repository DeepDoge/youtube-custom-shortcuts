import { $ } from "master-ts/library/$"
import { contentScript } from "./content"
import { popupScript } from "./popup"

const keysPressed = $.readable<string>((set) => {
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

// can't import async for now because it creates exports on build and chrome doesnt like it
if (document.body.hasAttribute("-extension-popup")) popupScript(keysPressed)
else contentScript(keysPressed)
