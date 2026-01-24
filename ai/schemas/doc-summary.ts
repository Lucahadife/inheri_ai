import { z } from "zod";

export const docSummarySchema = z.object({
  doc_type: z.string(),
  what_it_proves: z.string(),
  risks: z.array(z.string()),
  summary: z.string(),
});

export type DocSummary = z.infer<typeof docSummarySchema>;
