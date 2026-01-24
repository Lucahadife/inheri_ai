import { z } from "zod";

export const resolveSchema = z.object({
  suggested_swaps: z.array(
    z.object({
      give_asset: z.string(),
      receive_asset: z.string(),
      from_heir: z.string(),
      to_heir: z.string(),
      rationale: z.string(),
    })
  ),
  overall_rationale: z.string(),
});

export type ResolveResponse = z.infer<typeof resolveSchema>;
