import { Building2, ClipboardList, Users } from 'lucide-react';
import MetricCard from '../../components/ui/MetricCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral do sistema"
        description="Área para acompanhar cadastros, empresas, pedidos e apoio operacional do MVP."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Usuários" value="--" description="Clientes, empresas e entregadores." icon={Users} />
        <MetricCard title="Empresas" value="--" description="Restaurantes parceiros ativos." icon={Building2} />
        <MetricCard title="Pedidos" value="--" description="Fluxo geral da operação." icon={ClipboardList} />
      </div>
    </div>
  );
}
