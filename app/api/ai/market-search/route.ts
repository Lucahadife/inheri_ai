import { NextResponse } from "next/server";
import OpenAI from "openai";

type SearchPayload = {
  asset_type: string;
  query: string;
  location?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SearchPayload;

  if (!body?.query) {
    return NextResponse.json({ error: "Missing search query." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY." },
      { status: 500 }
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  // Build a market research query
  const assetType = body.asset_type?.toLowerCase() || "item";
  const location = body.location ? ` in ${body.location}` : "";
  
  let searchContext = "";
  
  if (assetType.includes("real estate") || assetType.includes("property") || assetType.includes("house") || assetType.includes("home")) {
    searchContext = `Research comparable real estate sales${location}. Consider: recent sale prices per square foot, neighborhood trends, property condition adjustments. Typical residential prices range from $100-500/sqft depending on location.`;
  } else if (assetType.includes("vehicle") || assetType.includes("car") || assetType.includes("truck")) {
    searchContext = `Research used vehicle values. Consider: year, make, model, mileage depreciation (15-20% first year, 10% after), condition (excellent/good/fair). Use Kelley Blue Book methodology.`;
  } else if (assetType.includes("jewelry") || assetType.includes("watch")) {
    searchContext = `Research jewelry/watch resale values. Consider: metal spot prices (gold ~$2000/oz), brand premiums (luxury brands 2-3x), gemstone quality, condition. Resale typically 50-70% of retail.`;
  } else if (assetType.includes("art") || assetType.includes("painting")) {
    searchContext = `Research art market values. Consider: artist reputation, provenance, medium, size, auction results. Without provenance, reduce value 30-50%.`;
  } else {
    searchContext = `Research fair market values for this type of item. Consider: condition, brand, age, comparable sales on secondary markets like eBay sold listings.`;
  }

  const systemPrompt = `You are a market research assistant for estate valuation. Provide realistic current market value estimates based on your knowledge of ${assetType} markets.

${searchContext}

Return JSON with this structure:
{
  "market_insights": string (2-3 sentences about current market conditions),
  "comparable_range": { "low": number, "high": number },
  "price_factors": string[] (3-5 factors affecting price),
  "data_quality": "high" | "medium" | "low"
}`;

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Estimate market value for: ${body.query}${location}` },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Market search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
