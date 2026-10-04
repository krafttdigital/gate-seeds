const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const mainPages = ["index.html", "about.html", "products.html", "contact.html"];
const seedPages = fs.readdirSync(path.join(root, "seeds"))
  .filter((name) => name.endsWith(".html"))
  .sort()
  .map((name) => path.join("seeds", name));
const pages = [...mainPages, ...seedPages];
const failures = [];

const decode = (value = "") => value
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&rsquo;/g, "’")
  .replace(/&mdash;/g, "—")
  .replace(/&ndash;/g, "–")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

const matchOne = (html, pattern) => {
  const match = html.match(pattern);
  return match ? decode(match[1].trim()) : "";
};

const seenTitles = new Map();
const seenDescriptions = new Map();
const seenCanonicals = new Map();

for (const relative of pages) {
  const filename = path.join(root, relative);
  const html = fs.readFileSync(filename, "utf8");
  const title = matchOne(html, /<title>([\s\S]*?)<\/title>/i);
  const description = matchOne(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical = matchOne(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);

  if (!title) failures.push(`${relative}: missing title`);
  if (title.length > 60) failures.push(`${relative}: title is ${title.length} characters`);
  if (!description) failures.push(`${relative}: missing meta description`);
  if (description.length > 160) failures.push(`${relative}: description is ${description.length} characters`);
  if (!canonical.startsWith("https://www.gateseeds.com/")) failures.push(`${relative}: invalid canonical ${canonical}`);
  if (!/name="robots"\s+content="index,follow,max-image-preview:large"/i.test(html)) failures.push(`${relative}: indexable robots meta missing`);
  if (!/property="og:title"/i.test(html) || !/property="og:description"/i.test(html) || !/property="og:image"/i.test(html) || !/property="og:image:alt"/i.test(html)) failures.push(`${relative}: incomplete Open Graph metadata`);
  if (!/name="twitter:title"/i.test(html) || !/name="twitter:description"/i.test(html) || !/name="twitter:image"/i.test(html) || !/name="twitter:image:alt"/i.test(html)) failures.push(`${relative}: incomplete Twitter metadata`);

  for (const [value, label, map] of [[title, "title", seenTitles], [description, "description", seenDescriptions], [canonical, "canonical", seenCanonicals]]) {
    if (map.has(value)) failures.push(`${relative}: duplicate ${label} also used by ${map.get(value)}`);
    else map.set(value, relative);
  }

  const jsonLdBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  if (!jsonLdBlocks.length) failures.push(`${relative}: missing JSON-LD`);
  const types = new Set();
  jsonLdBlocks.forEach((block, index) => {
    try {
      const data = JSON.parse(block[1]);
      const nodes = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
      nodes.forEach((node) => {
        const type = node["@type"];
        (Array.isArray(type) ? type : [type]).filter(Boolean).forEach((item) => types.add(item));
      });
    } catch (error) {
      failures.push(`${relative}: JSON-LD block ${index + 1} does not parse (${error.message})`);
    }
  });

  if (relative.startsWith("seeds\\") || relative.startsWith("seeds/")) {
    for (const type of ["Organization", "WebSite", "WebPage", "BreadcrumbList", "Product"]) {
      if (!types.has(type)) failures.push(`${relative}: JSON-LD missing ${type}`);
    }
    if (!/wa\.me\/919216971001\?text=/i.test(html)) failures.push(`${relative}: variety WhatsApp enquiry missing`);
  }

  const assetMatches = [...html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/gi)];
  for (const assetMatch of assetMatches) {
    const ref = assetMatch[1];
    if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(ref) || ref === "/") continue;
    let localRef = ref;
    try { localRef = decodeURIComponent(ref); } catch (_) {}
    const resolved = path.resolve(path.dirname(filename), localRef);
    if (!fs.existsSync(resolved)) failures.push(`${relative}: missing local reference ${ref}`);
  }
}

if (seedPages.length !== 29) failures.push(`expected 29 seed pages, found ${seedPages.length}`);

const productsHtml = fs.readFileSync(path.join(root, "products.html"), "utf8");
const linkedSeeds = new Set([...productsHtml.matchAll(/href="(seeds\/[^"]+\.html)"/gi)].map((match) => match[1]));
if (linkedSeeds.size !== 29) failures.push(`products.html links to ${linkedSeeds.size} unique seed pages instead of 29`);

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== 33) failures.push(`sitemap has ${sitemapUrls.length} URLs instead of 33`);
for (const canonical of seenCanonicals.keys()) {
  if (!sitemapUrls.includes(canonical)) failures.push(`sitemap missing ${canonical}`);
}

const css = fs.readFileSync(path.join(root, "css", "style.css"), "utf8");
for (const selector of [".hero", ".page-hero", ".products-hero", ".seed-detail-hero"]) {
  const start = css.indexOf(`${selector}{`);
  const end = start >= 0 ? css.indexOf("}\n", start) : -1;
  const block = start >= 0 && end >= 0 ? css.slice(start, end) : "";
  if (!block) failures.push(`CSS missing ${selector}`);
  if (/gradient\(/i.test(block)) failures.push(`${selector} still uses a gradient background`);
}
if (!css.includes("--hero-texture:")) failures.push("hero texture token missing");
if (!css.includes("@media (prefers-reduced-motion:no-preference)")) failures.push("motion preference layer missing");

if (failures.length) {
  console.error(`SEO audit failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`SEO audit passed: ${pages.length} pages, ${seedPages.length} varieties, ${sitemapUrls.length} sitemap URLs.`);
console.log("All titles/descriptions/canonicals are unique, JSON-LD parses, and local references resolve.");
