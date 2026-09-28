-- AlterEnum
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'EMAIL';
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'PHONE';
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'MULTISELECT';
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'RADIO';
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'CHECKBOX';
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'FILE';
ALTER TYPE "FieldType" ADD VALUE IF NOT EXISTS 'DATE';

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('SYSTEM', 'CLUB', 'EVENT', 'TEAM');

-- AlterTable
ALTER TABLE "Club" ADD COLUMN "banner" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "registrationOpensAt" TIMESTAMP(3),
ADD COLUMN "eligibility" JSONB;

-- CreateTable
CREATE TABLE "OrgUnit" (
    "id" TEXT NOT NULL,
    "clubId" TEXT,
    "eventId" TEXT,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMembership" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lead" BOOLEAN NOT NULL DEFAULT false,
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "OrgMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "scopeType" "ScopeType" NOT NULL,
    "scopeId" TEXT NOT NULL DEFAULT '',
    "orgUnitId" TEXT,
    "grantedById" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,

    CONSTRAINT "PermissionGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "scopeType" "ScopeType",
    "scopeId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgUnit_clubId_idx" ON "OrgUnit"("clubId");
CREATE INDEX "OrgUnit_eventId_idx" ON "OrgUnit"("eventId");
CREATE INDEX "OrgUnit_parentId_idx" ON "OrgUnit"("parentId");
CREATE UNIQUE INDEX "OrgMembership_unitId_userId_key" ON "OrgMembership"("unitId", "userId");
CREATE INDEX "OrgMembership_userId_idx" ON "OrgMembership"("userId");
CREATE INDEX "PermissionGrant_userId_revokedAt_idx" ON "PermissionGrant"("userId", "revokedAt");
CREATE INDEX "PermissionGrant_scopeType_scopeId_idx" ON "PermissionGrant"("scopeType", "scopeId");
CREATE INDEX "PermissionGrant_orgUnitId_idx" ON "PermissionGrant"("orgUnitId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_scopeType_scopeId_idx" ON "AuditLog"("scopeType", "scopeId");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PermissionGrant" ADD CONSTRAINT "PermissionGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PermissionGrant" ADD CONSTRAINT "PermissionGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PermissionGrant" ADD CONSTRAINT "PermissionGrant_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
