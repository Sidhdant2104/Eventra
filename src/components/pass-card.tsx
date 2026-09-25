import QRCode from "qrcode";
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
}: {
  token: string;
  eventName: string;
  studentName: string;
  teamName?: string | null;
  code: string;
  when: Date;
  status: string;
  venue?: string | null;
}) {
  const dataUrl = await QRCode.toDataURL(`${appUrl()}/passes/${token}`, {
    margin: 1,
    width: 560,
    errorCorrectionLevel: "M",
    color: { dark: "#121316", light: "#ffffff" },
  });
  return (
    <article className="mx-auto w-full max-w-[380px] overflow-hidden bg-ink text-white">
      <div className="px-6 pb-2 pt-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/50">NMIET One</p>
        <h1 className="mt-4 font-display text-5xl text-white">{eventName}</h1>
        <p className="mt-6 text-2xl font-medium tracking-[-0.03em]">{studentName}</p>
        {teamName ? <p className="mt-1 text-sm uppercase tracking-[0.16em] text-accent">{teamName}</p> : null}
      </div>
      <div className="px-6 py-5">
        <img src={dataUrl} alt={`QR pass for ${studentName}`} className="w-full bg-white p-3" />
      </div>
      <dl className="grid grid-cols-2 gap-4 border-t border-white/15 px-6 py-5 text-sm">
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
          <dd className="mt-1 font-medium tracking-[0.04em]">{code}</dd>
        </div>
        <div className="col-span-2 text-[11px] uppercase tracking-[0.16em] text-white/60">{status.replaceAll("_", " ").toLowerCase()}</div>
      </dl>
    </article>
  );
}
