const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Root projektu (jeden poziom wyżej niż katalog scripts)
const root = path.resolve(__dirname, '..');
const outXml = path.join(root, 'sitemap.xml');
const outGz = outXml + '.gz';

const baseUrl = process.env.BASE_URL || 'https://jasnepismo.pl';

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Pomiń katalogi, które nie zawierają stron do mapy
      if (['node_modules', '.git', '.vercel', 'api', 'tests', 'img', 'resources', 'scripts'].includes(e.name)) continue;
      walk(full, files);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function buildUrls() {
  const htmlFiles = walk(root);
  const urls = [];
  for (const f of htmlFiles) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    let loc;

    // Try to read canonical link from the HTML head (if present) and use it
    try {
      const content = fs.readFileSync(f, 'utf8');
      const m = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
      if (m && m[1]) {
        const href = m[1];
        if (/^https?:\/\//i.test(href)) {
          loc = href;
        } else if (href.startsWith('/')) {
          loc = baseUrl.replace(/\/$/, '') + href;
        } else {
          loc = baseUrl.replace(/\/$/, '') + '/' + href;
        }
      }
    } catch (err) {
      // ignore parse errors and fallback to file-based URL
    }

    if (!loc) {
      loc = baseUrl.replace(/\/$/, '') + '/' + rel;
      if (loc.endsWith('/index.html')) loc = loc.slice(0, -'index.html'.length);
      if (loc === baseUrl + '') loc = baseUrl + '/';
    }

    const stat = fs.statSync(f);
    const lastmod = formatDate(new Date(stat.mtime));
    const isHome = loc === baseUrl + '/';
    const changefreq = isHome ? 'weekly' : 'monthly';
    const priority = isHome ? '1.0' : '0.5';
    urls.push({ loc, lastmod, changefreq, priority });
  }
  // Deduplicate by loc
  const seen = new Set();
  const uniq = [];
  for (const u of urls) {
    if (!seen.has(u.loc)) { seen.add(u.loc); uniq.push(u); }
  }
  // ensure home first
  uniq.sort((a, b) => (a.loc === baseUrl + '/' ? -1 : b.loc === baseUrl + '/' ? 1 : 0));
  return uniq;
}

function generate() {
  const urls = buildUrls();
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const u of urls) {
    parts.push('  <url>');
    parts.push(`    <loc>${u.loc}</loc>`);
    parts.push(`    <lastmod>${u.lastmod}</lastmod>`);
    parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
    parts.push(`    <priority>${u.priority}</priority>`);
    parts.push('  </url>');
  }
  parts.push('</urlset>');
  const xml = parts.join('\n') + '\n';
  fs.writeFileSync(outXml, xml, 'utf8');
  console.log('Wrote', outXml);
  const gz = zlib.gzipSync(Buffer.from(xml, 'utf8'));
  fs.writeFileSync(outGz, gz);
  console.log('Wrote', outGz);
}

try {
  generate();
} catch (err) {
  console.error('Error generating sitemap:', err);
  process.exit(1);
}

