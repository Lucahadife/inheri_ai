"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/data/supabase/server";

const toNumber = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

export async function createAsset(formData: FormData) {
  const estateId = String(formData.get("estate_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const valueLow = toNumber(formData.get("value_low"));
  const valueHigh = toNumber(formData.get("value_high"));
  const file = formData.get("document");

  if (!estateId || !name) {
    redirect(`/estates/${estateId}/assets?error=Name%20is%20required.`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .insert({
      estate_id: estateId,
      name,
      description: description || null,
      location: location || null,
      notes: notes || null,
      value_low: valueLow,
      value_high: valueHigh,
      created_by: user.id,
    })
    .select()
    .single();

  if (assetError || !asset) {
    redirect(
      `/estates/${estateId}/assets?error=${encodeURIComponent(
        assetError?.message ?? "Failed"
      )}`
    );
  }

  if (file instanceof File && file.size > 0) {
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${estateId}/${asset.id}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("asset-docs")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      redirect(
        `/estates/${estateId}/assets?error=${encodeURIComponent(
          uploadError.message
        )}`
      );
    }

    const { error: docError } = await supabase.from("asset_documents").insert({
      asset_id: asset.id,
      storage_path: storagePath,
      file_name: file.name,
      file_type: file.type || null,
      file_size: file.size,
      uploaded_by: user.id,
    });

    if (docError) {
      redirect(
        `/estates/${estateId}/assets?error=${encodeURIComponent(
          docError.message
        )}`
      );
    }
  }

  redirect(`/estates/${estateId}/assets`);
}
