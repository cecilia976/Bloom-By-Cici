import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  ArrowDown,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Star,
  Trash2,
  X,
  Flower2,
  Images,
  Package,
  Pencil,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { isAuthorizedAdmin } from '../lib/auth';
import type { CustomerReview } from '../lib/reviews';
import type { Product, Category, StockStatus } from '../lib/types';
import {
  deleteAdminImageIfUnused,
  deleteAdminImages,
  deleteGalleryItem,
  fetchGalleryItems,
  getAdminImageStoragePath,
  replaceGalleryImage,
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
  { key: 'products', label: 'Products', icon: Flower2 },
  { key: 'gallery', label: 'Gallery & Images', icon: Images },
  { key: 'reviews', label: 'Customer Reviews', icon: Star },
] as const;

type AdminPage = (typeof adminPages)[number]['key'];
type ManagedProduct = Omit<Product, 'price'> & { price: number | null; active: boolean; display_order: number };
type DashboardData = {
  products: ManagedProduct[];
  reviews: CustomerReview[];
};

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
  const resolvedPagePart = pagePart === 'collections' ? 'products' : pagePart;
  const page: AdminPage = isAdminPage(resolvedPagePart) ? resolvedPagePart : 'overview';
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({ products: [], reviews: [] });
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [productSearch, setProductSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [productEditor, setProductEditor] = useState<ManagedProduct | null | false>(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [moderatingReviewId, setModeratingReviewId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && active) {
        setAuthorized(false);
      }
      if (session && !isAuthorizedAdmin(session.user) && active) setAuthorized(false);
    });

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

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!isAuthorizedAdmin(userData.user)) {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) throw signOutError;
          if (active) setAuthorized(false);
          return;
        }

        if (active) setAuthorized(true);
        await reloadDashboard();
        const galleryItems = await fetchGalleryItems();
        if (active) setGallery(galleryItems);
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error
            ? `Dashboard data could not be loaded: ${error.message}`
            : 'Dashboard data could not be loaded. Confirm the database migrations are applied and try again.');
          setAuthorized((current) => current ?? false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    async function reloadDashboard() {
      const [productsResult, reviewsResult] = await Promise.all([
        supabase.from('products').select('*').order('display_order').order('created_at', { ascending: false }),
        supabase.from('customer_reviews').select('*').order('created_at', { ascending: false }),
      ]);
      const dataError = productsResult.error ?? reviewsResult.error;
      if (dataError) throw dataError;
      if (active) {
        setData({
          products: (productsResult.data ?? []) as ManagedProduct[],
          reviews: (reviewsResult.data ?? []) as CustomerReview[],
        });
      }
    }

    void initialize();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function reloadDashboard() {
    const [productsResult, reviewsResult] = await Promise.all([
      supabase.from('products').select('*').order('display_order').order('created_at', { ascending: false }),
      supabase.from('customer_reviews').select('*').order('created_at', { ascending: false }),
    ]);
    const dataError = productsResult.error ?? reviewsResult.error;
    if (dataError) throw dataError;
    setData({
      products: (productsResult.data ?? []) as ManagedProduct[],
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
      if (productEditor && uploaded.length) {
        await Promise.all(productEditor.images.map(async (url) => {
          const path = getAdminImageStoragePath(url);
          if (path) await deleteAdminImageIfUnused(path, url);
        }));
      }
      await reloadDashboard();
      setProductEditor(false);
      setNotice('Arrangement saved.');
    } catch (error) {
      if (productSaved) {
        setProductEditor(false);
        let detail = `The arrangement was saved, but follow-up work failed: ${error instanceof Error ? error.message : 'unknown error'}`;
        try {
          await reloadDashboard();
        } catch (refreshError) {
          detail += ` Dashboard refresh also failed: ${refreshError instanceof Error ? refreshError.message : 'unknown error'}`;
        }
        reportError(new Error(detail), 'The arrangement was saved but follow-up work failed.');
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
      await Promise.all(product.images.map(async (url) => {
        const path = getAdminImageStoragePath(url);
        if (path) await deleteAdminImageIfUnused(path, url);
      }));
      await reloadDashboard();
      setNotice('Arrangement deleted.');
    } catch (error) {
      if (deleted) {
        setData((current) => ({ ...current, products: current.products.filter((item) => item.id !== product.id) }));
        let detail = `Arrangement deleted, but follow-up work failed: ${error instanceof Error ? error.message : 'unknown error'}`;
        try {
          await reloadDashboard();
        } catch (refreshError) {
          detail += ` Dashboard refresh also failed: ${refreshError instanceof Error ? refreshError.message : 'unknown error'}`;
        }
        reportError(new Error(detail), 'The arrangement was deleted but follow-up work failed.');
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

  async function moderateReview(review: CustomerReview, isApproved: boolean) {
    setModeratingReviewId(review.id);
    setErrorMessage('');
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_approved: isApproved })
        .eq('id', review.id);
      if (error) throw error;
      setData((current) => ({
        ...current,
        reviews: current.reviews.map((item) => item.id === review.id
          ? { ...item, is_approved: isApproved }
          : item),
      }));
      setNotice(isApproved ? 'Review approved and published.' : 'Review hidden from the website.');
    } catch (error) {
      reportError(error, 'The review status could not be changed.');
    } finally {
      setModeratingReviewId(null);
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
  if (!isAdminPage(resolvedPagePart) && pagePart !== undefined) return <Navigate to="/admin/overview" replace />;

  const title = adminPages.find((item) => item.key === page)?.label ?? 'Dashboard Overview';
  const pendingReviews = data.reviews.filter((review) => !review.is_approved);
  const visibleProducts = data.products
    .filter((product) => activeFilter === 'all' || (activeFilter === 'active' ? product.active : !product.active))
    .filter((product) => categoryFilter === 'all' || product.category === categoryFilter)
    .filter((product) => `${product.title} ${product.category}`.toLowerCase().includes(productSearch.toLowerCase()));
  const recentProducts = [...data.products]
    .sort((a, b) => (Date.parse(b.created_at ?? '') || 0) - (Date.parse(a.created_at ?? '') || 0))
    .slice(0, 5);
  const visibleReviews = data.reviews.filter((review) => {
    const matchesText = `${review.customer_name} ${review.feedback}`.toLowerCase().includes(reviewSearch.toLowerCase());
    const matchesStatus = reviewStatusFilter === 'all'
      || (reviewStatusFilter === 'pending' ? !review.is_approved : review.is_approved);
    return matchesText && matchesStatus && (reviewRatingFilter === 'all' || String(review.rating) === reviewRatingFilter);
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
              <StatCard label="Gallery images" value={gallery.length} icon={<Images />} />
              <StatCard label="Customer reviews" value={data.reviews.length} icon={<Star />} />
              <StatCard label="Pending reviews" value={pendingReviews.length} icon={<EyeOff />} />
            </div>
            <div className="admin-overview-columns">
              <div className="admin-panel">
                <div className="admin-panel-heading">
                  <h2>Recently added arrangements</h2>
                  <Link to="/admin/products">Manage products <span aria-hidden="true">→</span></Link>
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
                  <h2>Reviews awaiting approval</h2>
                  <Link to="/admin/reviews">Manage reviews <span aria-hidden="true">→</span></Link>
                </div>
                {pendingReviews.slice(0, 5).map((review) => (
                  <div className="admin-recent-review" key={review.id}>
                    <div><strong>{review.customer_name}</strong><span>{review.rating} of 5 stars · {formatDate(review.created_at)}</span></div>
                    <p>{review.feedback}</p>
                  </div>
                ))}
                {!pendingReviews.length && <p className="admin-empty">No reviews are waiting for approval.</p>}
              </div>
            </div>
            <div className="admin-quick-actions">
              <button className="admin-secondary-button" type="button" onClick={() => setProductEditor(null)}><Plus size={16} /> Add a product</button>
              <Link to="/admin/gallery"><Images size={16} /> Upload an image</Link>
              <Link to="/admin/reviews"><Star size={16} /> View reviews</Link>
            </div>
          </AdminPageFrame>
        )}

        {page === 'products' && (
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
              <select aria-label="Filter reviews by approval" value={reviewStatusFilter} onChange={(event) => setReviewStatusFilter(event.target.value as typeof reviewStatusFilter)}>
                <option value="all">All review statuses</option>
                <option value="pending">Awaiting approval</option>
                <option value="approved">Published</option>
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
                  <span className={review.is_approved ? 'admin-status published' : 'admin-status hidden'}>
                    {review.is_approved ? 'Published' : 'Awaiting approval'}
                  </span>
                  <button
                    className="admin-review-moderate"
                    type="button"
                    disabled={moderatingReviewId === review.id}
                    onClick={() => void moderateReview(review, !review.is_approved)}
                  >
                    {review.is_approved ? <><EyeOff size={16} /> Hide review</> : <><Check size={16} /> Approve review</>}
                  </button>
                  <button className="admin-review-delete" type="button" disabled={deletingReviewId === review.id} onClick={() => void deleteReview(review)}>
                    <Trash2 size={16} /> {deletingReviewId === review.id ? 'Deleting…' : 'Delete review'}
                  </button>
                </article>
              ))}
              {!visibleReviews.length && <p className="admin-empty">No reviews match these filters.</p>}
            </div>
          </AdminPageFrame>
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

  useEffect(() => () => {
    photoPreviews.filter((url) => url.startsWith('blob:')).forEach((url) => URL.revokeObjectURL(url));
  }, [photoPreviews]);

  function updatePreviews(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    try {
      files.forEach(validateImageFile);
      setPhotoPreviews(files.length ? files.map((file) => URL.createObjectURL(file)) : product?.images ?? []);
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [replacement, setReplacement] = useState<{ item: GalleryItem; file: File; preview: string } | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  useEffect(() => () => {
    pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    if (replacement) URL.revokeObjectURL(replacement.preview);
  }, [pendingPreviews, replacement]);

  function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    try {
      files.forEach(validateImageFile);
      setPendingFiles(files);
      setPendingPreviews(files.map((file) => URL.createObjectURL(file)));
      onError('');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Choose valid image files.');
    } finally {
      event.target.value = '';
    }
  }

  async function uploadPhotos() {
    if (!pendingFiles.length) return;
    setUploading(true);
    setUploadedCount(0);
    onError('');
    const uploads: { path: string; url: string }[] = [];
    const createdIds: string[] = [];
    try {
      for (const file of pendingFiles) {
        uploads.push(await uploadAdminImage(file));
        setUploadedCount(uploads.length);
      }
      const inserts = await Promise.all(uploads.map((image, index) =>
        supabase.from('gallery_items').insert({
          storage_path: image.path,
          image_url: image.url,
          caption: pendingFiles[index].name.replace(/\.[^.]+$/, ''),
          display_order: items.length + index,
          is_public: true,
        }).select().single(),
      ));
      createdIds.push(...inserts.flatMap((result) => result.data?.id ? [result.data.id] : []));
      const insertError = inserts.find((result) => result.error)?.error;
      if (insertError) throw insertError;
      onChange([...inserts.map((result) => result.data as GalleryItem), ...items]);
      onNotice('Photographs uploaded.');
      setPendingFiles([]);
      setPendingPreviews([]);
    } catch (error) {
      const cleanupErrors: string[] = [];
      let canDeleteFiles = true;
      if (createdIds.length) {
        const { error: rowCleanupError } = await supabase.from('gallery_items').delete().in('id', createdIds);
        if (rowCleanupError) {
          canDeleteFiles = false;
          cleanupErrors.push('Some gallery records may need manual cleanup; their image files were retained to avoid broken references.');
        }
      }
      if (uploads.length && canDeleteFiles) {
        try {
          await deleteAdminImages(uploads.map((image) => image.path));
        } catch (cleanupError) {
          cleanupErrors.push(`Some uploaded files may need manual cleanup: ${cleanupError instanceof Error ? cleanupError.message : 'storage cleanup failed.'}`);
        }
      }
      const message = error instanceof Error ? error.message : 'Photographs could not be uploaded.';
      onError(cleanupErrors.length ? `${message} ${cleanupErrors.join(' ')}` : message);
    } finally {
      setUploading(false);
    }
  }

  function chooseReplacement(item: GalleryItem, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      validateImageFile(file);
      setReplacement({ item, file, preview: URL.createObjectURL(file) });
      onError('');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Choose a valid image file.');
    }
  }

  async function confirmReplacement() {
    if (!replacement) return;
    setReplacingId(replacement.item.id);
    onError('');
    try {
      const updatedItem = await replaceGalleryImage(replacement.item, replacement.file);
      onChange(items.map((item) => item.id === updatedItem.id ? updatedItem : item));
      onNotice('Gallery image replaced.');
      setReplacement(null);
    } catch (error) {
      let message = error instanceof Error ? error.message : 'The gallery image could not be replaced.';
      try {
        const latestItems = await fetchGalleryItems();
        onChange(latestItems);
      } catch (refreshError) {
        message += ` Gallery refresh failed: ${refreshError instanceof Error ? refreshError.message : 'unknown error'}`;
      }
      onError(message);
      setReplacement(null);
    } finally {
      setReplacingId(null);
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
        <label className="admin-upload-button"><Plus size={17} /> Choose photographs
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || saving} onChange={choosePhotos} />
        </label>
        <label className="admin-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search captions" /></label>
      </div>
      <p className="admin-help">JPG, PNG, and WebP files up to 8 MB. Preview your selections before uploading.</p>
      {pendingFiles.length > 0 && (
        <section className="admin-upload-preview" aria-label="Selected image previews">
          <div className="admin-panel-heading">
            <h2>{uploading ? `Uploading ${uploadedCount} of ${pendingFiles.length}…` : `${pendingFiles.length} image${pendingFiles.length === 1 ? '' : 's'} selected`}</h2>
            <button type="button" className="admin-secondary-button" disabled={uploading} onClick={() => { setPendingFiles([]); setPendingPreviews([]); }}>Clear selection</button>
          </div>
          <div className="admin-image-previews">
            {pendingPreviews.map((url, index) => <img src={url} alt={`Selected gallery image ${index + 1}`} key={url} />)}
          </div>
          <button className="button button-dark" type="button" disabled={uploading} onClick={() => void uploadPhotos()}>
            {uploading ? 'Uploading…' : 'Upload selected images'}
          </button>
        </section>
      )}
      <div className="admin-gallery-grid">
        {items.filter((item) => item.caption.toLowerCase().includes(search.toLowerCase())).map((item) => (
          <article className="admin-gallery-item" key={item.id}>
            <img src={item.image_url} alt={item.caption} />
            <label>Alt text / caption<input value={item.caption} onChange={(event) => onChange(items.map((entry) => entry.id === item.id ? { ...entry, caption: event.target.value } : entry))} onBlur={(event) => void updateItem(item, { caption: event.target.value })} /></label>
            <label className="admin-checkbox"><input type="checkbox" checked={item.is_public} onChange={(event) => void updateItem(item, { is_public: event.target.checked })} /> Show publicly</label>
            <div className="admin-gallery-actions">
              <label className="admin-gallery-replace" aria-label={`Replace ${item.caption || 'gallery image'}`}>
                {replacingId === item.id ? 'Replacing…' : 'Replace'}
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(replacingId) || saving} onChange={(event) => chooseReplacement(item, event)} />
              </label>
              <button type="button" onClick={() => void moveItem(item, -1)} aria-label="Move image up"><ArrowUp size={15} /></button>
              <button type="button" onClick={() => void moveItem(item, 1)} aria-label="Move image down"><ArrowDown size={15} /></button>
              <button type="button" onClick={() => void onDelete(item)} aria-label="Delete image"><Trash2 size={15} /></button>
            </div>
          </article>
        ))}
        {!items.length && <p className="admin-empty">Upload photographs to start your gallery.</p>}
        {items.length > 0 && !items.some((item) => item.caption.toLowerCase().includes(search.toLowerCase())) && <p className="admin-empty">No gallery images match this search.</p>}
      </div>
      {replacement && (
        <div className="modal-overlay" onMouseDown={() => setReplacement(null)}>
          <section className="admin-modal" aria-labelledby="gallery-replacement-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div><span className="eyebrow">GALLERY IMAGE</span><h2 id="gallery-replacement-title">Preview replacement</h2></div>
              <button className="icon-button" type="button" aria-label="Cancel replacement" onClick={() => setReplacement(null)}><X /></button>
            </div>
            <img className="admin-replacement-preview" src={replacement.preview} alt="Preview of replacement image" />
            <p className="admin-help">This replaces the gallery item’s file. Existing products or page content that still use the old image will keep it.</p>
            <div className="admin-quick-actions">
              <button className="admin-secondary-button" type="button" onClick={() => setReplacement(null)}>Cancel</button>
              <button className="button button-dark" type="button" disabled={replacingId === replacement.item.id} onClick={() => void confirmReplacement()}>
                {replacingId === replacement.item.id ? 'Replacing…' : 'Replace image'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminPageFrame>
  );
}
