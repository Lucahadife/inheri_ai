"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/data/supabase/server";

export async function toggleScenarioItem(formData: FormData) {
  const estateId = String(formData.get("estate_id") ?? "");
  const scenarioName = String(formData.get("scenario_name") ?? "A");
  const assetId = String(formData.get("asset_id") ?? "");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: scenario } = await supabase
    .from("scenarios")
    .select("id")
    .eq("estate_id", estateId)
    .eq("heir_id", user.id)
    .eq("name", scenarioName)
    .maybeSingle();

  if (!scenario) {
    const { data: createdScenario, error: scenarioError } = await supabase
      .from("scenarios")
      .insert({
        estate_id: estateId,
        heir_id: user.id,
        name: scenarioName,
      })
      .select("id")
      .single();

    if (scenarioError || !createdScenario) {
      redirect(
        `/estates/${estateId}/scenarios?error=${encodeURIComponent(
          scenarioError?.message ?? "Failed"
        )}`
      );
    }

    scenario = createdScenario;
  }

  const { data: existingItem } = await supabase
    .from("scenario_items")
    .select("id")
    .eq("scenario_id", scenario.id)
    .eq("asset_id", assetId)
    .maybeSingle();

  if (existingItem) {
    const { error } = await supabase
      .from("scenario_items")
      .delete()
      .eq("id", existingItem.id);

    if (error) {
      redirect(
        `/estates/${estateId}/scenarios?error=${encodeURIComponent(
          error.message
        )}`
      );
    }
  } else {
    const { error } = await supabase.from("scenario_items").insert({
      scenario_id: scenario.id,
      asset_id: assetId,
    });

    if (error) {
      redirect(
        `/estates/${estateId}/scenarios?error=${encodeURIComponent(
          error.message
        )}`
      );
    }
  }

  redirect(`/estates/${estateId}/scenarios`);
}
