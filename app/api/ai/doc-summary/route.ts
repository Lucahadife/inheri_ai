import { NextResponse } from "next/server";

import { generateJson } from "@/ai/provider";
import { loadPrompt } from "@/ai/prompts";
import { docSummarySchema } from "@/ai/schemas/doc-summary";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.doc_text) {
    return NextResponse.json(
      { error: "Missing doc_text." },
      { status: 400 }
    );
  }

  const prompt = await loadPrompt("doc-summary.txt");
  const result = await generateJson(prompt, body, docSummarySchema);

  return NextResponse.json(result);
}
