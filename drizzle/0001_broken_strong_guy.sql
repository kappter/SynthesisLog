CREATE TABLE `chat_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reflectionId` int NOT NULL,
	`stage` enum('history','concrete','amalgam','motion') NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reflections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`termBankId` int NOT NULL,
	`dayIndex` int NOT NULL,
	`termHistory` varchar(255),
	`termConcrete` varchar(255),
	`termAmalgam` varchar(255),
	`termMotion` varchar(255),
	`textHistory` text,
	`textConcrete` text,
	`textAmalgam` text,
	`textMotion` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reflections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`termBankId` int NOT NULL,
	`startDate` varchar(10),
	`endDate` varchar(10),
	`currentDayIndex` int NOT NULL DEFAULT 1,
	`totalDays` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `term_banks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`terms` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`googleSheetId` varchar(255),
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `term_banks_id` PRIMARY KEY(`id`)
);
