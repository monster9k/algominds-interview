-- CreateTable
CREATE TABLE "user_persona_unlocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_persona_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_persona_unlocks_userId_personaId_key" ON "user_persona_unlocks"("userId", "personaId");

-- AddForeignKey
ALTER TABLE "user_persona_unlocks" ADD CONSTRAINT "user_persona_unlocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_persona_unlocks" ADD CONSTRAINT "user_persona_unlocks_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "interviewer_personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
