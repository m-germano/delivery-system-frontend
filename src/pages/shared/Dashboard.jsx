import { Bike, ClipboardList, Store, Utensils } from 'lucide-react';
import MetricCard from '../../components/ui/MetricCard.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { getRoleLabel } from '../../config/roles.js';
import { useAuthStore } from '../../stores/useAuthStore.js';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <section className="app-card overflow-hidden p-6 md:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">Bem-vindo</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Olá, {user?.name ?? 'usuário'}.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Seu perfil atual é <strong>{getRoleLabel(user)}</strong>. A sidebar já mostra apenas as funcionalidades permitidas para esse perfil.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Empresas" value="--" description="Cadastro e consulta de restaurantes." icon={Store} />
        <MetricCard title="Produtos" value="--" description="Cardápio e disponibilidade." icon={Utensils} />
        <MetricCard title="Pedidos" value="--" description="Fluxo operacional do pedido." icon={ClipboardList} />
        <MetricCard title="Entregas" value="--" description="Corridas e localização." icon={Bike} />
      </div>

      <Alert variant="info" title="Próximo passo">
        Esta base já está pronta para consumir as próximas rotas da API. Conforme você implementar empresas, produtos, pedidos e entregas no backend, basta ligar as páginas aos services já criados.
      </Alert>
    </div>
  );
}
