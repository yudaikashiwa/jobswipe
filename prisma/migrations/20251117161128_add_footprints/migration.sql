-- CreateTable
CREATE TABLE `Footprint` (
    `id` VARCHAR(191) NOT NULL,
    `studentUserId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `lastViewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Footprint_studentUserId_idx`(`studentUserId`),
    UNIQUE INDEX `Footprint_studentUserId_companyId_key`(`studentUserId`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Footprint` ADD CONSTRAINT `Footprint_studentUserId_fkey` FOREIGN KEY (`studentUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Footprint` ADD CONSTRAINT `Footprint_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
