/**
 * Client-side gate: server flag from GET /api/consultation/enabled wins.
 * Optional: set VITE_ENABLE_CONSULTATION_FLOW=false to hide UI even if the server enables the API.
 */
export function isConsultationUiAllowed(serverEnabled: boolean): boolean {
  const v = import.meta.env.VITE_ENABLE_CONSULTATION_FLOW;
  if (v === "0" || v === "false") return false;
  return serverEnabled;
}
