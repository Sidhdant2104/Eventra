"use client";

import { useRouter } from "next/navigation";
import { updateUserRole } from "@/lib/actions/users";

const roles = ["SUPER_ADMIN", "CLUB_ADMIN", "EVENT_MANAGER", "VOLUNTEER", "STUDENT"] as const;

export function RoleSelect({ userId, role, disabled }: { userId: string; role: string; disabled?: boolean }) {
  const router = useRouter();
  return (
    <select
      aria-label="Platform role"
      disabled={disabled}
      className="rounded-full border border-line bg-white px-2 py-1 text-xs"
      value={role}
      onChange={async (event) => {
        await updateUserRole(userId, event.target.value as (typeof roles)[number]);
        router.refresh();
      }}
    >
      {roles.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ").toLowerCase()}</option>)}
    </select>
  );
}
