import OpenAI from "openai";
import { z } from "zod";

const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const extractJson = (text: string) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain JSON.");
  }
  return text.slice(start, end + 1);
};

export async function generateJson<T>(
  prompt: string,
  input: unknown,
  schema: z.ZodSchema<T>
) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  const json = extractJson(content);
  const parsed = JSON.parse(json);
  return schema.parse(parsed);
}
