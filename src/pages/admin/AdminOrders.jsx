import FeaturePlaceholder from '../../components/ui/FeaturePlaceholder.jsx';

export default function AdminOrders() {
  return (
    <FeaturePlaceholder
      title="Pedidos do sistema"
      description="Consulta geral de pedidos para apoio administrativo."
      endpoint="GET /orders ou rota administrativa equivalente"
    />
  );
}
