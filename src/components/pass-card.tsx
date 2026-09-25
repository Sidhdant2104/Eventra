import QRCode from "qrcode";
import { eventTheme } from "@/lib/event-theme";
import { formatDay } from "@/lib/format";
import { appUrl } from "@/lib/utils";

export async function PassCard({
  token,
  eventName,
  studentName,
  teamName,
  code,
  when,
  status,
  venue,
  clubName,
  category,
}: {
  token: string;
  eventName: string;
  studentName: string;
  teamName?: string | null;
  code: string;
  when: Date;
  status: string;
  venue?: string | null;
  clubName?: string | null;
  category?: string | null;
}) {
  const theme = eventTheme(category || "");
  const dataUrl = await QRCode.toDataURL(`${appUrl()}/passes/${token}`, {
    margin: 1,
    width: 640,
    errorCorrectionLevel: "M",
    color: { dark: "#121316", light: "#ffffff" },
  });
  return (
    <article className="mx-auto w-full max-w-[420px] overflow-hidden bg-[#0e0f12] text-white">
      <div className="h-1.5" style={{ background: theme.accent }} />
      <div className="px-6 pb-2 pt-6">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
          <span>NMIET One</span>
          <span>{clubName || "Campus"}</span>
        </div>
        <h1 className="mt-8 font-display text-5xl text-white">{eventName}</h1>
        <p className="mt-8 text-[1.7rem] font-medium tracking-[-0.03em]">{studentName}</p>
        {teamName ? <p className="mt-1 text-sm uppercase tracking-[0.16em]" style={{ color: theme.accent }}>{teamName}</p> : null}
      </div>
      <div className="mx-6 border-t border-dashed border-white/25" />
      <div className="px-6 py-5">
        <img src={dataUrl} alt={`QR pass for ${studentName}`} className="w-full bg-white p-3" />
      </div>
      <dl className="grid grid-cols-2 gap-4 px-6 pb-6 text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">Date</dt>
          <dd className="mt-1">{formatDay(when)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">Campus</dt>
          <dd className="mt-1">{venue || "NMIET"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">Registration</dt>
          <dd className="mt-1 font-display text-3xl tracking-normal text-white">{code}</dd>
        </div>
        <div className="col-span-2 text-[11px] uppercase tracking-[0.16em] text-white/55">{status.replaceAll("_", " ").toLowerCase()}</div>
      </dl>
    </article>
  );
}
