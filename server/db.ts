import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  termBanks, 
  reflections, 
  runs, 
  chatHistory,
  InsertTermBank,
  InsertReflection,
  InsertRun,
  InsertChatHistory
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Term Bank operations
export async function createTermBank(data: InsertTermBank) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(termBanks).values(data);
  return result;
}

export async function getTermBanksByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(termBanks).where(eq(termBanks.userId, userId)).orderBy(desc(termBanks.createdAt));
}

export async function getActiveTermBank(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(termBanks)
    .where(and(eq(termBanks.userId, userId), eq(termBanks.isActive, true)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateTermBank(id: number, userId: number, data: Partial<InsertTermBank>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(termBanks)
    .set(data)
    .where(and(eq(termBanks.id, id), eq(termBanks.userId, userId)));
}

export async function setActiveTermBank(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deactivate all term banks for this user
  await db.update(termBanks)
    .set({ isActive: false })
    .where(eq(termBanks.userId, userId));
  
  // Activate the selected one
  await db.update(termBanks)
    .set({ isActive: true })
    .where(and(eq(termBanks.id, id), eq(termBanks.userId, userId)));
}

// Reflection operations
export async function createReflection(data: InsertReflection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reflections).values(data);
  return result;
}

export async function getReflection(userId: number, termBankId: number, dayIndex: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(reflections)
    .where(and(
      eq(reflections.userId, userId),
      eq(reflections.termBankId, termBankId),
      eq(reflections.dayIndex, dayIndex)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function upsertReflection(data: InsertReflection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getReflection(data.userId, data.termBankId, data.dayIndex);
  
  if (existing) {
    await db.update(reflections)
      .set(data)
      .where(eq(reflections.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(reflections).values(data);
    return result[0].insertId;
  }
}

export async function getReflectionsByTermBank(userId: number, termBankId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(reflections)
    .where(and(eq(reflections.userId, userId), eq(reflections.termBankId, termBankId)))
    .orderBy(reflections.dayIndex);
}

// Run operations
export async function createRun(data: InsertRun) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deactivate all runs for this user
  await db.update(runs)
    .set({ isActive: false })
    .where(eq(runs.userId, data.userId));
  
  const result = await db.insert(runs).values(data);
  return result;
}

export async function getActiveRun(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(runs)
    .where(and(eq(runs.userId, userId), eq(runs.isActive, true)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateRun(id: number, userId: number, data: Partial<InsertRun>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(runs)
    .set(data)
    .where(and(eq(runs.id, id), eq(runs.userId, userId)));
}

// Chat history operations
export async function saveChatMessage(data: InsertChatHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(chatHistory).values(data);
  return result;
}

export async function getChatHistory(userId: number, reflectionId: number, stage: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(chatHistory)
    .where(and(
      eq(chatHistory.userId, userId),
      eq(chatHistory.reflectionId, reflectionId),
      eq(chatHistory.stage, stage as any)
    ))
    .orderBy(chatHistory.createdAt);
}
