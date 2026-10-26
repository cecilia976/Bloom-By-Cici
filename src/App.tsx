import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import CustomOrders from './pages/CustomOrders';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';

function Storefront() { const [cartOpen, setCartOpen] = useState(false); return <><Header onCartOpen={() => setCartOpen(true)} /><CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} /><main><Routes><Route path="/" element={<Home onCartOpen={() => setCartOpen(true)} />} /><Route path="/shop" element={<Shop />} /><Route path="/product/:id" element={<ProductDetail />} /><Route path="/custom-orders" element={<CustomOrders />} /><Route path="/cart" element={<Cart />} /><Route path="/checkout" element={<Checkout />} /></Routes></main><Footer /></>; }
export default function App() { return <CartProvider><Routes><Route path="/admin/login" element={<AdminLogin />} /><Route path="/admin/*" element={<Admin />} /><Route path="*" element={<Storefront />} /></Routes></CartProvider>; }
