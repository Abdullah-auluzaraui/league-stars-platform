-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TournamentTeam" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
