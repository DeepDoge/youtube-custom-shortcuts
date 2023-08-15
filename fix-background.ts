#!/usr/bin/env tsx

import fs from "fs"
fs.writeFileSync("./dist/background.js", `function define(_, _, fn){fn(undefined, {})}${fs.readFileSync("./dist/background.js")}`)
