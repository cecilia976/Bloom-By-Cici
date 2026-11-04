import { assertSupabaseConfigured, supabase } from './supabase';

export type GalleryItem = {
  id: string;
  storage_path: string;
  image_url: string;
  caption: string;
  display_order: number;
  is_public: boolean;
  created_at: string;
};

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const maximumImageSize = 8 * 1024 * 1024;

export function validateImageFile(file: File): void {
  if (!imageTypes.has(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  if (file.size > maximumImageSize) {
    throw new Error('Images must be 8 MB or smaller.');
  }
}

export async function uploadAdminImage(file: File): Promise<{ path: string; url: string }> {
  assertSupabaseConfigured();
  validateImageFile(file);
  const extension = imageExtensions[file.type];
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('bloom-assets').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('bloom-assets').getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function deleteAdminImages(paths: string[]): Promise<void> {
  assertSupabaseConfigured();
  if (!paths.length) return;
  const { error } = await supabase.storage.from('bloom-assets').remove(paths);
  if (error) throw error;
}

export async function readSiteContent<T>(key: string, fallback: T): Promise<T> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('site_content')
    .select('content_value')
    .eq('content_key', key)
    .maybeSingle();
  if (error) throw error;
  return (data?.content_value as T | undefined) ?? fallback;
}

export async function saveSiteContent(key: string, value: Record<string, unknown>): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await supabase
    .from('site_content')
    .upsert({ content_key: key, content_value: value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function fetchGalleryItems(): Promise<GalleryItem[]> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GalleryItem[];
}

export async function deleteGalleryItem(item: GalleryItem): Promise<void> {
  assertSupabaseConfigured();
  const { error: rowError } = await supabase.from('gallery_items').delete().eq('id', item.id);
  if (rowError) throw rowError;
  await deleteAdminImages([item.storage_path]);
}
