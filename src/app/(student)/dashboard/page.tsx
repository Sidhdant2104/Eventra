import { redirect } from "next/navigation";
import { isProfileComplete } from "@/lib/profile-completion";
import { requireUser } from "@/lib/permissions";

export default async function DashboardRedirect() {
  const user = await requireUser();
  if (user.role === "STUDENT" && !isProfileComplete(user)) redirect("/onboarding");
  redirect("/home");
}
