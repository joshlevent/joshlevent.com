// Dev-only text editor, injected into every page by tools/text-editor/index.mjs.
// Option-click (Alt-click) any text to edit its source in place. Plain clicks behave normally.

const BLOCKS = 'h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,td,th,dt,dd,summary';
const INLINE = 'a,button,label,span,time,strong,em';
const SITE_SUFFIX = ' — Josh Levent';

const css = `
  .te-hover { outline: 2px dashed #c2410c !important; outline-offset: 3px; cursor: text !important; }
  .te-pill { position: fixed; left: 12px; bottom: 12px; z-index: 99999; display: flex; gap: 6px; align-items: center;
    font: 500 12px/1 system-ui, sans-serif; background: #1c1917; color: #fafaf9; padding: 7px 8px 7px 12px;
    border-radius: 999px; box-shadow: 0 6px 20px -8px rgba(0,0,0,.5); }
  .te-pill button { font: inherit; background: #44403c; color: inherit; border: 0; border-radius: 999px; padding: 5px 9px; cursor: pointer; }
  .te-box { position: absolute; z-index: 99998; }
  .te-box textarea { display: block; width: 100%; box-sizing: border-box; resize: none; overflow: hidden; margin: 0;
    padding: 6px 8px; border: 2px solid #c2410c; border-radius: 6px; background: #fffbeb; color: #1c1917; }
  .te-bar { display: flex; justify-content: space-between; gap: 12px; margin-top: 4px; font: 12px/1.4 system-ui, sans-serif; color: #57534e; }
  .te-bar code { font: 11px ui-monospace, monospace; }
  .te-menu { position: absolute; z-index: 99998; max-width: 560px; background: #fff; border: 1px solid #d6d3d1; border-radius: 8px;
    box-shadow: 0 12px 34px -12px rgba(0,0,0,.35); padding: 6px; font: 13px/1.4 system-ui, sans-serif; color: #1c1917; }
  .te-menu p { margin: 4px 6px 6px; color: #57534e; }
  .te-menu button { display: block; width: 100%; text-align: left; font: inherit; background: none; border: 0; border-radius: 6px; padding: 6px; cursor: pointer; }
  .te-menu button:hover { background: #f5f5f4; }
  .te-menu code { font: 11px ui-monospace, monospace; color: #c2410c; }
  .te-menu small { display: block; color: #78716c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .te-panel { position: fixed; left: 12px; bottom: 52px; z-index: 99999; width: min(520px, calc(100vw - 24px)); background: #fff;
    border: 1px solid #d6d3d1; border-radius: 10px; padding: 12px; box-shadow: 0 12px 34px -12px rgba(0,0,0,.35);
    font: 13px/1.4 system-ui, sans-serif; color: #1c1917; }
  .te-panel label { display: block; font-weight: 600; margin: 8px 0 4px; }
  .te-panel textarea { width: 100%; box-sizing: border-box; font: 14px/1.4 system-ui, sans-serif; padding: 6px; border: 1px solid #d6d3d1; border-radius: 6px; resize: vertical; }
  .te-panel .te-where { font: 11px ui-monospace, monospace; color: #78716c; }
  .te-toast { position: fixed; left: 50%; top: 16px; transform: translateX(-50%); z-index: 100000; background: #1c1917; color: #fafaf9;
    font: 13px/1.4 system-ui, sans-serif; padding: 8px 14px; border-radius: 8px; max-width: 80vw; }
`;

const style = document.createElement('style');
style.textContent = css;
document.head.append(style);

// ---------- helpers ----------

async function call(endpoint, payload) {
  const res = await fetch(`/__text-editor/${endpoint}`, { method: 'POST', body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

function toast(message, ms = 2500) {
  const el = document.createElement('div');
  el.className = 'te-toast';
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
}

// The element's own text, leaving out nested lists.
function textOf(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('ul,ol').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

// What an Option-click could mean, best guess first: the whole block, then the link or span clicked inside it
// (for blocks the template stitches together from several sources, like "Writing · 5 September 2019").
function candidatesOf(node) {
  if (node instanceof HTMLImageElement) return node.alt ? [node] : [];
  if (!(node instanceof Element) || node.closest('.te-pill,.te-panel,.te-box,.te-menu')) return [];
  return [node.closest(BLOCKS), node.closest(INLINE)].filter((el, i, all) => el && textOf(el) && all.indexOf(el) === i);
}

function targetOf(node) {
  return candidatesOf(node)[0] ?? null;
}

function closeAll() {
  document.querySelectorAll('.te-box,.te-menu').forEach((n) => n.remove());
}

function at(el) {
  const r = el.getBoundingClientRect();
  return { top: r.top + scrollY, left: r.left + scrollX, width: r.width, bottom: r.bottom + scrollY };
}

// ---------- finding ----------

async function locate(text, raw, key) {
  const { matches } = await call('find', { text, raw, key, page: location.pathname });
  // Trailing arrows and the like are often added by the template, not the source.
  if (!matches.length && !raw) {
    const trimmed = text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}.!?)"']+$/gu, '');
    if (trimmed && trimmed !== text) return (await call('find', { text: trimmed, page: location.pathname })).matches;
  }
  return matches;
}

function pick(matches, el) {
  return new Promise((resolve) => {
    const menu = document.createElement('div');
    menu.className = 'te-menu';
    const pos = at(el);
    Object.assign(menu.style, { top: `${pos.bottom + 6}px`, left: `${Math.max(8, pos.left)}px` });
    const intro = document.createElement('p');
    intro.textContent = 'This text appears in more than one place. Which one?';
    menu.append(intro);
    for (const m of matches) {
      const b = document.createElement('button');
      b.innerHTML = `<code></code><small></small>`;
      b.querySelector('code').textContent = `${m.file}:${m.line}`;
      b.querySelector('small').textContent = m.context;
      b.onclick = () => { menu.remove(); resolve(m); };
      menu.append(b);
    }
    document.body.append(menu);
  });
}

// ---------- editing in place ----------

function openEditor(el, match) {
  closeAll();
  const pos = at(el);
  const cs = getComputedStyle(el instanceof HTMLImageElement ? document.body : el);
  const box = document.createElement('div');
  box.className = 'te-box';
  Object.assign(box.style, {
    top: `${pos.top - 8}px`,
    left: `${Math.max(8, pos.left - 10)}px`,
    width: `${Math.min(Math.max(pos.width + 20, 360), innerWidth - 16)}px`,
  });
  const area = document.createElement('textarea');
  for (const prop of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'fontStyle']) area.style[prop] = cs[prop];
  area.value = match.source;
  area.spellcheck = true;
  const bar = document.createElement('div');
  bar.className = 'te-bar';
  bar.innerHTML = `<code></code><span>⌘↵ save · Esc cancel</span>`;
  bar.querySelector('code').textContent = `${match.file}:${match.line}${el instanceof HTMLImageElement ? ' (image alt text)' : ''}`;
  box.append(area, bar);
  document.body.append(box);

  const grow = () => { area.style.height = 'auto'; area.style.height = `${area.scrollHeight + 4}px`; };
  area.addEventListener('input', grow);
  area.addEventListener('keydown', async (e) => {
    if (e.key === 'Escape') { e.preventDefault(); box.remove(); }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (area.value === match.source) return box.remove();
      await commit(match, area.value, () => box.remove());
    }
  });
  grow();
  area.focus();
  area.setSelectionRange(area.value.length, area.value.length);
}

async function commit(match, text, done) {
  try {
    const saved = await call('save', { file: match.file, start: match.start, end: match.end, original: match.original, text });
    done?.();
    toast(`Saved ${saved.file}:${saved.line}`);
    // Astro reloads the page once it has re-read the content. Reloading sooner can race that and leave the
    // dev server rendering the old text, so only step in if Astro hasn't reloaded after a few seconds.
    setTimeout(() => location.reload(), 4000);
  } catch (err) {
    toast(err.message, 5000);
  }
}

async function edit(candidates) {
  closeAll();
  try {
    for (const el of candidates) {
      const isImage = el instanceof HTMLImageElement;
      const matches = await locate(isImage ? el.alt : textOf(el), isImage);
      if (matches.length) return openEditor(el, matches.length === 1 ? matches[0] : await pick(matches, el));
    }
    toast("Couldn't find this text in src/. It may be generated by code; try Option-clicking one part of it.", 4000);
  } catch (err) {
    toast(err.message, 5000);
  }
}

// ---------- page title and description ----------

async function pagePanel() {
  const existing = document.querySelector('.te-panel');
  if (existing) return existing.remove();
  const panel = document.createElement('div');
  panel.className = 'te-panel';
  panel.innerHTML = '<strong>Text that is not on the page</strong>';
  document.body.append(panel);

  const title = document.title.endsWith(SITE_SUFFIX) ? document.title.slice(0, -SITE_SUFFIX.length) : document.title;
  const description = document.querySelector('meta[name="description"]')?.content ?? '';
  for (const [label, value, key] of [['Browser tab title', title, 'title'], ['Search and social description', description, 'description']]) {
    const field = document.createElement('div');
    field.innerHTML = '<label></label><textarea rows="2"></textarea><div class="te-where"></div>';
    field.querySelector('label').textContent = label;
    const area = field.querySelector('textarea');
    const where = field.querySelector('.te-where');
    area.value = value;
    area.disabled = true;
    panel.append(field);
    const matches = await locate(value, true, key).catch(() => []);
    const match = matches[0];
    if (!match) { where.textContent = 'Not found in src/ (built from other text)'; continue; }
    // Several files set the same text: trust the one whose path matches this page, if exactly one does best.
    if (matches.length > 1 && matches[0].relevance === matches[1].relevance) {
      where.textContent = `Set in ${matches.length} places: ${matches.map((m) => `${m.file}:${m.line}`).join(', ')}. Edit it in your editor.`;
      continue;
    }
    area.disabled = false;
    where.textContent = `${match.file}:${match.line} · ⌘↵ save${matches.length > 1 ? ` (also set in ${matches.slice(1).map((m) => m.file).join(', ')})` : ''}`;
    area.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commit(match, area.value); }
    });
  }
}

// ---------- wiring ----------

const pill = document.createElement('div');
pill.className = 'te-pill';
pill.innerHTML = '<span>⌥-click text to edit</span><button type="button">Page title &amp; description</button>';
pill.querySelector('button').onclick = pagePanel;
document.body.append(pill);

let hovered = null;
function setHover(el) {
  if (hovered === el) return;
  hovered?.classList.remove('te-hover');
  hovered = el;
  hovered?.classList.add('te-hover');
}

document.addEventListener('mousemove', (e) => setHover(e.altKey ? targetOf(e.target) : null), true);
document.addEventListener('keyup', (e) => { if (e.key === 'Alt') setHover(null); });
document.addEventListener('click', (e) => {
  if (!e.altKey) return;
  const candidates = candidatesOf(e.target);
  if (!candidates.length) return;
  e.preventDefault();
  e.stopPropagation();
  setHover(null);
  edit(candidates);
}, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
