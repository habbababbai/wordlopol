-- CreateTable
CREATE TABLE "GuestDailySession" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "guessCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestDailySession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestDailySession_date_idx" ON "GuestDailySession"("date");
