-- Link SitterRequest to a Google Calendar event so the /calendar page can
-- show "sitter requested" / "sitter booked" badges next to events.
ALTER TABLE "SitterRequest" ADD COLUMN "calendarEventUid" TEXT;
CREATE INDEX "SitterRequest_calendarEventUid_idx" ON "SitterRequest"("calendarEventUid");

-- Events the operator explicitly marked as not needing a sitter.
CREATE TABLE "DismissedEvent" (
  "eventUid" TEXT NOT NULL,
  "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DismissedEvent_pkey" PRIMARY KEY ("eventUid")
);
