import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function uploadToSupabase(
  file: Buffer,
  bucket: string,
  path: string
): Promise<string> {
  // path should be relative to the bucket, e.g., "jobId/file.pdf"
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: 'application/octet-stream',
    upsert: true,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}


/**
 * Get file from Supabase storage
 */
export async function getSupabaseFile(path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from('resumes').download(path);
  if (error || !data) throw new Error(error?.message || 'Failed to download file');

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Delete file from Supabase
export async function deleteFromSupabase(path: string): Promise<void> {
  await supabase.storage.from('resumes').remove([path]);
}
