import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Check, ChefHat, ClipboardList, RefreshCw, Truck, Wifi, WifiOff, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { orderService } from '../../services/orderService.js';
import { connectRealtime } from '../../services/realtimeService.js';
import { formatCurrency } from '../../utils/formatters.js';

const nextStatusActions = {
  ABERTO: [
    { status: 'ACEITO', label: 'Aceitar', icon: Check, action: 'accept' },
    { status: 'RECUSADO', label: 'Recusar', icon: X, action: 'reject', variant: 'danger' },
  ],
  ACEITO: [{ status: 'EM_PREPARO', label: 'Iniciar preparo', icon: ChefHat }],
  EM_PREPARO: [{ status: 'AGUARDANDO_ENTREGADOR', label: 'Disponibilizar entrega', icon: Truck }],
};

const statusVariant = {
  ABERTO: 'orange',
  ACEITO: 'blue',
  EM_PREPARO: 'blue',
  AGUARDANDO_ENTREGADOR: 'orange',
  EM_ENTREGA: 'blue',
  ENTREGUE: 'green',
  CANCELADO: 'red',
  RECUSADO: 'red',
};

function OrderCard({ order, onAction }) {
  const actions = nextStatusActions[order.status] ?? [];
  const canCompanyCancel = !['ENTREGUE', 'CANCELADO', 'RECUSADO'].includes(order.status);

  return (
    <article className="app-card space-y-5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-slate-950">Pedido #{order.id}</h3>
            <Badge variant={statusVariant[order.status] ?? 'slate'}>{order.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">Pagamento na entrega: {order.payment_method}</p>
        </div>
        <p className="text-2xl font-black text-orange-600">{formatCurrency(order.total)}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">Itens</p>
          <div className="mt-3 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm text-slate-600">
                <span>{item.quantity}x {item.product_name}</span>
                <strong>{formatCurrency(item.total_price)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-bold text-slate-900">Entrega</p>
          {order.customer_address ? (
            <p className="mt-2">
              {order.customer_address.street}, {order.customer_address.number} · {order.customer_address.city}/{order.customer_address.state}
            </p>
          ) : null}
          <div className="mt-3 space-y-1">
            <p>Distância: <strong>{order.distance_km} km</strong></p>
            <p>Taxa: <strong>{formatCurrency(order.delivery_fee)}</strong></p>
          </div>
        </div>
      </div>

      {order.notes ? <Alert variant="info" title="Observações">{order.notes}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.status}
              type="button"
              variant={action.variant ?? 'secondary'}
              onClick={() => onAction(order, action)}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
        {canCompanyCancel ? (
          <Button type="button" variant="danger" onClick={() => onAction(order, { action: 'cancel', label: 'Cancelar pedido' })}>
            <X className="h-4 w-4" />
            Cancelar pedido
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default function CompanyOrders() {
  const reconnectTimerRef = useRef(null);
  const socketRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await orderService.listCompany({ limit: 100 });
      setOrders(response?.items ?? []);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível carregar os pedidos.');
      setError(message);
      if (!silent) toast.error(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    let shouldReconnect = true;

    function scheduleReconnect() {
      if (!shouldReconnect) return;
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(connect, 3000);
    }

    function connect() {
      socketRef.current?.close();
      socketRef.current = connectRealtime('/ws/company/orders', {
        onOpen: () => setRealtimeConnected(true),
        onMessage: (event) => {
          if (event.type === 'connection.ready') return;

          if (event.type === 'order.created') {
            toast.info(event.message ?? 'Novo pedido recebido.');
          }

          if (event.type === 'order.cancelled') {
            toast.info(event.message ?? 'Pedido cancelado.');
          }

          if (event.type?.startsWith('order.')) {
            loadOrders({ silent: true });
          }
        },
        onClose: () => {
          setRealtimeConnected(false);
          scheduleReconnect();
        },
        onError: () => {
          setRealtimeConnected(false);
        },
      });
    }

    connect();

    return () => {
      shouldReconnect = false;
      window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [loadOrders]);

  async function handleAction(order, action) {
    try {
      if (action.action === 'accept') await orderService.accept(order.id);
      else if (action.action === 'reject') await orderService.reject(order.id);
      else if (action.action === 'cancel') await orderService.cancelByCompany(order.id);
      else await orderService.updateStatus(order.id, action.status);

      toast.success('Pedido atualizado com sucesso.');
      await loadOrders({ silent: true });
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível atualizar o pedido.'));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos recebidos"
        description="Os pedidos aparecem automaticamente quando os clientes compram."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
              {realtimeConnected ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-slate-400" />}
              {realtimeConnected ? 'Tempo real ativo' : 'Reconectando'}
            </span>
            <Button type="button" variant="secondary" onClick={() => loadOrders()} disabled={loading}>
              <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Atualizar
            </Button>
          </div>
        }
      />

      {error ? <Alert variant="error" title="Atenção">{error}</Alert> : null}

      {loading ? (
        <div className="app-card flex items-center gap-3 p-6 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando pedidos...
        </div>
      ) : null}

      {!loading && orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhum pedido recebido" description="Os pedidos criados pelos clientes aparecerão aqui em tempo real." />
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onAction={handleAction} />
        ))}
      </div>
    </div>
  );
}
