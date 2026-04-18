-- CreateTable
CREATE TABLE "Sitter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sitter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitterRequest" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "timeWindow" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitterRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outreach" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "sitterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "replyBody" TEXT,
    "errorText" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Outreach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sitter_phone_key" ON "Sitter"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Outreach_requestId_sitterId_key" ON "Outreach"("requestId", "sitterId");

-- CreateIndex
CREATE INDEX "Outreach_requestId_order_idx" ON "Outreach"("requestId", "order");

-- AddForeignKey
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SitterRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_sitterId_fkey" FOREIGN KEY ("sitterId") REFERENCES "Sitter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
