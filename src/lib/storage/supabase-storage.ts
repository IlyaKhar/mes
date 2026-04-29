import { createClient } from "@supabase/supabase-js";

export const supabaseStorageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "neos-files";

function getSupabaseStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Заполни NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY для CloudSpace");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function uploadToSupabaseStorage(input: {
  path: string;
  body: ArrayBuffer;
  contentType: string;
}) {
  const supabase = getSupabaseStorageClient();
  const { error } = await supabase.storage
    .from(supabaseStorageBucket)
    .upload(input.path, input.body, {
      contentType: input.contentType,
      upsert: true
    });

  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

  return input.path;
}

export async function downloadFromSupabaseStorage(path: string) {
  const supabase = getSupabaseStorageClient();
  const { data, error } = await supabase.storage
    .from(supabaseStorageBucket)
    .download(path);

  if (error) throw new Error(`Supabase Storage download failed: ${error.message}`);
  return data;
}

export async function removeFromSupabaseStorage(path: string) {
  const supabase = getSupabaseStorageClient();
  const { error } = await supabase.storage
    .from(supabaseStorageBucket)
    .remove([path]);

  if (error) throw new Error(`Supabase Storage remove failed: ${error.message}`);
}
