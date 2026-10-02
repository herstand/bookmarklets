const MoveTeamsTiles = () => {
  const NS = "__teamsTileMover";
  if (window[NS]) {
    window[NS].disable();
    return;
  }

  const DRAG_THRESHOLD = 4;
  const SLIDE = "translate 160ms ease";
  const INTERACTIVE = 'button, a, input, textarea, select, [role="button"], [role="checkbox"], [role="menuitemcheckbox"], [role="slider"], [role="tab"], [contenteditable="true"]';
  const TILE_MARKERS = [
    '[data-tid^="video-item-container-"]',
    '[data-stream-type="Video"]',
    '[data-tid="participant-tile"]',
    '[data-tid^="participant-tile-"]',
    '[data-tid="video-tile"]',
    '[data-tid="local-video-tile"]',
    '[data-cid="calling-participant-stream"]',
    '[data-tid="calling-participant-stream"]',
    '[data-tid="stream-container"]'
  ];
  const ITEM = '[role="menuitem"], [role="listitem"], [role="gridcell"]';
  const SHARE_HINT = /share|sharing|screen|content|presentation|whiteboard/i;

  const state = {
    order: [],
    styled: new Map(),
    ancestors: new Map(),
    drag: null,
    observers: [],
    listeners: [],
    unclipped: new WeakMap(),
    timer: 0,
    z: 1000,
    raf: 0
  };

  const documents = () => {
    const out = [document];
    document.querySelectorAll("iframe").forEach((f) => {
      try {
        if (f.contentDocument && f.contentDocument.body) out.push(f.contentDocument);
      } catch (e) {}
    });
    return out;
  };

  const rectOf = (el) => el.getBoundingClientRect();
  const area = (el) => {
    const r = rectOf(el);
    return r.width * r.height;
  };
  const visible = (el) => {
    const r = rectOf(el);
    return r.width >= 48 && r.height >= 36;
  };
  const looksLikeShare = (el) => {
    const attrs = [el.getAttribute("data-tid"), el.getAttribute("data-cid"), el.getAttribute("data-stream-type"), el.getAttribute("aria-label")].join(" ");
    return SHARE_HINT.test(attrs);
  };
  const isShare = (el) => looksLikeShare(el) || Array.from(el.querySelectorAll("[data-stream-type]")).some((s) => SHARE_HINT.test(s.getAttribute("data-stream-type")));

  const mediaOf = (doc) => Array.from(doc.querySelectorAll('video, img, [role="img"]')).filter((m) => visible(m) && !m.closest('[role="dialog"], [role="complementary"], [role="navigation"], [role="banner"], header, nav'));

  const overlaps = (a, b) => {
    const ra = rectOf(a), rb = rectOf(b);
    const x = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
    const y = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
    const inter = x * y;
    const smaller = Math.min(ra.width * ra.height, rb.width * rb.height) || 1;
    return inter / smaller > 0.6;
  };

  const heuristicTiles = (doc) => {
    const media = mediaOf(doc);
    if (!media.length) return [];
    const tiles = [];
    const walk = (container) => {
      Array.from(container.children).forEach((child) => {
        const inside = media.filter((m) => child.contains(m));
        if (!inside.length) return;
        const sameSpot = inside.every((m) => overlaps(m, inside[0]));
        if (inside.length === 1 || sameSpot) {
          tiles.push(child);
        } else {
          walk(child);
        }
      });
    };
    walk(doc.body);
    return tiles.filter((t) => visible(t) && !isShare(t));
  };

  const tileOf = (marker) => {
    const item = marker.closest(ITEM);
    if (item && item !== marker && area(item) <= area(marker) * 1.5) return item;
    return marker;
  };

  const findTiles = (doc) => {
    const found = new Set();
    TILE_MARKERS.forEach((sel) => {
      doc.querySelectorAll(sel).forEach((m) => {
        if (visible(m) && !isShare(m)) found.add(tileOf(m));
      });
    });
    const tiles = Array.from(found).filter((t) => !Array.from(found).some((other) => other !== t && other.contains(t)));
    return tiles.length ? tiles : heuristicTiles(doc);
  };

  const allTiles = () => documents().flatMap(findTiles);

  const tileKey = (tile) => {
    const tagged = [tile].concat(Array.from(tile.querySelectorAll("[data-tid]")));
    const stream = tagged.find((el) => el.hasAttribute("data-stream-type") && el.getAttribute("data-tid"));
    if (stream) return "id:" + stream.getAttribute("data-stream-type") + ":" + stream.getAttribute("data-tid");
    const marker = tagged.find((el) => /^video-item-container-/.test(el.getAttribute("data-tid") || "")) || tagged.find((el) => /participant|tile|stream/i.test(el.getAttribute("data-tid") || ""));
    if (marker) return "id:" + marker.getAttribute("data-tid").replace(/^video-item-container-/, "");
    const label = tile.getAttribute("aria-label");
    if (label) return "label:" + label;
    return "text:" + (tile.textContent || "").trim().slice(0, 80);
  };

  const remember = (el) => {
    if (!state.styled.has(el)) {
      state.styled.set(el, {
        translate: el.style.translate,
        zIndex: el.style.zIndex,
        position: el.style.position,
        cursor: el.style.cursor,
        transition: el.style.transition,
        outline: el.style.outline
      });
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
    }
  };

  const parseTranslate = (value) => {
    const parts = (value || "").trim().split(/\s+/).map(parseFloat);
    return { dx: parts[0] || 0, dy: parts[1] || 0 };
  };
  const shownTranslate = (tile) => parseTranslate(getComputedStyle(tile).translate);

  const naturalRect = (tile) => {
    const r = rectOf(tile);
    const t = shownTranslate(tile);
    return { left: r.left - t.dx, top: r.top - t.dy, width: r.width, height: r.height };
  };
  const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  const sameSize = (a, b) => Math.abs(a.width - b.width) <= 0.25 * Math.max(a.width, b.width) && Math.abs(a.height - b.height) <= 0.25 * Math.max(a.height, b.height);

  const rowMajor = (entries) => {
    const sorted = entries.slice().sort((a, b) => a.natural.top - b.natural.top);
    const rows = [];
    sorted.forEach((e) => {
      const row = rows[rows.length - 1];
      if (row && Math.abs(e.natural.top - row[0].natural.top) < Math.min(e.natural.height, row[0].natural.height) / 2) row.push(e);
      else rows.push([e]);
    });
    return rows.flatMap((row) => row.sort((a, b) => a.natural.left - b.natural.left));
  };

  const layout = () => {
    const seen = new Map();
    const entries = rowMajor(allTiles().map((tile) => {
      let key = tileKey(tile);
      const n = (seen.get(key) || 0) + 1;
      seen.set(key, n);
      if (n > 1) key += "~" + n;
      return { tile, key, natural: naturalRect(tile) };
    }));
    const present = new Set(entries.map((e) => e.key));
    const keys = state.order.filter((k) => present.has(k));
    entries.forEach((e) => {
      if (!keys.includes(e.key)) keys.push(e.key);
    });
    return { entries, slots: entries.map((e) => e.natural), keys };
  };

  const unclipAncestors = (tile) => {
    const doc = tile.ownerDocument;
    const vw = doc.documentElement.clientWidth, vh = doc.documentElement.clientHeight;
    let bounds = { left: 0, top: 0, right: vw, bottom: vh };
    let el = tile.parentElement;
    while (el && el !== doc.body && el !== doc.documentElement) {
      const cs = getComputedStyle(el);
      const clips = /hidden|auto|scroll|clip/.test(cs.overflowX + cs.overflowY) || /paint|layout|strict|content/.test(cs.contain);
      if (clips) {
        const r = rectOf(el);
        if (r.width >= vw * 0.9 && r.height >= vh * 0.9) {
          bounds = { left: Math.max(bounds.left, r.left), top: Math.max(bounds.top, r.top), right: Math.min(bounds.right, r.right), bottom: Math.min(bounds.bottom, r.bottom) };
        } else if (!state.ancestors.has(el)) {
          state.ancestors.set(el, { overflow: el.style.overflow, contain: el.style.contain });
          el.style.overflow = "visible";
          el.style.contain = "none";
        }
      }
      el = el.parentElement;
    }
    return bounds;
  };

  const clamp = (tile, dx, dy, bounds) => {
    const r = rectOf(tile);
    const cur = shownTranslate(tile);
    const left = r.left - cur.dx, top = r.top - cur.dy;
    const minX = bounds.left - left, maxX = bounds.right - left - r.width;
    const minY = bounds.top - top, maxY = bounds.bottom - top - r.height;
    return {
      dx: maxX < minX ? dx : Math.min(Math.max(dx, minX), maxX),
      dy: maxY < minY ? dy : Math.min(Math.max(dy, minY), maxY)
    };
  };

  const place = (tile, dx, dy) => {
    remember(tile);
    const cur = parseTranslate(tile.style.translate);
    if (Math.abs(cur.dx - dx) > 0.5 || Math.abs(cur.dy - dy) > 0.5) tile.style.translate = Math.round(dx) + "px " + Math.round(dy) + "px";
  };

  const floating = (tile) => state.drag && state.drag.moved && state.drag.tile === tile;

  const applyLayout = (previewKeys) => {
    const { entries, slots, keys } = layout();
    const order = previewKeys || keys;
    entries.forEach((e) => {
      if (floating(e.tile)) return;
      let idx = order.indexOf(e.key);
      if (idx < 0) idx = keys.indexOf(e.key);
      const slot = slots[Math.min(idx, slots.length - 1)];
      const nc = center(e.natural), sc = center(slot);
      place(e.tile, sc.x - nc.x, sc.y - nc.y);
    });
  };

  const prime = (tile) => {
    remember(tile);
    if (state.unclipped.get(tile) !== tile.parentElement) {
      unclipAncestors(tile);
      state.unclipped.set(tile, tile.parentElement);
    }
    if (floating(tile)) return;
    if (tile.style.cursor !== "grab") tile.style.cursor = "grab";
    if (tile.style.transition !== SLIDE) tile.style.transition = SLIDE;
  };

  const refresh = () => {
    state.raf = 0;
    allTiles().forEach(prime);
    applyLayout(state.drag && state.drag.preview);
  };
  const scheduleRefresh = () => {
    if (!state.raf) state.raf = requestAnimationFrame(refresh);
  };
  const onMutations = (records) => {
    const relevant = records.some((r) => {
      if (r.type !== "attributes") return true;
      const t = r.target;
      if (!(t instanceof Element)) return false;
      const item = t.closest(ITEM);
      return !item || item === t;
    });
    if (relevant) scheduleRefresh();
  };

  const slotAt = (slots, x, y) => {
    const hit = slots.findIndex((s) => x >= s.left && x <= s.left + s.width && y >= s.top && y <= s.top + s.height);
    if (hit >= 0) return hit;
    let best = -1, bestDistance = Infinity;
    slots.forEach((s, i) => {
      const c = center(s);
      const distance = Math.hypot(c.x - x, c.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    return best;
  };

  const tileFrom = (target) => {
    if (!(target instanceof Element)) return null;
    const tiles = findTiles(target.ownerDocument);
    let best = null;
    tiles.forEach((t) => {
      if (t.contains(target) && (!best || best.contains(t))) best = t;
    });
    if (!best) return null;
    const control = target.closest(INTERACTIVE);
    if (control && control !== best && best.contains(control)) return null;
    return best;
  };

  let suppressClick = false;

  const lift = (d) => {
    const tile = d.tile;
    remember(tile);
    const entry = layout().entries.find((e) => e.tile === tile);
    d.key = entry ? entry.key : tileKey(tile);
    d.bounds = unclipAncestors(tile);
    d.base = shownTranslate(tile);
    tile.style.transition = "none";
    tile.style.zIndex = String(++state.z);
    tile.style.outline = "3px solid rgba(255,255,255,0.85)";
    tile.style.cursor = "grabbing";
    tile.ownerDocument.body.style.userSelect = "none";
    try { tile.setPointerCapture(d.pointerId); } catch (err) {}
  };

  const settle = (d) => {
    const tile = d.tile;
    const saved = state.styled.get(tile) || {};
    tile.style.transition = SLIDE;
    tile.style.outline = saved.outline || "";
    tile.style.cursor = "grab";
    tile.ownerDocument.body.style.userSelect = "";
    try { tile.releasePointerCapture(d.pointerId); } catch (err) {}
  };

  const finishDrag = (d, commit) => {
    state.drag = null;
    if (commit && d.preview) state.order = d.preview;
    settle(d);
    applyLayout();
  };

  const onDown = (e) => {
    if (e.button !== 0 || state.drag) return;
    const target = e.composedPath ? e.composedPath()[0] : e.target;
    const tile = tileFrom(target);
    if (!tile) return;
    state.drag = { tile, key: null, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false, target: -1, preview: null };
  };

  const onMove = (e) => {
    const d = state.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      lift(d);
    }
    e.preventDefault();
    e.stopPropagation();
    const want = clamp(d.tile, d.base.dx + dx, d.base.dy + dy, d.bounds);
    d.tile.style.translate = Math.round(want.dx) + "px " + Math.round(want.dy) + "px";
    const { entries, slots, keys } = layout();
    const mine = entries.find((entry) => entry.key === d.key);
    if (!mine || !keys.includes(d.key)) return;
    const group = slots.map((slot, i) => i).filter((i) => sameSize(slots[i], mine.natural));
    const pick = slotAt(group.map((i) => slots[i]), e.clientX, e.clientY);
    if (pick < 0 || group[pick] === d.target) return;
    d.target = group[pick];
    const groupKeys = group.map((i) => keys[i]);
    groupKeys.splice(groupKeys.indexOf(d.key), 1);
    groupKeys.splice(pick, 0, d.key);
    const preview = keys.slice();
    group.forEach((slotIndex, position) => { preview[slotIndex] = groupKeys[position]; });
    d.preview = preview;
    applyLayout(preview);
  };

  const onUp = (e) => {
    const d = state.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.moved) {
      state.drag = null;
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    finishDrag(d, e.type !== "pointercancel");
  };

  const onKey = (e) => {
    if (e.key === "Escape" && state.drag && state.drag.moved) {
      e.preventDefault();
      e.stopPropagation();
      finishDrag(state.drag, false);
    }
  };

  const onClick = (e) => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragStart = (e) => {
    if (state.drag) e.preventDefault();
  };

  const listen = (target, type, fn) => {
    target.addEventListener(type, fn, true);
    state.listeners.push([target, type, fn]);
  };

  const toast = (msg) => {
    const d = document.createElement("div");
    d.textContent = msg;
    Object.assign(d.style, {
      position: "fixed", left: "50%", top: "16px", transform: "translateX(-50%)", zIndex: "2147483647",
      background: "rgba(20,20,20,0.9)", color: "white", padding: "10px 16px", borderRadius: "8px",
      font: "14px/1.4 system-ui, sans-serif", pointerEvents: "none", transition: "opacity 0.4s", maxWidth: "80vw"
    });
    document.body.appendChild(d);
    setTimeout(() => {
      d.style.opacity = "0";
      setTimeout(() => d.remove(), 500);
    }, 3500);
  };

  const enable = () => {
    documents().forEach((doc) => {
      listen(doc, "pointerdown", onDown);
      listen(doc, "pointermove", onMove);
      listen(doc, "pointerup", onUp);
      listen(doc, "pointercancel", onUp);
      listen(doc, "keydown", onKey);
      listen(doc, "click", onClick);
      listen(doc, "dragstart", onDragStart);
      listen(doc, "transitionend", scheduleRefresh);
      const mo = new MutationObserver(onMutations);
      mo.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
      state.observers.push(mo);
    });
    listen(window, "resize", scheduleRefresh);
    state.timer = setInterval(scheduleRefresh, 500);
    const tiles = allTiles();
    tiles.forEach(prime);
    toast(tiles.length ? "Arrange mode on: drag a tile to a new spot in the grid. Click the bookmark again to restore the usual order and turn off." : "Arrange mode on, but no video tiles were found yet. Try again once participants are visible.");
  };

  const disable = () => {
    state.listeners.forEach(([target, type, fn]) => target.removeEventListener(type, fn, true));
    state.observers.forEach((mo) => mo.disconnect());
    clearInterval(state.timer);
    if (state.raf) cancelAnimationFrame(state.raf);
    state.styled.forEach((saved, el) => {
      el.style.transition = saved.transition;
      el.style.translate = saved.translate;
      el.style.zIndex = saved.zIndex;
      el.style.position = saved.position;
      el.style.cursor = saved.cursor;
      el.style.outline = saved.outline;
    });
    state.ancestors.forEach((saved, el) => {
      el.style.overflow = saved.overflow;
      el.style.contain = saved.contain;
    });
    documents().forEach((doc) => { doc.body.style.userSelect = ""; });
    delete window[NS];
    toast("Arrange mode off: the usual tile order is back.");
  };

  window[NS] = { enable, disable, state, findTiles: allTiles, layout };
  enable();
};

const code = MoveTeamsTiles.toString();
const MoveTeamsTilesURI = encodeURI(`javascript:(${code})()`);
export default MoveTeamsTilesURI;
