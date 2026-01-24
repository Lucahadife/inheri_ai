"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/data/supabase/server";

export async function upsertPreference(formData: FormData) {
  const estateId = String(formData.get("estate_id") ?? "");
  const assetId = String(formData.get("asset_id") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const note = String(formData.get("note") ?? "").trim();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("preferences").upsert(
    {
      asset_id: assetId,
      heir_id: user.id,
      emotional_score: score,
      note: note || null,
    },
    { onConflict: "asset_id,heir_id" }
  );

  if (error) {
    redirect(
      `/estates/${estateId}/preferences?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/estates/${estateId}/preferences`);
}

export async function upsertBoost(formData: FormData) {
  const estateId = String(formData.get("estate_id") ?? "");
  const assetId = String(formData.get("asset_id") ?? "");
  const heirId = String(formData.get("heir_id") ?? "");
  const boost = Number(formData.get("boost") ?? 0);
  const note = String(formData.get("note") ?? "").trim();

  const supabase = createClient();

  const { error } = await supabase.from("decedent_boosts").upsert(
    {
      asset_id: assetId,
      heir_id: heirId,
      boost,
      note: note || null,
    },
    { onConflict: "asset_id,heir_id" }
  );

  if (error) {
    redirect(
      `/estates/${estateId}/preferences?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/estates/${estateId}/preferences`);
}
