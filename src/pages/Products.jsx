import { ProductCard } from '../components/ProductCard.jsx';
import { useProducts } from '../hooks/useProducts.js';

export function Products() {
  const { products, loading, error } = useProducts();

  if (loading) return <p>Carregando produtos...</p>;
  if (error) return <p>Erro: {error}</p>;

  return (
    <section>
      <h1>Produtos</h1>
      <div className="grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
