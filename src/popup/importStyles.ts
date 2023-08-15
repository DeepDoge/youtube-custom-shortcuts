import { ComponentBase } from "master-ts/library/component"
import appCSS from "./styles/app.css?inline"

const appStyleSheet = new CSSStyleSheet()

await Promise.all([appStyleSheet.replace(appCSS)])

ComponentBase.$globalStyleSheets.push(appStyleSheet)
document.adoptedStyleSheets.push(appStyleSheet)
