-- Additive production-safe change: existing flowers keep working with a null color
-- until they are edited or assigned one from the admin form.
ALTER TABLE "Flower" ADD COLUMN "color" TEXT;
