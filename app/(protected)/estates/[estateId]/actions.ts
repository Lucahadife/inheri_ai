"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/data/supabase/server";

export async function addMember(formData: FormData) {
  const estateId = String(formData.get("estate_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "heir");

  if (!estateId || !email) {
    redirect(`/estates/${estateId}?error=Email%20is%20required.`);
  }

  const supabase = createClient();

  const { error } = await supabase.from("estate_members").insert({
    estate_id: estateId,
    email,
    role,
    status: "pending",
  });

  if (error) {
    redirect(`/estates/${estateId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/estates/${estateId}`);
}
