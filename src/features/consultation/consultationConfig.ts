/**
 * Client-side gate (optional): set VITE_ENABLE_CONSULTATION_FLOW=false to hide consultation UI
 * even if the server enables the API. Server defaults to consultation on when env is unset.
 */
export function isConsultationUiAllowed(serverEnabled: boolean): boolean {
  const v = import.meta.env.VITE_ENABLE_CONSULTATION_FLOW;
  if (v === "0" || v === "false") return false;
  return serverEnabled;
}
