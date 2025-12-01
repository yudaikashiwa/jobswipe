-- AlterTable
ALTER TABLE `CompanyProfile` ADD COLUMN `industries` JSON NULL,
    ADD COLUMN `industryDisplay` TEXT NULL,
    ADD COLUMN `location` VARCHAR(191) NULL;
