import { z } from "zod";

export const fairnessSchema = z.object({
  acceptance_probability: z.number().min(0).max(1),
  summary: z.string(),
  key_drivers: z.array(z.string()),
});

export type FairnessResponse = z.infer<typeof fairnessSchema>;
