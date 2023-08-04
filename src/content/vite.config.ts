import typescript from "typescript"
import { defineConfig } from "vite"
import { masterTs } from "../../node_modules/master-ts-vite-plugin/plugin"
import { parse } from "../../node_modules/master-ts/library/template/parse"

export default defineConfig({
  plugins: [masterTs({ parse, typescript })],
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
