import { notFound } from "next/navigation";
import { BlockEditor } from "@/components/block-editor";
import { PublishControls } from "@/components/event-settings";
import type { BlockType, EditorSection } from "@/lib/blocks";
import { BLOCK_TYPES } from "@/lib/blocks";
import { prisma } from "@/lib/db";
import { requireEventAccess } from "@/lib/permissions";

export default async function BuilderPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event, level } = await requireEventAccess(eventId, ["full", "manage"]);
  if (level === "scan") notFound();
  const sections = await prisma.eventSection.findMany({ where: { eventId }, orderBy: { position: "asc" } });
  const initial: EditorSection[] = sections.filter((section) => BLOCK_TYPES.includes(section.type as BlockType)).map((section) => ({
    id: section.id,
    type: section.type as BlockType,
    visible: section.visible,
    content: (section.content && typeof section.content === "object" ? section.content : {}) as Record<string, unknown>,
  }));
  return (
    <div className="space-y-4">
      <PublishControls eventId={eventId} status={event.status} />
      <BlockEditor
        eventId={eventId}
        slug={event.slug}
        initial={initial}
        preview={{
          name: event.name,
          slug: event.slug,
          summary: event.summary,
          coverImage: event.coverImage,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt.toISOString(),
          registrationDeadline: event.registrationDeadline.toISOString(),
          venue: event.venue,
          mode: event.mode,
          category: event.category,
          registrationMode: event.registrationMode,
          status: event.status,
          clubName: event.club.name,
        }}
      />
    </div>
  );
}
