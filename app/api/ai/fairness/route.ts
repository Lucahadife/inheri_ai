import { NextResponse } from "next/server";

import { generateJson } from "@/ai/provider";
import { loadPrompt } from "@/ai/prompts";
import { fairnessSchema } from "@/ai/schemas/fairness";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.allocation || !body?.preferences || !body?.rules) {
    return NextResponse.json(
      { error: "Missing allocation, preferences, or rules." },
      { status: 400 }
    );
  }

  const prompt = await loadPrompt("fairness.txt");
  const result = await generateJson(prompt, body, fairnessSchema);

  return NextResponse.json(result);
}
