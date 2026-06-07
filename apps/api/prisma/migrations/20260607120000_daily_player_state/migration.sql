-- CreateTable
CREATE TABLE "DailyPlayerDay" (
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "guessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyPlayerDay_pkey" PRIMARY KEY ("userId","date")
);

-- AddForeignKey
ALTER TABLE "DailyPlayerDay" ADD CONSTRAINT "DailyPlayerDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
