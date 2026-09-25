"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StatusSelect } from "@/components/status-select";
import { Avatar } from "@/components/ui";
import { bulkUpdateRegistrationStatus } from "@/lib/actions/registration";

export type RegistrationRow = {
  key: string;
  registrationId: string;
  name: string;
  email: string;
  code: string;
  department: string;
  year: string;
  team: string;
  status: string;
  attendance: string;
  registeredAt: string;
};

export function RegistrationTable({ eventId, rows }: { eventId: string; rows: RegistrationRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState("CONFIRMED");
  const [pending, startTransition] = useTransition();
  const all = rows.length > 0 && rows.every((row) => selected.includes(row.registrationId));

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div>
      {selected.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 bg-ink px-3 py-2 text-sm text-white">
          <span>{selected.length} selected</span>
          <select aria-label="Bulk status" className="h-8 border border-white/20 bg-transparent px-2" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="CONFIRMED">Confirmed</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="ATTENDED">Attended</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            type="button"
            className="bg-white px-3 py-1 text-ink"
            disabled={pending}
            onClick={() => startTransition(async () => {
              await bulkUpdateRegistrationStatus(eventId, selected, status as "CONFIRMED" | "WAITLISTED" | "CANCELLED" | "ATTENDED");
              setSelected([]);
              router.refresh();
            })}
          >
            Apply
          </button>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="sticky top-0 bg-[#f6f6f4] text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="w-10 px-3 py-3 font-medium">
                <input type="checkbox" aria-label="Select all on this page" checked={all} onChange={() => setSelected(all ? [] : [...new Set(rows.map((row) => row.registrationId))])} />
              </th>
              <th className="py-3 font-medium">Participant</th>
              <th className="py-3 font-medium">Registration</th>
              <th className="py-3 font-medium">Department</th>
              <th className="py-3 font-medium">Year</th>
              <th className="py-3 font-medium">Team</th>
              <th className="py-3 font-medium">Status</th>
              <th className="py-3 font-medium">Attendance</th>
              <th className="py-3 pr-3 font-medium">Registered</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-line transition hover:bg-white">
                <td className="px-3 py-3">
                  <input type="checkbox" aria-label={`Select ${row.name}`} checked={selected.includes(row.registrationId)} onChange={() => toggle(row.registrationId)} />
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} />
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted">{row.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3">{row.code}</td>
                <td className="py-3">{row.department}</td>
                <td className="py-3">{row.year}</td>
                <td className="py-3">{row.team}</td>
                <td className="py-3"><StatusSelect eventId={eventId} registrationId={row.registrationId} status={row.status} /></td>
                <td className="py-3">{row.attendance}</td>
                <td className="py-3 pr-3 text-muted">{row.registeredAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
