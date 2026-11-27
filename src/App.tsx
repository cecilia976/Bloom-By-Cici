import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Menu,
  X,
  Instagram,
  Facebook,
  Heart,
  Leaf,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import type { CustomerReview } from "./lib/reviews";
import { isSupabaseConfigured as reviewServiceConfigured } from "./lib/supabase-config";
import "./styles.css";

const products = [
  {
    id: "1",
    name: "Classic Red Roses",
    category: "HANDMADE BOUQUETS",
    description: "A hand-tied bouquet of classic red roses, made to make a heartfelt moment feel special.",
    image:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "2",
    name: "Blush Pink Bouquet",
    category: "HANDMADE BOUQUETS",
    description: "Soft pink blooms arranged by hand for birthdays, anniversaries, and little just-because moments.",
    image:
      "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "3",
    name: "The Keepsake Vase",
    category: "FLOWERS IN VASES",
    description: "A sculptural vase filled with thoughtfully arranged blooms to bring a little beauty into your home.",
    image:
      "https://images.pexels.com/photos/9957266/pexels-photo-9957266.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  },
  {
    id: "4",
    name: "Pink Hour Arrangement",
    category: "FLOWERS IN VASES",
    description: "Pink roses and airy fillers, finished in a softly curved glass vase for a thoughtful home accent.",
    image:
      "https://images.pexels.com/photos/15325501/pexels-photo-15325501.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  },
  {
    id: "5",
    name: "Petal Frame Mirror",
    category: "MIRROR DÉCOR",
    description: "A statement mirror edged with hand-placed blooms and preserved texture, made to brighten a favourite space.",
    image:
      "https://images.pexels.com/photos/15409846/pexels-photo-15409846.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  },
  {
    id: "6",
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
type Collection = (typeof collections)[number];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoAvailable, setLogoAvailable] = useState(true);
  const [storeProducts, setStoreProducts] = useState<Product[]>(products);
  const [storeCollections, setStoreCollections] = useState<Collection[]>(collections);
  const [homepageContent, setHomepageContent] = useState<Record<string, unknown>>({});
  const [websiteInfo, setWebsiteInfo] = useState<Record<string, unknown>>({});
  const [whatsappSettings, setWhatsappSettings] = useState<Record<string, unknown>>({});
  const [galleryImages, setGalleryImages] = useState<{ image_url: string; caption: string }[]>([]);
  const [whatsappWidgetOpen, setWhatsappWidgetOpen] = useState(false);
  const whatsappWidgetButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    const productId = new URLSearchParams(window.location.search).get("product");
    return products.find((product) => product.id === productId) ?? null;
  });
  const [inquiryOpen, setInquiryOpen] = useState(() => {
    const productId = new URLSearchParams(window.location.search).get("product");
    return products.some((product) => product.id === productId);
  });
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [validation, setValidation] = useState<{ name?: string; message?: string }>({});
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewValidation, setReviewValidation] = useState<{
    name?: string;
    rating?: string;
    feedback?: string;
  }>({});
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const businessName = typeof websiteInfo.business_name === "string" && websiteInfo.business_name.trim()
    ? websiteInfo.business_name
    : "Bloom By Cici";
  const whatsappPhone = typeof whatsappSettings.phone === "string" && whatsappSettings.phone.replace(/\D/g, "")
    ? whatsappSettings.phone.replace(/\D/g, "")
    : "254794541304";
  const whatsappDefaultMessage = typeof whatsappSettings.default_message === "string" && whatsappSettings.default_message.trim()
    ? whatsappSettings.default_message
    : "Hi Bloom By Cici! I'd love help choosing flowers or creating a custom design. Could you tell me more?";
  const heroHeadline = typeof homepageContent.hero_headline === "string"
    ? homepageContent.hero_headline
    : "Flowers that speak\nfrom the heart.";
  const aboutStory = typeof homepageContent.about_story === "string"
    ? homepageContent.about_story
    : "At Bloom By Cici, handmade bouquets, flowers in vases, and floral mirror décor make a moment or a favourite room feel personal.";
  const logoUrl = typeof websiteInfo.logo_url === "string" && websiteInfo.logo_url.trim()
    ? websiteInfo.logo_url
    : "/bloom-by-cici-logo.svg";
  const showWhatsappWidget = whatsappSettings.widget_enabled !== "false";

  useEffect(() => {
    if (!reviewServiceConfigured) return;
    let active = true;
    void (async () => {
      try {
        const { supabase } = await import("./lib/supabase");
        const [productResult, contentResult, galleryResult] = await Promise.all([
          supabase.from("products").select("id,title,category,description,images,active,display_order").eq("active", true).order("display_order"),
          supabase.from("site_content").select("content_key,content_value").in("content_key", ["homepage", "website_information", "whatsapp_settings"]),
          supabase.from("gallery_items").select("image_url,caption").eq("is_public", true).order("display_order"),
        ]);
        if (productResult.error) throw productResult.error;
        if (contentResult.error) throw contentResult.error;
        if (galleryResult.error) throw galleryResult.error;
        if (!active) return;

        const categoryLabels: Record<string, string> = {
          "Fresh & Preserved Bouquets": "HANDMADE BOUQUETS",
          "Vases & Floral Arrangements": "FLOWERS IN VASES",
          "Mirror & Wall Floral Decor": "MIRROR DÉCOR",
        };
        if (productResult.data?.length) {
          setStoreProducts(productResult.data.map((item, index) => ({
            id: item.id,
            name: item.title,
            category: categoryLabels[item.category] ?? item.category.toUpperCase(),
            description: item.description,
            image: item.images?.[0] ?? products[index % products.length].image,
          })));
        } else {
          setStoreProducts([]);
        }

        const values = Object.fromEntries((contentResult.data ?? []).map((row) => [row.content_key, row.content_value])) as Record<string, unknown>;
        const homepageRow = values.homepage as { content?: string } | undefined;
        let editableHomepage: Record<string, unknown> = {};
        try {
          editableHomepage = homepageRow?.content ? JSON.parse(homepageRow.content) as Record<string, unknown> : {};
        } catch (error) {
          console.error("Saved homepage content could not be parsed.", error);
        }
        setHomepageContent(editableHomepage);
        setWebsiteInfo((values.website_information as Record<string, unknown> | undefined) ?? {});
        setWhatsappSettings((values.whatsapp_settings as Record<string, unknown> | undefined) ?? {});
        const managedCollections = editableHomepage.collections;
        if (Array.isArray(managedCollections)) {
          setStoreCollections((managedCollections as Record<string, unknown>[])
            .slice()
            .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
            .map((item, index) => ({
              title: String(item.title ?? collections[index]?.title ?? ""),
              subtitle: String(item.description ?? collections[index]?.subtitle ?? ""),
              image: String(item.image ?? collections[index]?.image ?? ""),
            })));
        }
        setGalleryImages((galleryResult.data ?? []) as { image_url: string; caption: string }[]);
        const productId = new URLSearchParams(window.location.search).get("product");
        if (productId) {
          const matchingProduct = productResult.data?.find((item) => item.id === productId);
          if (matchingProduct) {
            setSelectedProduct({
              id: matchingProduct.id,
              name: matchingProduct.title,
              category: categoryLabels[matchingProduct.category] ?? matchingProduct.category.toUpperCase(),
              description: matchingProduct.description,
              image: matchingProduct.images?.[0] ?? products[0].image,
            });
            setInquiryOpen(true);
          }
        }
      } catch (error) {
        console.error("Public site content could not be loaded from Supabase.", error);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    if (!reviewServiceConfigured) {
      setReviewsError("Customer reviews are temporarily unavailable.");
      setReviewsLoading(false);
      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        const { fetchCustomerReviews, subscribeToCustomerReviews } = await import("./lib/reviews");
        const loadReviews = async () => {
          try {
            const customerReviews = await fetchCustomerReviews();
            if (active) {
              setReviews(customerReviews);
              setReviewsError("");
            }
          } catch {
            if (active) setReviewsError("Customer reviews could not be loaded. Please try again later.");
          } finally {
            if (active) setReviewsLoading(false);
          }
        };
        await loadReviews();
        if (active) {
          unsubscribe = subscribeToCustomerReviews(() => void loadReviews());
        }
      } catch {
        if (active) {
          setReviewsError("Customer reviews are temporarily unavailable.");
          setReviewsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  useEffect(() => {
    function syncProductFromUrl() {
      const productId = new URLSearchParams(window.location.search).get("product");
      const product = storeProducts.find((item) => item.id === productId) ?? null;
      setSelectedProduct(product);
      setInquiryOpen(product !== null);
    }

    window.addEventListener("popstate", syncProductFromUrl);
    return () => window.removeEventListener("popstate", syncProductFromUrl);
  }, [storeProducts]);

  useEffect(() => {
    if (!whatsappWidgetOpen) return;

    function handleWidgetKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setWhatsappWidgetOpen(false);
        whatsappWidgetButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleWidgetKeyDown);
    return () => window.removeEventListener("keydown", handleWidgetKeyDown);
  }, [whatsappWidgetOpen]);

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
    const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
    setWhatsappUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = {
      name: reviewName.trim().length >= 2 && reviewName.trim().length <= 80
        ? undefined
        : "Your name must be between 2 and 80 characters.",
      rating: reviewRating > 0 ? undefined : "Please choose a star rating.",
      feedback: reviewFeedback.trim().length >= 10 && reviewFeedback.trim().length <= 1000
        ? undefined
        : "Your review must be between 10 and 1,000 characters.",
    };
    setReviewValidation(errors);
    setReviewSubmitError("");
    setReviewSubmitted(false);
    if (errors.name || errors.rating || errors.feedback) return;
    if (!reviewServiceConfigured) {
      setReviewSubmitError("Reviews are temporarily unavailable. Please try again later.");
      return;
    }

    setReviewSubmitting(true);
    try {
      const { submitCustomerReview } = await import("./lib/reviews");
      await submitCustomerReview({
        customer_name: reviewName.trim(),
        rating: reviewRating,
        feedback: reviewFeedback.trim(),
      });
      setReviewName("");
      setReviewRating(0);
      setReviewFeedback("");
      setReviewValidation({});
      setReviewSubmitted(true);
    } catch {
      setReviewSubmitError("We couldn't submit your review right now. Please try again shortly.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <div className="site-shell">
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
                src={logoUrl}
                alt={`${businessName} — Flowers & Gifts`}
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
            <a href="#collections" onClick={() => setMenuOpen(false)}>Shop by collection</a>
            <a href="#occasions-title" onClick={() => setMenuOpen(false)}>Occasions</a>
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
            src={typeof homepageContent.hero_image === "string" && homepageContent.hero_image ? homepageContent.hero_image : "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=2200&q=90"}
            alt="A beautiful arrangement of fresh flowers"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <span className="eyebrow hero-eyebrow">
              {businessName.toUpperCase()} · FLOWERS & GIFTS
            </span>
            <h1>{heroHeadline.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
            <p>
              {typeof homepageContent.hero_intro === "string" ? homepageContent.hero_intro : "Find a thoughtful bouquet for a celebration, a kind gesture, or simply to bring a little beauty into the day."}
            </p>
            <button className="button button-light" onClick={() => scrollTo(String(homepageContent.hero_destination ?? "shop").replace(/^#/, ""))}>
              {typeof homepageContent.hero_button === "string" && homepageContent.hero_button ? homepageContent.hero_button : "Shop flowers"} <ArrowRight size={17} />
            </button>
          </div>
          <span className="hero-caption">A LITTLE BEAUTY, FOR YOUR MOMENT.</span>
        </section>

        <section className="about-section" id="about">
          <div className="story-section">
            <div className="story-image">
              <img
                src={typeof homepageContent.about_image === "string" && homepageContent.about_image ? homepageContent.about_image : "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1100&q=85"}
                alt="An elegant hand-tied floral bouquet"
              />
            </div>
            <div className="story-copy">
              <span className="eyebrow">A LITTLE ABOUT BLOOM BY CICI</span>
              <h2>{typeof homepageContent.about_heading === "string" && homepageContent.about_heading ? homepageContent.about_heading : "Every flower can say something."}</h2>
              <p>{aboutStory}</p>
              <p>
                Looking for something specific? Tell Cici about your custom design idea.
              </p>
              <button className="button button-dark" onClick={openCustomInquiry}>
                Request a custom design <ArrowRight size={17} />
              </button>
            </div>
          </div>
          <div className="values-strip">
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
          </div>
        </section>

        <section className="shop-section" id="shop" aria-labelledby="collections-title">
          <div className="collections section-wrap" id="collections">
            <div className="section-heading">
              <div>
                <span className="eyebrow">A PLACE TO BEGIN</span>
                <h2 id="collections-title">Shop by collection</h2>
                <p className="muted-copy">Handmade pieces for gifting and home</p>
              </div>
            </div>

            <div className="collection-grid">
              {storeCollections.map((collection, index) => (
                <button
                  className="collection-card"
                  key={collection.title}
                  onClick={() => scrollTo("products-title")}
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
          </div>
          <div className="section-wrap">
            <div className="section-heading">
              <div>
                <span className="eyebrow" id="products-title">HANDMADE PIECES</span>
                <h2>Flowers and décor to fall for</h2>
              </div>
            </div>

            <div className="product-grid">
              {storeProducts.map((product) => (
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

        {galleryImages.length > 0 && (
          <section className="gallery-section section-wrap" aria-labelledby="gallery-title">
            <div className="section-heading">
              <div><span className="eyebrow">A GLIMPSE OF OUR WORK</span><h2 id="gallery-title">From the Bloom By Cici gallery</h2></div>
            </div>
            <div className="public-gallery-grid">
              {galleryImages.map((item, index) => (
                <figure key={`${item.image_url}-${index}`}>
                  <img src={item.image_url} alt={item.caption || "Floral work by Bloom By Cici"} />
                  {item.caption && <figcaption>{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="testimonials-section section-wrap" aria-labelledby="testimonials-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">KIND WORDS, FROM THE HEART</span>
              <h2 id="testimonials-title">Notes from our customers</h2>
              <p className="testimonials-intro">
                Every thoughtful word means the world to us. Read what our customers have shared.
              </p>
            </div>
          </div>
          {reviewsLoading ? (
            <p className="reviews-state" role="status">Loading customer reviews…</p>
          ) : reviewsError ? (
            <p className="reviews-state" role="status">{reviewsError}</p>
          ) : reviews.length ? (
            <div className="testimonial-grid">
              {reviews.map((review) => (
                <article className="testimonial-card" key={review.id}>
                  <div className="testimonial-stars" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} size={16} aria-hidden="true" fill={index < review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <blockquote>“{review.feedback}”</blockquote>
                  <div className="testimonial-byline">
                    <p className="testimonial-name">{review.customer_name}</p>
                    <time dateTime={review.created_at}>
                      {new Date(review.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="reviews-state">Be the first to share a kind word about your Bloom By Cici experience.</p>
          )}

          <button
            className="review-form-toggle"
            type="button"
            aria-expanded={reviewFormOpen}
            aria-controls="review-form"
            onClick={() => setReviewFormOpen((open) => !open)}
          >
            <MessageCircle size={18} aria-hidden="true" />
            {reviewFormOpen ? "Close review form" : "Share your experience with us"}
          </button>
          {reviewFormOpen && (
          <form id="review-form" className="review-form" onSubmit={submitReview} noValidate>
            <div className="review-form-heading">
              <span className="eyebrow">SHARE YOUR EXPERIENCE</span>
              <h3>Leave us a little note</h3>
              <p>Your review will appear in the testimonials as soon as it is submitted.</p>
            </div>
            <label className="review-field" htmlFor="review-name">
              Your name
              <input
                id="review-name"
                type="text"
                autoComplete="name"
                maxLength={80}
                value={reviewName}
                onChange={(event) => setReviewName(event.target.value)}
                placeholder="Enter the name you'd like displayed"
                aria-invalid={Boolean(reviewValidation.name)}
                aria-describedby={reviewValidation.name ? "review-name-error" : undefined}
                required
              />
              {reviewValidation.name && <span className="field-error" id="review-name-error" role="alert">{reviewValidation.name}</span>}
            </label>
            <fieldset className="review-rating">
              <legend>Your rating (tap 1–5 stars)</legend>
              <div className="review-rating-options" role="group" aria-label="Choose a star rating">
                {Array.from({ length: 5 }, (_, index) => {
                  const rating = index + 1;
                  return (
                    <button
                      className={rating <= reviewRating ? "review-star is-selected" : "review-star"}
                      key={rating}
                      type="button"
                      aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
                      aria-pressed={reviewRating === rating}
                      onClick={() => setReviewRating(rating)}
                    >
                      <Star size={25} fill={rating <= reviewRating ? "currentColor" : "none"} />
                    </button>
                  );
                })}
              </div>
              {reviewValidation.rating && <span className="field-error" role="alert">{reviewValidation.rating}</span>}
            </fieldset>
            <label className="review-field" htmlFor="review-feedback">
              Your feedback
              <textarea
                id="review-feedback"
                rows={4}
                maxLength={1000}
                value={reviewFeedback}
                onChange={(event) => setReviewFeedback(event.target.value)}
                placeholder="What did you order? How did the flowers look or make your occasion feel? Share a few words about your experience."
                aria-invalid={Boolean(reviewValidation.feedback)}
                aria-describedby={reviewValidation.feedback ? "review-feedback-error" : undefined}
                required
              />
              {reviewValidation.feedback && <span className="field-error" id="review-feedback-error" role="alert">{reviewValidation.feedback}</span>}
            </label>
            <button className="button button-dark review-submit" type="submit" disabled={reviewSubmitting}>
              {reviewSubmitting ? "Submitting…" : "Submit review"} <ArrowRight size={16} />
            </button>
            {reviewSubmitError && <p className="review-submit-error" role="alert">{reviewSubmitError}</p>}
            {reviewSubmitted && (
              <p className="review-submit-success" role="status">
                Thank you for sharing your experience! Your review will appear after the administrator approves it.
              </p>
            )}
            <p className="review-privacy-note">Please keep reviews kind and respectful. Reviews may be removed by the Bloom By Cici team.</p>
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
                  src={logoUrl}
                  alt={`${businessName} — Flowers & Gifts`}
                  onError={() => setLogoAvailable(false)}
                />
              ) : (
                <>
                  <span className="brand-name">Bloom</span>
                  <span className="brand-subtitle">BY CICI · FLOWERS & GIFTS</span>
                </>
              )}
            </a>
            <p>{typeof websiteInfo.description === "string" && websiteInfo.description ? websiteInfo.description : "Flowers and gifts for the moments you want to make meaningful."}</p>
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
              <a href={typeof websiteInfo.instagram === "string" && websiteInfo.instagram ? websiteInfo.instagram : "https://www.instagram.com/"} aria-label="Instagram">
                <Instagram />
              </a>
              <a href="https://www.facebook.com/" aria-label="Facebook">
                <Facebook />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {businessName}</span>
          <span>WhatsApp inquiries are not confirmed orders. Details are discussed directly with Bloom By Cici.</span>
        </div>
      </footer>

      {showWhatsappWidget && <div className="whatsapp-widget">
        {whatsappWidgetOpen && (
          <section className="whatsapp-panel" id="whatsapp-contact-panel" role="dialog" aria-labelledby="whatsapp-panel-title">
            <button
              className="whatsapp-panel-close"
              type="button"
              aria-label="Close WhatsApp contact panel"
              onClick={() => {
                setWhatsappWidgetOpen(false);
                whatsappWidgetButtonRef.current?.focus();
              }}
            >
              <X size={17} />
            </button>
            <span className="whatsapp-panel-eyebrow">{businessName.toUpperCase()}</span>
            <h2 id="whatsapp-panel-title">Hello, flower lover!</h2>
            <p>{typeof whatsappSettings.introduction === "string" && whatsappSettings.introduction ? whatsappSettings.introduction : "Looking for something special? Cici would love to help you find the right blooms."}</p>
            <span className="whatsapp-contact-status">
              <span aria-hidden="true" /> Reach us directly on WhatsApp
            </span>
            <a
              className="whatsapp-chat-link"
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappDefaultMessage)}`}
              target="_blank"
              rel="noreferrer"
            >
              Let’s Chat <ArrowRight size={16} />
            </a>
            <p className="whatsapp-panel-note">WhatsApp will open so you can review and send your message.</p>
          </section>
        )}
        <button
          ref={whatsappWidgetButtonRef}
          className="whatsapp-widget-button"
          type="button"
          aria-label={whatsappWidgetOpen ? "Close WhatsApp contact panel" : "Open WhatsApp contact panel"}
          aria-expanded={whatsappWidgetOpen}
          aria-controls="whatsapp-contact-panel"
          onClick={() => setWhatsappWidgetOpen((open) => !open)}
        >
          {whatsappWidgetOpen ? (
            <X size={24} />
          ) : (
            <span className="whatsapp-symbol" aria-hidden="true">
              <MessageCircle className="whatsapp-symbol-bubble" size={30} />
              <Phone className="whatsapp-symbol-phone" size={13} />
            </span>
          )}
        </button>
      </div>}

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
            Your name (required)
            <input
              id="inquiry-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Enter your name"
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
