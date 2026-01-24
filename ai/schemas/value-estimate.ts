import { z } from "zod";

export const valueEstimateSchema = z.object({
  low: z.number(),
  high: z.number(),
  factors: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  disclaimer: z.string(),
  explanation: z.string(),
});

export type ValueEstimate = z.infer<typeof valueEstimateSchema>;
