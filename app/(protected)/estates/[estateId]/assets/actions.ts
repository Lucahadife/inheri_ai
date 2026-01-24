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
  const assetType = String(formData.get("asset_type") ?? "").trim();
  const assetCategory = String(formData.get("asset_category") ?? "").trim();
  const sizeLabel = String(formData.get("size_label") ?? "").trim();
  const valueLow = toNumber(formData.get("value_low"));
  const valueHigh = toNumber(formData.get("value_high"));
  const aiValueLow = toNumber(formData.get("ai_value_low"));
  const aiValueHigh = toNumber(formData.get("ai_value_high"));
  const aiConfidence = toNumber(formData.get("ai_confidence"));
  const aiFactors = String(formData.get("ai_factors") ?? "")
    .split("|")
    .filter(Boolean);
  const aiDisclaimer = String(formData.get("ai_disclaimer") ?? "").trim();
  const aiExplanation = String(formData.get("ai_explanation") ?? "").trim();
  const aiApproved = String(formData.get("ai_approved") ?? "") === "1";
  const docTitle = String(formData.get("doc_title") ?? "").trim();
  const docType = String(formData.get("doc_type") ?? "").trim();
  const docText = String(formData.get("doc_text") ?? "").trim();
  const aiSummary = String(formData.get("ai_summary") ?? "").trim();
  const docTypeAi = String(formData.get("doc_type_ai") ?? "").trim();
  const file = formData.get("document");

  if (!estateId || !name) {
    redirect(`/estates/${estateId}/assets?error=Name%20is%20required.`);
  }

  const supabase = await createClient();
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
      asset_type: assetType || null,
      asset_category: assetCategory || null,
      size_label: sizeLabel || null,
      description: description || null,
      location: location || null,
      notes: notes || null,
      value_low: valueLow,
      value_high: valueHigh,
      ai_value_low: aiValueLow,
      ai_value_high: aiValueHigh,
      ai_confidence: aiConfidence,
      ai_factors: aiFactors.length ? aiFactors : null,
      ai_disclaimer: aiDisclaimer || null,
      ai_explanation: aiExplanation || null,
      ai_approved: aiApproved,
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
      title: docTitle || file.name,
      doc_type: docTypeAi || docType || null,
      summary: docText || null,
      ai_summary: aiSummary || null,
      doc_text: docText || null,
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
