import { Scanner } from "@/components/scanner";
import { requireEventAccess } from "@/lib/permissions";

export default async function ScannerPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  await requireEventAccess(eventId);
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-muted">Scan a pass QR. The code only contains a token, not personal details. Attendance is stored on the server, so multiple volunteers can scan the same event.</p>
      <Scanner eventId={eventId} />
    </div>
  );
}
