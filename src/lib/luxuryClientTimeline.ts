/** Luxury dashboard timeline: filters, dedupe, human labels, progress — no ALL CAPS. */

export type TimelineStatus = 'pending' | 'active' | 'completed';

export interface TimelineRow {
  id: number;
  event_type: string;
  description?: string | null;
  reference_id?: string | null;
  created_at: string;
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
}

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
};

function normType(et: string): string {
  return String(et || '').toLowerCase().trim();
}

export function inferTimelineStatus(eventType: string): TimelineStatus {
  const e = normType(eventType);
  if (e.includes('counter')) return 'pending';
  if (e.includes('submitted')) return 'active';
  if (e.includes('payment_schedule')) return 'active';
  if (e.includes('production_started')) return 'active';
  if (e.includes('deal_room') || e.includes('collector_room')) return 'active';
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

function priorityFor(eventType: string, status: TimelineStatus): number {
  const e = normType(eventType);
  if (status === 'pending') return e.includes('counter') ? 5 : 15;
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
  const map = lang === 'de' ? TITLE_DE : TITLE_EN;
  if (map[e]) return map[e];
  const raw = eventType.replace(/_/g, ' ').trim();
  if (!raw) return lang === 'de' ? 'Ereignis' : 'Update';
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

export function buildLuxuryTimelinePresentation(
  rows: TimelineRow[],
  lang: string,
): LuxuryTimelinePresentation | null {
  if (!rows?.length) return null;

  const deduped = dedupeTimelineRows(rows);
  const normalized: LuxuryTimelineEntry[] = deduped.map((r) => {
    const status = inferTimelineStatus(r.event_type);
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

  const progressSteps: [string, string, string, string] =
    lang === 'de'
      ? ['Entwurf & Vereinbarung', 'Fertigung', 'Fertigstellung', 'Übergabe']
      : ['Design & agreement', 'Production', 'Finishing', 'Delivery'];

  const progressActiveIndex = progressIndex(deduped);

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
          : `Next: ${second.title.charAt(0).toLowerCase() + second.title.slice(1)}`;
    }
  } else {
    const latestDone = completed.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
    currentTitle =
      lang === 'de'
        ? 'Alle aktuellen Schritte sind abgeschlossen'
        : 'All current steps are complete';
    currentSubtitle = latestDone ? latestDone.title : null;
  }

  if (!nextStep && top) {
    if (top.status === 'pending') {
      nextStep =
        lang === 'de'
          ? 'Freigabe oder Antwort durch Sie erforderlich'
          : 'Your acknowledgement or reply is needed';
    } else if (normType(deduped.find((r) => inferTimelineStatus(r.event_type) === 'active')?.event_type || '').includes('production')) {
      nextStep =
        lang === 'de'
          ? 'Wir halten Sie über den Fortgang auf dem Laufenden.'
          : 'We will keep you informed as work progresses.';
    } else if (pending.length === 0 && active.length > 0) {
      nextStep =
        lang === 'de'
          ? 'Nächste Zahlung oder Formalität gemäß Ihrem Plan'
          : 'Next payment or formality per your plan';
    }
  }

  const completedHistory = completed.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const COLLAPSED_MAX = 4;
  const pastHiddenCount = Math.max(0, completedHistory.length - COLLAPSED_MAX);

  return {
    currentTitle,
    currentSubtitle,
    nextStep,
    progressSteps,
    progressActiveIndex,
    completedHistory,
    pastHiddenCount,
    historyCollapsedDefault: pastHiddenCount > 0,
  };
}
