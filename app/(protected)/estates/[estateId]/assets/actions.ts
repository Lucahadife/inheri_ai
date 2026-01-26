"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/data/supabase/server";

const toNumber = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const normalizeEstateId = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned || cleaned === "undefined" || cleaned === "null") return "";
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(cleaned) ? cleaned : "";
};

export async function createAsset(formData: FormData) {
  const estateIdRaw = String(
    formData.get("estate_id") ?? formData.get("estateId") ?? ""
  );
  const estatePath = String(formData.get("estate_path") ?? "").trim();
  const estateFromPath =
    estatePath.match(/\/estates\/([^/]+)\/assets/)?.[1] ?? "";
  const referer = (await headers()).get("referer") ?? "";
  const estateFromReferer =
    referer.match(/\/estates\/([^/]+)\/assets/)?.[1] ?? "";
  const estateIdClean =
    normalizeEstateId(estateIdRaw) ||
    normalizeEstateId(estateFromPath) ||
    normalizeEstateId(estateFromReferer);
  const docFile = formData.get("document");
  const photoFiles = formData
    .getAll("asset_photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const docTitle = String(formData.get("doc_title") ?? "").trim();
  const fallbackName =
    docTitle || (docFile instanceof File ? docFile.name : "") || "Untitled asset";
  const name = String(formData.get("name") ?? "").trim() || fallbackName;
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
  const docType = String(formData.get("doc_type") ?? "").trim();
  const docText = String(formData.get("doc_text") ?? "").trim();
  const aiSummary = String(formData.get("ai_summary") ?? "").trim();
  const docTypeAi = String(formData.get("doc_type_ai") ?? "").trim();

  if (!estateIdClean) {
    redirect(`/estates?error=Estate%20id%20is%20missing%20or%20invalid.`);
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
      estate_id: estateIdClean,
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
      `/estates/${estateIdClean}/assets?error=${encodeURIComponent(
        assetError?.message ?? "Failed"
      )}`
    );
  }

  if (docFile instanceof File && docFile.size > 0) {
    const safeName = sanitizeFileName(docFile.name);
    const storagePath = `${estateIdClean}/${asset.id}/docs/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await docFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("asset-docs")
      .upload(storagePath, buffer, {
        contentType: docFile.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      redirect(
        `/estates/${estateIdClean}/assets?error=${encodeURIComponent(
          uploadError.message
        )}`
      );
    }

    const { error: docError } = await supabase.from("asset_documents").insert({
      asset_id: asset.id,
      storage_path: storagePath,
      file_name: docFile.name,
      file_type: docFile.type || null,
      file_size: docFile.size,
      title: docTitle || docFile.name,
      doc_type: docTypeAi || docType || null,
      summary: docText || null,
      ai_summary: aiSummary || null,
      doc_text: docText || null,
      doc_role: "document",
      uploaded_by: user.id,
    });

    if (docError) {
      redirect(
        `/estates/${estateIdClean}/assets?error=${encodeURIComponent(
          docError.message
        )}`
      );
    }
  }

  if (photoFiles.length) {
    for (const photo of photoFiles) {
      const safeName = sanitizeFileName(photo.name);
      const storagePath = `${estateIdClean}/${asset.id}/photos/${Date.now()}-${safeName}`;
      const buffer = Buffer.from(await photo.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("asset-docs")
        .upload(storagePath, buffer, {
          contentType: photo.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        redirect(
          `/estates/${estateIdClean}/assets?error=${encodeURIComponent(
            uploadError.message
          )}`
        );
      }

      const { error: photoError } = await supabase
        .from("asset_documents")
        .insert({
          asset_id: asset.id,
          storage_path: storagePath,
          file_name: photo.name,
          file_type: photo.type || null,
          file_size: photo.size,
          title: photo.name,
          doc_role: "photo",
          uploaded_by: user.id,
        });

      if (photoError) {
        redirect(
          `/estates/${estateIdClean}/assets?error=${encodeURIComponent(
            photoError.message
          )}`
        );
      }
    }
  }

  revalidatePath(`/estates/${estateIdClean}/assets`);
  revalidatePath(`/estates/${estateIdClean}/preferences`);
  redirect(`/estates/${estateIdClean}/assets`);
}
