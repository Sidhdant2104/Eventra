"use client";

import { useRouter } from "next/navigation";
import { updateRegistrationStatus } from "@/lib/actions/registration";

export function StatusSelect({ eventId, registrationId, status }: { eventId: string; registrationId: string; status: string }) {
  const router = useRouter();
  return (
    <select
      aria-label="Registration status"
      className="border border-line bg-surface px-2 py-1 text-xs"
      value={status}
      onChange={async (event) => {
        await updateRegistrationStatus(eventId, registrationId, event.target.value as "CONFIRMED" | "WAITLISTED" | "CANCELLED" | "ATTENDED");
        router.refresh();
      }}
    >
      <option value="CONFIRMED">Confirmed</option>
      <option value="WAITLISTED">Waitlisted</option>
      <option value="ATTENDED">Attended</option>
      <option value="CANCELLED">Cancelled</option>
    </select>
  );
}
