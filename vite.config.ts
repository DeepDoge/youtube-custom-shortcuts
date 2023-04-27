import { defineConfig } from "vite"
import { masterTsPlugin } from "master-ts-vite-plugin/plugin"

export default defineConfig({
	plugins: [masterTsPlugin],
	build: {
		target: "esnext",
		rollupOptions: {
			output: {
				entryFileNames: "[name].js",
			},
		},
	},
	resolve: {
		alias: {
			"@": "/src",
		},
	},
})
