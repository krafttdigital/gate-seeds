const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const seedDir = path.join(root, "seeds");
const siteUrl = "https://www.gateseeds.com";
const whatsappNumber = "919216971001";
const lastmod = "2026-10-04";

const wheat = [
  "PBW-872", "PBW-826", "DBW-187", "DBW-222", "WH-1270", "HD-3086",
  "DBW-303", "HD-3386", "HD-2967", "HD-2851", "DBW-327", "PBW-343",
  "DBW-371", "DBW-372", "WH-711", "PBW-502", "GATE-71"
];

const shortGrain = ["PR-126", "PR-131", "PR-114"];
const longGrain = ["PB-1509", "PB-1401", "PB-1121", "PB-1718", "PB-1847", "PB-1885", "PB-1692"];

const imageMap = {
  "PBW-826": { file: "product-pbw826.jpg", alt: "GateSeeds PBW-826 wheat seed pack" },
  "PR-126": { file: "product-paddy-pr126.jpg", alt: "GateSeeds PR-126 paddy seed pack" },
  "PB-1509": { file: "product-paddy-pb1509-studio.jpg", alt: "GateSeeds PB-1509 paddy seed pack" },
  "PB-1718": { file: "product-paddy-pb1718-studio.jpg", alt: "GateSeeds PB-1718 paddy seed pack" },
  "PB-1885": { file: "product-paddy-pb1885.jpg", alt: "GateSeeds PB-1885 paddy seed pack" },
  "KRANTI": { file: "product-paddy-kranti.jpg", alt: "GateSeeds Kranti exclusive research paddy seed pack" }
};

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function varietySlug(name, crop) {
  return `${slugify(name)}-${crop.toLowerCase()}-seed.html`;
}

function whatsappLink(name, crop) {
  const message = `Hello GateSeeds,\nI would like to enquire about ${name} ${crop.toLowerCase()} seed.\nQuantity:\nLocation:`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function prefixFor(name) {
  return name.split("-")[0];
}

function wheatSeed(name) {
  const research = name === "GATE-71";
  const prefix = prefixFor(name);
  return {
    name,
    crop: "Wheat",
    group: research ? "GateSeeds Research Variety" : `${prefix} Wheat Selection`,
    eyebrow: research ? "Research Wheat Variety" : `${prefix} Wheat Variety`,
    title: research ? "GATE-71 Wheat Seed | GateSeeds Research Variety" : `${name} Wheat Seed | GateSeeds`,
    description: research
      ? "Discover GATE-71, a proprietary GateSeeds wheat research variety focused on dependable field performance. Enquire about availability and pack details."
      : `Explore GateSeeds ${name} wheat seed from our ${prefix} selection. Send your variety, quantity and location for current requirement information.`,
    research,
    exclusive: false
  };
}

function paddySeed(name, group) {
  const exclusive = name === "KRANTI";
  const dsr = group === "Direct Sowing Rice (DSR)";
  const short = group === "Short Grain Paddy";
  const title = exclusive
    ? "Kranti Paddy Seed | Exclusive GateSeeds Variety"
    : `${name} Paddy Seed | GateSeeds`;
  let description;
  if (exclusive) {
    description = "Discover Kranti, GateSeeds’ exclusive, internally developed paddy variety engineered for peak productivity. Enquire about availability and pack details.";
  } else if (dsr) {
    description = "Explore GateSeeds PUSA 1985 direct-sowing rice (DSR) paddy seed. Send your quantity and location for current requirement information.";
  } else if (short) {
    description = `Explore GateSeeds ${name} short-grain paddy seed. Send your variety, quantity and location for current pack and requirement information.`;
  } else {
    description = `Explore GateSeeds ${name} basmati and long-grain paddy seed. Send your quantity and location for current pack and requirement information.`;
  }
  return {
    name,
    crop: "Paddy",
    group: exclusive ? "GateSeeds Exclusive Research Variety" : group,
    eyebrow: exclusive ? "Exclusive Research Paddy Variety" : group,
    title,
    description,
    research: exclusive,
    exclusive
  };
}

const seeds = [
  ...wheat.map(wheatSeed),
  ...shortGrain.map((name) => paddySeed(name, "Short Grain Paddy")),
  ...longGrain.map((name) => paddySeed(name, "Basmati / Long Grain Paddy")),
  paddySeed("PUSA 1985", "Direct Sowing Rice (DSR)"),
  paddySeed("KRANTI", "GateSeeds Exclusive Research Variety")
].map((seed) => ({
  ...seed,
  slug: varietySlug(seed.name, seed.crop),
  image: imageMap[seed.name] || null
}));

if (seeds.length !== 29) throw new Error(`Expected 29 seed pages, found ${seeds.length}`);

for (const seed of seeds) {
  if (seed.title.length > 60) throw new Error(`Title too long (${seed.title.length}): ${seed.title}`);
  if (seed.description.length > 160) throw new Error(`Description too long (${seed.description.length}): ${seed.name}`);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function relatedSeeds(seed) {
  const sameCrop = seeds.filter((item) => item.crop === seed.crop && item.name !== seed.name);
  const sourceIndex = seeds.filter((item) => item.crop === seed.crop).findIndex((item) => item.name === seed.name);
  return [0, 1, 2].map((offset) => sameCrop[(sourceIndex + offset) % sameCrop.length]);
}

function pageSchema(seed) {
  const canonical = `${siteUrl}/seeds/${seed.slug}`;
  const product = {
    "@type": "Product",
    "@id": `${canonical}#product`,
    name: `${seed.name} ${seed.crop} Seed`,
    description: seed.description,
    sku: seed.name,
    category: `${seed.crop} Seed`,
    brand: { "@type": "Brand", name: "GateSeeds" },
    url: canonical,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Crop", value: seed.crop },
      { "@type": "PropertyValue", name: "Portfolio", value: seed.group },
      { "@type": "PropertyValue", name: "Variety", value: seed.name }
    ]
  };
  if (seed.image) product.image = `${siteUrl}/img/${seed.image.file}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "GateSeeds",
        url: `${siteUrl}/`,
        logo: `${siteUrl}/img/logo-primary.png`,
        telephone: "+91-92169-71001",
        email: "info@gateseeds.com"
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: "GateSeeds",
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en-IN"
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: seed.title,
        description: seed.description,
        dateModified: lastmod,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${canonical}#product` },
        mainEntity: { "@id": `${canonical}#product` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Products", item: `${siteUrl}/products.html` },
          { "@type": "ListItem", position: 3, name: `${seed.name} ${seed.crop} Seed`, item: canonical }
        ]
      },
      product
    ]
  };
}

function productVisual(seed) {
  if (seed.image) {
    return `<img src="../img/${seed.image.file}" alt="${escapeHtml(seed.image.alt)}" width="900" height="900">`;
  }
  return `<div class="seed-detail-monogram" aria-hidden="true"><span>${seed.crop === "Wheat" ? "W" : "P"}</span><strong>${escapeHtml(seed.name)}</strong></div>`;
}

function renderPage(seed) {
  const canonical = `${siteUrl}/seeds/${seed.slug}`;
  const ogImage = `${siteUrl}/img/social/${seed.slug.replace(".html", ".jpg")}`;
  const related = relatedSeeds(seed);
  const researchClass = seed.research ? " seed-detail-hero--research" : "";
  const exclusiveBadge = seed.exclusive ? `<span class="seed-exclusive-badge">GateSeeds Exclusive</span>` : "";
  const whyCopy = seed.exclusive
    ? "Kranti is our exclusive, internally developed paddy variety, engineered for peak productivity. It brings practical farming insight and targeted innovation to the Gate Seeds portfolio."
    : seed.research
      ? "GATE-71 is a proprietary wheat research development within the Gate Seeds portfolio, bringing practical farming insight and targeted innovation together for dependable field performance."
      : `${seed.name} is part of GateSeeds’ ${seed.group} portfolio.`;

  const schema = JSON.stringify(pageSchema(seed), null, 2).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
  (function () {
    var host = window.location.hostname.toLowerCase().replace(/\\.$/, "");
    if (host === "gateseeds.in" || host === "www.gateseeds.in") {
      window.location.replace("https://www.gateseeds.com" + window.location.pathname + window.location.search + window.location.hash);
    }
  })();
</script>
<title>${escapeHtml(seed.title)}</title>
<meta name="description" content="${escapeHtml(seed.description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="author" content="GateSeeds">
<meta name="theme-color" content="#0B3E10">
<link rel="canonical" href="${canonical}">

<meta property="og:type" content="product">
<meta property="og:site_name" content="GateSeeds">
<meta property="og:title" content="${escapeHtml(seed.title)}">
<meta property="og:description" content="${escapeHtml(seed.description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:secure_url" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="${escapeHtml(`${seed.name} ${seed.crop} seed — Reliable genetics for your season. GateSeeds`)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${siteUrl}/seeds/${seed.slug}">
<meta name="twitter:title" content="${escapeHtml(seed.title)}">
<meta name="twitter:description" content="${escapeHtml(seed.description)}">
<meta name="twitter:image" content="${ogImage}">
<meta name="twitter:image:alt" content="${escapeHtml(seed.image ? seed.image.alt : "GateSeeds wheat and paddy seed varieties")}">

<link rel="icon" href="../img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="../img/favicon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="../img/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&amp;family=Manrope:wght@500;600;700;800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/style.css">
<script type="application/ld+json">
${schema}
</script>
</head>
<body class="seed-detail-page">
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
  <div class="container nav-row">
    <a href="../index.html" class="brand" aria-label="GateSeeds home"><img src="../img/logo-primary.png" alt="GateSeeds — seeds that yield"></a>
    <nav class="nav-links" id="navLinks">
      <a href="../index.html">Home</a>
      <a href="../about.html">About</a>
      <a href="../products.html" class="is-active">Products</a>
      <a href="../contact.html">Contact</a>
    </nav>
    <div class="nav-right">
      <a class="btn nav-cta desktop-only" href="${whatsappLink(seed.name, seed.crop)}" target="_blank" rel="noopener">WhatsApp Enquiry</a>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="navLinks"><span></span></button>
    </div>
  </div>
</header>

<main id="main">
  <section class="seed-detail-hero${researchClass}">
    <div class="container seed-detail-hero-grid">
      <div class="seed-detail-hero-copy">
        <p class="crumbs"><a href="../index.html">Home</a><span>/</span><a href="../products.html">Products</a><span>/</span>${escapeHtml(seed.name)}</p>
        <span class="hero-eyebrow">${escapeHtml(seed.eyebrow)}</span>
        ${exclusiveBadge}
        <h1>${escapeHtml(seed.name)} <em>${escapeHtml(seed.crop)} Seed</em></h1>
        <p class="lede">${escapeHtml(seed.description)}</p>
        <div class="hero-ctas">
          <a class="btn btn-red" href="${whatsappLink(seed.name, seed.crop)}" target="_blank" rel="noopener">Enquire on WhatsApp</a>
          <a class="btn btn-ghost-light" href="../products.html#catalogue">Back to Catalogue</a>
        </div>
      </div>
      <aside class="seed-detail-visual" aria-label="${escapeHtml(seed.name)} variety identity">
        <span class="seed-detail-visual-label">Variety Profile</span>
        ${productVisual(seed)}
        <dl>
          <div><dt>Crop</dt><dd>${escapeHtml(seed.crop)}</dd></div>
          <div><dt>Portfolio</dt><dd>${escapeHtml(seed.group)}</dd></div>
          <div><dt>Brand</dt><dd>GateSeeds</dd></div>
        </dl>
      </aside>
    </div>
  </section>

  <section class="seed-detail-content">
    <div class="container seed-detail-content-grid">
      <article class="seed-detail-copy reveal">
        <span class="eyebrow">About the Variety</span>
        <h2>Build your season with ${escapeHtml(seed.name)}.</h2>
        <p>${escapeHtml(whyCopy)} Rooted in Maur Mandi for over two decades, Gate Seeds focuses on purity, presentation and field performance. We provide reliable genetics you can build a season on.</p>
        <p>For current availability, packaging or requirement information, send the variety name, required quantity and location to the GateSeeds team on WhatsApp.</p>
        <div class="seed-detail-facts">
          <div><span>01</span><strong>Exact variety</strong><p>${escapeHtml(seed.name)} ${escapeHtml(seed.crop)} seed</p></div>
          <div><span>02</span><strong>Requirement details</strong><p>Quantity and preferred packaging</p></div>
          <div><span>03</span><strong>Location</strong><p>Your town, district or delivery area</p></div>
        </div>
      </article>
      <aside class="seed-enquiry-card reveal">
        <span>Requirement checklist</span>
        <h2>Ask about ${escapeHtml(seed.name)}.</h2>
        <ul>
          <li>Confirm the variety name</li>
          <li>Add the required quantity</li>
          <li>Share your location</li>
        </ul>
        <a class="btn btn-red" href="${whatsappLink(seed.name, seed.crop)}" target="_blank" rel="noopener">WhatsApp ${escapeHtml(seed.name)} Enquiry</a>
      </aside>
    </div>
  </section>

  <section class="related-seeds">
    <div class="container">
      <div class="section-head reveal"><span class="eyebrow">Related ${escapeHtml(seed.crop)} Seeds</span><h2>Continue exploring the portfolio.</h2></div>
      <div class="related-seed-grid reveal-stagger">
        ${related.map((item) => `<a href="${item.slug}" class="related-seed-card"><span>${escapeHtml(item.group)}</span><strong>${escapeHtml(item.name)}</strong><em>View variety &rarr;</em></a>`).join("\n        ")}
      </div>
    </div>
  </section>

  <section class="cta-banner">
    <div class="container">
      <div class="reveal"><h2>Have a Seed Requirement?</h2><p>Send the crop, variety, quantity and location on WhatsApp for a prompt response.</p></div>
      <div class="cta-actions reveal"><a class="btn btn-ghost-light" href="${whatsappLink(seed.name, seed.crop)}" target="_blank" rel="noopener">WhatsApp Enquiry</a><a class="btn" style="background:#fff;color:var(--red);" href="../contact.html">Contact Details</a></div>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <img src="../img/logo-secondary.png" alt="GateSeeds">
      <p>Reliable wheat and paddy genetics, rooted in over two decades of experience in Maur Mandi. Seed you can build a season on.</p>
      <div class="footer-social">
        <a href="https://www.youtube.com/channel/UCe9ZtmGjVrJ-nqW4ZquojMQ" target="_blank" rel="noopener" aria-label="GateSeeds on YouTube"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 8.5s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-1C16.3 5 12 5h0s-4.3 0-7.1.2c-.4 0-1.3.1-2.1 1-.6.7-.8 2.3-.8 2.3S1.8 10.4 1.8 12.3v1.8c0 1.9.2 3.8.2 3.8s.2 1.6.8 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.3.2 7.3.2s4.3 0 7.1-.3c.4 0 1.3-.1 2.1-1 .6-.7.8-2.3.8-2.3s.2-1.9.2-3.8v-1.8c0-1.9-.2-3.8-.2-3.8ZM9.9 15.6V9.4l5.4 3.1-5.4 3.1Z"/></svg></a>
        <a href="https://www.facebook.com/profile.php?id=61551690355087" target="_blank" rel="noopener" aria-label="GateSeeds on Facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 8h2V5h-2a4 4 0 0 0-4 4v2H9v3h2v6h3v-6h2.5l.5-3H14V9a1 1 0 0 1 1-1Z"/></svg></a>
        <a href="https://www.instagram.com/gateseeds" target="_blank" rel="noopener noreferrer" aria-label="GateSeeds on Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r="1"/></svg></a>
      </div>
    </div>
    <div class="footer-col"><h4>Quick Links</h4><ul><li><a href="../index.html">Home</a></li><li><a href="../about.html">About Us</a></li><li><a href="../products.html">Products</a></li><li><a href="../contact.html">Contact</a></li></ul></div>
    <div class="footer-col"><h4>Get in Touch</h4><ul><li><p>Rampura-Talwandi Road, Near Railway Crossing, Maur Mandi, Bathinda, Punjab</p></li><li><a href="tel:+919216971001">+91 92169-71001</a></li><li><a href="mailto:info@gateseeds.com">info@gateseeds.com</a></li></ul></div>
  </div>
  <div class="container footer-bottom"><p>&copy; <span id="year"></span> GateSeeds. All rights reserved.</p><p>Wheat &amp; paddy seed portfolio &middot; Bathinda, Punjab</p></div>
  <div class="container footer-credit"><a class="made-by-badge" href="https://krafttdigital.in/" target="_blank" rel="noopener noreferrer" aria-label="Made with love by Kraftt Digital"><span>Made with</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.2-4.35-9.6-8.45C.25 8.85 2.2 4.5 6.45 4.5c2.4 0 4.05 1.35 5.55 3.05 1.5-1.7 3.15-3.05 5.55-3.05 4.25 0 6.2 4.35 4.05 8.05C19.2 16.65 12 21 12 21Z"/></svg><span>by</span><strong>Kraftt Digital</strong></a></div>
</footer>

<a class="whatsapp-float" href="${whatsappLink(seed.name, seed.crop)}" target="_blank" rel="noopener" aria-label="Enquire about ${escapeHtml(seed.name)} on WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.5 8.5 0 0 1-12.36 7.56L3 20l1.06-5.4A8.5 8.5 0 1 1 21 11.5Z"/></svg></a>
<a class="back-to-top" href="#main" aria-label="Back to top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg></a>
<script src="../js/script.js"></script>
</body>
</html>
`;
}

fs.mkdirSync(seedDir, { recursive: true });
for (const seed of seeds) {
  fs.writeFileSync(path.join(seedDir, seed.slug), renderPage(seed), "utf8");
}

const sitemapEntries = [
  { loc: `${siteUrl}/`, priority: "1.0", changefreq: "monthly" },
  { loc: `${siteUrl}/about.html`, priority: "0.8", changefreq: "monthly" },
  { loc: `${siteUrl}/products.html`, priority: "0.9", changefreq: "weekly" },
  { loc: `${siteUrl}/contact.html`, priority: "0.8", changefreq: "monthly" },
  ...seeds.map((seed) => ({ loc: `${siteUrl}/seeds/${seed.slug}`, priority: seed.research ? "0.8" : "0.7", changefreq: "monthly" }))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map((entry) => `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap, "utf8");
console.log(`Generated ${seeds.length} seed pages and ${sitemapEntries.length} sitemap URLs.`);
