import React from "react";
import { Diamond, ArrowLeft, Clock3, ShieldCheck, FileText, Receipt, Wallet } from "lucide-react";

type Props = {
  pathname: string;
  onNavigate: (path: string) => void;
};

type Product = {
  id: number;
  title: string;
  material: string;
  description: string;
  image: string;
  collection: string;
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    title: "Nocturne Emerald Collar",
    material: "18k Gold · Emerald · Diamond",
    description: "Ein skulpturales Collier mit tiefgruenen Smaragden und handgefassten Brillanten.",
    image: "[IMAGE_PRODUCT_1]",
    collection: "heritage",
  },
  {
    id: 2,
    title: "Imperial Sapphire Cuff",
    material: "White Gold · Sapphire · Diamond",
    description: "Markante Cuff-Silhouette mit royalblauen Saphiren und archivierter Fassung.",
    image: "[IMAGE_PRODUCT_2]",
    collection: "royal",
  },
  {
    id: 3,
    title: "Lumiere Ruby Ring",
    material: "Rose Gold · Ruby · Diamond",
    description: "Statement-Ring mit leuchtendem Rubin und eleganter Halo-Architektur.",
    image: "[IMAGE_PRODUCT_3]",
    collection: "atelier",
  },
  {
    id: 4,
    title: "Vesper Diamond Pendant",
    material: "Platinum · Diamond",
    description: "Minimalistisches Pendant mit Fokus auf Licht, Symmetrie und Reinheit.",
    image: "[IMAGE_PRODUCT_1]",
    collection: "heritage",
  },
];

const AUCTIONS = [
  { id: 101, title: "Emerald Crown Suite", status: "Live", image: "[IMAGE_AUCTION]" },
  { id: 102, title: "Royal Sapphire Pair", status: "Geschlossen", image: "[IMAGE_AUCTION]" },
];

const NAV = [
  { label: "Marktplatz", href: "/marktplatz" },
  { label: "Kollektionen", href: "/kollektionen" },
  { label: "Auktionen", href: "/auktionen" },
  { label: "Galerie", href: "/galerie" },
  { label: "Drops", href: "/drops" },
  { label: "Tresor", href: "/tresor" },
  { label: "Login", href: "/login" },
];

function imageShell(label: string, ratio = "aspect-[16/9]") {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 ${ratio}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.22),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(212,175,55,0.12),transparent_50%)]" />
      <p className="absolute bottom-4 left-4 text-[10px] tracking-[0.2em] uppercase text-zinc-400">{label}</p>
    </div>
  );
}

function SiteHeader({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(8,8,8,0.86)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate("/marktplatz")} className="flex items-center gap-2">
          <Diamond className="w-4 h-4 text-amber-400" />
          <span className="font-serif italic text-zinc-100">Antonio Bellanova</span>
        </button>
        <nav className="hidden md:flex items-center gap-2">
          {NAV.map((n) => (
            <button
              key={n.href}
              onClick={() => onNavigate(n.href)}
              className="px-3 py-2 rounded-xl text-xs uppercase tracking-[0.18em] text-zinc-300 hover:text-amber-300 hover:bg-white/5 transition"
            >
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function ProductCard({ p, onNavigate }: { p: Product; onNavigate: (path: string) => void }) {
  return (
    <article className="group rounded-2xl border border-white/10 bg-black/30 overflow-hidden hover:border-amber-500/40 transition">
      {imageShell(p.image, "aspect-[4/5]")}
      <div className="p-5 space-y-2">
        <h3 className="font-serif italic text-xl text-zinc-100 group-hover:text-amber-300 transition">{p.title}</h3>
        <p className="text-xs uppercase tracking-wider text-zinc-500">{p.material}</p>
        <button
          onClick={() => onNavigate(`/produkt/${p.id}`)}
          className="mt-3 inline-flex rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-black bg-gradient-to-r from-amber-300 to-amber-500 hover:brightness-110 transition"
        >
          Produkt ansehen
        </button>
      </div>
    </article>
  );
}

function Shell({ children, onNavigate }: { children: React.ReactNode; onNavigate: (path: string) => void }) {
  return (
    <div className="min-h-screen bg-[#070707] text-zinc-100">
      <SiteHeader onNavigate={onNavigate} />
      <main className="mx-auto max-w-[1400px] px-6 py-10 md:py-14 space-y-14">{children}</main>
    </div>
  );
}

export function isLuxuryPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/marktplatz" ||
    pathname === "/kollektionen" ||
    pathname === "/auktionen" ||
    pathname === "/galerie" ||
    pathname === "/drops" ||
    pathname === "/tresor" ||
    pathname === "/login" ||
    pathname === "/kontakt" ||
    pathname === "/dashboard" ||
    /^\/produkt\/\d+$/.test(pathname) ||
    /^\/kollektion\/[^/]+$/.test(pathname) ||
    /^\/auktion\/\d+$/.test(pathname)
  );
}

export function LuxuryPublicSite({ pathname, onNavigate }: Props) {
  const productIdMatch = pathname.match(/^\/produkt\/(\d+)$/);
  const auctionIdMatch = pathname.match(/^\/auktion\/(\d+)$/);
  const collectionMatch = pathname.match(/^\/kollektion\/([^/]+)$/);

  if (pathname === "/login") {
    return (
      <div className="min-h-screen bg-[#070707] text-zinc-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8 space-y-6">
          <h1 className="font-serif italic text-3xl">Login</h1>
          <input className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3" placeholder="E-Mail" />
          <input type="password" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3" placeholder="Passwort" />
          <button
            onClick={() => onNavigate("/dashboard")}
            className="w-full rounded-full py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500"
          >
            Einloggen
          </button>
        </div>
      </div>
    );
  }

  if (pathname === "/dashboard") {
    return (
      <div className="min-h-screen bg-[#070707] text-zinc-100">
        <div className="mx-auto max-w-[1200px] px-6 py-12 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="font-serif italic text-4xl">Dashboard</h1>
            <button onClick={() => onNavigate("/tresor")} className="rounded-full px-5 py-2 text-xs uppercase tracking-[0.2em] bg-zinc-900 border border-zinc-700">
              Mein Tresor
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {["Mein Tresor", "Meine Stücke", "Dokumente"].map((x) => (
              <div key={x} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <p className="font-serif italic text-2xl">{x}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pathname === "/kontakt") {
    return (
      <Shell onNavigate={onNavigate}>
        <h1 className="font-serif italic text-4xl">Kontakt</h1>
        <div className="max-w-2xl space-y-4">
          <input className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3" placeholder="Name" />
          <textarea className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3 min-h-40" placeholder="Anfrage" />
          <button className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
            Senden
          </button>
        </div>
      </Shell>
    );
  }

  if (productIdMatch) {
    const id = Number(productIdMatch[1]);
    const p = PRODUCTS.find((x) => x.id === id) ?? PRODUCTS[0];
    return (
      <Shell onNavigate={onNavigate}>
        <button onClick={() => onNavigate("/marktplatz")} className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-300 text-xs uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Zurueck
        </button>
        <section className="grid lg:grid-cols-2 gap-10">
          {imageShell(p.image, "aspect-[4/5]")}
          <div className="space-y-5">
            <h1 className="font-serif italic text-5xl">{p.title}</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{p.material}</p>
            <p className="text-zinc-300 leading-relaxed">{p.description}</p>
            <div className="flex flex-wrap gap-3 pt-4">
              <button onClick={() => onNavigate("/kontakt")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
                Anfrage senden
              </button>
              <button onClick={() => onNavigate("/marktplatz")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] border border-zinc-700">
                Zurueck
              </button>
            </div>
          </div>
        </section>
      </Shell>
    );
  }

  if (collectionMatch) {
    const name = decodeURIComponent(collectionMatch[1] || "collection");
    const set = PRODUCTS.filter((p) => p.collection.includes(name) || name === "all");
    return (
      <Shell onNavigate={onNavigate}>
        <h1 className="font-serif italic text-5xl capitalize">Kollektion {name}</h1>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {(set.length ? set : PRODUCTS).map((p) => (
            <ProductCard key={p.id} p={p} onNavigate={onNavigate} />
          ))}
        </div>
      </Shell>
    );
  }

  if (auctionIdMatch) {
    const id = Number(auctionIdMatch[1]);
    const item = AUCTIONS.find((a) => a.id === id) ?? AUCTIONS[0];
    return (
      <Shell onNavigate={onNavigate}>
        <h1 className="font-serif italic text-5xl">{item.title}</h1>
        {imageShell(item.image)}
        <div className="flex gap-3">
          <button onClick={() => onNavigate("/login")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
            Gebot abgeben
          </button>
          <button onClick={() => onNavigate("/auktionen")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] border border-zinc-700">
            Zurueck zu Auktionen
          </button>
        </div>
      </Shell>
    );
  }

  if (pathname === "/kollektionen") {
    return (
      <Shell onNavigate={onNavigate}>
        <h1 className="font-serif italic text-5xl">Kollektionen</h1>
        <section className="grid lg:grid-cols-2 gap-8">
          {[
            { name: "heritage", image: "[IMAGE_COLLECTION]" },
            { name: "royal", image: "[IMAGE_COLLECTION]" },
          ].map((c) => (
            <button key={c.name} onClick={() => onNavigate(`/kollektion/${c.name}`)} className="text-left rounded-2xl border border-white/10 p-4 bg-black/30 hover:border-amber-500/40 transition">
              {imageShell(c.image)}
              <p className="mt-4 font-serif italic text-3xl capitalize">{c.name}</p>
            </button>
          ))}
        </section>
      </Shell>
    );
  }

  if (pathname === "/auktionen") {
    return (
      <Shell onNavigate={onNavigate}>
        <h1 className="font-serif italic text-5xl">Exklusive Auktionen</h1>
        {imageShell("[IMAGE_AUCTION]")}
        <div className="grid md:grid-cols-2 gap-6">
          {AUCTIONS.map((a) => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{a.status}</p>
              <h3 className="font-serif italic text-2xl">{a.title}</h3>
              <div className="flex gap-2">
                <button onClick={() => onNavigate(`/auktion/${a.id}`)} className="rounded-full px-4 py-2 text-[11px] uppercase tracking-widest border border-zinc-700">Details ansehen</button>
                <button onClick={() => onNavigate("/login")} className="rounded-full px-4 py-2 text-[11px] uppercase tracking-widest text-black bg-gradient-to-r from-amber-300 to-amber-500">Gebot abgeben</button>
              </div>
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  if (pathname === "/galerie") {
    return (
      <Shell onNavigate={onNavigate}>
        <h1 className="font-serif italic text-5xl">Galerie</h1>
        <div className="columns-1 md:columns-2 xl:columns-3 gap-5 [column-fill:_balance]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="mb-5">
              {imageShell("[IMAGE_GALLERY]", i % 3 === 0 ? "aspect-[3/4]" : "aspect-[4/3]")}
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  if (pathname === "/drops") {
    return (
      <Shell onNavigate={onNavigate}>
        <h1 className="font-serif italic text-5xl">Drops</h1>
        {imageShell("[IMAGE_DROP]")}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-zinc-300">
            <Clock3 className="w-5 h-5 text-amber-400" />
            <p className="text-sm uppercase tracking-[0.2em]">Countdown: 03 : 14 : 28 : 51</p>
          </div>
          <button onClick={() => onNavigate("/login")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
            Jetzt sichern
          </button>
        </div>
      </Shell>
    );
  }

  if (pathname === "/tresor") {
    return (
      <Shell onNavigate={onNavigate}>
        <h1 className="font-serif italic text-5xl">Tresor</h1>
        {imageShell("[IMAGE_TRESOR]")}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { title: "Schmuckstuecke", icon: Diamond },
            { title: "Zertifikate", icon: ShieldCheck },
            { title: "Vertraege", icon: FileText },
            { title: "Transaktionen", icon: Wallet },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <s.icon className="w-5 h-5 text-amber-400 mb-3" />
              <p className="font-serif italic text-2xl">{s.title}</p>
              <button className="mt-4 rounded-full px-4 py-2 text-[11px] uppercase tracking-widest border border-zinc-700">
                Dokument oeffnen
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate("/dashboard")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
          Zum Dashboard
        </button>
      </Shell>
    );
  }

  // Default + /marktplatz
  return (
    <Shell onNavigate={onNavigate}>
      <section className="space-y-6">
        {imageShell("[IMAGE_HERO]")}
        <h1 className="font-serif italic text-6xl">Marktplatz</h1>
        <button onClick={() => onNavigate("/kollektionen")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
          Kollektion ansehen
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-5 flex flex-wrap gap-3 items-center">
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Kategorien</span>
        {["Ringe", "Colliers", "Ohrringe", "Bespoke"].map((x) => (
          <button key={x} className="rounded-full px-3 py-1.5 text-[11px] uppercase tracking-widest border border-zinc-700 text-zinc-300">{x}</button>
        ))}
        <span className="ml-auto text-xs uppercase tracking-[0.2em] text-zinc-500">Sortierung</span>
        <select className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs">
          <option>Neueste</option>
          <option>Beliebtheit</option>
          <option>Preis</option>
        </select>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} p={p} onNavigate={onNavigate} />
        ))}
      </section>
    </Shell>
  );
}

