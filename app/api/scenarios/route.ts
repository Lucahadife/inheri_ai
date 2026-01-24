import { NextResponse } from "next/server";

import { createClient } from "@/data/supabase/server";

export async function POST(request: Request) {
  const { estateId, assetId, scenarioName, action } = await request.json();

  if (!estateId || !assetId || !scenarioName) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let { data: scenario } = await supabase
    .from("scenarios")
    .select("id")
    .eq("estate_id", estateId)
    .eq("heir_id", user.id)
    .eq("name", scenarioName)
    .maybeSingle();

  if (!scenario) {
    const { data: created, error } = await supabase
      .from("scenarios")
      .insert({
        estate_id: estateId,
        heir_id: user.id,
        name: scenarioName,
      })
      .select("id")
      .single();

    if (error || !created) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create scenario." },
        { status: 500 }
      );
    }

    scenario = created;
  }

  if (action === "remove") {
    await supabase
      .from("scenario_items")
      .delete()
      .eq("scenario_id", scenario.id)
      .eq("asset_id", assetId);
  } else {
    await supabase.from("scenario_items").upsert(
      {
        scenario_id: scenario.id,
        asset_id: assetId,
      },
      { onConflict: "scenario_id,asset_id" }
    );
  }

  return NextResponse.json({ ok: true });
}
