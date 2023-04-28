import { defineConfig } from "vite"
import { masterTsPlugin } from "master-ts-vite-plugin/plugin"

export default defineConfig({
	plugins: [masterTsPlugin],
	build: {
		target: "esnext",
		rollupOptions: {
			input: {
				app: "./src/popup/index.html",
			},
			output: {
				entryFileNames: "[name].js",
				dir: "./dist/popup",
			},
		},
	},
	base: "/popup/",
	resolve: {
		alias: {
			"@": "/src",
		},
	},
})
