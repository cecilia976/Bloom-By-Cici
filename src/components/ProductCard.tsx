import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { Product } from '../lib/types';

export default function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product) => void;
}) {
  const unavailable = product.stock_status === 'Out of stock';

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-image-wrap">
        <img src={product.images[0]} alt={product.title} />
        <span className="product-tag">
          {product.featured ? "Cici's pick" : product.occasions?.[0]}
        </span>
        {unavailable && <span className="sold-out">Sold out</span>}
      </Link>

      <div className="product-card-info">
        <div>
          <span className="product-category">{product.category.split(' & ')[0]}</span>
          <Link to={`/product/${product.id}`}>
            <h3>{product.title}</h3>
          </Link>
          <span className="stock-line">
            <i className={product.stock_status.toLowerCase().replace(' ', '-')}></i>
            {product.stock_status}
          </span>
        </div>

        <div className="card-buy">
          <strong>${product.price.toFixed(2)}</strong>
          <button
            disabled={unavailable}
            onClick={() => onAdd(product)}
            aria-label={`Add ${product.title} to cart`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
