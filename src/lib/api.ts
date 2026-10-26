import { supabase } from './supabase';
import type { Inquiry, Product } from './types';

export async function fetchProducts(): Promise<Product[]> { const { data, error } = await supabase.from('products').select('*').eq('active', true).order('featured', { ascending: false }).order('created_at', { ascending: false }); if (error) throw error; return (data ?? []) as Product[]; }
export async function fetchProduct(id: string): Promise<Product | null> { const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle(); if (error) throw error; return data as Product | null; }
export async function submitInquiry(payload: Omit<Inquiry, 'id' | 'created_at' | 'status'>) { const { error } = await supabase.from('inquiries').insert({ ...payload, status: 'New' }); if (error) throw error; }
