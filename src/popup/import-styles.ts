import { Component } from "master-ts/library/component"
import appCSS from "./styles/app.css?inline"

const appStyleSheet = new CSSStyleSheet()

await Promise.all([appStyleSheet.replace(appCSS)])

Component.$globalStyleSheets.push(appStyleSheet)
document.adoptedStyleSheets.push(appStyleSheet)
