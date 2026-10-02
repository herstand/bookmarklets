# bookmarklets

Tools to improve your web experience: small scripts that live in your bookmarks bar and add a feature to a website with one click.

## Install

Open `bookmarklets.html` (or `index.html` served over HTTP) and drag a button onto your browser's bookmarks bar. Then open the matching site and click the bookmark.

## What's here

| Site | Bookmark | What it does |
| --- | --- | --- |
| Google Meet | Mirror My Video | Flips your own camera preview so it matches a mirror. |
| Microsoft Teams | Teams: Move Tiles | Drag gallery tiles into new spots; the rest slide over and snap back into the grid. |
| Limber Health | Automate OC | Fills in and clicks through every step of an outcomes assessment with placeholder answers. |

## Development

Each tool is a plain function in `src/<site>/index.js`. The module turns the function's source into a `javascript:` URL and exports it. `src/tools.js` lists every tool with its site, label, and instructions, and `src/site/` holds the shared page template, styles, and the small script that keeps people from clicking the buttons instead of dragging them.

`index.html` renders the manifest in the browser from those modules, so it needs to be served over HTTP:

```bash
python3 -m http.server 8765
```

`npm run build` writes `bookmarklets.html`, a single self-contained page with every bookmarklet, the styles, and the script inlined. It needs no server and can be opened from disk or hosted anywhere.

## Publishing

`npm run upload` builds the page and replaces `bookmarklets.html` in the `developers.limberhealth.com` S3 bucket, so it goes live at https://developers.limberhealth.com/bookmarklets.html. It uses the `prod-v2` AWS SSO profile and only prompts for an SSO login when the session has expired.

Keep `#` out of a tool's source: encodeURI leaves it alone, and some browsers treat it as the start of a URL fragment and truncate the bookmarklet. The build fails if it finds one.
