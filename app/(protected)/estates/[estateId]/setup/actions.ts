"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/data/supabase/server";

export async function addMemberInSetup(formData: FormData) {
  const estateId = String(formData.get("estate_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "heir");

  if (!estateId || !email) {
    redirect(`/estates/${estateId}/setup?error=Email%20is%20required.`);
  }

  const supabase = await createClient();

  const { error } = await supabase.from("estate_members").insert({
    estate_id: estateId,
    email,
    role,
    status: "pending",
  });

  if (error) {
    redirect(
      `/estates/${estateId}/setup?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect(`/estates/${estateId}/setup`);
}

export async function addRule(formData: FormData) {
  const estateId = String(formData.get("estate_id") ?? "");
  const ruleType = String(formData.get("rule_type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!estateId || !ruleType || !title) {
    redirect(`/estates/${estateId}/setup?error=Rule%20is%20required.`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("estate_rules").insert({
    estate_id: estateId,
    rule_type: ruleType,
    title,
    description: description || null,
    created_by: user.id,
  });

  if (error) {
    redirect(
      `/estates/${estateId}/setup?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect(`/estates/${estateId}/setup`);
}

export async function acceptRule(formData: FormData) {
  const estateId = String(formData.get("estate_id") ?? "");
  const ruleId = String(formData.get("rule_id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("estate_rule_acceptances").upsert(
    {
      estate_rule_id: ruleId,
      user_id: user.id,
    },
    { onConflict: "estate_rule_id,user_id" }
  );

  if (error) {
    redirect(
      `/estates/${estateId}/setup?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect(`/estates/${estateId}/setup`);
}
