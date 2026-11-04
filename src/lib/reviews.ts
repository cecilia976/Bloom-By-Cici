import { assertSupabaseConfigured, supabase } from './supabase';

export type CustomerReview = {
  id: string;
  customer_name: string;
  rating: number;
  feedback: string;
  created_at: string;
};

export async function fetchCustomerReviews(): Promise<CustomerReview[]> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('customer_reviews')
    .select('id, customer_name, rating, feedback, created_at')
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) throw error;
  return data ?? [];
}

export async function submitCustomerReview(review: {
  customer_name: string;
  rating: number;
  feedback: string;
}): Promise<CustomerReview> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from('customer_reviews')
    .insert(review)
    .select('id, customer_name, rating, feedback, created_at')
    .single();
  if (error) throw error;
  return data;
}

export function subscribeToCustomerReviews(onChange: () => void): () => void {
  assertSupabaseConfigured();
  const channel = supabase
    .channel('public-customer-reviews')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'customer_reviews' },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
