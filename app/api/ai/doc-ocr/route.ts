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
  try {
    const body = (await request.json()) as OcrPayload;

    if (!body?.image || !body?.mimeType) {
      return NextResponse.json({ error: "Missing image." }, { status: 400 });
    }

    // Handle PDF files
    if (body.mimeType === "application/pdf") {
      try {
        const buffer = Buffer.from(body.image, "base64");
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();
        return NextResponse.json({ text: result.text ?? "" });
      } catch (pdfError) {
        const message = pdfError instanceof Error ? pdfError.message : "PDF parsing failed.";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    // Check for valid image types
    if (!body.mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "OCR currently supports image or PDF uploads only." },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const prompt = await loadPrompt("doc-ocr.txt");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    // Call OpenAI Vision API
    const response = await client.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 4096,
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
    
    if (!content.trim()) {
      return NextResponse.json({ error: "No text extracted from image." }, { status: 500 });
    }

    // Try to parse as JSON first (if model returned JSON)
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
        const data = docOcrSchema.parse(parsed);
        return NextResponse.json(data);
      } catch {
        // If JSON parsing fails, return the raw content as text
      }
    }

    // Return raw content as text if not JSON
    return NextResponse.json({ text: content.trim() });

  } catch (error) {
    console.error("OCR error:", error);
    const message = error instanceof Error ? error.message : "OCR processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
