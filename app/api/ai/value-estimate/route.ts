import { NextResponse } from "next/server";

import { generateJson } from "@/ai/provider";
import { loadPrompt } from "@/ai/prompts";
import { valueEstimateSchema } from "@/ai/schemas/value-estimate";

type EstimatePayload = {
  name?: string;
  asset_type?: string;
  asset_category?: string;
  size_label?: string;
  description?: string;
  location?: string;
  notes?: string;
  value_low_manual?: string;
  value_high_manual?: string;
  doc_text?: string;
  doc_title?: string;
  doc_type?: string;
  doc_summary?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as EstimatePayload;

  if (!body?.name && !body?.description && !body?.doc_text) {
    return NextResponse.json(
      { error: "Provide asset name, description, or document text." },
      { status: 400 }
    );
  }

  try {
    const prompt = await loadPrompt("value-estimate.txt");

    // Build a comprehensive context object for the AI
    const assetContext = {
      // Basic info
      name: body.name || "Unknown asset",
      asset_type: body.asset_type || body.asset_category || "general",
      category: body.asset_category || "",
      size: body.size_label || "",
      
      // Location and details
      location: body.location || "",
      description: body.description || "",
      notes: body.notes || "",
      
      // Manual estimates if provided (for reference)
      manual_estimate: {
        low: body.value_low_manual ? parseFloat(body.value_low_manual) : null,
        high: body.value_high_manual ? parseFloat(body.value_high_manual) : null,
      },
      
      // Document information
      document: {
        title: body.doc_title || "",
        type: body.doc_type || "",
        summary: body.doc_summary || "",
        full_text: body.doc_text || "",
      },
      
      // Estimation guidance based on asset type
      estimation_hints: getEstimationHints(body.asset_type || body.asset_category || ""),
    };

    const result = await generateJson(prompt, assetContext, valueEstimateSchema);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI estimate failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getEstimationHints(assetType: string): string {
  const type = assetType.toLowerCase();
  
  if (type.includes("real estate") || type.includes("property") || type.includes("house") || type.includes("home") || type.includes("land")) {
    return `REAL ESTATE ESTIMATION:
- Look for: address, square footage, bedrooms, bathrooms, lot size, year built
- Price per sqft varies: rural $50-150, suburban $150-300, urban $200-500, luxury $400-1000+
- Condition adjustments: excellent +10%, good 0%, fair -15%, poor -30%
- If appraisal document is recent (within 2 years), weight heavily
- Land value: $1,000-50,000+ per acre depending on location and zoning`;
  }
  
  if (type.includes("vehicle") || type.includes("car") || type.includes("truck") || type.includes("motorcycle")) {
    return `VEHICLE ESTIMATION:
- Look for: year, make, model, trim, mileage, VIN
- Depreciation: Year 1: -20%, Year 2-5: -10%/year, Year 6+: -5%/year
- Mileage: Average 12k/year. High mileage = -$0.05-0.15 per excess mile
- Condition: Excellent = 90% of clean retail, Good = 80%, Fair = 65%
- Popular makes (Toyota, Honda) hold value better than luxury`;
  }
  
  if (type.includes("jewelry") || type.includes("watch") || type.includes("ring") || type.includes("necklace")) {
    return `JEWELRY/WATCH ESTIMATION:
- Gold: ~$2,000/troy oz, Platinum: ~$1,000/troy oz, Silver: ~$25/troy oz
- Diamonds: varies wildly by 4Cs - assume $1,000-10,000/carat for quality stones
- Brand premiums: Rolex 2-3x, Cartier 2x, Tiffany 1.5x over melt/stone value
- Resale: typically 50-70% of retail for jewelry, 70-90% for luxury watches
- If appraisal exists, use it but discount 10-20% for resale`;
  }
  
  if (type.includes("art") || type.includes("painting") || type.includes("sculpture") || type.includes("antique")) {
    return `ART/ANTIQUES ESTIMATION:
- Artist reputation is key: unknown = $100-1,000, regional = $1,000-10,000, national = $10,000+
- Provenance adds 30-50% to value; lack of it reduces by same amount
- Size matters: larger pieces generally more valuable (to a point)
- Condition critical: any damage can reduce value 50%+
- Antiques: age alone doesn't guarantee value; condition and rarity matter`;
  }
  
  if (type.includes("furniture")) {
    return `FURNITURE ESTIMATION:
- Standard furniture: loses 70-80% of value immediately
- Antiques (100+ years): may retain or exceed original value
- Designer/luxury: retains 30-50% (Herman Miller, Restoration Hardware)
- Condition critical: scratches, stains, wear reduce value significantly
- Large pieces harder to sell = lower prices`;
  }
  
  return `GENERAL ESTIMATION:
- Research comparable items sold recently
- Condition scale: Excellent = 70-80% of new, Good = 50-60%, Fair = 30-40%
- Brand recognition adds 20-50% vs generic
- Age typically reduces value unless item is collectible
- If receipt or purchase documentation exists, use as upper bound reference`;
}
