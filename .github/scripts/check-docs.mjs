// Offline checks for the markdown docs: relative links resolve, code fences balance.
// External URLs are deliberately not checked; the GIS endpoints are too flaky for CI.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const skip = new Set(['.git', 'node_modules']);
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    if (skip.has(n)) return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
  });

const errors = [];
for (const file of walk('.')) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');

  const fences = lines.filter((l) => /^\s*(```|~~~)/.test(l)).length;
  if (fences % 2) errors.push(`${file}: unbalanced code fences (${fences} fence lines)`);

  let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) return;
    for (const m of line.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = m[1].split('#')[0];
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      const path = target.startsWith('/') ? resolve('.', target.slice(1)) : resolve(dirname(file), decodeURIComponent(target));
      if (!existsSync(path)) errors.push(`${file}:${i + 1}: broken relative link -> ${m[1]}`);
    }
  });
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('docs checks passed');
