import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  ArrowDown,
  Image,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  X,
  Flower2,
  Images,
  Globe,
  UserRound,
  Package,
  Inbox,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { CustomerReview } from '../lib/reviews';
import type { Inquiry, Product, Category, StockStatus } from '../lib/types';
import {
  deleteAdminImages,
  deleteGalleryItem,
  fetchGalleryItems,
  readSiteContent,
  saveSiteContent,
  uploadAdminImage,
  validateImageFile,
} from '../lib/admin-content';
import type { GalleryItem } from '../lib/admin-content';
import Logo from '../components/Logo';
import Loading from '../components/Loading';

const categories: Category[] = [
  'Fresh & Preserved Bouquets',
  'Vases & Floral Arrangements',
  'Mirror & Wall Floral Decor',
];

const categoryLabels: Record<Category, string> = {
  'Fresh & Preserved Bouquets': 'Bouquets',
  'Vases & Floral Arrangements': 'Home Décor',
  'Mirror & Wall Floral Decor': 'Mirror Décor',
};

const adminPages = [
  { key: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { key: 'collections', label: 'Manage Collections', icon: Flower2 },
  { key: 'reviews', label: 'Manage Reviews', icon: Star },
  { key: 'homepage', label: 'Manage Homepage', icon: Image },
  { key: 'gallery', label: 'Manage Gallery', icon: Images },
  { key: 'information', label: 'Website Information', icon: Globe },
  { key: 'whatsapp', label: 'WhatsApp Settings', icon: MessageCircle },
  { key: 'account', label: 'Admin Account', icon: UserRound },
] as const;

type AdminPage = (typeof adminPages)[number]['key'];
type ManagedProduct = Omit<Product, 'price'> & { price: number | null; active: boolean; display_order: number };
type DashboardData = {
  products: ManagedProduct[];
  inquiries: Inquiry[];
  reviews: CustomerReview[];
};
type ProductDraft = {
  title: string;
  category: Category;
  description: string;
  price: string;
  stock_status: StockStatus;
  active: boolean;
  display_order: string;
  image_url: string;
  images: string[];
};
type ContentFields = Record<string, string>;

const emptyProductDraft = (): ProductDraft => ({
  title: '',
  category: categories[0],
  description: '',
  price: '',
  stock_status: 'In stock',
  active: true,
  display_order: '0',
  image_url: '',
  images: [],
});

function isAdminPage(value: string | undefined): value is AdminPage {
  return adminPages.some((page) => page.key === value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function AdminPageFrame({ children }: { children: ReactNode }) {
  return <section className="admin-page-content">{children}</section>;
}

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const pagePart = location.pathname.split('/')[2];
  const page: AdminPage = isAdminPage(pagePart) ? pagePart : 'overview';
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({ products: [], inquiries: [], reviews: [] });
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [homepage, setHomepage] = useState<ContentFields>({});
  const [websiteInfo, setWebsiteInfo] = useState<ContentFields>({});
  const [whatsappSettings, setWhatsappSettings] = useState<ContentFields>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [productSearch, setProductSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [productEditor, setProductEditor] = useState<ManagedProduct | null | false>(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (!isSupabaseConfigured) {
        if (active) {
          setErrorMessage('Supabase is not configured. Set the project URL and public anon key before enabling admin access.');
          setAuthorized(false);
        }
        setLoading(false);
        return;
      }

      try {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        if (!authData.session) {
          if (active) setAuthorized(false);
          return;
        }

        const { data: staff, error: staffError } = await supabase
          .from('staff_profiles')
          .select('role')
          .eq('user_id', authData.session.user.id)
          .maybeSingle();
        if (staffError) throw staffError;
        if (staff?.role !== 'admin') {
          await supabase.auth.signOut();
          if (active) setAuthorized(false);
          return;
        }

        if (active) {
          setCurrentUser({
            email: authData.session.user.email ?? '',
            name: String(authData.session.user.user_metadata?.full_name ?? ''),
          });
          setAuthorized(true);
        }
        await reloadDashboard();
        const [galleryItems, homeContent, information, whatsapp] = await Promise.all([
          fetchGalleryItems(),
          readSiteContent<ContentFields>('homepage', {}),
          readSiteContent<ContentFields>('website_information', {}),
          readSiteContent<ContentFields>('whatsapp_settings', {}),
        ]);
        if (active) {
          setGallery(galleryItems);
          setHomepage(homeContent);
          setWebsiteInfo(information);
          setWhatsappSettings(whatsapp);
        }
      } catch {
        if (active) {
          setErrorMessage('Dashboard data could not be loaded. Confirm the database migrations are applied and try again.');
          setAuthorized((current) => current ?? false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    async function reloadDashboard() {
      const [productsResult, inquiriesResult, reviewsResult] = await Promise.all([
        supabase.from('products').select('*').order('display_order').order('created_at', { ascending: false }),
        supabase.from('inquiries').select('*').order('created_at', { ascending: false }),
        supabase.from('customer_reviews').select('*').order('created_at', { ascending: false }),
      ]);
      const dataError = productsResult.error ?? inquiriesResult.error ?? reviewsResult.error;
      if (dataError) throw dataError;
      if (active) {
        setData({
          products: (productsResult.data ?? []) as ManagedProduct[],
          inquiries: (inquiriesResult.data ?? []) as Inquiry[],
          reviews: (reviewsResult.data ?? []) as CustomerReview[],
        });
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, []);

  async function reloadDashboard() {
    const [productsResult, inquiriesResult, reviewsResult] = await Promise.all([
      supabase.from('products').select('*').order('display_order').order('created_at', { ascending: false }),
      supabase.from('inquiries').select('*').order('created_at', { ascending: false }),
      supabase.from('customer_reviews').select('*').order('created_at', { ascending: false }),
    ]);
    const dataError = productsResult.error ?? inquiriesResult.error ?? reviewsResult.error;
    if (dataError) throw dataError;
    setData({
      products: (productsResult.data ?? []) as ManagedProduct[],
      inquiries: (inquiriesResult.data ?? []) as Inquiry[],
      reviews: (reviewsResult.data ?? []) as CustomerReview[],
    });
  }

  function reportError(error: unknown, fallback: string) {
    setErrorMessage(error instanceof Error ? error.message : fallback);
    setNotice('');
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (productEditor === false) return;
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const priceValue = String(formData.get('price') ?? '').trim();
    if (title.length < 2 || description.length < 5) {
      setErrorMessage('Enter an arrangement name and a description of at least five characters.');
      return;
    }
    if (priceValue && (!Number.isFinite(Number(priceValue)) || Number(priceValue) < 0)) {
      setErrorMessage('Price must be a non-negative number.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    const uploaded: { path: string; url: string }[] = [];
    let productSaved = false;
    try {
      const category = String(formData.get('category')) as Category;
      const files = formData.getAll('photos').filter((file): file is File => file instanceof File && file.size > 0);
      for (const file of files) uploaded.push(await uploadAdminImage(file));
      const previousImages = productEditor ? productEditor.images : [];
      const images = [...(productEditor && !files.length ? previousImages : []), ...uploaded.map((image) => image.url)];
      const imageUrl = uploaded[0]?.url ?? (productEditor ? productEditor.images[0] : '') ?? '';
      if (!imageUrl) {
        setErrorMessage('Choose at least one arrangement photograph.');
        return;
      }
      const payload = {
        title,
        category,
        description,
        price: priceValue ? Number(priceValue) : null,
        images: images.length ? images : [imageUrl],
        stock_status: String(formData.get('stock_status')) as StockStatus,
        active: formData.get('active') === 'on',
        display_order: Number(formData.get('display_order')) || 0,
        stock_count: productEditor?.stock_count ?? 0,
        occasions: productEditor?.occasions ?? [],
        sizes: productEditor?.sizes ?? ['Standard'],
        featured: productEditor?.featured ?? false,
      };
      const result = productEditor
        ? await supabase.from('products').update(payload).eq('id', productEditor.id).select().single()
        : await supabase.from('products').insert(payload).select().single();
      if (result.error) throw result.error;
      productSaved = true;
      await reloadDashboard();
      setProductEditor(false);
      setNotice('Arrangement saved.');
    } catch (error) {
      if (productSaved) {
        setProductEditor(false);
        reportError(new Error('Arrangement saved, but the dashboard could not refresh. Reload the page to verify the latest data.'), 'The arrangement was saved but could not be refreshed.');
        return;
      }
      if (!productSaved && uploaded.length) {
        try {
          await deleteAdminImages(uploaded.map((image) => image.path));
        } catch {
          reportError(new Error('The arrangement could not be saved, and an uploaded image may need manual cleanup.'), 'The arrangement could not be saved.');
          return;
        }
      }
      reportError(error, 'The arrangement could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: ManagedProduct) {
    if (!window.confirm(`Delete “${product.title}”? This cannot be undone.`)) return;
    let deleted = false;
    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      deleted = true;
      await reloadDashboard();
      setNotice('Arrangement deleted.');
    } catch (error) {
      if (deleted) {
        reportError(new Error('Arrangement deleted, but the dashboard could not refresh. Reload the page to verify the latest data.'), 'The arrangement was deleted but could not be refreshed.');
        return;
      }
      reportError(error, 'The arrangement could not be deleted.');
    }
  }

  async function reorderProduct(product: ManagedProduct, direction: -1 | 1) {
    const ordered = [...data.products].sort((a, b) => a.display_order - b.display_order);
    const index = ordered.findIndex((item) => item.id === product.id);
    const target = ordered[index + direction];
    if (!target) return;
    try {
      const updates = await Promise.all([
        supabase.from('products').update({ display_order: target.display_order }).eq('id', product.id),
        supabase.from('products').update({ display_order: product.display_order }).eq('id', target.id),
      ]);
      const updateError = updates.find((result) => result.error)?.error;
      if (updateError) {
        const rollback = await Promise.all([
          supabase.from('products').update({ display_order: product.display_order }).eq('id', product.id),
          supabase.from('products').update({ display_order: target.display_order }).eq('id', target.id),
        ]);
        if (rollback.some((result) => result.error)) {
          throw new Error('The order update was incomplete and automatic rollback failed. Review the arrangement order.');
        }
        throw updateError;
      }
      await reloadDashboard();
    } catch (error) {
      reportError(error, 'The display order could not be changed.');
    }
  }

  async function deleteReview(review: CustomerReview) {
    if (!window.confirm(`Delete the review from ${review.customer_name}? This cannot be undone.`)) return;
    setDeletingReviewId(review.id);
    setErrorMessage('');
    try {
      const { error } = await supabase.from('customer_reviews').delete().eq('id', review.id);
      if (error) throw error;
      setData((current) => ({
        ...current,
        reviews: current.reviews.filter((item) => item.id !== review.id),
      }));
      setNotice('Review deleted.');
    } catch (error) {
      reportError(error, 'The review could not be deleted.');
    } finally {
      setDeletingReviewId(null);
    }
  }

  async function saveContent(key: string, value: Record<string, unknown>, label: string): Promise<boolean> {
    setSaving(true);
    setErrorMessage('');
    try {
      await saveSiteContent(key, value);
      setNotice(`${label} saved.`);
      return true;
    } catch (error) {
      reportError(error, `${label} could not be saved. Apply the admin content migration and try again.`);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteGalleryPhoto(item: GalleryItem) {
    if (!window.confirm(`Delete this gallery photograph${item.caption ? ` (“${item.caption}”)` : ''}?`)) return;
    setErrorMessage('');
    try {
      await deleteGalleryItem(item);
      setGallery((current) => current.filter((entry) => entry.id !== item.id));
      setNotice('Gallery photograph deleted.');
    } catch (error) {
      reportError(error, 'The gallery photograph could not be deleted.');
      try {
        setGallery(await fetchGalleryItems());
      } catch (refreshError) {
        reportError(refreshError, 'The gallery changed but could not be refreshed. Reload the page.');
      }
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      reportError(error, 'Could not sign out. Please try again.');
      return;
    }
    navigate('/admin/login');
  }

  if (loading) return <Loading label="Opening the studio…" />;
  if (!authorized) return <Navigate to="/admin/login" replace />;
  if (!isAdminPage(pagePart) && pagePart !== undefined) return <Navigate to="/admin/overview" replace />;

  const title = adminPages.find((item) => item.key === page)?.label ?? 'Dashboard Overview';
  const averageRating = data.reviews.length
    ? data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length
    : 0;
  const visibleProducts = data.products
    .filter((product) => activeFilter === 'all' || (activeFilter === 'active' ? product.active : !product.active))
    .filter((product) => categoryFilter === 'all' || product.category === categoryFilter)
    .filter((product) => `${product.title} ${product.category}`.toLowerCase().includes(productSearch.toLowerCase()));
  const recentProducts = [...data.products]
    .sort((a, b) => (Date.parse(b.created_at ?? '') || 0) - (Date.parse(a.created_at ?? '') || 0))
    .slice(0, 5);
  const visibleReviews = data.reviews.filter((review) => {
    const matchesText = `${review.customer_name} ${review.feedback}`.toLowerCase().includes(reviewSearch.toLowerCase());
    return matchesText && (reviewRatingFilter === 'all' || String(review.rating) === reviewRatingFilter);
  });

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Logo />
        <nav className="admin-side-links" aria-label="Admin dashboard">
          {adminPages.map(({ key, label, icon: Icon }) => (
            <Link className={page === key ? 'active' : ''} key={key} to={`/admin/${key}`}>
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <button className="admin-logout" type="button" onClick={() => void logout()}>
          <LogOut size={17} /> Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-top">
          <div>
            <span className="eyebrow">BLOOM BY CICI · STUDIO</span>
            <h1>{title}</h1>
          </div>
          <Link className="admin-view-site" to="/">View website</Link>
        </header>
        {errorMessage && <p className="admin-message" role="alert">{errorMessage}</p>}
        {notice && <p className="admin-notice" role="status">{notice}</p>}

        {page === 'overview' && (
          <AdminPageFrame>
            <div className="admin-stat-grid">
              <StatCard label="Floral arrangements" value={data.products.length} icon={<Package />} />
              {categories.map((category) => (
                <StatCard
                  key={category}
                  label={categoryLabels[category]}
                  value={data.products.filter((product) => product.category === category).length}
                  icon={<Flower2 />}
                />
              ))}
              <StatCard label="Customer reviews" value={data.reviews.length} icon={<Star />} />
              <StatCard label="Average rating" value={data.reviews.length ? `${averageRating.toFixed(1)} / 5` : '—'} icon={<Star />} />
            </div>
            <div className="admin-overview-columns">
              <div className="admin-panel">
                <div className="admin-panel-heading">
                  <h2>Recently added arrangements</h2>
                  <Link to="/admin/collections">Manage collections <span aria-hidden="true">→</span></Link>
                </div>
                {recentProducts.map((product) => (
                  <div className="admin-recent-item" key={product.id}>
                    <img src={product.images[0]} alt="" />
                    <div><strong>{product.title}</strong><span>{categoryLabels[product.category]}</span></div>
                    <time>{formatDate(product.created_at ?? '')}</time>
                  </div>
                ))}
                {!data.products.length && <p className="admin-empty">No arrangements yet.</p>}
              </div>
              <div className="admin-panel">
                <div className="admin-panel-heading">
                  <h2>Recently submitted reviews</h2>
                  <Link to="/admin/reviews">Manage reviews <span aria-hidden="true">→</span></Link>
                </div>
                {data.reviews.slice(0, 5).map((review) => (
                  <div className="admin-recent-review" key={review.id}>
                    <div><strong>{review.customer_name}</strong><span>{review.rating} of 5 stars · {formatDate(review.created_at)}</span></div>
                    <p>{review.feedback}</p>
                  </div>
                ))}
                {!data.reviews.length && <p className="admin-empty">No customer reviews yet.</p>}
              </div>
            </div>
            <div className="admin-quick-actions">
              <Link to="/admin/collections"><Plus size={16} /> Add arrangement</Link>
              <Link to="/admin/gallery"><Images size={16} /> Update gallery</Link>
              <Link to="/admin/homepage"><Pencil size={16} /> Edit homepage</Link>
            </div>
          </AdminPageFrame>
        )}

        {page === 'collections' && (
          <AdminPageFrame>
            <div className="admin-toolbar">
              <label className="admin-search"><Search size={17} /><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search arrangements" /></label>
              <select aria-label="Filter arrangements" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}>
                <option value="all">All arrangements</option><option value="active">Published</option><option value="hidden">Hidden</option>
              </select>
              <select aria-label="Filter by collection" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)}>
                <option value="all">All collections</option>
                {categories.map((category) => <option value={category} key={category}>{categoryLabels[category]}</option>)}
              </select>
              <button className="button button-dark" type="button" onClick={() => setProductEditor(null)}><Plus size={16} /> Add arrangement</button>
            </div>
            <div className="admin-category-summary">
              {categories.map((category) => <span key={category}>{categoryLabels[category]} <strong>{data.products.filter((product) => product.category === category).length}</strong></span>)}
            </div>
            <div className="admin-product-grid">
              {visibleProducts.map((product) => (
                <article className="admin-product" key={product.id}>
                  <img src={product.images[0]} alt={product.title} />
                  <div className="admin-product-copy">
                    <span className="product-category">{categoryLabels[product.category]}</span>
                    <h2>{product.title}</h2>
                    <p>{product.description}</p>
                    <strong>{product.price == null ? 'Price on request' : `${product.price.toLocaleString()}`}</strong>
                    <span className={product.active ? 'admin-status published' : 'admin-status hidden'}>{product.active ? 'Published' : 'Hidden'} · {product.stock_status}</span>
                  </div>
                  <div className="admin-product-actions">
                    <button type="button" onClick={() => void reorderProduct(product, -1)} aria-label={`Move ${product.title} up`}><ArrowUp size={15} /></button>
                    <button type="button" onClick={() => void reorderProduct(product, 1)} aria-label={`Move ${product.title} down`}><ArrowDown size={15} /></button>
                    <button type="button" onClick={() => setProductEditor(product)} aria-label={`Edit ${product.title}`}><Pencil size={15} /></button>
                    <button type="button" onClick={() => void deleteProduct(product)} aria-label={`Delete ${product.title}`}><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
              {!visibleProducts.length && <p className="admin-empty">No matching arrangements found.</p>}
            </div>
          </AdminPageFrame>
        )}

        {page === 'reviews' && (
          <AdminPageFrame>
            <div className="admin-toolbar">
              <label className="admin-search"><Search size={17} /><input value={reviewSearch} onChange={(event) => setReviewSearch(event.target.value)} placeholder="Search names or feedback" /></label>
              <select aria-label="Filter by rating" value={reviewRatingFilter} onChange={(event) => setReviewRatingFilter(event.target.value)}>
                <option value="all">All ratings</option>
                {[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} stars</option>)}
              </select>
              <span>{visibleReviews.length} reviews</span>
            </div>
            <div className="admin-reviews">
              {visibleReviews.map((review) => (
                <article className="admin-review" key={review.id}>
                  <div className="admin-review-heading">
                    <div><h2>{review.customer_name}</h2><time dateTime={review.created_at}>{formatDate(review.created_at)}</time></div>
                    <span className="admin-review-rating" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} fill={index < review.rating ? 'currentColor' : 'none'} />)}
                    </span>
                  </div>
                  <p>{review.feedback}</p>
                  <button className="admin-review-delete" type="button" disabled={deletingReviewId === review.id} onClick={() => void deleteReview(review)}>
                    <Trash2 size={16} /> {deletingReviewId === review.id ? 'Deleting…' : 'Delete review'}
                  </button>
                </article>
              ))}
              {!visibleReviews.length && <p className="admin-empty">No reviews match these filters.</p>}
            </div>
          </AdminPageFrame>
        )}

        {page === 'homepage' && (
          <HomepageEditor
            value={homepage}
            saving={saving}
            onSave={(value) => {
              void saveContent('homepage', value, 'Homepage content').then((saved) => {
                if (saved) setHomepage(value);
              });
            }}
          />
        )}

        {page === 'gallery' && (
          <GalleryEditor
            items={gallery}
            saving={saving}
            onChange={setGallery}
            onDelete={deleteGalleryPhoto}
            onError={(message) => setErrorMessage(message)}
            onNotice={setNotice}
          />
        )}

        {page === 'information' && (
          <SettingsEditor
            title="Business details"
            description="Keep the business identity and contact information consistent across the website."
            value={websiteInfo}
            fields={[
              ['business_name', 'Business name'],
              ['logo_url', 'Logo image URL'],
              ['description', 'Business description'],
              ['contact_email', 'Contact email'],
              ['phone', 'Business phone number'],
              ['location', 'Business location'],
              ['instagram', 'Instagram URL'],
              ['other_social', 'Other social links'],
              ['footer', 'Footer information'],
            ]}
            saving={saving}
            onSave={(value) => {
              void saveContent('website_information', value, 'Website information').then((saved) => {
                if (saved) setWebsiteInfo(value);
              });
            }}
          />
        )}

        {page === 'whatsapp' && (
          <SettingsEditor
            title="WhatsApp contact"
            description="Update the contact details and floating prompt used by the public website."
            value={whatsappSettings}
            fields={[
              ['phone', 'WhatsApp number (international format)'],
              ['default_message', 'Default inquiry message'],
              ['widget_enabled', 'Floating WhatsApp button enabled (true/false)'],
              ['introduction', 'Widget introduction text'],
            ]}
            saving={saving}
            onSave={(value) => {
              void saveContent('whatsapp_settings', value, 'WhatsApp settings').then((saved) => {
                if (saved) setWhatsappSettings(value);
              });
            }}
          />
        )}

        {page === 'account' && (
          <AccountSettings
            user={currentUser}
            saving={saving}
            onSaveName={async (name) => {
              if (!name.trim()) throw new Error('Enter your display name.');
              const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
              if (error) throw error;
              setCurrentUser((current) => current ? { ...current, name: name.trim() } : current);
            }}
            onSavePassword={async (password) => {
              if (password.length < 10) throw new Error('Use a password with at least 10 characters.');
              const { error } = await supabase.auth.updateUser({ password });
              if (error) throw error;
            }}
            setSaving={setSaving}
            onError={reportError}
            onNotice={setNotice}
          />
        )}

        {productEditor !== false && (
          <ProductEditor
            product={productEditor}
            saving={saving}
            onClose={() => setProductEditor(false)}
            onSubmit={saveProduct}
          />
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return <article className="admin-stat-card"><span>{icon}</span><p>{label}</p><strong>{value}</strong></article>;
}

function ProductEditor({
  product,
  saving,
  onClose,
  onSubmit,
}: {
  product: ManagedProduct | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(product?.images ?? []);

  function updatePreviews(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    try {
      files.forEach(validateImageFile);
      setPhotoPreviews([...files.map((file) => URL.createObjectURL(file)), ...(product?.images ?? [])]);
    } catch (error) {
      event.target.value = '';
      window.alert(error instanceof Error ? error.message : 'Invalid image file.');
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <section className="admin-modal" aria-labelledby="product-editor-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div><span className="eyebrow">COLLECTION DETAILS</span><h2 id="product-editor-title">{product ? 'Edit arrangement' : 'Add arrangement'}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close editor"><X /></button>
        </div>
        <form onSubmit={onSubmit}>
          <label>Arrangement name<input name="title" required minLength={2} maxLength={120} defaultValue={product?.title ?? ''} /></label>
          <div className="input-grid">
            <label>Collection<select name="category" defaultValue={product?.category ?? categories[0]}>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select></label>
            <label>Optional price<input name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? ''} placeholder="Leave blank for price on request" /></label>
            <label>Availability<select name="stock_status" defaultValue={product?.stock_status ?? 'In stock'}><option>In stock</option><option>Low stock</option><option>Out of stock</option></select></label>
            <label>Display order<input name="display_order" type="number" step="1" defaultValue={product?.display_order ?? 0} /></label>
          </div>
          <label>Description<textarea name="description" rows={4} required minLength={5} maxLength={2000} defaultValue={product?.description ?? ''} /></label>
          <label>Arrangement photographs<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={updatePreviews} required={!product} /></label>
          <p className="admin-help">JPG, PNG, or WebP; maximum 8 MB each. Choosing new photos replaces the existing set.</p>
          {photoPreviews.length > 0 && <div className="admin-image-previews">{photoPreviews.map((url, index) => <img src={url} alt={`Arrangement preview ${index + 1}`} key={`${url}-${index}`} />)}</div>}
          <label className="admin-checkbox"><input name="active" type="checkbox" defaultChecked={product?.active ?? true} /> Publish on website</label>
          <button className="button button-dark button-full" disabled={saving}>{saving ? 'Saving…' : product ? 'Save changes' : 'Add arrangement'}</button>
        </form>
      </section>
    </div>
  );
}

type EditableHomepage = {
  hero_headline: string;
  hero_intro: string;
  hero_image: string;
  hero_button: string;
  hero_destination: string;
  about_heading: string;
  about_story: string;
  about_image: string;
  collections: { title: string; description: string; image: string; order: string }[];
};

const defaultHomepage: EditableHomepage = {
  hero_headline: 'Flowers that speak from the heart.',
  hero_intro: 'Find a thoughtful bouquet for a celebration, a kind gesture, or simply to bring a little beauty into the day.',
  hero_image: '',
  hero_button: 'Shop flowers',
  hero_destination: '#shop',
  about_heading: 'Every flower can say something.',
  about_story: 'At Bloom By Cici, handmade bouquets, flowers in vases, and floral mirror décor make a moment or a favourite room feel personal.',
  about_image: '',
  collections: [
    { title: 'Handmade bouquets', description: 'Thoughtful flowers, tied by hand', image: '', order: '1' },
    { title: 'Flowers in vases', description: 'A little beauty for your home', image: '', order: '2' },
    { title: 'Floral mirror décor', description: 'Hand-finished pieces for your walls', image: '', order: '3' },
  ],
};

function HomepageEditor({
  value,
  saving,
  onSave,
}: {
  value: ContentFields;
  saving: boolean;
  onSave: (value: ContentFields) => void;
}) {
  const parsed = useMemo((): EditableHomepage => {
    try {
      return { ...defaultHomepage, ...(JSON.parse(value.content ?? '{}') as Partial<EditableHomepage>) };
    } catch {
      return defaultHomepage;
    }
  }, [value]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const collections = parsed.collections.map((item, index) => ({
      title: String(formData.get(`collection-title-${index}`) ?? '').trim(),
      description: String(formData.get(`collection-description-${index}`) ?? '').trim(),
      image: String(formData.get(`collection-image-${index}`) ?? '').trim(),
      order: String(formData.get(`collection-order-${index}`) ?? index + 1),
    }));
    onSave({
      content: JSON.stringify({
        hero_headline: formData.get('hero_headline'),
        hero_intro: formData.get('hero_intro'),
        hero_image: formData.get('hero_image'),
        hero_button: formData.get('hero_button'),
        hero_destination: formData.get('hero_destination'),
        about_heading: formData.get('about_heading'),
        about_story: formData.get('about_story'),
        about_image: formData.get('about_image'),
        collections,
      }),
    });
  }

  return (
    <SettingsForm title="Homepage content" description="Edit the hero, About section, and collection feature content." saving={saving} onSubmit={handleSubmit}>
      <fieldset className="admin-fieldset"><legend>Hero section</legend>
        <label>Headline<input name="hero_headline" required defaultValue={parsed.hero_headline} /></label>
        <label>Introductory text<textarea name="hero_intro" rows={3} required defaultValue={parsed.hero_intro} /></label>
        <label>Hero image URL<input name="hero_image" type="url" defaultValue={parsed.hero_image} placeholder="Upload in Gallery and paste its public URL" /></label>
        <div className="input-grid"><label>Button text<input name="hero_button" defaultValue={parsed.hero_button} /></label><label>Button destination<input name="hero_destination" defaultValue={parsed.hero_destination} /></label></div>
      </fieldset>
      <fieldset className="admin-fieldset"><legend>About Bloom By Cici</legend>
        <label>Section heading<input name="about_heading" required defaultValue={parsed.about_heading} /></label>
        <label>Brand story<textarea name="about_story" rows={4} required defaultValue={parsed.about_story} /></label>
        <label>About photograph URL<input name="about_image" type="url" defaultValue={parsed.about_image} placeholder="Upload in Gallery and paste its public URL" /></label>
      </fieldset>
      <fieldset className="admin-fieldset"><legend>Our collections</legend>
        {parsed.collections.map((collection, index) => (
          <div className="admin-collection-fields" key={index}>
            <h3>{categoryLabels[categories[index]]}</h3>
            <label>Collection title<input name={`collection-title-${index}`} defaultValue={collection.title} /></label>
            <label>Description<input name={`collection-description-${index}`} defaultValue={collection.description} /></label>
            <label>Photo URL<input name={`collection-image-${index}`} type="url" defaultValue={collection.image} /></label>
            <label>Display order<input name={`collection-order-${index}`} type="number" defaultValue={collection.order} /></label>
          </div>
        ))}
      </fieldset>
    </SettingsForm>
  );
}

function GalleryEditor({
  items,
  saving,
  onChange,
  onDelete,
  onError,
  onNotice,
}: {
  items: GalleryItem[];
  saving: boolean;
  onChange: (items: GalleryItem[]) => void;
  onDelete: (item: GalleryItem) => Promise<void>;
  onError: (message: string) => void;
  onNotice: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');

  async function uploadPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    onError('');
    const uploads: { path: string; url: string }[] = [];
    const createdIds: string[] = [];
    try {
      for (const file of files) uploads.push(await uploadAdminImage(file));
      const inserts = await Promise.all(uploads.map((image, index) =>
        supabase.from('gallery_items').insert({
          storage_path: image.path,
          image_url: image.url,
          caption: files[index].name.replace(/\.[^.]+$/, ''),
          display_order: items.length + index,
          is_public: true,
        }).select().single(),
      ));
      createdIds.push(...inserts.flatMap((result) => result.data?.id ? [result.data.id] : []));
      const insertError = inserts.find((result) => result.error)?.error;
      if (insertError) throw insertError;
      onChange([...inserts.map((result) => result.data as GalleryItem), ...items]);
      onNotice('Photographs uploaded.');
      event.target.value = '';
    } catch (error) {
      const cleanupErrors: string[] = [];
      if (createdIds.length) {
        const { error: rowCleanupError } = await supabase.from('gallery_items').delete().in('id', createdIds);
        if (rowCleanupError) cleanupErrors.push('Some gallery records may need manual cleanup.');
      }
      if (uploads.length) {
        try {
          await deleteAdminImages(uploads.map((image) => image.path));
        } catch {
          cleanupErrors.push('Some uploaded files may need manual cleanup.');
        }
      }
      const message = error instanceof Error ? error.message : 'Photographs could not be uploaded.';
      onError(cleanupErrors.length ? `${message} ${cleanupErrors.join(' ')}` : message);
    } finally {
      setUploading(false);
    }
  }

  async function updateItem(item: GalleryItem, changes: Partial<GalleryItem>) {
    const previous = items.find((entry) => entry.id === item.id);
    try {
      const { error } = await supabase.from('gallery_items').update(changes).eq('id', item.id);
      if (error) throw error;
      onChange(items.map((entry) => entry.id === item.id ? { ...entry, ...changes } : entry));
    } catch (error) {
      if (previous) onChange(items.map((entry) => entry.id === item.id ? previous : entry));
      onError(error instanceof Error ? error.message : 'Gallery changes could not be saved.');
    }
  }

  async function moveItem(item: GalleryItem, direction: -1 | 1) {
    const ordered = [...items].sort((a, b) => a.display_order - b.display_order);
    const index = ordered.findIndex((entry) => entry.id === item.id);
    const target = ordered[index + direction];
    if (!target) return;
    try {
      const updates = await Promise.all([
        supabase.from('gallery_items').update({ display_order: target.display_order }).eq('id', item.id),
        supabase.from('gallery_items').update({ display_order: item.display_order }).eq('id', target.id),
      ]);
      const updateError = updates.find((result) => result.error)?.error;
      if (updateError) {
        const rollback = await Promise.all([
          supabase.from('gallery_items').update({ display_order: item.display_order }).eq('id', item.id),
          supabase.from('gallery_items').update({ display_order: target.display_order }).eq('id', target.id),
        ]);
        if (rollback.some((result) => result.error)) {
          throw new Error('The gallery order update was incomplete and automatic rollback failed. Review the gallery order.');
        }
        throw updateError;
      }
      onChange(items.map((entry) => {
        if (entry.id === item.id) return { ...entry, display_order: target.display_order };
        if (entry.id === target.id) return { ...entry, display_order: item.display_order };
        return entry;
      }));
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Gallery order could not be changed.');
    }
  }

  return (
    <AdminPageFrame>
      <div className="admin-toolbar">
        <label className="admin-upload-button"><Plus size={17} /> {uploading ? 'Uploading…' : 'Upload photographs'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || saving} onChange={(event) => void uploadPhotos(event)} />
        </label>
        <label className="admin-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search captions" /></label>
      </div>
      <p className="admin-help">JPG, PNG, and WebP files up to 8 MB. Uploaded images can be used in the homepage editor.</p>
      <div className="admin-gallery-grid">
        {items.filter((item) => item.caption.toLowerCase().includes(search.toLowerCase())).map((item) => (
          <article className="admin-gallery-item" key={item.id}>
            <img src={item.image_url} alt={item.caption} />
            <label>Caption<input value={item.caption} onChange={(event) => onChange(items.map((entry) => entry.id === item.id ? { ...entry, caption: event.target.value } : entry))} onBlur={(event) => void updateItem(item, { caption: event.target.value })} /></label>
            <label className="admin-checkbox"><input type="checkbox" checked={item.is_public} onChange={(event) => void updateItem(item, { is_public: event.target.checked })} /> Show publicly</label>
            <div className="admin-gallery-actions">
              <button type="button" onClick={() => void moveItem(item, -1)} aria-label="Move image up"><ArrowUp size={15} /></button>
              <button type="button" onClick={() => void moveItem(item, 1)} aria-label="Move image down"><ArrowDown size={15} /></button>
              <button type="button" onClick={() => void onDelete(item)} aria-label="Delete image"><Trash2 size={15} /></button>
            </div>
          </article>
        ))}
        {!items.length && <p className="admin-empty">Upload photographs to start your gallery.</p>}
      </div>
    </AdminPageFrame>
  );
}

function SettingsEditor({
  title,
  description,
  value,
  fields,
  saving,
  onSave,
}: {
  title: string;
  description: string;
  value: ContentFields;
  fields: [string, string][];
  saving: boolean;
  onSave: (value: ContentFields) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const content = Object.fromEntries(fields.map(([key]) => [key, String(formData.get(key) ?? '').trim()]));
    onSave({ content: JSON.stringify(content) });
  }

  const initialValues = useMemo(() => {
    try {
      return JSON.parse(value.content ?? '{}') as Record<string, string>;
    } catch {
      return {};
    }
  }, [value]);

  return (
    <SettingsForm title={title} description={description} saving={saving} onSubmit={submit}>
      {fields.map(([key, label]) => (
        <label key={key}>{label}
          {key === 'description' || key === 'footer' || key === 'default_message' || key === 'introduction' || key === 'other_social'
            ? <textarea name={key} rows={key === 'default_message' ? 4 : 3} defaultValue={initialValues[key] ?? ''} />
            : <input name={key} type={key.includes('email') ? 'email' : key.includes('instagram') ? 'url' : 'text'} defaultValue={initialValues[key] ?? ''} />}
          {key === 'widget_enabled' && <small>Enter true to show the floating contact button, or false to hide it.</small>}
        </label>
      ))}
    </SettingsForm>
  );
}

function SettingsForm({
  title,
  description,
  saving,
  onSubmit,
  children,
}: {
  title: string;
  description: string;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <AdminPageFrame>
      <div className="admin-panel admin-settings-panel">
        <div className="admin-panel-heading"><h2>{title}</h2><Settings size={19} /></div>
        <p className="admin-help">{description}</p>
        <form className="admin-settings-form" onSubmit={onSubmit}>
          {children}
          <button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </form>
      </div>
    </AdminPageFrame>
  );
}

function AccountSettings({
  user,
  saving,
  onSaveName,
  onSavePassword,
  setSaving,
  onError,
  onNotice,
}: {
  user: { email: string; name: string } | null;
  saving: boolean;
  onSaveName: (name: string) => Promise<void>;
  onSavePassword: (password: string) => Promise<void>;
  setSaving: (saving: boolean) => void;
  onError: (error: unknown, fallback: string) => void;
  onNotice: (message: string) => void;
}) {
  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSaveName(String(new FormData(event.currentTarget).get('name') ?? ''));
      onNotice('Account name updated.');
    } catch (error) {
      onError(error, 'Account name could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get('password') ?? '');
    if (password !== String(values.get('confirm_password') ?? '')) {
      onError(new Error('The passwords do not match.'), 'The password could not be updated.');
      return;
    }
    setSaving(true);
    try {
      await onSavePassword(password);
      form.reset();
      onNotice('Password updated.');
    } catch (error) {
      onError(error, 'Password could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    if (!user?.email) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      onNotice('If password recovery is enabled, a reset link has been sent to the account email.');
    } catch (error) {
      onError(error, 'A password reset email could not be sent.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageFrame>
      <div className="admin-account-grid">
        <section className="admin-panel">
          <h2>Account details</h2>
          <p><strong>Email</strong><br />{user?.email || 'No email available'}</p>
          <form className="admin-settings-form" onSubmit={saveName}>
            <label>Display name<input name="name" minLength={2} maxLength={80} defaultValue={user?.name ?? ''} required /></label>
            <button className="button button-dark" disabled={saving}>Update name</button>
          </form>
        </section>
        <section className="admin-panel">
          <h2>Change password</h2>
          <form className="admin-settings-form" onSubmit={savePassword}>
            <label>New password<input name="password" type="password" minLength={10} autoComplete="new-password" required /></label>
            <label>Confirm new password<input name="confirm_password" type="password" minLength={10} autoComplete="new-password" required /></label>
            <button className="button button-dark" disabled={saving}>Change password</button>
          </form>
          <button className="admin-secondary-button" type="button" onClick={() => void resetPassword()} disabled={saving}>Send password reset link</button>
        </section>
      </div>
    </AdminPageFrame>
  );
}
