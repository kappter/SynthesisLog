import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { fetchTermsFromSheet, validateSheetAccess } from "./googleSheets";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  termBank: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTermBanksByUserId(ctx.user.id);
    }),

    getActive: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveTermBank(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        terms: z.array(z.string()),
        googleSheetId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createTermBank({
          userId: ctx.user.id,
          name: input.name,
          terms: JSON.stringify(input.terms),
          isActive: false,
          googleSheetId: input.googleSheetId,
        });
        return { success: true };
      }),

    setActive: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setActiveTermBank(input.id, ctx.user.id);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        terms: z.array(z.string()).optional(),
        googleSheetId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.terms) updateData.terms = JSON.stringify(input.terms);
        if (input.googleSheetId !== undefined) updateData.googleSheetId = input.googleSheetId;
        
        await db.updateTermBank(input.id, ctx.user.id, updateData);
        return { success: true };
      }),
  }),

  run: router({
    getActive: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveRun(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        termBankId: z.number(),
        totalDays: z.number(),
        startDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createRun({
          userId: ctx.user.id,
          termBankId: input.termBankId,
          totalDays: input.totalDays,
          startDate: input.startDate,
          currentDayIndex: 1,
          isActive: true,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        currentDayIndex: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: any = {};
        if (input.currentDayIndex !== undefined) updateData.currentDayIndex = input.currentDayIndex;
        if (input.startDate !== undefined) updateData.startDate = input.startDate;
        if (input.endDate !== undefined) updateData.endDate = input.endDate;
        
        await db.updateRun(input.id, ctx.user.id, updateData);
        return { success: true };
      }),
  }),

  reflection: router({
    get: protectedProcedure
      .input(z.object({
        termBankId: z.number(),
        dayIndex: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getReflection(ctx.user.id, input.termBankId, input.dayIndex);
      }),

    save: protectedProcedure
      .input(z.object({
        termBankId: z.number(),
        dayIndex: z.number(),
        termHistory: z.string().optional(),
        termConcrete: z.string().optional(),
        termAmalgam: z.string().optional(),
        termMotion: z.string().optional(),
        textHistory: z.string().optional(),
        textConcrete: z.string().optional(),
        textAmalgam: z.string().optional(),
        textMotion: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const reflectionId = await db.upsertReflection({
          userId: ctx.user.id,
          termBankId: input.termBankId,
          dayIndex: input.dayIndex,
          termHistory: input.termHistory,
          termConcrete: input.termConcrete,
          termAmalgam: input.termAmalgam,
          termMotion: input.termMotion,
          textHistory: input.textHistory,
          textConcrete: input.textConcrete,
          textAmalgam: input.textAmalgam,
          textMotion: input.textMotion,
        });
        return { success: true, reflectionId };
      }),

    list: protectedProcedure
      .input(z.object({ termBankId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getReflectionsByTermBank(ctx.user.id, input.termBankId);
      }),
  }),

  ai: router({
    chat: protectedProcedure
      .input(z.object({
        reflectionId: z.number(),
        stage: z.string(),
        message: z.string(),
        context: z.object({
          focalTerm: z.string(),
          activeTermSet: z.array(z.string()),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        // Build system prompt based on stage
        let systemPrompt = "";
        if (input.stage === "history") {
          systemPrompt = "You are a helpful assistant providing concise historical and conceptual context for terms in a synthesis reflection exercise. Keep responses focused and journal-friendly.";
        } else if (input.stage === "concrete") {
          systemPrompt = "You are a helpful assistant suggesting concrete and abstract images or applications for terms. Provide vivid, specific examples that help visualize concepts.";
        } else if (input.stage === "amalgam") {
          systemPrompt = "You are a helpful assistant proposing conceptual amalgamations that link multiple terms together. Focus on creative connections and synthesis.";
        } else {
          systemPrompt = "You are a helpful assistant proposing named 'motions' or conceptual moves that link terms together. Suggest actionable proposals or frameworks.";
        }

        const contextInfo = `Focal term: ${input.context.focalTerm}. Active term set: ${input.context.activeTermSet.join(", ")}.`;

        // Get chat history
        const history = await db.getChatHistory(ctx.user.id, input.reflectionId, input.stage);
        
        const messages: Array<{ role: "system" | "user" | "assistant", content: string }> = [
          { role: "system", content: systemPrompt + " " + contextInfo }
        ];

        // Add history
        for (const msg of history) {
          messages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }

        // Add current message
        messages.push({
          role: "user",
          content: input.message,
        });

        // Call LLM
        const response = await invokeLLM({ messages });
        const content = response.choices[0]?.message?.content;
        const assistantMessage = typeof content === 'string' ? content : "I apologize, but I couldn't generate a response.";

        // Save both messages to history
        await db.saveChatMessage({
          userId: ctx.user.id,
          reflectionId: input.reflectionId,
          stage: input.stage,
          role: "user",
          content: input.message,
        });

        await db.saveChatMessage({
          userId: ctx.user.id,
          reflectionId: input.reflectionId,
          stage: input.stage,
          role: "assistant",
          content: assistantMessage,
        });

        return { message: assistantMessage };
      }),

    getChatHistory: protectedProcedure
      .input(z.object({
        reflectionId: z.number(),
        stage: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getChatHistory(ctx.user.id, input.reflectionId, input.stage);
      }),
  }),

  sheets: router({
    importFromSheet: protectedProcedure
      .input(z.object({
        sheetUrl: z.string(),
        name: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate sheet access
        const isAccessible = await validateSheetAccess(input.sheetUrl);
        if (!isAccessible) {
          throw new Error("Cannot access sheet. Make sure it's publicly readable.");
        }

        // Fetch terms
        const terms = await fetchTermsFromSheet(input.sheetUrl);
        
        if (terms.length === 0) {
          throw new Error("No terms found in sheet");
        }

        // Create term bank
        await db.createTermBank({
          userId: ctx.user.id,
          name: input.name,
          terms: JSON.stringify(terms),
          isActive: false,
          googleSheetId: input.sheetUrl,
          lastSyncedAt: new Date(),
        });

        return { success: true, termCount: terms.length };
      }),

    syncSheet: protectedProcedure
      .input(z.object({
        termBankId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get term bank
        const banks = await db.getTermBanksByUserId(ctx.user.id);
        const bank = banks.find(b => b.id === input.termBankId);
        
        if (!bank || !bank.googleSheetId) {
          throw new Error("Term bank not found or not linked to a Google Sheet");
        }

        // Fetch updated terms
        const terms = await fetchTermsFromSheet(bank.googleSheetId);
        
        // Update term bank
        await db.updateTermBank(input.termBankId, ctx.user.id, {
          terms: JSON.stringify(terms),
          lastSyncedAt: new Date(),
        });

        return { success: true, termCount: terms.length };
      }),
  }),

  spiral: router({
    exportCalendar: publicProcedure
      .input(z.object({
        allTerms: z.array(z.object({
          term: z.string(),
          listId: z.string(),
          listHue: z.number(),
          originalIndex: z.number(),
        })),
        startDate: z.string(),
        totalDays: z.number(),
        reflectionDepth: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
        calendarName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { generateIcsCalendar } = await import("./icsExport");
        const icsContent = generateIcsCalendar({
          allTerms: input.allTerms,
          startDate: input.startDate,
          totalDays: input.totalDays,
          reflectionDepth: input.reflectionDepth,
          calendarName: input.calendarName ?? "Synthesis Log",
          appId: ctx.user ? String(ctx.user.id) : "anonymous",
        });
        return {
          ics: Buffer.from(icsContent, "utf8").toString("base64"),
          filename: `synthesis-log-spiral.ics`,
        };
      }),

    exportPDF: publicProcedure
      .input(z.object({
        segments: z.array(z.object({
          listId: z.string(),
          listName: z.string(),
          listHue: z.number(),
          terms: z.array(z.string()),
          startDay: z.number(),
        })),
        reflections: z.record(z.string(), z.record(z.string(), z.string())),
        startDate: z.string(),
        currentDay: z.number(),
        reflectionDepth: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
        reportType: z.enum(['standard', 'ib-tok']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          console.log('[PDF Export] Starting PDF generation...');
          console.log('[PDF Export] Input data:', {
            segmentCount: input.segments.length,
            reflectionCount: Object.keys(input.reflections).length,
            currentDay: input.currentDay,
            reflectionDepth: input.reflectionDepth,
          });
          
          const { generateSpiralPDF } = await import("./pdfExport");
          
          // Convert string keys to numbers for reflections
          const reflections: Record<number, Record<string, string>> = {};
          for (const [dayStr, reflection] of Object.entries(input.reflections)) {
            reflections[parseInt(dayStr)] = reflection;
          }
          
          console.log('[PDF Export] Calling generateSpiralPDF...');
          const pdfBuffer = await generateSpiralPDF({
            segments: input.segments,
            reflections,
            startDate: input.startDate,
            currentDay: input.currentDay,
            reflectionDepth: input.reflectionDepth,
            reportType: input.reportType ?? 'standard',
          });
          
          console.log('[PDF Export] PDF generated, size:', pdfBuffer.length, 'bytes');
          
          // Return base64 encoded PDF
          const suffix = input.reportType === 'ib-tok' ? '-ib-tok' : '';
          return {
            pdf: pdfBuffer.toString('base64'),
            filename: `synthesis-log${suffix}-${new Date().toISOString().split('T')[0]}.pdf`,
          };
        } catch (error) {
          console.error('[PDF Export] Error:', error);
          throw error;
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
