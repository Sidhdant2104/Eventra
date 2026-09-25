import { addCollege, addDepartment } from "@/lib/actions/academics";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const metadata = { title: "Academics" };

export default async function AcademicsPage() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/admin");
  const colleges = await prisma.college.findMany({ include: { departments: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } });
  const years = await prisma.academicYear.findMany({ orderBy: { position: "asc" } });
  const divisions = await prisma.divisionOption.findMany({ orderBy: { position: "asc" } });
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-5xl">Academics</h1>
        <p className="mt-2 text-sm text-secondary">Colleges, departments, years, and divisions used by student profiles.</p>
      </div>
      <form action={async (formData) => { "use server"; await addCollege(String(formData.get("name") ?? "")); }} className="flex gap-2">
        <input name="name" placeholder="New college" className="h-11 flex-1 border border-line bg-surface px-3 text-sm" />
        <button className="bg-ink px-4 text-sm font-medium text-white" type="submit">Add college</button>
      </form>
      {colleges.map((college) => (
        <section key={college.id}>
          <h2 className="text-lg font-medium">{college.name}</h2>
          <ul className="mt-2 text-sm text-secondary">{college.departments.map((department) => <li key={department.id}>{department.name}</li>)}</ul>
          <form action={async (formData) => { "use server"; await addDepartment(college.id, String(formData.get("name") ?? "")); }} className="mt-3 flex gap-2">
            <input name="name" placeholder="New department" aria-label={`Department for ${college.name}`} className="h-10 flex-1 border border-line bg-surface px-3 text-sm" />
            <button className="border border-line px-3 text-sm" type="submit">Add</button>
          </form>
        </section>
      ))}
      <section>
        <h2 className="text-lg font-medium">Years</h2>
        <p className="mt-2 text-sm text-secondary">{years.map((year) => year.label).join(" · ") || "None yet"}</p>
      </section>
      <section>
        <h2 className="text-lg font-medium">Divisions</h2>
        <p className="mt-2 text-sm text-secondary">{divisions.map((division) => division.name).join(" · ") || "None yet"}</p>
      </section>
    </div>
  );
}
