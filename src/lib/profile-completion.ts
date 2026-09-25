export type ProfileShape = {
  name: string;
  image?: string | null;
  profile: {
    department: string | null;
    year: string | null;
    division: string | null;
    rollNumber: string | null;
    studentId?: string | null;
    college?: string | null;
    skills?: string | null;
    interests?: string | null;
    linkedin?: string | null;
    github?: string | null;
    portfolioUrl?: string | null;
    bio?: string | null;
  } | null;
};

export function academicReady(profile: ProfileShape["profile"]) {
  return Boolean(profile?.department && profile.year && profile.division && (profile.rollNumber || profile.studentId) && profile.college);
}

export function isProfileComplete(user: ProfileShape) {
  return Boolean(user.name.trim() && user.name.trim().toLowerCase() !== "student" && academicReady(user.profile));
}

export function profileChecklist(user: ProfileShape) {
  const profile = user.profile;
  const items = [
    { key: "basic", label: "Basic information", done: Boolean(user.name.trim() && user.name.trim().toLowerCase() !== "student") },
    { key: "academic", label: "Academic information", done: academicReady(profile) },
    { key: "skills", label: "Skills", done: Boolean(profile?.skills?.trim()) },
    { key: "photo", label: "Profile photo", done: Boolean(user.image) },
    { key: "links", label: "Social links", done: Boolean(profile?.linkedin || profile?.github || profile?.portfolioUrl) },
  ];
  const done = items.filter((item) => item.done).length;
  return { items, percent: Math.round((done / items.length) * 100), requiredDone: items[0]!.done && items[1]!.done };
}
