// Dev-only text editor: Option-click any text on the running site to edit its source in place.
// The client sends the rendered text; the server finds where it lives under src/ and writes edits back.
// Does nothing in `astro build`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const EXTENSIONS = ['.md', '.astro', '.ts'];

export default function textEditor() {
  let srcDir;
  return {
    name: 'text-editor',
    hooks: {
      'astro:config:setup': ({ command, config, injectScript }) => {
        if (command !== 'dev') return;
        srcDir = path.resolve(fileURLToPath(config.srcDir));
        injectScript('page', fs.readFileSync(path.join(here, 'client.js'), 'utf8'));
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use('/__text-editor', (req, res) => {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            const send = (status, data) => {
              res.statusCode = status;
              res.setHeader('content-type', 'application/json');
              res.end(JSON.stringify(data));
            };
            try {
              const input = JSON.parse(body || '{}');
              if (req.url === '/find') return send(200, find(srcDir, input));
              if (req.url === '/save') return send(200, save(srcDir, input));
              send(404, { error: 'unknown endpoint' });
            } catch (err) {
              send(err.status ?? 500, { error: err.message });
            }
          });
        });
      },
    },
  };
}

// ---------- finding text ----------

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return EXTENSIONS.includes(path.extname(entry.name)) ? [full] : [];
  });
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', rarr: '→', larr: '←', hellip: '…', middot: '·' };

// Fold the characters that smartypants, entities and markdown change between source and page.
function fold(ch) {
  if ('‘’‚‛′'.includes(ch)) return "'";
  if ('“”„″'.includes(ch)) return '"';
  if ('–—‒−'.includes(ch)) return '-';
  if (ch === '…') return '...';
  if (/\s/.test(ch)) return ' ';
  if ('[]*_`'.includes(ch)) return '';
  return ch;
}

function normalise(text) {
  return [...text].map(fold).join('').replace(/ +/g, ' ').replace(/-+/g, '-').trim();
}

// Project a source file to roughly what a reader sees, keeping a map from each visible
// character back to its source range so a match can be turned into an edit.
function project(src) {
  const chars = [];
  const from = [];
  const to = [];
  const push = (text, start, end) => {
    for (const ch of [...text].map(fold).join('')) {
      const last = chars[chars.length - 1];
      if ((ch === ' ' && (last === ' ' || last === undefined)) || (ch === '-' && last === '-')) continue;
      chars.push(ch);
      from.push(start);
      to.push(end);
    }
  };
  let i = 0;
  let lineStart = true;
  while (i < src.length) {
    const c = src[i];
    if (lineStart) {
      const marker = /^[ \t]*(#{1,6}[ \t]+|[-*+][ \t]+|\d+\.[ \t]+|>[ \t]?)/.exec(src.slice(i, i + 12));
      lineStart = false;
      if (marker) { i += marker[0].length; continue; }
    }
    if (c === '\n') { push(' ', i, i + 1); i++; lineStart = true; continue; }
    const autolink = c === '<' && /^<((?:https?:\/\/|mailto:)[^>\s]+)>/.exec(src.slice(i, i + 500));
    if (autolink) {
      for (let k = 0; k < autolink[1].length; k++) push(autolink[1][k], i + 1 + k, i + 2 + k);
      i += autolink[0].length;
      continue;
    }
    const codeBlock = c === '<' && /^<(style|script)\b/i.exec(src.slice(i, i + 8));
    if (codeBlock) {
      const close = src.indexOf(`</${codeBlock[1]}>`, i);
      if (close !== -1) { i = close + codeBlock[1].length + 3; continue; }
    }
    if (c === '<' && /[A-Za-z/!]/.test(src[i + 1] ?? '')) {
      const close = src.indexOf('>', i);
      if (close !== -1) { i = close + 1; continue; }
    }
    if (c === ']' && src[i + 1] === '(') {
      const close = src.indexOf(')', i);
      if (close !== -1) { i = close + 1; continue; }
    }
    if (c === '!' && src[i + 1] === '[') { i++; continue; }
    if (c === '\\' && i + 1 < src.length) { push(src[i + 1], i, i + 2); i += 2; continue; }
    if (c === '&') {
      const entity = /^&(#\d+|#x[0-9a-f]+|[a-z]+);/i.exec(src.slice(i, i + 10));
      if (entity) {
        const name = entity[1];
        const ch = name[0] === '#'
          ? String.fromCodePoint(parseInt(name.slice(name[1] === 'x' ? 2 : 1), name[1] === 'x' ? 16 : 10))
          : ENTITIES[name.toLowerCase()];
        if (ch) { push(ch, i, i + entity[0].length); i += entity[0].length; continue; }
      }
    }
    push(c, i, i + 1);
    i++;
  }
  return { text: chars.join(''), from, to };
}

// Widen a match over the inline markdown wrapped around it, e.g. **bold** or [link](url).
function widen(src, start, end) {
  while (start > 0 && '[*_`'.includes(src[start - 1])) start--;
  while (end < src.length) {
    if ('*_`]'.includes(src[end])) end++;
    else if (src[end] === '(' && src[end - 1] === ']' && src.indexOf(')', end) !== -1) end = src.indexOf(')', end) + 1;
    else break;
  }
  return { start, end };
}

// A "whole" match fills its line, element, string literal or YAML value, rather than being part of a longer text.
function isWhole(src, start, end) {
  const before = src.slice(src.lastIndexOf('\n', start - 1) + 1, start);
  const lineEnd = src.indexOf('\n', end);
  const after = src.slice(end, lineEnd === -1 ? src.length : lineEnd);
  const okBefore = /^\s*(#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s*)?$/.test(before) || /[>"'`]\s*$/.test(before) || /^\s*[\w-]+:\s*$/.test(before);
  const okAfter = /^\s*$/.test(after) || /^\s*[<"'`]/.test(after);
  return okBefore && okAfter;
}

const cache = new Map();
function load(file) {
  const mtime = fs.statSync(file).mtimeMs;
  const hit = cache.get(file);
  if (hit?.mtime === mtime) return hit;
  const src = fs.readFileSync(file, 'utf8');
  const entry = { mtime, src, projected: project(src) };
  cache.set(file, entry);
  return entry;
}

function lineOf(src, offset) {
  return src.slice(0, offset).split('\n').length;
}

function find(srcDir, { text, raw = false, page = '/', key }) {
  const needle = raw ? text : normalise(text);
  if (!needle || needle.length < 2) return { matches: [] };
  const segments = page.split('/').filter(Boolean);
  const matches = [];
  for (const file of listFiles(srcDir)) {
    const { src, projected } = load(file);
    const rel = path.relative(path.dirname(srcDir), file);
    const hits = [];
    if (raw) {
      // Alt text and meta: literal attribute or string values, possibly escaped.
      const variants = new Set([needle, needle.replace(/'/g, "\\'"), needle.replace(/"/g, '\\"'), needle.replace(/&/g, '&amp;').replace(/"/g, '&quot;')]);
      for (const v of variants) {
        for (let at = src.indexOf(v); at !== -1; at = src.indexOf(v, at + 1)) hits.push({ start: at, end: at + v.length });
      }
    } else {
      const p = projected;
      for (let at = p.text.indexOf(needle); at !== -1; at = p.text.indexOf(needle, at + 1)) {
        hits.push(widen(src, p.from[at], p.to[at + needle.length - 1]));
      }
    }
    for (const { start, end } of hits) {
      // Only offer text whose context we read correctly: escaping it as found must give back the source.
      if (!roundTrips(src, file, start, end)) continue;
      // Page title and description: only values given to that prop or frontmatter key.
      if (key && !new RegExp(`\\b${key}\\s*[:=]\\s*\\{?\\s*["'\`]?$`).test(src.slice(Math.max(0, start - 40), start))) continue;
      const line = lineOf(src, start);
      // Rank files that look like they belong to the current page first.
      const relevance = segments.filter((s) => rel.includes(s)).length + (rel.includes('content') ? 0.5 : 0);
      matches.push({
        file: rel, start, end, line, relevance,
        whole: isWhole(src, start, end),
        original: src.slice(start, end),
        source: unescapeFor(src, file, start, end),
        context: src.split('\n')[line - 1].trim().slice(0, 140),
      });
    }
  }
  const whole = matches.filter((m) => m.whole);
  const result = (whole.length ? whole : matches).sort((a, b) => b.relevance - a.relevance);
  const unique = [...new Map(result.map((m) => [`${m.file}:${m.start}`, m])).values()];
  return { matches: unique };
}

// ---------- saving ----------

function frontmatterEnd(src) {
  if (!src.startsWith('---')) return -1;
  const close = src.indexOf('\n---', 3);
  return close === -1 ? -1 : close;
}

function contextOf(src, file, start, end) {
  const quote = src[start - 1];
  return {
    quote,
    closes: src[end] === quote,
    inFrontmatter: start < frontmatterEnd(src),
    ext: path.extname(file),
  };
}

// Show the text as written, without the escaping its context needs; escapeFor puts it back on save.
function unescapeFor(src, file, start, end) {
  const { quote, closes, inFrontmatter, ext } = contextOf(src, file, start, end);
  const text = src.slice(start, end);
  if (ext === '.md' && inFrontmatter) {
    if (quote === '"' && closes) return text.replace(/\\(.)/g, '$1');
    if (quote === "'" && closes) return text.replace(/''/g, "'");
    return text;
  }
  if (ext === '.ts' || (ext === '.astro' && inFrontmatter)) {
    return "'\"`".includes(quote) && closes ? text.replace(/\\(.)/g, '$1') : text;
  }
  if (ext === '.astro') {
    if (quote === '"' && closes) return text;
    return text.replace(/&lt;/g, '<').replace(/&#123;/g, '{').replace(/&#125;/g, '}');
  }
  return text;
}

// Escape the new text for wherever the old text sat: YAML value, JS string, HTML attribute, template or markdown.
function escapeFor(src, file, start, end, text) {
  const { quote, closes, inFrontmatter, ext } = contextOf(src, file, start, end);
  const oneLine = (s) => s.replace(/\s*\n\s*/g, ' ');

  if (ext === '.md' && inFrontmatter) {
    if (quote === '"' && closes) return oneLine(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    if (quote === "'" && closes) return oneLine(text).replace(/'/g, "''");
    const line = oneLine(text);
    const needsQuotes = /: |\s#|^[-?:,[\]{}#&*!|>'"%@`]|:$/.test(line);
    return needsQuotes ? `"${line.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : line;
  }
  if (ext === '.ts' || (ext === '.astro' && inFrontmatter)) {
    if ("'\"`".includes(quote) && closes) return oneLine(text).replace(/\\/g, '\\\\').replaceAll(quote, `\\${quote}`);
    return text;
  }
  if (ext === '.astro') {
    // Attributes stay raw (component props don't decode entities); save() switches to {"..."} for a double quote.
    if (quote === '"' && closes) return oneLine(text);
    return text.replace(/</g, '&lt;').replace(/{/g, '&#123;').replace(/}/g, '&#125;');
  }
  return text;
}

function roundTrips(src, file, start, end) {
  return escapeFor(src, file, start, end, unescapeFor(src, file, start, end)) === src.slice(start, end);
}

function save(srcDir, { file, start, end, original, text }) {
  const full = path.resolve(path.dirname(srcDir), file);
  if (!full.startsWith(srcDir + path.sep) || !EXTENSIONS.includes(path.extname(full))) {
    throw Object.assign(new Error('refusing to write outside src/'), { status: 400 });
  }
  const src = fs.readFileSync(full, 'utf8');
  if (src.slice(start, end) !== original) {
    throw Object.assign(new Error(`${file} changed since this text was opened; Option-click it again`), { status: 409 });
  }
  if (!roundTrips(src, file, start, end)) {
    throw Object.assign(new Error(`Can't safely edit this here; open ${file}:${lineOf(src, start)} instead`), { status: 400 });
  }
  // The content schema rejects these when empty, and Astro then silently keeps serving the old page.
  const key = /\b(title|alt|src):\s*["']?$/.exec(src.slice(src.lastIndexOf('\n', start - 1) + 1, start));
  if (key && !text.trim() && start < frontmatterEnd(src)) {
    const hint = key[1] === 'title' ? '' : `; to remove the image, delete its whole entry in ${file}`;
    throw Object.assign(new Error(`${key[1]} can't be empty${hint}`), { status: 400 });
  }
  const { quote, closes, inFrontmatter, ext } = contextOf(src, file, start, end);
  const next = ext === '.astro' && !inFrontmatter && quote === '"' && closes && text.includes('"')
    ? src.slice(0, start - 1) + `{${JSON.stringify(text.replace(/\s*\n\s*/g, ' '))}}` + src.slice(end + 1)
    : src.slice(0, start) + escapeFor(src, file, start, end, text) + src.slice(end);
  fs.writeFileSync(full, next);
  return { ok: true, file, line: lineOf(src, start) };
}
