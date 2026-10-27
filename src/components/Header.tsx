import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowRight, Menu, ShoppingBag, X } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '../context/CartContext';

export default function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  const closeMenu = () => setOpen(false);

  return <header className="site-header">
    <div className="announcement">Small-batch flowers, made with feeling <span>✦</span> Free delivery on orders over $80</div>
    <div className="header-inner">
      <Logo />
      <nav className={`main-nav ${open ? 'is-open' : ''}`}>
        <NavLink to="/shop" onClick={closeMenu}>Shop all</NavLink>
        <NavLink to="/shop?category=Fresh%20%26%20Preserved%20Bouquets" onClick={closeMenu}>Bouquets</NavLink>
        <NavLink to="/shop?category=Vases%20%26%20Floral%20Arrangements" onClick={closeMenu}>Arrangements</NavLink>
        <NavLink to="/shop?category=Mirror%20%26%20Wall%20Floral%20Decor" onClick={closeMenu}>Mirror décor</NavLink>
        <NavLink to="/custom-orders" onClick={closeMenu}>Custom orders</NavLink>
      </nav>
      <div className="header-actions">
        <Link to="/shop" className="header-cta">Order yours <ArrowRight size={14} /></Link>
        <button className="cart-button" onClick={onCartOpen} aria-label={`Open cart with ${count} items`}><ShoppingBag size={20} /><span>Cart</span>{count > 0 && <b>{count}</b>}</button>
        <button className="icon-button menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X /> : <Menu />}</button>
      </div>
    </div>
  </header>;
}
