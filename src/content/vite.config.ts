import { defineConfig } from "vite"
import { masterTsPlugin } from "master-ts-vite-plugin/plugin"

export default defineConfig({
	plugins: [masterTsPlugin],
	build: {
		target: "esnext",
		rollupOptions: {
			input: {
				app: "./src/content/index.html",
			},
			output: {
				entryFileNames: "[name].js",
				dir: "./dist/content",
			},
		},
	},
	base: "/content/",
	resolve: {
		alias: {
			"@": "/src",
		},
	},
})
