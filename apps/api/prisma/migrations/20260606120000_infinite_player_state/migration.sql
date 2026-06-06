-- CreateTable
CREATE TABLE "InfinitePlayerDay" (
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "cycleNumber" INTEGER NOT NULL DEFAULT 0,
    "currentWordId" INTEGER,

    CONSTRAINT "InfinitePlayerDay_pkey" PRIMARY KEY ("userId","date")
);

-- CreateTable
CREATE TABLE "InfiniteWordUsage" (
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "InfiniteWordUsage_userId_date_cycleNumber_idx" ON "InfiniteWordUsage"("userId", "date", "cycleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InfiniteWordUsage_userId_date_cycleNumber_wordId_key" ON "InfiniteWordUsage"("userId", "date", "cycleNumber", "wordId");

-- AddForeignKey
ALTER TABLE "InfinitePlayerDay" ADD CONSTRAINT "InfinitePlayerDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfinitePlayerDay" ADD CONSTRAINT "InfinitePlayerDay_currentWordId_fkey" FOREIGN KEY ("currentWordId") REFERENCES "Word"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfiniteWordUsage" ADD CONSTRAINT "InfiniteWordUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfiniteWordUsage" ADD CONSTRAINT "InfiniteWordUsage_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
