import type React from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Menu,
  X,
  Instagram,
  Facebook,
  Heart,
  Leaf,
  Flower2,
  MessageCircle,
  Sparkles,
  Sun,
} from "lucide-react";
import "./styles.css";

const products = [
  {
    id: 1,
    name: "Classic Red Roses",
    category: "HANDMADE BOUQUETS",
    description: "A hand-tied bouquet of classic red roses, made to make a heartfelt moment feel special.",
    image:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 2,
    name: "Blush Pink Bouquet",
    category: "HANDMADE BOUQUETS",
    description: "Soft pink blooms arranged by hand for birthdays, anniversaries, and little just-because moments.",
    image:
      "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: 3,
    name: "The Keepsake Vase",
    category: "FLOWERS IN VASES",
    description: "A sculptural vase filled with thoughtfully arranged blooms to bring a little beauty into your home.",
    image:
      "https://images.pexels.com/photos/9957266/pexels-photo-9957266.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  },
  {
    id: 4,
    name: "Pink Hour Arrangement",
    category: "FLOWERS IN VASES",
    description: "Pink roses and airy fillers, finished in a softly curved glass vase for a thoughtful home accent.",
    image:
      "https://images.pexels.com/photos/15325501/pexels-photo-15325501.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  },
  {
    id: 5,
    name: "Petal Frame Mirror",
    category: "MIRROR DÉCOR",
    description: "A statement mirror edged with hand-placed blooms and preserved texture, made to brighten a favourite space.",
    image:
      "https://images.pexels.com/photos/15409846/pexels-photo-15409846.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  },
  {
    id: 6,
    name: "The Bloom Wall Moment",
    category: "MIRROR DÉCOR",
    description: "A dreamy floral wall piece designed to bring softness, colour, and a little theatre to your home.",
    image:
      "https://images.pexels.com/photos/30368728/pexels-photo-30368728.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  },
];

const collections = [
  {
    title: "Handmade bouquets",
    subtitle: "Thoughtful flowers, tied by hand",
    image:
      "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Flowers in vases",
    subtitle: "A little beauty for your home",
    image:
      "https://images.pexels.com/photos/9957266/pexels-photo-9957266.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  },
  {
    title: "Floral mirror décor",
    subtitle: "Hand-finished pieces for your walls",
    image:
      "https://images.pexels.com/photos/15409846/pexels-photo-15409846.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  },
];

type Product = (typeof products)[number];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoAvailable, setLogoAvailable] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    const productId = Number(new URLSearchParams(window.location.search).get("product"));
    return products.find((product) => product.id === productId) ?? null;
  });
  const [inquiryOpen, setInquiryOpen] = useState(() => {
    const productId = Number(new URLSearchParams(window.location.search).get("product"));
    return products.some((product) => product.id === productId);
  });
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [validation, setValidation] = useState<{ name?: string; message?: string }>({});
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    function syncProductFromUrl() {
      const productId = Number(new URLSearchParams(window.location.search).get("product"));
      const product = products.find((item) => item.id === productId) ?? null;
      setSelectedProduct(product);
      setInquiryOpen(product !== null);
    }

    window.addEventListener("popstate", syncProductFromUrl);
    return () => window.removeEventListener("popstate", syncProductFromUrl);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  function resetInquiry() {
    setInquiryName("");
    setInquiryMessage("");
    setValidation({});
    setWhatsappUrl("");
  }

  function openProduct(product: Product) {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("product", String(product.id));
    window.history.pushState(null, "", url);
    resetInquiry();
    setSelectedProduct(product);
    setInquiryOpen(true);
  }

  function openCustomInquiry() {
    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    window.history.pushState(null, "", url);
    resetInquiry();
    setSelectedProduct(null);
    setInquiryOpen(true);
  }

  function closeInquiry() {
    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    url.hash = "shop";
    window.history.pushState(null, "", url);
    setSelectedProduct(null);
    setInquiryOpen(false);
    setValidation({});
    setWhatsappUrl("");
  }

  function getProductUrl(product: Product) {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("product", String(product.id));
    return url.toString();
  }

  function submitInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = {
      name: inquiryName.trim() ? undefined : "Please enter your name.",
      message: inquiryMessage.trim() ? undefined : "Please tell us what you are looking for.",
    };
    setValidation(errors);
    if (errors.name || errors.message) return;

    const productDetails = selectedProduct
      ? `I'm interested in ${selectedProduct.name} (${selectedProduct.category.toLowerCase()}).\nProduct link: ${getProductUrl(selectedProduct)}`
      : "I'd love to discuss a custom design.";
    const message = [
      `Hi Bloom By Cici! My name is ${inquiryName.trim()}.`,
      productDetails,
      `My inquiry: ${inquiryMessage.trim()}`,
      "I understand this is an inquiry, not a confirmed order. I'd like to discuss availability, pricing, delivery, and any other details here.",
      "Thank you!",
    ].join("\n\n");
    const url = `https://wa.me/254794541304?text=${encodeURIComponent(message)}`;
    setWhatsappUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
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
            <a
              href="#contact"
              onClick={(event) => {
                event.preventDefault();
                setMenuOpen(false);
                openCustomInquiry();
              }}
            >
              Contact us
            </a>
          </nav>
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
              { title: "Birthdays", detail: "A bouquet to brighten their day", category: "BOUQUETS", icon: <Flower2 size={20} aria-hidden="true" /> },
              { title: "Anniversaries", detail: "A timeless way to say I love you", category: "ROSES", icon: <Heart size={20} aria-hidden="true" /> },
              { title: "Celebrations", detail: "Flowers for the moments worth marking", category: "SPECIAL OCCASIONS", icon: <Sparkles size={20} aria-hidden="true" /> },
              { title: "Just because", detail: "A thoughtful surprise, any day", category: "BOUQUETS", icon: <Sun size={20} aria-hidden="true" /> },
            ].map((occasion, index) => (
              <button
                className="occasion-card"
                key={occasion.title}
                onClick={() => scrollTo("shop")}
              >
                <span className="occasion-number">0{index + 1}</span>
                <span className="occasion-category">{occasion.category}</span>
                <span className="occasion-mark">{occasion.icon}</span>
                <strong>{occasion.title}</strong>
                <span className="occasion-detail">{occasion.detail}</span>
                <ArrowRight className="occasion-arrow" size={17} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-wrap">
            <div className="section-heading">
              <div>
                <span className="eyebrow">A FEW FAVOURITES</span>
                <h2>Flowers and décor to fall for</h2>
              </div>
              <span className="muted-copy">Handmade pieces for gifting and home</span>
            </div>

            <div className="product-grid">
              {products.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <img src={product.image} alt={product.name} />
                    <span className="product-label">{product.category}</span>
                    <button
                      className="quick-add"
                      aria-label={`View details for ${product.name}`}
                      onClick={() => openProduct(product)}
                    >
                      <span>View details</span>
                      <ArrowRight size={17} />
                    </button>
                  </div>
                  <div className="product-details">
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="demo-note">
              Every piece is handmade. Ask about current availability, pricing,
              and delivery when you message Bloom By Cici on WhatsApp.
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
              At Bloom By Cici, handmade bouquets, flowers in vases, and floral
              mirror décor make a moment or a favourite room feel personal.
            </p>
            <p>
              Looking for something specific? Tell Cici about your custom design idea.
            </p>
            <button className="button button-dark" onClick={openCustomInquiry}>
              Request a custom design <ArrowRight size={17} />
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
            <MessageCircle />
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
            <button className="footer-link" type="button" onClick={openCustomInquiry}>Flower enquiries</button>
            <a href="#shop">Browse handmade pieces</a>
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
          <span>WhatsApp inquiries are not confirmed orders. Details are discussed directly with Bloom By Cici.</span>
        </div>
      </footer>

      {inquiryOpen && (
        <InquiryModal
          product={selectedProduct}
          name={inquiryName}
          message={inquiryMessage}
          validation={validation}
          whatsappUrl={whatsappUrl}
          onNameChange={(value) => {
            setInquiryName(value);
            setValidation((current) => ({ ...current, name: undefined }));
            setWhatsappUrl("");
          }}
          onMessageChange={(value) => {
            setInquiryMessage(value);
            setValidation((current) => ({ ...current, message: undefined }));
            setWhatsappUrl("");
          }}
          onSubmit={submitInquiry}
          onClose={closeInquiry}
        />
      )}
    </div>
  );
}

type InquiryModalProps = {
  product: Product | null;
  name: string;
  message: string;
  validation: { name?: string; message?: string };
  whatsappUrl: string;
  onNameChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

function InquiryModal({
  product,
  name,
  message,
  validation,
  whatsappUrl,
  onNameChange,
  onMessageChange,
  onSubmit,
  onClose,
}: InquiryModalProps) {
  return (
    <div className="inquiry-overlay" onMouseDown={onClose}>
      <section
        className={`inquiry-dialog${product ? " has-product" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="inquiry-close" type="button" onClick={onClose} aria-label="Close inquiry">
          <X size={20} />
        </button>
        <div className="inquiry-product">
          {product ? (
            <>
              <img src={product.image} alt={product.name} />
              <span className="eyebrow">{product.category}</span>
              <h2 id="inquiry-title">{product.name}</h2>
              <p>{product.description}</p>
            </>
          ) : (
            <>
              <span className="eyebrow">LET’S MAKE IT PERSONAL</span>
              <h2 id="inquiry-title">Bring us your beautiful idea.</h2>
              <p>
                Share what you have in mind for a custom bouquet, mirror décor,
                or a floral piece for your home.
              </p>
            </>
          )}
        </div>
        <form className="inquiry-form" onSubmit={onSubmit} noValidate>
          <div className="inquiry-form-heading">
            <span className="eyebrow">A FRIENDLY FIRST STEP</span>
            <h3>{product ? "Ask about this piece" : "Start a custom request"}</h3>
            <p>Leave your name and a note for Cici. No phone number needed.</p>
          </div>
          <label className="inquiry-field" htmlFor="inquiry-name">
            Your name
            <input
              id="inquiry-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="What should we call you?"
              aria-invalid={Boolean(validation.name)}
              aria-describedby={validation.name ? "inquiry-name-error" : undefined}
              required
            />
            {validation.name && <span className="field-error" id="inquiry-name-error" role="alert">{validation.name}</span>}
          </label>
          <label className="inquiry-field" htmlFor="inquiry-message">
            Your inquiry
            <textarea
              id="inquiry-message"
              rows={5}
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder={product
                ? "What would you like to know about this piece? Share the occasion, colours, or any details..."
                : "Tell Cici about your idea, the style or colours you have in mind, and any questions..."}
              aria-invalid={Boolean(validation.message)}
              aria-describedby={validation.message ? "inquiry-message-error" : undefined}
              required
            />
            {validation.message && <span className="field-error" id="inquiry-message-error" role="alert">{validation.message}</span>}
          </label>
          <button className="button button-dark inquiry-submit" type="submit">
            <MessageCircle size={17} /> Send inquiry on WhatsApp
          </button>
          <p className="inquiry-disclaimer">
            WhatsApp opens with your message for you to review and send. You must
            tap Send in WhatsApp. An inquiry is not a confirmed order; availability,
            pricing, delivery, and other details are discussed directly with Bloom By Cici.
          </p>
          {whatsappUrl && (
            <p className="whatsapp-ready" role="status">
              WhatsApp should open in a new tab. If it didn’t,{" "}
              <a href={whatsappUrl} target="_blank" rel="noreferrer">open your message here</a>.
              Remember to tap Send in WhatsApp.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
