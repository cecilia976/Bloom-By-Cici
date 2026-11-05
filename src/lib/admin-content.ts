import { assertSupabaseConfigured, supabase } from './supabase';
import { supabaseUrl } from './supabase-config';

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

export async function deleteAdminImageIfUnused(
  path: string,
  url: string,
  excludedGalleryId?: string,
): Promise<void> {
  assertSupabaseConfigured();
  const [productsResult, galleryResult, contentResult, inquiriesResult] = await Promise.all([
    supabase.from('products').select('id').contains('images', [url]).limit(1),
    supabase.from('gallery_items').select('id,storage_path,image_url'),
    supabase.from('site_content').select('content_value'),
    supabase.from('inquiries').select('id').contains('image_urls', [url]).limit(1),
  ]);
  const queryError = productsResult.error ?? galleryResult.error ?? contentResult.error ?? inquiriesResult.error;
  if (queryError) throw queryError;

  const referencedByProduct = (productsResult.data ?? []).length > 0;
  const referencedByGallery = (galleryResult.data ?? []).some((item) =>
    item.id !== excludedGalleryId && (item.storage_path === path || item.image_url === url),
  );
  const referencedByContent = (contentResult.data ?? []).some((item) =>
    JSON.stringify(item.content_value).includes(url) || JSON.stringify(item.content_value).includes(path),
  );
  const referencedByInquiry = (inquiriesResult.data ?? []).length > 0;

  if (!referencedByProduct && !referencedByGallery && !referencedByContent && !referencedByInquiry) {
    await deleteAdminImages([path]);
  }
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
  await deleteAdminImageIfUnused(item.storage_path, item.image_url, item.id);
}

export async function replaceGalleryImage(
  item: GalleryItem,
  file: File,
): Promise<GalleryItem> {
  assertSupabaseConfigured();
  const upload = await uploadAdminImage(file);
  const { data, error } = await supabase
    .from('gallery_items')
    .update({ storage_path: upload.path, image_url: upload.url })
    .eq('id', item.id)
    .select()
    .single();

  if (error) {
    try {
      await deleteAdminImages([upload.path]);
    } catch (cleanupError) {
      throw new Error(
        `The image could not be replaced and the new upload may need manual cleanup: ${cleanupError instanceof Error ? cleanupError.message : 'unknown cleanup error'}`,
      );
    }
    throw error;
  }

  try {
    await deleteAdminImageIfUnused(item.storage_path, item.image_url, item.id);
  } catch (error) {
    throw new Error(
      `The image replacement was saved, but the previous file could not be cleaned up: ${error instanceof Error ? error.message : 'unknown cleanup error'}`,
    );
  }
  return data as GalleryItem;
}

export function getAdminImageStoragePath(url: string): string | null {
  try {
    const imageUrl = new URL(url);
    const projectUrl = new URL(supabaseUrl);
    if (imageUrl.origin !== projectUrl.origin) return null;
    const marker = '/storage/v1/object/public/bloom-assets/';
    const markerIndex = imageUrl.pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    return decodeURIComponent(imageUrl.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}
