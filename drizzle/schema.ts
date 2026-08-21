import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Term banks - collections of terms for the four-stage workflow
 */
export const termBanks = mysqlTable("term_banks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  terms: text("terms").notNull(), // JSON array of term strings
  isActive: boolean("isActive").default(false).notNull(),
  googleSheetId: varchar("googleSheetId", { length: 255 }),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TermBank = typeof termBanks.$inferSelect;
export type InsertTermBank = typeof termBanks.$inferInsert;

/**
 * Daily reflections - stores user reflections for each day of the run
 */
export const reflections = mysqlTable("reflections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  termBankId: int("termBankId").notNull(),
  dayIndex: int("dayIndex").notNull(),
  termHistory: varchar("termHistory", { length: 255 }),
  termConcrete: varchar("termConcrete", { length: 255 }),
  termAmalgam: varchar("termAmalgam", { length: 255 }),
  termMotion: varchar("termMotion", { length: 255 }),
  textHistory: text("textHistory"),
  textConcrete: text("textConcrete"),
  textAmalgam: text("textAmalgam"),
  textMotion: text("textMotion"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reflection = typeof reflections.$inferSelect;
export type InsertReflection = typeof reflections.$inferInsert;

/**
 * Run metadata - tracks start/end dates and current state of a synthesis run
 */
export const runs = mysqlTable("runs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  termBankId: int("termBankId").notNull(),
  startDate: varchar("startDate", { length: 10 }), // YYYY-MM-DD
  endDate: varchar("endDate", { length: 10 }), // YYYY-MM-DD
  currentDayIndex: int("currentDayIndex").default(1).notNull(),
  totalDays: int("totalDays").notNull(),
  reflectionDepth: int("reflectionDepth").default(4).notNull(), // 2, 3, 4, or 5 step model
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Run = typeof runs.$inferSelect;
export type InsertRun = typeof runs.$inferInsert;

/**
 * AI chat history - stores conversation history for each stage
 */
export const chatHistory = mysqlTable("chat_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reflectionId: int("reflectionId").notNull(),
  stage: varchar("stage", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;
