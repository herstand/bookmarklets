const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

export const renderTool = (tool) => `
      <article class="tool" id="${escapeHtml(tool.id)}">
        <div class="tool-install">
          <a class="bookmarklet" href="${escapeHtml(tool.href)}" title="Drag me to your bookmarks bar"><span class="grip" aria-hidden="true"></span>${escapeHtml(tool.label)}</a>
          <p class="drag-hint">Drag this button to your bookmarks bar</p>
        </div>
        <div class="tool-body">
          <h3>${escapeHtml(tool.name)}</h3>
          <p class="summary">${escapeHtml(tool.summary)}</p>
          <h4>How to use</h4>
          <ol>${tool.steps.map((step) => `
            <li>${escapeHtml(step)}</li>`).join("")}
          </ol>${tool.notes ? `
          <p class="notes"><strong>Notes:</strong> ${escapeHtml(tool.notes)}</p>` : ""}
        </div>
      </article>`;

export const renderGroup = (group) => `
    <section class="group" id="${escapeHtml(group.id)}" style="--accent: ${escapeHtml(group.accent)}">
      <h2><span class="monogram" aria-hidden="true">${escapeHtml(group.monogram)}</span>${escapeHtml(group.name)}</h2>${group.tools.map(renderTool).join("")}
    </section>`;

export const renderPage = (groups) => `
  <header class="site-header">
    <h1>Bookmarklets</h1>
    <p class="tagline">Little tools that live in your bookmarks bar and add features to websites with one click.</p>
    <aside class="howto">
      <h2>How to install one</h2>
      <ol>
        <li>Show your bookmarks bar: <kbd data-os="mac">⌘ Shift B</kbd> on a Mac, <kbd data-os="win">Ctrl Shift B</kbd> on Windows.</li>
        <li>Drag a button below onto the bookmarks bar. Clicking it here does nothing.</li>
        <li>Open the matching site and click your new bookmark.</li>
      </ol>
    </aside>
    <nav class="toc" aria-label="Sites">${groups.map((group) => `
      <a href="#${escapeHtml(group.id)}">${escapeHtml(group.name)}</a>`).join("")}
    </nav>
  </header>
  <main>${groups.map(renderGroup).join("")}
  </main>
  <footer>By <a href="https://herstand.com" target="_blank" rel="noopener noreferrer">Micah Cowsik-Herstand</a> · <a href="https://github.com/herstand/bookmarklets" target="_blank" rel="noopener noreferrer">Source on GitHub</a></footer>
`;

export const renderDocument = ({ groups, css, script, title = "Bookmarklets" }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
${css}
  </style>
</head>
<body>${renderPage(groups)}
<script>
${script}
</script>
</body>
</html>
`;
