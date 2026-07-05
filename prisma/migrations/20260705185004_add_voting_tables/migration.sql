/*
  Warnings:

  - You are about to drop the column `isNominated` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `goalId` on the `GoalVote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[votingRoundGoalId,fingerprint]` on the table `GoalVote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `votingRoundGoalId` to the `GoalVote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GoalVote" DROP CONSTRAINT "GoalVote_goalId_fkey";

-- DropIndex
DROP INDEX "GoalVote_goalId_fingerprint_key";

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "isNominated";

-- AlterTable
ALTER TABLE "GoalVote" DROP COLUMN "goalId",
ADD COLUMN     "votingRoundGoalId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "streamUrl" TEXT;

-- CreateTable
CREATE TABLE "VotingRound" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tournamentId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "winnerGoalId" TEXT,
    "showResultsMode" TEXT NOT NULL DEFAULT 'after_vote',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VotingRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VotingRoundGoal" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "videoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VotingRoundGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VotingRoundGoal_roundId_goalId_key" ON "VotingRoundGoal"("roundId", "goalId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalVote_votingRoundGoalId_fingerprint_key" ON "GoalVote"("votingRoundGoalId", "fingerprint");

-- AddForeignKey
ALTER TABLE "GoalVote" ADD CONSTRAINT "GoalVote_votingRoundGoalId_fkey" FOREIGN KEY ("votingRoundGoalId") REFERENCES "VotingRoundGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotingRoundGoal" ADD CONSTRAINT "VotingRoundGoal_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "VotingRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotingRoundGoal" ADD CONSTRAINT "VotingRoundGoal_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
