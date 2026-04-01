import React from "react";
import { Diamond, ArrowLeft, Clock3, ShieldCheck, FileText, Receipt, Wallet } from "lucide-react";

type Props = {
  pathname: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  onNavigate: (path: string) => void;
};

const LANGS = ["de", "en", "it", "fr", "es", "pt", "ar"] as const;
type Lang = (typeof LANGS)[number];

const I18N: Record<Lang, Record<string, string>> = {
  de: {
    marketplace: "Marktplatz",
    collections: "Kollektionen",
    auctions: "Auktionen",
    gallery: "Galerie",
    drops: "Drops",
    vault: "Tresor",
    login: "Login",
    product_view: "Produkt ansehen",
    back: "Zurueck",
    send_inquiry: "Anfrage senden",
    back_to_auctions: "Zurueck zu Auktionen",
    exclusive_auctions: "Exklusive Auktionen",
    details_view: "Details ansehen",
    place_bid: "Gebot abgeben",
    secure_now: "Jetzt sichern",
    to_dashboard: "Zum Dashboard",
    open_document: "Dokument oeffnen",
    collection_view: "Kollektion ansehen",
    categories: "Kategorien",
    sorting: "Sortierung",
    newest: "Neueste",
    popularity: "Beliebtheit",
    price: "Preis",
    countdown: "Countdown",
    my_vault: "Mein Tresor",
    my_pieces: "Meine Stuecke",
    documents: "Dokumente",
    contact: "Kontakt",
    name: "Name",
    inquiry: "Anfrage",
    send: "Senden",
    email: "E-Mail",
    password: "Passwort",
    sign_in: "Einloggen",
    status_closed: "Geschlossen",
    jewelry: "Schmuckstuecke",
    certificates: "Zertifikate",
    contracts: "Vertraege",
    transactions: "Transaktionen",
    language: "Sprache",
  },
  en: {
    marketplace: "Marketplace",
    collections: "Collections",
    auctions: "Auctions",
    gallery: "Gallery",
    drops: "Drops",
    vault: "Vault",
    login: "Login",
    product_view: "View product",
    back: "Back",
    send_inquiry: "Send inquiry",
    back_to_auctions: "Back to auctions",
    exclusive_auctions: "Exclusive auctions",
    details_view: "View details",
    place_bid: "Place bid",
    secure_now: "Secure now",
    to_dashboard: "To dashboard",
    open_document: "Open document",
    collection_view: "View collection",
    categories: "Categories",
    sorting: "Sorting",
    newest: "Newest",
    popularity: "Popularity",
    price: "Price",
    countdown: "Countdown",
    my_vault: "My vault",
    my_pieces: "My pieces",
    documents: "Documents",
    contact: "Contact",
    name: "Name",
    inquiry: "Inquiry",
    send: "Send",
    email: "Email",
    password: "Password",
    sign_in: "Sign in",
    status_closed: "Closed",
    jewelry: "Jewelry",
    certificates: "Certificates",
    contracts: "Contracts",
    transactions: "Transactions",
    language: "Language",
  },
  it: {
    marketplace: "Mercato",
    collections: "Collezioni",
    auctions: "Aste",
    gallery: "Galleria",
    drops: "Drops",
    vault: "Caveau",
    login: "Accesso",
    product_view: "Vedi prodotto",
    back: "Indietro",
    send_inquiry: "Invia richiesta",
    back_to_auctions: "Torna alle aste",
    exclusive_auctions: "Aste esclusive",
    details_view: "Vedi dettagli",
    place_bid: "Fai offerta",
    secure_now: "Acquista ora",
    to_dashboard: "Vai alla dashboard",
    open_document: "Apri documento",
    collection_view: "Vedi collezione",
    categories: "Categorie",
    sorting: "Ordinamento",
    newest: "Più recenti",
    popularity: "Popolarita",
    price: "Prezzo",
    countdown: "Countdown",
    my_vault: "Il mio caveau",
    my_pieces: "I miei pezzi",
    documents: "Documenti",
    contact: "Contatto",
    name: "Nome",
    inquiry: "Richiesta",
    send: "Invia",
    email: "Email",
    password: "Password",
    sign_in: "Accedi",
    status_closed: "Chiusa",
    jewelry: "Gioielli",
    certificates: "Certificati",
    contracts: "Contratti",
    transactions: "Transazioni",
    language: "Lingua",
  },
  fr: { marketplace: "Marche", collections: "Collections", auctions: "Encheres", gallery: "Galerie", drops: "Drops", vault: "Coffre", login: "Connexion", product_view: "Voir le produit", back: "Retour", send_inquiry: "Envoyer demande", back_to_auctions: "Retour aux encheres", exclusive_auctions: "Encheres exclusives", details_view: "Voir details", place_bid: "Encherir", secure_now: "Reserver maintenant", to_dashboard: "Vers dashboard", open_document: "Ouvrir document", collection_view: "Voir collection", categories: "Categories", sorting: "Tri", newest: "Plus recents", popularity: "Popularite", price: "Prix", countdown: "Compte a rebours", my_vault: "Mon coffre", my_pieces: "Mes pieces", documents: "Documents", contact: "Contact", name: "Nom", inquiry: "Demande", send: "Envoyer", email: "Email", password: "Mot de passe", sign_in: "Se connecter", status_closed: "Fermee", jewelry: "Bijoux", certificates: "Certificats", contracts: "Contrats", transactions: "Transactions", language: "Langue" },
  es: { marketplace: "Mercado", collections: "Colecciones", auctions: "Subastas", gallery: "Galeria", drops: "Drops", vault: "Boveda", login: "Login", product_view: "Ver producto", back: "Atras", send_inquiry: "Enviar consulta", back_to_auctions: "Volver a subastas", exclusive_auctions: "Subastas exclusivas", details_view: "Ver detalles", place_bid: "Hacer puja", secure_now: "Asegurar ahora", to_dashboard: "Al dashboard", open_document: "Abrir documento", collection_view: "Ver coleccion", categories: "Categorias", sorting: "Ordenar", newest: "Novedades", popularity: "Popularidad", price: "Precio", countdown: "Cuenta regresiva", my_vault: "Mi boveda", my_pieces: "Mis piezas", documents: "Documentos", contact: "Contacto", name: "Nombre", inquiry: "Consulta", send: "Enviar", email: "Email", password: "Contrasena", sign_in: "Entrar", status_closed: "Cerrada", jewelry: "Joyeria", certificates: "Certificados", contracts: "Contratos", transactions: "Transacciones", language: "Idioma" },
  pt: { marketplace: "Marketplace", collections: "Colecoes", auctions: "Leiloes", gallery: "Galeria", drops: "Drops", vault: "Cofre", login: "Login", product_view: "Ver produto", back: "Voltar", send_inquiry: "Enviar consulta", back_to_auctions: "Voltar aos leiloes", exclusive_auctions: "Leiloes exclusivos", details_view: "Ver detalhes", place_bid: "Fazer lance", secure_now: "Garantir agora", to_dashboard: "Para dashboard", open_document: "Abrir documento", collection_view: "Ver colecao", categories: "Categorias", sorting: "Ordenacao", newest: "Mais recentes", popularity: "Popularidade", price: "Preco", countdown: "Contagem", my_vault: "Meu cofre", my_pieces: "Minhas pecas", documents: "Documentos", contact: "Contato", name: "Nome", inquiry: "Consulta", send: "Enviar", email: "Email", password: "Senha", sign_in: "Entrar", status_closed: "Encerrado", jewelry: "Joias", certificates: "Certificados", contracts: "Contratos", transactions: "Transacoes", language: "Idioma" },
  ar: { marketplace: "المتجر", collections: "المجموعات", auctions: "المزادات", gallery: "المعرض", drops: "الإصدارات", vault: "الخزنة", login: "تسجيل الدخول", product_view: "عرض المنتج", back: "رجوع", send_inquiry: "إرسال طلب", back_to_auctions: "العودة للمزادات", exclusive_auctions: "مزادات حصرية", details_view: "عرض التفاصيل", place_bid: "تقديم عرض", secure_now: "احجز الآن", to_dashboard: "إلى لوحة التحكم", open_document: "فتح المستند", collection_view: "عرض المجموعة", categories: "الفئات", sorting: "الترتيب", newest: "الأحدث", popularity: "الأكثر شعبية", price: "السعر", countdown: "العد التنازلي", my_vault: "خزنتي", my_pieces: "قطعي", documents: "المستندات", contact: "تواصل", name: "الاسم", inquiry: "الاستفسار", send: "إرسال", email: "البريد الإلكتروني", password: "كلمة المرور", sign_in: "دخول", status_closed: "مغلق", jewelry: "المجوهرات", certificates: "الشهادات", contracts: "العقود", transactions: "المعاملات", language: "اللغة" },
};

const LANG_LABELS: Record<Lang, string> = { de: "DE", en: "EN", it: "IT", fr: "FR", es: "ES", pt: "PT", ar: "AR" };

function pickLang(raw: string): Lang {
  const x = (raw || "de").toLowerCase().slice(0, 2) as Lang;
  return (LANGS as readonly string[]).includes(x) ? x : "de";
}

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
    image: "[IMAGE_PRODUCT]",
    collection: "heritage",
  },
  {
    id: 2,
    title: "Imperial Sapphire Cuff",
    material: "White Gold · Sapphire · Diamond",
    description: "Markante Cuff-Silhouette mit royalblauen Saphiren und archivierter Fassung.",
    image: "[IMAGE_PRODUCT]",
    collection: "royal",
  },
  {
    id: 3,
    title: "Lumiere Ruby Ring",
    material: "Rose Gold · Ruby · Diamond",
    description: "Statement-Ring mit leuchtendem Rubin und eleganter Halo-Architektur.",
    image: "[IMAGE_PRODUCT]",
    collection: "atelier",
  },
  {
    id: 4,
    title: "Vesper Diamond Pendant",
    material: "Platinum · Diamond",
    description: "Minimalistisches Pendant mit Fokus auf Licht, Symmetrie und Reinheit.",
    image: "[IMAGE_PRODUCT]",
    collection: "heritage",
  },
];

const AUCTIONS = [
  { id: 101, title: "Emerald Crown Suite", status: "Live", image: "[IMAGE_AUCTION]" },
  { id: 102, title: "Royal Sapphire Pair", status: "closed", image: "[IMAGE_AUCTION]" },
];

const NAV = [
  { key: "marketplace", href: "/marktplatz" },
  { key: "collections", href: "/kollektionen" },
  { key: "auctions", href: "/auktionen" },
  { key: "gallery", href: "/galerie" },
  { key: "drops", href: "/drops" },
  { key: "vault", href: "/tresor" },
  { key: "login", href: "/login" },
];

/** Raw token e.g. `[IMAGE_HERO]` → `IMAGE_HERO` für zentrierten Platzhalter-Text */
function placeholderToken(label: string): string {
  const s = label.trim();
  if (s.startsWith("[") && s.endsWith("]")) return s.slice(1, -1);
  return s;
}

function imageShell(label: string, ratio = "aspect-[16/9]") {
  const token = placeholderToken(label);
  return (
    <div
      role="img"
      aria-label={token}
      className={`relative isolate w-full min-h-[140px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 ${ratio}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-800/50 via-zinc-950 to-black" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(212,175,55,0.07),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 skeleton opacity-35" />
      <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
        <span className="max-w-full text-center font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 sm:text-[11px]">
          {token}
        </span>
      </div>
    </div>
  );
}

function SiteHeader({
  onNavigate,
  tr,
  language,
  onLanguageChange,
}: {
  onNavigate: (path: string) => void;
  tr: (k: string) => string;
  language: Lang;
  onLanguageChange: (lang: string) => void;
}) {
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
              {tr(n.key)}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 hidden sm:inline">{tr("language")}</span>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] uppercase tracking-wider"
            aria-label={tr("language")}
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

function ProductCard({ p, onNavigate, tr }: { p: Product; onNavigate: (path: string) => void; tr: (k: string) => string }) {
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
          {tr("product_view")}
        </button>
      </div>
    </article>
  );
}

function Shell({
  children,
  onNavigate,
  tr,
  language,
  onLanguageChange,
}: {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
  tr: (k: string) => string;
  language: Lang;
  onLanguageChange: (lang: string) => void;
}) {
  return (
    <div className="min-h-screen bg-[#070707] text-zinc-100">
      <SiteHeader onNavigate={onNavigate} tr={tr} language={language} onLanguageChange={onLanguageChange} />
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

export function LuxuryPublicSite({ pathname, language, onLanguageChange, onNavigate }: Props) {
  const L = pickLang(language);
  const tr = (k: string) => I18N[L][k] || I18N.en[k] || k;
  const productIdMatch = pathname.match(/^\/produkt\/(\d+)$/);
  const auctionIdMatch = pathname.match(/^\/auktion\/(\d+)$/);
  const collectionMatch = pathname.match(/^\/kollektion\/([^/]+)$/);

  if (pathname === "/login") {
    return (
      <div className="min-h-screen bg-[#070707] text-zinc-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8 space-y-6">
          <h1 className="font-serif italic text-3xl">{tr("login")}</h1>
          <input className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3" placeholder={tr("email")} />
          <input type="password" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3" placeholder={tr("password")} />
          <button
            onClick={() => onNavigate("/dashboard")}
            className="w-full rounded-full py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500"
          >
            {tr("sign_in")}
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
              {tr("my_vault")}
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[tr("my_vault"), tr("my_pieces"), tr("documents")].map((x) => (
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
      <Shell onNavigate={onNavigate} tr={tr} language={L} onLanguageChange={onLanguageChange}>
        <h1 className="font-serif italic text-4xl">{tr("contact")}</h1>
        <div className="max-w-2xl space-y-4">
          <input className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3" placeholder={tr("name")} />
          <textarea className="w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3 min-h-40" placeholder={tr("inquiry")} />
          <button className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
            {tr("send")}
          </button>
        </div>
      </Shell>
    );
  }

  if (productIdMatch) {
    const id = Number(productIdMatch[1]);
    const p = PRODUCTS.find((x) => x.id === id) ?? PRODUCTS[0];
    return (
      <Shell onNavigate={onNavigate} tr={tr} language={L} onLanguageChange={onLanguageChange}>
        <button onClick={() => onNavigate("/marktplatz")} className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-300 text-xs uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> {tr("back")}
        </button>
        <section className="grid lg:grid-cols-2 gap-10">
          {imageShell(p.image, "aspect-[4/5]")}
          <div className="space-y-5">
            <h1 className="font-serif italic text-5xl">{p.title}</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{p.material}</p>
            <p className="text-zinc-300 leading-relaxed">{p.description}</p>
            <div className="flex flex-wrap gap-3 pt-4">
              <button onClick={() => onNavigate("/kontakt")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
                {tr("send_inquiry")}
              </button>
              <button onClick={() => onNavigate("/marktplatz")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] border border-zinc-700">
                {tr("back")}
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
      <Shell onNavigate={onNavigate} tr={tr} language={L} onLanguageChange={onLanguageChange}>
        <h1 className="font-serif italic text-5xl capitalize">{tr("collections")} {name}</h1>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {(set.length ? set : PRODUCTS).map((p) => (
            <ProductCard key={p.id} p={p} onNavigate={onNavigate} tr={tr} />
          ))}
        </div>
      </Shell>
    );
  }

  if (auctionIdMatch) {
    const id = Number(auctionIdMatch[1]);
    const item = AUCTIONS.find((a) => a.id === id) ?? AUCTIONS[0];
    return (
      <Shell onNavigate={onNavigate} tr={tr} language={L} onLanguageChange={onLanguageChange}>
        <h1 className="font-serif italic text-5xl">{item.title}</h1>
        {imageShell(item.image)}
        <div className="flex gap-3">
          <button onClick={() => onNavigate("/login")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
            {tr("place_bid")}
          </button>
          <button onClick={() => onNavigate("/auktionen")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] border border-zinc-700">
            {tr("back_to_auctions")}
          </button>
        </div>
      </Shell>
    );
  }

  if (pathname === "/kollektionen") {
    return (
      <Shell onNavigate={onNavigate} tr={tr} language={L} onLanguageChange={onLanguageChange}>
        <h1 className="font-serif italic text-5xl">{tr("collections")}</h1>
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
      <Shell onNavigate={onNavigate} tr={tr} language={L} onLanguageChange={onLanguageChange}>
        <h1 className="font-serif italic text-5xl">{tr("exclusive_auctions")}</h1>
        {imageShell("[IMAGE_AUCTION]")}
        <div className="grid md:grid-cols-2 gap-6">
          {AUCTIONS.map((a) => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{a.status === "closed" ? tr("status_closed") : "Live"}</p>
              <h3 className="font-serif italic text-2xl">{a.title}</h3>
              <div className="flex gap-2">
                <button onClick={() => onNavigate(`/auktion/${a.id}`)} className="rounded-full px-4 py-2 text-[11px] uppercase tracking-widest border border-zinc-700">{tr("details_view")}</button>
                <button onClick={() => onNavigate("/login")} className="rounded-full px-4 py-2 text-[11px] uppercase tracking-widest text-black bg-gradient-to-r from-amber-300 to-amber-500">{tr("place_bid")}</button>
              </div>
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  if (pathname === "/galerie") {
    return (
      <Shell onNavigate={onNavigate} tr={tr} language={L} onLanguageChange={onLanguageChange}>
        <h1 className="font-serif italic text-5xl">{tr("gallery")}</h1>
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
      <Shell onNavigate={onNavigate} tr={tr} language={L} onLanguageChange={onLanguageChange}>
        <h1 className="font-serif italic text-5xl">{tr("drops")}</h1>
        {imageShell("[IMAGE_DROP]")}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-zinc-300">
            <Clock3 className="w-5 h-5 text-amber-400" />
            <p className="text-sm uppercase tracking-[0.2em]">{tr("countdown")}: 03 : 14 : 28 : 51</p>
          </div>
          <button onClick={() => onNavigate("/login")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
            {tr("secure_now")}
          </button>
        </div>
      </Shell>
    );
  }

  if (pathname === "/tresor") {
    return (
      <Shell onNavigate={onNavigate} tr={tr} language={L} onLanguageChange={onLanguageChange}>
        <h1 className="font-serif italic text-5xl">{tr("vault")}</h1>
        {imageShell("[IMAGE_TRESOR]")}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { title: tr("jewelry"), icon: Diamond },
            { title: tr("certificates"), icon: ShieldCheck },
            { title: tr("contracts"), icon: FileText },
            { title: tr("transactions"), icon: Wallet },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <s.icon className="w-5 h-5 text-amber-400 mb-3" />
              <p className="font-serif italic text-2xl">{s.title}</p>
              <button className="mt-4 rounded-full px-4 py-2 text-[11px] uppercase tracking-widest border border-zinc-700">
                {tr("open_document")}
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate("/dashboard")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
          {tr("to_dashboard")}
        </button>
      </Shell>
    );
  }

  // Default + /marktplatz
  return (
    <Shell onNavigate={onNavigate} tr={tr} language={L} onLanguageChange={onLanguageChange}>
      <section className="space-y-6">
        {imageShell("[IMAGE_HERO]")}
        <h1 className="font-serif italic text-6xl">{tr("marketplace")}</h1>
        <button onClick={() => onNavigate("/kollektionen")} className="rounded-full px-6 py-3 text-xs uppercase tracking-[0.2em] text-black bg-gradient-to-r from-amber-300 to-amber-500">
          {tr("collection_view")}
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-5 flex flex-wrap gap-3 items-center">
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{tr("categories")}</span>
        {["Ringe", "Colliers", "Ohrringe", "Bespoke"].map((x) => (
          <button key={x} className="rounded-full px-3 py-1.5 text-[11px] uppercase tracking-widest border border-zinc-700 text-zinc-300">{x}</button>
        ))}
        <span className="ml-auto text-xs uppercase tracking-[0.2em] text-zinc-500">{tr("sorting")}</span>
        <select className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs">
          <option>{tr("newest")}</option>
          <option>{tr("popularity")}</option>
          <option>{tr("price")}</option>
        </select>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} p={p} onNavigate={onNavigate} tr={tr} />
        ))}
      </section>
    </Shell>
  );
}

