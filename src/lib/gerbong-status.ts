export function getGerbongStatus(gerbong: {
  totalKasus?: number | null;
  belum?: number | null;
  proses?: number | null;
  selesai?: number | null;
}) {
  const total = gerbong.totalKasus ?? 0;

  if (total === 0) return "tak ada masalah";
  if ((gerbong.belum ?? 0) > 0) return "pending";
  if ((gerbong.proses ?? 0) > 0) return "on progress";

  // if there are cases and all are selesai
  return "completed";
}

export function getGerbongStatusColor(status: string) {
  switch (status) {
    case "tak ada masalah":
      return "text-emerald-600 bg-emerald-100";
    case "pending":
      return "text-rose-600 bg-rose-100";
    case "on progress":
      return "text-amber-600 bg-amber-100";
    case "completed":
      return "text-blue-600 bg-blue-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}
