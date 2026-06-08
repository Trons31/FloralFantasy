-- Add receipt gallery support to expenses while keeping the main photo columns for compatibility.
ALTER TABLE "Expense"
ADD COLUMN IF NOT EXISTS "receiptPhotos" JSONB;
