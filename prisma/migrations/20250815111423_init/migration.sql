/*
  Warnings:

  - The values [ASSISTENT] on the enum `MessageRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."MessageRole_new" AS ENUM ('USER', 'ASSISTANT');
ALTER TABLE "public"."Message" ALTER COLUMN "role" TYPE "public"."MessageRole_new" USING ("role"::text::"public"."MessageRole_new");
ALTER TYPE "public"."MessageRole" RENAME TO "MessageRole_old";
ALTER TYPE "public"."MessageRole_new" RENAME TO "MessageRole";
DROP TYPE "public"."MessageRole_old";
COMMIT;
