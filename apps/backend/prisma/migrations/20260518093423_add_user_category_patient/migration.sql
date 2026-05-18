/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[staff_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "user_category" AS ENUM ('internal_staff', 'patient');

-- AlterEnum
ALTER TYPE "role" ADD VALUE 'patient';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "staff_id" VARCHAR(32),
ADD COLUMN     "user_category" "user_category" NOT NULL DEFAULT 'internal_staff',
ADD COLUMN     "user_type" VARCHAR(32);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_staff_id_key" ON "users"("staff_id");
