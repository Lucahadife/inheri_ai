import { NextResponse } from "next/server";

import OpenAI from "openai";
import { PDFParse } from "pdf-parse";

import { loadPrompt } from "@/ai/prompts";
import { docOcrSchema } from "@/ai/schemas/doc-ocr";

type OcrPayload = {
  image: string;
  mimeType: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as OcrPayload;

  if (!body?.image || !body?.mimeType) {
    return NextResponse.json({ error: "Missing image." }, { status: 400 });
  }

  if (body.mimeType === "application/pdf") {
    const buffer = Buffer.from(body.image, "base64");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return NextResponse.json(docOcrSchema.parse({ text: result.text ?? "" }));
  }

  if (!body.mimeType.startsWith("image/")) {
    return NextResponse.json(
      { error: "OCR currently supports image or PDF uploads only." },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY." },
      { status: 500 }
    );
  }

  const prompt = await loadPrompt("doc-ocr.txt");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the text from this document image." },
          {
            type: "image_url",
            image_url: { url: `data:${body.mimeType};base64,${body.image}` },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    return NextResponse.json({ error: "OCR response invalid." }, { status: 500 });
  }

  const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
  const data = docOcrSchema.parse(parsed);

  return NextResponse.json(data);
}
