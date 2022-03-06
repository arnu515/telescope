/*
  Warnings:

  - You are about to drop the column `expires_at` on the `calls` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `calls` table. All the data in the column will be lost.
  - Added the required column `room_sid` to the `calls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "calls" DROP COLUMN "expires_at",
DROP COLUMN "is_active",
ADD COLUMN     "room_sid" TEXT NOT NULL;
