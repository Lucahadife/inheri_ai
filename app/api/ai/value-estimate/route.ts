import { NextResponse } from "next/server";

import { generateJson } from "@/ai/provider";
import { loadPrompt } from "@/ai/prompts";
import { valueEstimateSchema } from "@/ai/schemas/value-estimate";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.name && !body?.description) {
    return NextResponse.json(
      { error: "Missing asset name or description." },
      { status: 400 }
    );
  }

  try {
    const prompt = await loadPrompt("value-estimate.txt");
    const result = await generateJson(prompt, body, valueEstimateSchema);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI estimate failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
