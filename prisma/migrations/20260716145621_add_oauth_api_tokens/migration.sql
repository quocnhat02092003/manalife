-- AlterTable
ALTER TABLE "OAuthAccount" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "OAuthAccount" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "OAuthAccount" ADD COLUMN "scope" TEXT;
ALTER TABLE "OAuthAccount" ADD COLUMN "tokenExpiresAt" DATETIME;
