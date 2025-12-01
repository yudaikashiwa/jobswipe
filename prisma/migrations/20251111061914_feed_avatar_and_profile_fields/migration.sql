-- AlterTable
ALTER TABLE `CompanyProfile` ADD COLUMN `avatarUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Message` ADD COLUMN `attachmentName` VARCHAR(191) NULL,
    ADD COLUMN `attachmentType` VARCHAR(191) NULL,
    ADD COLUMN `attachmentUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `StudentProfile` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `artsOrScience` VARCHAR(191) NULL,
    ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `birthDate` DATETIME(3) NULL,
    ADD COLUMN `certifications` TEXT NULL,
    ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `desiredIndustry1` VARCHAR(191) NULL,
    ADD COLUMN `desiredIndustry2` VARCHAR(191) NULL,
    ADD COLUMN `desiredIndustry3` VARCHAR(191) NULL,
    ADD COLUMN `faculty` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `grade` VARCHAR(191) NULL,
    ADD COLUMN `highSchoolName` VARCHAR(191) NULL,
    ADD COLUMN `languageSkills` TEXT NULL,
    ADD COLUMN `nameKana` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `postalCode` VARCHAR(191) NULL,
    ADD COLUMN `programmingSkills` TEXT NULL,
    ADD COLUMN `researchTheme` VARCHAR(191) NULL,
    ADD COLUMN `seminar` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `TypingStatus` (
    `id` VARCHAR(191) NOT NULL,
    `offerId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `until` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TypingStatus_offerId_userId_key`(`offerId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
