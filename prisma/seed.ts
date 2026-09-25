import { hash } from "bcryptjs";
import { PrismaClient, type Prisma } from "@prisma/client";
import { DEMO_PASSWORD } from "../src/lib/demo-password";
import { randomToken } from "../src/lib/crypto";

const prisma = new PrismaClient();

function section(type: string, position: number, content: Prisma.InputJsonValue) {
  return { type, position, visible: true, content };
}

async function main() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Notification",
      "Announcement",
      "Attendance",
      "Certificate",
      "CertificateTemplate",
      "QrPass",
      "RegistrationFieldResponse",
      "RegistrationParticipant",
      "Registration",
      "TeamInvitation",
      "TeamMember",
      "Team",
      "RegistrationField",
      "EventSection",
      "EventStaff",
      "Event",
      "ClubMember",
      "Club",
      "PasswordResetToken",
      "Session",
      "Account",
      "VerificationToken",
      "StudentProfile",
      "User"
    RESTART IDENTITY CASCADE
  `);

  const passwordHash = await hash(DEMO_PASSWORD, 12);
  const account = (email: string, name: string, role: "SUPER_ADMIN" | "CLUB_ADMIN" | "EVENT_MANAGER" | "VOLUNTEER" | "STUDENT", profile?: Prisma.StudentProfileCreateWithoutUserInput) =>
    prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash,
        profile: profile ? { create: { college: "NMIET", ...profile } } : role === "STUDENT" ? { create: { college: "NMIET" } } : undefined,
      },
    });

  const admin = await account("admin@nmiet.edu.in", "Ananya Kulkarni", "SUPER_ADMIN");
  const iicAdmin = await account("iic.admin@nmiet.edu.in", "Rahul Deshmukh", "CLUB_ADMIN");
  const codingAdmin = await account("coding.admin@nmiet.edu.in", "Sneha Patil", "CLUB_ADMIN");
  const ecellAdmin = await account("ecell.admin@nmiet.edu.in", "Vikram Joshi", "CLUB_ADMIN");
  const manager = await account("manager@nmiet.edu.in", "Neha Shah", "EVENT_MANAGER");
  const volunteer = await account("volunteer@nmiet.edu.in", "Arjun More", "VOLUNTEER");
  const aarav = await account("aarav@nmiet.edu.in", "Aarav Mehta", "STUDENT", { phone: "9876543210", department: "Computer Engineering", year: "TE", division: "A", rollNumber: "TECOA041", skills: "TypeScript, product design", bio: "Building campus tools and hackathon prototypes.", github: "https://github.com/aarav-mehta", linkedin: "https://www.linkedin.com/in/aarav-mehta" });
  const diya = await account("diya@nmiet.edu.in", "Diya Kulkarni", "STUDENT", { phone: "9876500011", department: "Information Technology", year: "TE", division: "B", rollNumber: "TEITB018", skills: "Python, ML", github: "https://github.com/diya-kulkarni" });
  const kabir = await account("kabir@nmiet.edu.in", "Kabir Shah", "STUDENT", { phone: "9876500022", department: "Artificial Intelligence & Data Science", year: "SE", division: "A", rollNumber: "SEAIA012", skills: "Computer vision" });
  const meera = await account("meera@nmiet.edu.in", "Meera Iyer", "STUDENT", { phone: "9876500033", department: "Computer Engineering", year: "SE", division: "C", rollNumber: "SECOC027", skills: "UI, Figma" });
  const rohan = await account("rohan@nmiet.edu.in", "Rohan Pawar", "STUDENT", { phone: "9876500044", department: "Electronics & Telecommunication", year: "BE", division: "A", rollNumber: "BEEXA009", skills: "Embedded systems" });

  const iic = await prisma.club.create({ data: { name: "IIC", slug: "iic", description: "Institution's Innovation Council. Workshops, ideation, and incubation support for NMIET builders." } });
  const coding = await prisma.club.create({ data: { name: "Coding Club", slug: "coding-club", description: "The campus home for hack nights, contests, and Technova." } });
  const ecell = await prisma.club.create({ data: { name: "E-Cell", slug: "e-cell", description: "Entrepreneurship Cell. Hackathons, founder talks, and startup weekends." } });

  await prisma.clubMember.createMany({
    data: [
      { clubId: iic.id, userId: iicAdmin.id, role: "CLUB_ADMIN" },
      { clubId: coding.id, userId: codingAdmin.id, role: "CLUB_ADMIN" },
      { clubId: ecell.id, userId: ecellAdmin.id, role: "CLUB_ADMIN" },
    ],
  });

  const technova = await prisma.event.create({
    data: {
      clubId: coding.id,
      createdById: codingAdmin.id,
      name: "Technova 2026",
      slug: "technova",
      summary: "NMIET's flagship technology festival. Two days of builds, talks, and club showcases.",
      coverImage: "/covers/technova.svg",
      startAt: new Date("2026-11-07T09:00:00+05:30"),
      endAt: new Date("2026-11-08T18:00:00+05:30"),
      registrationDeadline: new Date("2026-11-04T23:59:00+05:30"),
      venue: "NMIET Main Auditorium",
      mode: "OFFLINE",
      category: "Technical",
      registrationMode: "BOTH",
      minTeamSize: 2,
      maxTeamSize: 4,
      featured: true,
      status: "PUBLISHED",
      registrationPrefix: "TN",
      registrationSeq: 1,
      maxParticipants: 400,
      sections: {
        create: [
          section("HERO", 0, { eyebrow: "Coding Club · 7–8 Nov 2026", title: "Technova 2026", subtitle: "The festival where NMIET ships ideas in public. Competitions, showcases, and a campus that stays up late for the right reasons.", image: "/covers/technova.svg" }),
          section("ABOUT", 1, { heading: "A festival, not a form", body: "Technova is the annual technology festival hosted by the Coding Club. Departments bring projects, clubs run tracks, and students spend two days moving from the auditorium to the labs.\n\nYou register with the profile you already have. If you are entering a team track, your captain registers the roster.", image: "" }),
          section("RICH_TEXT", 2, { heading: "Why participate", body: "Technova is the one weekend where a class project can meet a sponsor, a recruiter, and the rest of campus.\n\nTracks are open to every department. First-year teams are encouraged, and the showcase floor is judged on clarity as much as complexity." }),
          section("PRIZES", 3, { heading: "Prizes", prizes: [{ place: "Grand prize", title: "Technova Cup", reward: "₹50,000", description: "Best overall build across tracks." }, { place: "Track winners", title: "Three tracks", reward: "₹15,000", description: "Coding, robotics, and design each award a winner." }, { place: "Showcase", title: "People's choice", reward: "₹5,000", description: "Voted by everyone who walks the floor." }] }),
          section("SPEAKERS", 4, { heading: "Speakers", people: [{ name: "Aditi Rao", role: "Product engineer, Pune", bio: "Shipping student tools that survive contact with a real campus.", image: "" }, { name: "Farhan Qureshi", role: "Robotics researcher", bio: "On building competition robots with a lab budget.", image: "" }, { name: "Leena Bhosale", role: "Design lead", bio: "How a demo becomes a story someone remembers.", image: "" }] }),
          section("TIMELINE", 5, { heading: "Timeline", items: [{ time: "7 Nov · 9:00", title: "Opening & tracks", description: "Auditorium briefing, then teams move to labs." }, { time: "7 Nov · 14:00", title: "Build floor opens", description: "Mentors rotate through the registered teams." }, { time: "8 Nov · 11:00", title: "Showcase", description: "Public demos in the foyer." }, { time: "8 Nov · 17:00", title: "Awards", description: "Results, certificates, and closing." }] }),
          section("RULES", 6, { heading: "Rules", rules: ["Carry your Event Hub pass. Attendance is scanned at the gate.", "Solo entries and teams of 2–4 are both welcome.", "Projects must be demonstrable on the showcase floor.", "One active registration per student.", "Follow the lab safety briefing before the robotics track."] }),
          section("FAQS", 7, { heading: "FAQs", items: [{ question: "Do I fill a form?", answer: "No. Confirm your saved profile. Track selection is the only extra question." }, { question: "Can I join a team later?", answer: "Yes, until the captain registers the team and the deadline passes." }, { question: "Is there a fee?", answer: "Technova registration is free for NMIET students." }] }),
          section("SPONSORS", 8, { heading: "Sponsors", sponsors: [{ name: "NMIET", tier: "Host", logo: "" }, { name: "Campus Labs", tier: "Partner", logo: "" }] }),
          section("ORGANIZERS", 9, { heading: "Organizers", people: [{ name: "Sneha Patil", role: "Coding Club", image: "" }, { name: "Neha Shah", role: "Event manager", image: "" }] }),
          section("CONTACT", 10, { heading: "Contact", email: "coding@nmiet.edu.in", phone: "02114-231666", location: "Coding Club room, NMIET", note: "Questions about tracks go to the club desk. Pass issues are handled in Event Hub." }),
          section("REGISTRATION_CTA", 11, { heading: "Save your seat", body: "Your name, department, year, and roll number are already on your profile.", buttonLabel: "Register now" }),
        ],
      },
      fields: { create: [{ label: "Track", key: "track", type: "SELECT", required: true, options: ["Coding", "Robotics", "Design"], position: 0, appliesTo: "BOTH" }] },
    },
  });

  const hackathon = await prisma.event.create({
    data: {
      clubId: ecell.id,
      createdById: ecellAdmin.id,
      name: "Hackathon 2026",
      slug: "hackathon-2026",
      summary: "A 24-hour build sprint. Form a team, pick a track, and demo what you ship.",
      coverImage: "/covers/hackathon.svg",
      startAt: new Date("2026-10-18T09:00:00+05:30"),
      endAt: new Date("2026-10-19T18:00:00+05:30"),
      registrationDeadline: new Date("2026-10-15T18:00:00+05:30"),
      venue: "Innovation Lab",
      mode: "OFFLINE",
      category: "Hackathon",
      registrationMode: "TEAM",
      minTeamSize: 3,
      maxTeamSize: 4,
      featured: true,
      status: "PUBLISHED",
      registrationPrefix: "HK",
      registrationSeq: 0,
      sections: {
        create: [
          section("HERO", 0, { eyebrow: "E-Cell · 18–19 Oct", title: "Hackathon 2026", subtitle: "Twenty-four hours. Teams of three or four. A demo that has to work in front of the room.", image: "/covers/hackathon.svg" }),
          section("ABOUT", 1, { heading: "About", body: "E-Cell runs Hackathon 2026 as a team-only build sprint. The captain creates the team, invites members inside Event Hub, and registers everyone with one confirmation.\n\nGitHub and experience are asked only for this event. They stay off your permanent profile.", image: "" }),
          section("PRIZES", 2, { heading: "Prizes", prizes: [{ place: "Winner", title: "Best product", reward: "₹40,000", description: "The demo the judges would fund." }, { place: "Runner-up", title: "Second place", reward: "₹20,000", description: "A strong build with a clear next step." }] }),
          section("TIMELINE", 3, { heading: "Timeline", items: [{ time: "18 Oct · 9:00", title: "Kickoff", description: "Problem statements and team check-in." }, { time: "18 Oct · 21:00", title: "Mentor hours", description: "Optional reviews in the lab." }, { time: "19 Oct · 15:00", title: "Demos", description: "Five minutes per team." }] }),
          section("RULES", 4, { heading: "Rules", rules: ["Teams must have 3 or 4 accepted members.", "The captain submits the registration.", "Every member needs a complete Event Hub profile.", "Code written before kickoff must be declared."] }),
          section("FAQS", 5, { heading: "FAQs", items: [{ question: "Can I register alone?", answer: "No. Create or join a team first." }, { question: "How do invites work?", answer: "Search a classmate, email them, or share the team link." }] }),
          section("CONTACT", 6, { heading: "Contact", email: "ecell@nmiet.edu.in", phone: "", location: "E-Cell cabin", note: "Team disputes are handled by the event manager before the deadline." }),
          section("REGISTRATION_CTA", 7, { heading: "Register your team", body: "Members do not register separately.", buttonLabel: "Create a team" }),
        ],
      },
      fields: {
        create: [
          { label: "GitHub", key: "github", type: "URL", required: true, position: 0, appliesTo: "TEAM" },
          { label: "Experience", key: "experience", type: "SELECT", required: true, options: ["Beginner", "Intermediate", "Advanced"], position: 1, appliesTo: "TEAM" },
        ],
      },
    },
  });

  const workshop = await prisma.event.create({
    data: {
      clubId: iic.id,
      createdById: iicAdmin.id,
      name: "Innovation Workshop",
      slug: "innovation-workshop",
      summary: "A Saturday workshop on framing problems worth building. Attendance and certificates are already in the demo.",
      coverImage: "/covers/workshop.svg",
      startAt: new Date("2026-09-12T10:00:00+05:30"),
      endAt: new Date("2026-09-12T16:00:00+05:30"),
      registrationDeadline: new Date("2026-09-10T18:00:00+05:30"),
      venue: "Seminar Hall 2",
      mode: "OFFLINE",
      category: "Workshop",
      registrationMode: "SOLO",
      featured: false,
      status: "PUBLISHED",
      registrationPrefix: "IW",
      registrationSeq: 3,
      sections: {
        create: [
          section("HERO", 0, { eyebrow: "IIC · 12 Sep 2026", title: "Innovation Workshop", subtitle: "A working session on finding a problem, talking to users, and deciding what not to build.", image: "/covers/workshop.svg" }),
          section("ABOUT", 1, { heading: "About", body: "IIC hosted a one-day workshop for students who want a better starting point than a blank hackathon idea.\n\nThis event is in the past so you can see attendance and certificates. Technova and the hackathon are still open.", image: "" }),
          section("TIMELINE", 2, { heading: "The day", items: [{ time: "10:00", title: "Problem framing", description: "What makes a campus problem worth a weekend." }, { time: "13:00", title: "Interviews", description: "Short conversations with invited guests." }, { time: "15:30", title: "Share-out", description: "Each table presents one decision." }] }),
          section("FAQS", 3, { heading: "FAQs", items: [{ question: "Can I still register?", answer: "Registration closed before the workshop. Your pass history is still available if you attended." }] }),
          section("CONTACT", 4, { heading: "Contact", email: "iic@nmiet.edu.in", phone: "", location: "Seminar Hall 2", note: "Certificate questions go to the IIC admin inside Event Hub." }),
          section("REGISTRATION_CTA", 5, { heading: "Registration closed", body: "Certificates for this workshop are already on student profiles.", buttonLabel: "View event" }),
        ],
      },
    },
  });

  await prisma.eventStaff.createMany({
    data: [technova, hackathon, workshop].flatMap((event) => [
      { eventId: event.id, userId: manager.id, role: "EVENT_MANAGER" as const },
      { eventId: event.id, userId: volunteer.id, role: "VOLUNTEER" as const },
    ]),
  });

  const rohanReg = await prisma.registration.create({
    data: {
      eventId: technova.id,
      userId: rohan.id,
      code: "NMIET-TN-0001",
      status: "CONFIRMED",
      responses: { create: [{ fieldId: (await prisma.registrationField.findFirstOrThrow({ where: { eventId: technova.id, key: "track" } })).id, value: "Robotics" }] },
    },
  });
  const rohanParticipant = await prisma.registrationParticipant.create({ data: { registrationId: rohanReg.id, eventId: technova.id, userId: rohan.id, dedupeKey: rohan.id } });
  await prisma.qrPass.create({ data: { participantId: rohanParticipant.id, token: randomToken() } });

  const team = await prisma.team.create({
    data: {
      eventId: hackathon.id,
      name: "Code Warriors",
      captainId: aarav.id,
      status: "FORMING",
      inviteToken: randomToken(18),
      members: { create: [{ userId: aarav.id }, { userId: diya.id }, { userId: kabir.id }] },
    },
  });
  await prisma.teamInvitation.create({
    data: {
      teamId: team.id,
      email: meera.email,
      invitedById: aarav.id,
      inviteeId: meera.id,
      token: randomToken(18),
      status: "PENDING",
      expiresAt: hackathon.registrationDeadline,
    },
  });

  const workshopRegs = [];
  for (const [index, student] of [aarav, diya, kabir].entries()) {
    const registration = await prisma.registration.create({
      data: { eventId: workshop.id, userId: student.id, code: `NMIET-IW-${String(index + 1).padStart(4, "0")}`, status: index < 2 ? "ATTENDED" : "CONFIRMED" },
    });
    const participant = await prisma.registrationParticipant.create({ data: { registrationId: registration.id, eventId: workshop.id, userId: student.id, dedupeKey: student.id } });
    await prisma.qrPass.create({ data: { participantId: participant.id, token: randomToken() } });
    workshopRegs.push({ registration, student, participant });
  }
  await prisma.attendance.createMany({
    data: [workshopRegs[0]!, workshopRegs[1]!].map((row) => ({
      eventId: workshop.id,
      registrationId: row.registration.id,
      userId: row.student.id,
      scannerId: volunteer.id,
      checkedInAt: new Date("2026-09-12T10:12:00+05:30"),
    })),
  });

  const template = await prisma.certificateTemplate.create({
    data: { eventId: workshop.id, type: "PARTICIPATION", name: "Participation", config: { accent: "#1f3fe0", nameY: 46, metaY: 62 } },
  });
  await prisma.certificate.createMany({
    data: [aarav, diya].map((student, index) => ({
      publicId: index === 0 ? "NMIET-CERT-WORKSHOP" : "NMIET-CERT-DIYA26",
      eventId: workshop.id,
      userId: student.id,
      templateId: template.id,
      type: "PARTICIPATION" as const,
      issuedAt: new Date("2026-09-13T11:00:00+05:30"),
    })),
  });

  await prisma.announcement.create({
    data: { eventId: workshop.id, authorId: iicAdmin.id, title: "Seminar Hall 2", body: "The workshop is in Seminar Hall 2, not the auditorium.", audience: "ALL_REGISTERED" },
  });

  await prisma.notification.createMany({
    data: [
      { userId: aarav.id, type: "CERTIFICATE_AVAILABLE", title: "Certificate ready · Innovation Workshop", body: "Your participation certificate can be viewed and verified.", href: "/certificates" },
      { userId: aarav.id, type: "TEAM_MEMBER_JOINED", title: "Kabir joined Code Warriors", body: "Your hackathon team has 3 members. You can register it.", href: "/teams" },
      { userId: aarav.id, type: "EVENT_PUBLISHED", title: "Technova 2026 is open", body: "A new event page is live.", href: "/events/technova", readAt: new Date() },
      { userId: meera.id, type: "TEAM_INVITATION", title: "Join Code Warriors", body: "Aarav Mehta invited you to their team for Hackathon 2026.", href: "/teams" },
      { userId: diya.id, type: "TEAM_MEMBER_JOINED", title: "You joined Code Warriors", body: "Aarav can register the team once the roster is ready.", href: "/teams" },
    ],
  });

  console.log("Seeded NMIET Event Hub demo data.");
  console.log(`Password: ${DEMO_PASSWORD}`);
  console.log("Try aarav@nmiet.edu.in, meera@nmiet.edu.in, volunteer@nmiet.edu.in, admin@nmiet.edu.in");
  void admin;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
