import { formatDay } from "@/lib/format";

export function CertificateArt({
  publicId,
  recipient,
  eventName,
  clubName,
  typeLabel,
  issuedAt,
  revoked,
  backgroundUrl,
  config,
}: {
  publicId: string;
  recipient: string;
  eventName: string;
  clubName: string;
  typeLabel: string;
  issuedAt: Date;
  revoked?: boolean;
  backgroundUrl?: string | null;
  config?: { nameY?: number; metaY?: number; accent?: string } | null;
}) {
  const nameY = config?.nameY ?? 46;
  const metaY = config?.metaY ?? 62;
  const accent = config?.accent ?? "#ff3d1f";
  return (
    <article id="certificate" className="relative mx-auto aspect-[1.414/1] w-full max-w-4xl overflow-hidden bg-white text-ink shadow-2xl print:shadow-none">
      {backgroundUrl ? <img src={backgroundUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#d9e0ff,transparent_28%),linear-gradient(#fffcf7,#f4f1ea)]" />
      )}
      <div className="absolute inset-3 rounded-[1.2rem] border border-ink/15" />
      <div className="absolute inset-5 rounded-[1rem] border" style={{ borderColor: accent }} />
      <div className="relative flex h-full flex-col items-center px-8 text-center">
        <p className="mt-[10%] text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: accent }}>NMIET One</p>
        <h1 className="mt-3 font-display text-4xl sm:text-6xl">{typeLabel}</h1>
        <p className="mt-4 text-sm text-muted">This certificate is presented to</p>
        <p className="absolute left-0 right-0 font-display text-4xl sm:text-6xl" style={{ top: `${nameY}%` }}>{recipient}</p>
        <div className="absolute left-0 right-0 px-10" style={{ top: `${metaY}%` }}>
          <p className="text-sm text-muted">for {typeLabel.toLowerCase()} at</p>
          <p className="mt-1 text-2xl font-semibold">{eventName}</p>
          <p className="mt-2 text-sm text-muted">{clubName} · Issued {formatDay(issuedAt)}</p>
        </div>
        <div className="absolute bottom-[9%] left-0 right-0 flex items-end justify-between px-12 text-xs">
          <div>
            <p className="font-semibold">{clubName}</p>
            <p className="text-muted">Organizer</p>
          </div>
          <div>
            <p className="font-semibold">{publicId}</p>
            <p className="text-muted">{revoked ? "Revoked" : "Verify at /verify"}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function certificateLabel(type: string, custom?: string | null) {
  switch (type) {
    case "PARTICIPATION":
      return "Certificate of Participation";
    case "WINNER":
      return "Winner Certificate";
    case "RUNNER_UP":
      return "Runner-up Certificate";
    case "VOLUNTEER":
      return "Volunteer Certificate";
    default:
      return custom || "Certificate";
  }
}
