import { defineConfig } from "vite"
import { masterTsPreprocessor } from "master-ts/library/preprocessor"

export default defineConfig({
	plugins: [masterTsPreprocessor()],
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
