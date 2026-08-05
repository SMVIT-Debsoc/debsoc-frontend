-- CreateTable
CREATE TABLE "Digest" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Digest_pkey" PRIMARY KEY ("id")
);
