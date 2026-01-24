"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/data/supabase/server";
import { supabaseAdmin } from "@/data/supabase/admin";

export async function createEstateFromSetup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    redirect("/setup?error=Estate%20name%20is%20required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/setup");
  }

  const { data: estate, error } = await supabaseAdmin
    .from("estates")
    .insert({
      name,
      description: description || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !estate) {
    redirect(`/setup?error=${encodeURIComponent(error?.message ?? "Failed")}`);
  }

  const { error: memberError } = await supabaseAdmin
    .from("estate_members")
    .insert({
      estate_id: estate.id,
      user_id: user.id,
      email: user.email ?? "",
      role: "admin",
      status: "active",
    });

  if (memberError) {
    redirect(`/setup?error=${encodeURIComponent(memberError.message)}`);
  }

  redirect(`/estates/${estate.id}/setup`);
}
