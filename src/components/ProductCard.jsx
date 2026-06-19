export function ProductCard({ product }) {
  return (
    <article className="card">
      <h3>{product.name}</h3>
      <p>{product.description || 'Sem descrição.'}</p>
      <strong>R$ {Number(product.price).toFixed(2)}</strong>
    </article>
  );
}
