import { z } from "zod";

export const docOcrSchema = z.object({
  text: z.string(),
});

export type DocOcrResponse = z.infer<typeof docOcrSchema>;
