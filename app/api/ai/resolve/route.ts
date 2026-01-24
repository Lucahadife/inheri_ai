import { NextResponse } from "next/server";

import { generateJson } from "@/ai/provider";
import { loadPrompt } from "@/ai/prompts";
import { resolveSchema } from "@/ai/schemas/resolve";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.conflict || !body?.allocation || !body?.preferences) {
    return NextResponse.json(
      { error: "Missing conflict, allocation, or preferences." },
      { status: 400 }
    );
  }

  const prompt = await loadPrompt("resolve.txt");
  const result = await generateJson(prompt, body, resolveSchema);

  return NextResponse.json(result);
}
