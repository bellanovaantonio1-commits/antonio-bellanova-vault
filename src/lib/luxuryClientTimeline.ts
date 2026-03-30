/** Luxury dashboard timeline: filters, dedupe, human labels, progress — no ALL CAPS. */

export type TimelineStatus = 'pending' | 'active' | 'completed';

export interface TimelineRow {
  id: number;
  event_type: string;
  description?: string | null;
  reference_id?: string | null;
  created_at: string;
  /** From DB when present; overrides inferred status from event_type */
  status?: string | null;
}

export interface LuxuryTimelineEntry {
  id: number;
  created_at: string;
  status: TimelineStatus;
  title: string;
  detail: string | null;
  priority: number;
}

export interface LuxuryTimelinePresentation {
  currentTitle: string;
  currentSubtitle: string | null;
  nextStep: string | null;
  progressSteps: [string, string, string, string];
  progressActiveIndex: number;
  /** Full completed history (newest first), for expandable list */
  completedHistory: LuxuryTimelineEntry[];
  /** How many completed rows are hidden when collapsed */
  pastHiddenCount: number;
  historyCollapsedDefault: boolean;
  /** Next payment from payment_schedule (deal rooms), if any */
  paymentHint: string | null;
  /** Pending + active rows for the minimal rail (max 5), status-sorted */
  openAndActiveEntries: LuxuryTimelineEntry[];
}

export interface PaymentNextHint {
  amount: number;
  due_date: string | null;
  project_title?: string | null;
  deal_id: number;
}

const TITLE_IT: Record<string, string> = {
  contract_signed: 'Contratto firmato',
  production_started: 'Produzione in corso',
  payment_schedule_created: 'Piano di pagamento concordato',
  deal_room_created: 'Commessa creata',
  deal_room_opened: 'Sala privata aperta',
  collector_room_assigned: 'Collector room assegnata',
  deal_offer_submitted: 'Offerta inviata',
  deal_offer_accepted: 'Offerta accettata',
  deal_offer_rejected: 'Offerta rifiutata',
  deal_offer_countered: 'Controfferta ricevuta',
  offer_accepted: 'Offerta accettata',
  offer_declined: 'Offerta rifiutata',
  approval_requested: 'Approvazione richiesta',
  client_approval_resolved: 'Approvazione completata',
};

const TITLE_FR: Record<string, string> = {
  contract_signed: 'Contrat signé',
  production_started: 'Production en cours',
  payment_schedule_created: 'Échéancier convenu',
  deal_room_created: 'Commande créée',
  deal_room_opened: 'Espace privé ouvert',
  collector_room_assigned: 'Espace collectionneur attribué',
  deal_offer_submitted: 'Offre soumise',
  deal_offer_accepted: 'Offre acceptée',
  deal_offer_rejected: 'Offre refusée',
  deal_offer_countered: 'Contre-offre reçue',
  offer_accepted: 'Offre acceptée',
  offer_declined: 'Offre refusée',
  approval_requested: 'Approbation requise',
  client_approval_resolved: 'Approbation traitée',
};

const TITLE_DE: Record<string, string> = {
  contract_signed: 'Vertrag unterzeichnet',
  production_started: 'Fertigung läuft',
  payment_schedule_created: 'Zahlungsplan vereinbart',
  deal_room_created: 'Auftrag angelegt',
  deal_room_opened: 'Exklusiver Raum geöffnet',
  collector_room_assigned: 'Privater Sammlerraum zugewiesen',
  deal_offer_submitted: 'Angebot eingereicht',
  deal_offer_accepted: 'Angebot angenommen',
  deal_offer_rejected: 'Angebot abgelehnt',
  deal_offer_countered: 'Gegenangebot liegt vor',
  offer_accepted: 'Angebot angenommen',
  offer_declined: 'Angebot abgelehnt',
  approval_requested: 'Freigabe erforderlich',
  client_approval_resolved: 'Freigabe bearbeitet',
};

const TITLE_EN: Record<string, string> = {
  contract_signed: 'Contract signed',
  production_started: 'Production in progress',
  payment_schedule_created: 'Payment plan agreed',
  deal_room_created: 'Commission created',
  deal_room_opened: 'Private room opened',
  collector_room_assigned: 'Collector room assigned',
  deal_offer_submitted: 'Offer submitted',
  deal_offer_accepted: 'Offer accepted',
  deal_offer_rejected: 'Offer declined',
  deal_offer_countered: 'Counter-offer received',
  offer_accepted: 'Offer accepted',
  offer_declined: 'Offer declined',
  approval_requested: 'Approval requested',
  client_approval_resolved: 'Approval completed',
};

function normType(et: string): string {
  return String(et || '').toLowerCase().trim();
}

export function inferTimelineStatus(eventType: string): TimelineStatus {
  const e = normType(eventType);
  if (e.includes('counter')) return 'pending';
  if (e.includes('approval_requested')) return 'pending';
  if (e.includes('submitted')) return 'active';
  if (e.includes('payment_schedule')) return 'active';
  if (e.includes('production_started')) return 'active';
  if (e.includes('deal_room') || e.includes('collector_room')) return 'active';
  if (e.includes('client_approval_resolved')) return 'completed';
  if (
    e.includes('signed') ||
    e.includes('accepted') ||
    e.includes('rejected') ||
    e.includes('declined')
  ) {
    return 'completed';
  }
  return 'completed';
}

export function rowTimelineStatus(row: TimelineRow): TimelineStatus {
  const s = String(row.status || '').toLowerCase().trim();
  if (s === 'pending' || s === 'active' || s === 'completed') return s;
  return inferTimelineStatus(row.event_type);
}

function priorityFor(eventType: string, status: TimelineStatus): number {
  const e = normType(eventType);
  if (status === 'pending') {
    if (e.includes('counter')) return 5;
    if (e.includes('approval_requested')) return 12;
    return 15;
  }
  if (status === 'active') {
    if (e.includes('production')) return 25;
    if (e.includes('payment_schedule')) return 35;
    if (e.includes('submitted')) return 40;
    if (e.includes('deal_room') || e.includes('collector')) return 45;
    return 50;
  }
  return 100;
}

function humanTitle(eventType: string, lang: string): string {
  const e = normType(eventType);
  const map =
    lang === 'de' ? TITLE_DE : lang === 'it' ? TITLE_IT : lang === 'fr' ? TITLE_FR : TITLE_EN;
  if (map[e]) return map[e];
  const raw = eventType.replace(/_/g, ' ').trim();
  if (!raw) return lang === 'de' ? 'Ereignis' : lang === 'it' ? 'Aggiornamento' : lang === 'fr' ? 'Mise à jour' : 'Update';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Hide noisy payment line; keep short hint in timeline row via title only. */
function sanitizeDetail(description: string | null | undefined, eventType: string, lang: string): string | null {
  const d = (description || '').trim();
  if (!d) return null;
  const low = d.toLowerCase();
  if (low.includes('payment schedule') || low.includes('deposit €') || low.includes('balance €')) {
    return lang === 'de' ? 'Anzahlung und Restzahlung sind im Plan vereinbart.' : 'Deposit and balance are set out in your plan.';
  }
  if (low.includes('production status:')) {
    return lang === 'de' ? 'Reservierung für die Fertigung.' : 'Reserved for production.';
  }
  if (d.length > 160) return `${d.slice(0, 157)}…`;
  return d;
}

export function dedupeTimelineRows(rows: TimelineRow[]): TimelineRow[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const seen = new Set<string>();
  const out: TimelineRow[] = [];
  for (const r of sorted) {
    const k = `${normType(r.event_type)}|${r.reference_id ?? ''}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function sortForFocus(a: LuxuryTimelineEntry, b: LuxuryTimelineEntry): number {
  const rank = (s: TimelineStatus) => (s === 'pending' ? 0 : s === 'active' ? 1 : 2);
  const ra = rank(a.status);
  const rb = rank(b.status);
  if (ra !== rb) return ra - rb;
  if (a.priority !== b.priority) return a.priority - b.priority;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function progressIndex(rows: TimelineRow[]): number {
  const types = rows.map((r) => normType(r.event_type));
  const signed = types.some((t) => t.includes('contract_signed'));
  const production = types.some((t) => t.includes('production_started'));
  let idx = 0;
  if (signed) idx = Math.max(idx, 1);
  if (production) idx = Math.max(idx, 2);
  if (signed && production) idx = Math.max(idx, 3);
  return idx;
}

function formatPaymentHint(p: PaymentNextHint, lang: string): string {
  const loc = lang === 'de' ? 'de-DE' : lang === 'it' ? 'it-IT' : lang === 'fr' ? 'fr-FR' : 'en-GB';
  const amt = Number(p.amount || 0).toLocaleString(loc);
  const due = p.due_date
    ? new Date(p.due_date).toLocaleDateString(loc)
    : null;
  const proj = p.project_title ? String(p.project_title) : '';
  if (lang === 'de') {
    return `Nächste Zahlung: ${amt} €${due ? ` · fällig ${due}` : ''}${proj ? ` · ${proj}` : ''}`;
  }
  if (lang === 'it') {
    return `Prossimo pagamento: ${amt} €${due ? ` · entro il ${due}` : ''}${proj ? ` · ${proj}` : ''}`;
  }
  if (lang === 'fr') {
    return `Prochain paiement : ${amt} €${due ? ` · échéance ${due}` : ''}${proj ? ` · ${proj}` : ''}`;
  }
  return `Next payment: €${amt}${due ? ` · due ${due}` : ''}${proj ? ` · ${proj}` : ''}`;
}

function progressStepsForLang(lang: string): [string, string, string, string] {
  if (lang === 'de') {
    return ['Entwurf & Vereinbarung', 'Fertigung', 'Fertigstellung', 'Übergabe'];
  }
  if (lang === 'it') {
    return ['Progetto & accordo', 'Produzione', 'Finitura', 'Consegna'];
  }
  if (lang === 'fr') {
    return ['Projet & accord', 'Production', 'Finition', 'Remise'];
  }
  return ['Design & agreement', 'Production', 'Finishing', 'Delivery'];
}

export function buildLuxuryTimelinePresentation(
  rows: TimelineRow[],
  lang: string,
  paymentNext?: PaymentNextHint | null,
): LuxuryTimelinePresentation | null {
  if (!rows?.length && !paymentNext) return null;

  const deduped = rows?.length ? dedupeTimelineRows(rows) : [];
  const normalized: LuxuryTimelineEntry[] = deduped.map((r) => {
    const status = rowTimelineStatus(r);
    return {
      id: r.id,
      created_at: r.created_at,
      status,
      title: humanTitle(r.event_type, lang),
      detail: sanitizeDetail(r.description ?? null, r.event_type, lang),
      priority: priorityFor(r.event_type, status),
    };
  });

  const pending = normalized.filter((x) => x.status === 'pending');
  const active = normalized.filter((x) => x.status === 'active');
  const completed = normalized.filter((x) => x.status === 'completed');

  const focusPool = [...pending, ...active].sort(sortForFocus);
  const top = focusPool[0];
  const second = focusPool[1];

  const progressSteps = progressStepsForLang(lang);

  const progressActiveIndex = progressIndex(deduped);

  const paymentHint = paymentNext ? formatPaymentHint(paymentNext, lang) : null;

  let currentTitle: string;
  let currentSubtitle: string | null = null;
  let nextStep: string | null = null;

  if (top) {
    currentTitle = top.title;
    currentSubtitle = top.detail;
    if (second) {
      nextStep =
        lang === 'de'
          ? `Als Nächstes: ${second.title.toLowerCase()}`
          : lang === 'it'
            ? `Prossimo: ${second.title.charAt(0).toLowerCase() + second.title.slice(1)}`
            : lang === 'fr'
              ? `Ensuite : ${second.title.charAt(0).toLowerCase() + second.title.slice(1)}`
              : `Next: ${second.title.charAt(0).toLowerCase() + second.title.slice(1)}`;
    }
  } else if (paymentNext) {
    currentTitle =
      lang === 'de'
        ? 'Zahlung ausstehend'
        : lang === 'it'
          ? 'Pagamento in sospeso'
          : lang === 'fr'
            ? 'Paiement en attente'
            : 'Payment pending';
    currentSubtitle = paymentHint;
  } else {
    const latestDone = completed.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
    currentTitle =
      lang === 'de'
        ? 'Alle aktuellen Schritte sind abgeschlossen'
        : lang === 'it'
          ? 'Tutti i passaggi attuali sono completati'
          : lang === 'fr'
            ? 'Toutes les étapes en cours sont terminées'
            : 'All current steps are complete';
    currentSubtitle = latestDone ? latestDone.title : null;
  }

  if (!nextStep && top) {
    if (top.status === 'pending') {
      nextStep =
        lang === 'de'
          ? 'Freigabe oder Antwort durch Sie erforderlich'
          : lang === 'it'
            ? 'È richiesta la sua conferma o risposta'
            : lang === 'fr'
              ? 'Votre validation ou réponse est requise'
              : 'Your acknowledgement or reply is needed';
    } else if (
      normType(
        deduped.find((r) => rowTimelineStatus(r) === 'active')?.event_type || '',
      ).includes('production')
    ) {
      nextStep =
        lang === 'de'
          ? 'Wir halten Sie über den Fortgang auf dem Laufenden.'
          : lang === 'it'
            ? 'La terremo informata sugli avanzamenti.'
            : lang === 'fr'
              ? 'Nous vous tiendrons informé(e) de l’avancement.'
              : 'We will keep you informed as work progresses.';
    } else if (pending.length === 0 && active.length > 0) {
      nextStep =
        lang === 'de'
          ? 'Nächste Zahlung oder Formalität gemäß Ihrem Plan'
          : lang === 'it'
            ? 'Prossimo pagamento o formalità secondo il suo piano'
            : lang === 'fr'
              ? 'Prochain paiement ou formalité selon votre planning'
              : 'Next payment or formality per your plan';
    }
  }

  const completedHistory = completed.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const COLLAPSED_MAX = 4;
  const pastHiddenCount = Math.max(0, completedHistory.length - COLLAPSED_MAX);

  const sortedOpenActive = [...pending, ...active].sort(sortForFocus);
  const openAndActiveEntries = top
    ? sortedOpenActive.filter((e) => e.id !== top.id).slice(0, 5)
    : sortedOpenActive.slice(0, 5);

  return {
    currentTitle,
    currentSubtitle,
    nextStep,
    progressSteps,
    progressActiveIndex,
    completedHistory,
    pastHiddenCount,
    historyCollapsedDefault: pastHiddenCount > 0,
    paymentHint,
    openAndActiveEntries,
  };
}
