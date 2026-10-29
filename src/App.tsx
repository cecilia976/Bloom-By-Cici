import type React from "react";
import { useState } from "react";
import {
  ArrowRight,
  Menu,
  X,
  ShoppingBag,
  Instagram,
  Facebook,
  Heart,
  Leaf,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import "./styles.css";

const products = [
  {
    id: 1,
    name: "Classic Red Roses",
    category: "ROSES",
    price: 2500,
    image:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 2,
    name: "Blush Pink Bouquet",
    category: "BOUQUETS",
    price: 3200,
    image:
      "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 3,
    name: "White Rose Elegance",
    category: "ROSES",
    price: 2800,
    image:
      "https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 4,
    name: "Garden Romance",
    category: "SPECIAL OCCASIONS",
    price: 4500,
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=85",
  },
];

const collections = [
  {
    title: "Beautiful Roses",
    subtitle: "Timeless flowers for every moment",
    image:
      "https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Thoughtful Bouquets",
    subtitle: "Make somebody's day special",
    image:
      "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Gifts & Occasions",
    subtitle: "Flowers that say it beautifully",
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=85",
  },
];

const money = (price: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(price);

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoAvailable, setLogoAvailable] = useState(true);
  const [cartItems, setCartItems] = useState<
  { productId: number; quantity: number }[]
>([]);
const [isCartOpen, setIsCartOpen] = useState(false);
const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

const [customerName, setCustomerName] = useState("");
const [customerPhone, setCustomerPhone] = useState("");
const [deliveryAddress, setDeliveryAddress] = useState("");
const [orderNote, setOrderNote] = useState("");
const [orderConfirmation, setOrderConfirmation] = useState("");

const cartCount = cartItems.reduce(
  (total, item) => total + item.quantity,
  0
);

const cartDetails = cartItems
  .map((item) => {
    const product = products.find((p) => p.id === item.productId);

    return product ? { ...product, quantity: item.quantity } : null;
  })
  .filter((item) => item !== null);

const cartSubtotal = cartDetails.reduce(
  (total, item) => total + item.price * item.quantity,
  0
);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }
  function addToBag(productId: number) {
  setOrderConfirmation("");

  setCartItems((currentItems) => {
    const existingItem = currentItems.find(
      (item) => item.productId === productId
    );

    if (existingItem) {
      return currentItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }

    return [...currentItems, { productId, quantity: 1 }];
  });
}

function changeQuantity(productId: number, amount: number) {
  setCartItems((currentItems) =>
    currentItems
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + amount }
          : item
      )
      .filter((item) => item.quantity > 0)
  );
}

function removeFromBag(productId: number) {
  setCartItems((currentItems) =>
    currentItems.filter((item) => item.productId !== productId)
  );
}

function placeDemoOrder(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (cartDetails.length === 0) {
    return;
  }

  const orderReference = `BC-${Date.now().toString().slice(-6)}`;

  setOrderConfirmation(
    `Thank you, ${customerName}! Your demo order ${orderReference} has been recorded on this page. Total: ${money(cartSubtotal)}. No payment was taken and the order has not been sent to Bloom By Cici.`
  );

  setCartItems([]);
  setIsCheckoutOpen(false);
  setCustomerName("");
  setCustomerPhone("");
  setDeliveryAddress("");
  setOrderNote("");
}

  return (
    <div className="site-shell">
      <div className="announcement">
        Thoughtful flowers for the moments that matter
      </div>

      <header className="site-header">
        <div className="header-inner">
          <button
            className="icon-button mobile-menu"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <a className="brand" href="#home" onClick={() => setMenuOpen(false)}>
            {logoAvailable ? (
              <img
                className="brand-logo"
                src="/bloom-by-cici-logo.svg"
                alt="Bloom By Cici — Flowers & Gifts"
                onError={() => setLogoAvailable(false)}
              />
            ) : (
              <>
                <span className="brand-name">Bloom</span>
                <span className="brand-subtitle">BY CICI · FLOWERS & GIFTS</span>
              </>
            )}
          </a>

          <nav
            id="primary-navigation"
            className={menuOpen ? "navigation navigation-open" : "navigation"}
            aria-label="Main navigation"
          >
            <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#collections" onClick={() => setMenuOpen(false)}>Collections</a>
            <a href="#shop" onClick={() => setMenuOpen(false)}>Shop flowers</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>Our story</a>
            <a href="tel:+254710303757" onClick={() => setMenuOpen(false)}>Contact +254 710 303 757</a>
          </nav>

          <button
            className="cart-button"
            aria-label={`Open shopping bag with ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            onClick={() => {
              setIsCartOpen(true);
              setIsCheckoutOpen(false);
            }}
          >
            <ShoppingBag size={19} />
            <span>Bag</span>
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=2200&q=90"
            alt="A beautiful arrangement of fresh flowers"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <span className="eyebrow hero-eyebrow">
              BLOOM BY CICI · FLOWERS & GIFTS
            </span>
            <h1>Flowers that speak<br />from the heart.</h1>
            <p>
              Find a thoughtful bouquet for a celebration, a kind gesture,
              or simply to bring a little beauty into the day.
            </p>
            <button className="button button-light" onClick={() => scrollTo("shop")}>
              Shop flowers <ArrowRight size={17} />
            </button>
          </div>
          <span className="hero-caption">A LITTLE BEAUTY, FOR YOUR MOMENT.</span>
        </section>

        <section className="intro section-wrap">
          <span className="eyebrow">A THOUGHTFUL WAY TO SAY IT</span>
          <h2>Flowers for the moments that matter.</h2>
          <p>
            Explore roses, considered bouquets, and floral gifts to mark
            the moments you want to make a little more meaningful.
          </p>
        </section>

        <section className="collections section-wrap" id="collections">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A PLACE TO BEGIN</span>
              <h2>Find your kind of flowers</h2>
            </div>
            <button className="text-link" onClick={() => scrollTo("shop")}>
              Shop all flowers <ArrowRight size={16} />
            </button>
          </div>

          <div className="collection-grid">
            {collections.map((collection, index) => (
              <button
                className="collection-card"
                key={collection.title}
                onClick={() => scrollTo("shop")}
              >
                <img src={collection.image} alt={collection.title} />
                <span className="collection-number">0{index + 1}</span>
                <span className="collection-info">
                  <strong>{collection.title}</strong>
                  <small>{collection.subtitle}</small>
                  <span className="collection-link">
                    Explore collection <ArrowRight size={15} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="occasions-section section-wrap" aria-labelledby="occasions-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FOR EVERY KIND OF FEELING</span>
              <h2 id="occasions-title">Make their moment bloom</h2>
            </div>
          </div>
          <div className="occasion-grid">
            {[
              { title: "Birthdays", detail: "A bouquet to brighten their day", category: "BOUQUETS" },
              { title: "Anniversaries", detail: "A timeless way to say I love you", category: "ROSES" },
              { title: "Celebrations", detail: "Flowers for the moments worth marking", category: "SPECIAL OCCASIONS" },
              { title: "Just because", detail: "A thoughtful surprise, any day", category: "BOUQUETS" },
            ].map((occasion, index) => (
              <button
                className="occasion-card"
                key={occasion.title}
                onClick={() => scrollTo("shop")}
              >
                <span className="occasion-number">0{index + 1}</span>
                <span className="occasion-category">{occasion.category}</span>
                <strong>{occasion.title}</strong>
                <span className="occasion-detail">{occasion.detail}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-wrap">
            <div className="section-heading">
              <div>
                <span className="eyebrow">A FEW FAVOURITES</span>
                <h2>Flowers to fall for</h2>
              </div>
              <span className="muted-copy">Our floral favourites</span>
            </div>

            <div className="product-grid">
              {products.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <img src={product.image} alt={`${product.name} floral arrangement`} />
                    <span className="product-label">{product.category}</span>
                    <button
                      className="quick-add"
                      aria-label={`Add ${product.name} to bag`}
                      onClick={() => {
                        addToBag(product.id);
                        setIsCartOpen(true);
                      }}
                    >
                      <ShoppingBag size={18} />
                      <span>Add to bag</span>
                    </button>
                  </div>
                  <div className="product-details">
                    <div>
                      <h3>{product.name}</h3>
                      <p>Fresh floral selection</p>
                    </div>
                    <strong>{money(product.price)}</strong>
                  </div>
                </article>
              ))}
            </div>
            <p className="demo-note">
              Product prices and availability are illustrative and can be
              updated to match your actual catalogue.
            </p>
          </div>
        </section>

        <section className="story-section" id="about">
          <div className="story-image">
            <img
              src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1100&q=85"
              alt="An elegant hand-tied floral bouquet"
            />
          </div>
          <div className="story-copy">
            <span className="eyebrow">A LITTLE ABOUT BLOOM BY CICI</span>
            <h2>Every flower can say something.</h2>
            <p>
              At Bloom By Cici, flowers are a thoughtful way to make a
              moment feel personal. Explore a considered selection of roses,
              bouquets, and gifts for the people and occasions you care about.
            </p>
            <p>
              Looking for something specific? Get in touch to share your idea.
            </p>
            <button className="button button-dark" onClick={() => scrollTo("contact")}>
              Get in touch <ArrowRight size={17} />
            </button>
          </div>
        </section>

        <section className="values-strip">
          <div>
            <Leaf />
            <h3>Thoughtfully arranged</h3>
            <p>Explore a considered selection of floral styles.</p>
          </div>
          <div>
            <Heart />
            <h3>For every occasion</h3>
            <p>Find flowers for celebrations and just-because days.</p>
          </div>
          <div>
            <ShoppingBag />
            <h3>Personal service</h3>
            <p>Have an idea in mind? We would love to hear about it.</p>
          </div>
        </section>

        <section className="newsletter" id="contact">
          <span className="eyebrow">A LITTLE FLOWER MAIL</span>
          <h2>Let good things bloom.</h2>
          <p>Sign up for floral inspiration, special occasions and lovely updates.</p>
          {subscribed ? (
            <p className="success-message">
              Thank you for your interest! Newsletter signup is currently a
              visual demo and has not sent your email to a mailing list.
            </p>
          ) : (
            <form
              className="newsletter-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (email.trim()) setSubscribed(true);
              }}
            >
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                aria-label="Your email address"
              />
              <button type="submit">Sign me up <ArrowRight size={16} /></button>
            </form>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand" href="#home">
              {logoAvailable ? (
                <img
                  className="brand-logo"
                  src="/bloom-by-cici-logo.svg"
                  alt="Bloom By Cici — Flowers & Gifts"
                  onError={() => setLogoAvailable(false)}
                />
              ) : (
                <>
                  <span className="brand-name">Bloom</span>
                  <span className="brand-subtitle">BY CICI · FLOWERS & GIFTS</span>
                </>
              )}
            </a>
            <p>            Flowers and gifts for the moments you want to make meaningful.</p>
          </div>
          <div>
            <h4>EXPLORE</h4>
            <a href="#collections">Collections</a>
            <a href="#shop">Shop flowers</a>
            <a href="#about">Our story</a>
          </div>
          <div>
            <h4>GET IN TOUCH</h4>
            <a href="tel:+254710303757">Call +254 710 303 757</a>
            <a href="#contact">Flower enquiries</a>
            <a href="#collections">Explore collections</a>
          </div>
          <div>
            <h4>FOLLOW OUR BLOOM</h4>
            <div className="social-links">
              <a href="https://www.instagram.com/" aria-label="Instagram">
                <Instagram />
              </a>
              <a href="https://www.facebook.com/" aria-label="Facebook">
                <Facebook />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Bloom By Cici</span>
          <span>Made with care, one bloom at a time.</span>
        </div>
      </footer>

      {isCartOpen && (
        <div
          className="cart-overlay"
          onClick={() => setIsCartOpen(false)}
        >
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your shopping bag"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cart-drawer-header">
              <div>
                <span className="eyebrow">BLOOM BY CICI</span>
                <h2>{isCheckoutOpen ? "Delivery details" : "Your shopping bag"}</h2>
              </div>

              <button
                className="cart-close"
                aria-label="Close shopping bag"
                onClick={() => setIsCartOpen(false)}
              >
                <X />
              </button>
            </div>

            {orderConfirmation ? (
              <div className="cart-confirmation">
                <span className="confirmation-icon">✓</span>
                <h3>Thank you for your order!</h3>
                <p>{orderConfirmation}</p>
                <button
                  className="button button-dark"
                  onClick={() => {
                    setOrderConfirmation("");
                    setIsCartOpen(false);
                  }}
                >
                  Continue shopping
                </button>
              </div>
            ) : isCheckoutOpen ? (
              <form className="checkout-form" onSubmit={placeDemoOrder}>
                <p className="checkout-intro">
                  Enter your details to preview a demo order. No payment is
                  collected.
                </p>

                <label htmlFor="customer-name">Full name</label>
                <input
                  id="customer-name"
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Your full name"
                  required
                />

                <label htmlFor="customer-phone">Phone number</label>
                <input
                  id="customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="e.g. 07XX XXX XXX"
                  required
                />

                <label htmlFor="delivery-address">Delivery location</label>
                <textarea
                  id="delivery-address"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="Town, estate, street or delivery instructions"
                  rows={3}
                  required
                />

                <label htmlFor="order-note">Gift message or extra instructions (optional)</label>
                <textarea
                  id="order-note"
                  value={orderNote}
                  onChange={(event) => setOrderNote(event.target.value)}
                  placeholder="Write a short gift message..."
                  rows={2}
                />

                <div className="cart-subtotal">
                  <span>Order total</span>
                  <strong>{money(cartSubtotal)}</strong>
                </div>

                <button className="button button-dark checkout-submit" type="submit">
                  Place demo order
                </button>

                <button
                  className="cart-back-button"
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                >
                  Back to bag
                </button>
              </form>
            ) : (
              <>
                <div className="cart-items">
                  {cartDetails.length === 0 ? (
                    <div className="cart-empty">
                      <ShoppingBag size={36} />
                      <h3>Your bag is waiting for blooms.</h3>
                      <p>Add a bouquet to get started.</p>
                      <button
                        className="button button-dark"
                        onClick={() => {
                          setIsCartOpen(false);
                          scrollTo("shop");
                        }}
                      >
                        Explore flowers
                      </button>
                    </div>
                  ) : (
                    cartDetails.map((item) => (
                      <article className="cart-item" key={item.id}>
                        <img src={item.image} alt={item.name} />

                        <div className="cart-item-info">
                          <h3>{item.name}</h3>
                          <p>{money(item.price)}</p>

                          <div className="quantity-controls">
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name} quantity`}
                              onClick={() => changeQuantity(item.id, -1)}
                            >
                              <Minus size={15} />
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              type="button"
                              aria-label={`Increase ${item.name} quantity`}
                              onClick={() => changeQuantity(item.id, 1)}
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="cart-item-end">
                          <strong>{money(item.price * item.quantity)}</strong>
                          <button
                            className="remove-item"
                            type="button"
                            aria-label={`Remove ${item.name}`}
                            onClick={() => removeFromBag(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                {cartDetails.length > 0 && (
                  <div className="cart-footer">
                    <div className="cart-subtotal">
                      <span>Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})</span>
                      <strong>{money(cartSubtotal)}</strong>
                    </div>

                    <p className="cart-disclaimer">
                      Delivery charges, if applicable, are not included.
                    </p>

                    <button
                      className="button button-dark checkout-submit"
                      onClick={() => setIsCheckoutOpen(true)}
                    >
                      Continue to checkout <ArrowRight size={17} />
                    </button>

                    <button
                      className="cart-back-button"
                      onClick={() => setIsCartOpen(false)}
                    >
                      Continue shopping
                    </button>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
