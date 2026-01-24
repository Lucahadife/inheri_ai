import { NextResponse } from "next/server";

import { createClient } from "@/data/supabase/server";

export async function POST(request: Request) {
  const { assetId, score, note } = await request.json();

  if (!assetId) {
    return NextResponse.json({ error: "Missing assetId." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("preferences").upsert(
    {
      asset_id: assetId,
      heir_id: user.id,
      emotional_score: Number(score ?? 0),
      note: note || null,
    },
    { onConflict: "asset_id,heir_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
