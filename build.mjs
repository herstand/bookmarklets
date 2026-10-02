import { readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import groups from "./src/tools.js";
import { renderDocument } from "./src/site/render.js";
import { enhancePage } from "./src/site/enhance.js";

const root = dirname(fileURLToPath(import.meta.url));
const tools = groups.flatMap((group) => group.tools);

for (const tool of tools) {
  if (!tool.href.startsWith("javascript:")) throw new Error(`${tool.id}: href must be a javascript: URL`);
  if (tool.href.includes("#")) throw new Error(`${tool.id}: a # inside a bookmarklet truncates it in some browsers`);
  new Function(decodeURI(tool.href.slice("javascript:".length)));
}

const css = readFileSync(join(root, "src/site/styles.css"), "utf8");
const script = `(${enhancePage.toString()})();`;
const out = join(root, "bookmarklets.html");
writeFileSync(out, renderDocument({ groups, css, script }));
console.log(`Wrote bookmarklets.html (${statSync(out).size} bytes): ${tools.length} bookmarklets across ${groups.length} sites.`);
