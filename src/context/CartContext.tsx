import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '../lib/types';

type CartContextValue = { items: CartItem[]; count: number; subtotal: number; addItem: (product: Product, size: string, quantity: number, giftMessage: string, deliveryDate: string) => void; updateQuantity: (cartId: string, quantity: number) => void; removeItem: (cartId: string) => void; clearCart: () => void };
const CartContext = createContext<CartContextValue | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => { try { return JSON.parse(localStorage.getItem('bloom-cart') ?? '[]'); } catch { return []; } });
  useEffect(() => localStorage.setItem('bloom-cart', JSON.stringify(items)), [items]);
  const value = useMemo(() => ({ items, count: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), addItem: (product: Product, size: string, quantity: number, giftMessage: string, deliveryDate: string) => setItems(current => { const cartId = `${product.id}-${size}-${giftMessage}-${deliveryDate}`; const existing = current.find(item => item.cartId === cartId); return existing ? current.map(item => item.cartId === cartId ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock_count || 99) } : item) : [...current, { cartId, product, size, quantity, giftMessage, deliveryDate }]; }), updateQuantity: (cartId: string, quantity: number) => setItems(current => current.map(item => item.cartId === cartId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock_count || 99)) } : item)), removeItem: (cartId: string) => setItems(current => current.filter(item => item.cartId !== cartId)), clearCart: () => setItems([]) }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('CartProvider is missing'); return context; }
