-- CreateIndex
CREATE UNIQUE INDEX "GameResult_userId_dailyChallengeId_key" ON "GameResult"("userId", "dailyChallengeId");
