export type Category = 'Fresh & Preserved Bouquets' | 'Vases & Floral Arrangements' | 'Mirror & Wall Floral Decor';
export type StockStatus = 'In stock' | 'Low stock' | 'Out of stock';
export type Product = { id: string; title: string; category: Category; price: number; description: string; images: string[]; stock_status: StockStatus; stock_count: number; occasions: string[]; sizes: string[]; featured: boolean; created_at?: string };
export type CartItem = { cartId: string; product: Product; size: string; quantity: number; giftMessage: string; deliveryDate: string };
export type Inquiry = { id: string; full_name: string; email: string; event_date: string; budget_range: string; description: string; image_urls: string[]; status: 'New' | 'In Progress' | 'Completed'; created_at: string };
