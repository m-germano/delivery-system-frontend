import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Check, ChefHat, ClipboardList, RefreshCw, Store, Truck, Wifi, WifiOff, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import InputField from '../../components/ui/InputField.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { orderService } from '../../services/orderService.js';
import { connectRealtime } from '../../services/realtimeService.js';
import { formatCurrency } from '../../utils/formatters.js';

const deliveryStatusActions = {
  ABERTO: [
    { status: 'ACEITO', label: 'Aceitar', icon: Check, action: 'accept' },
    { status: 'RECUSADO', label: 'Recusar', icon: X, action: 'reject', variant: 'danger' },
  ],
  ACEITO: [{ status: 'EM_PREPARO', label: 'Iniciar preparo', icon: ChefHat }],
  EM_PREPARO: [{ status: 'AGUARDANDO_ENTREGADOR', label: 'Disponibilizar entrega', icon: Truck }],
};

const pickupStatusActions = {
  ABERTO: [
    { status: 'ACEITO', label: 'Aceitar', icon: Check, action: 'accept' },
    { status: 'RECUSADO', label: 'Recusar', icon: X, action: 'reject', variant: 'danger' },
  ],
  ACEITO: [{ status: 'EM_PREPARO', label: 'Iniciar preparo', icon: ChefHat }],
  EM_PREPARO: [{ status: 'PRONTO_PARA_RETIRADA', label: 'Pronto para retirada', icon: Store }],
  PRONTO_PARA_RETIRADA: [{ status: 'RETIRADO', label: 'Marcar como retirado', icon: Check }],
};

const statusVariant = {
  ABERTO: 'orange',
  ACEITO: 'blue',
  EM_PREPARO: 'blue',
  PRONTO_PARA_RETIRADA: 'orange',
  AGUARDANDO_ENTREGADOR: 'orange',
  EM_ENTREGA: 'blue',
  ENTREGUE: 'green',
  RETIRADO: 'green',
  CANCELADO: 'red',
  RECUSADO: 'red',
};

function OrderCard({ order, onAction }) {
  const isPickup = order.fulfillment_type === 'PICKUP';
  const actions = (isPickup ? pickupStatusActions : deliveryStatusActions)[order.status] ?? [];
  const canCompanyCancel = !['ENTREGUE', 'RETIRADO', 'CANCELADO', 'RECUSADO'].includes(order.status);

  return (
    <article className="app-card space-y-5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-slate-950">Pedido #{order.id}</h3>
            <Badge variant={statusVariant[order.status] ?? 'slate'}>{order.status}</Badge>
            <Badge variant={isPickup ? 'blue' : 'green'}>{isPickup ? 'Retirada' : 'Delivery'}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Pagamento {isPickup ? 'na retirada' : 'na entrega'}: {order.payment_method}
          </p>
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
          <p className="font-bold text-slate-900">{isPickup ? 'Retirada' : 'Entrega'}</p>
          {isPickup ? (
            <p className="mt-2">Cliente retirará o pedido na loja. Não enviar para motoboy.</p>
          ) : order.customer_address ? (
            <p className="mt-2">
              {order.customer_address.street}, {order.customer_address.number} · {order.customer_address.city}/{order.customer_address.state}
            </p>
          ) : null}
          <div className="mt-3 space-y-1">
            {Number(order.discount_amount ?? 0) > 0 ? (
              <p className="text-emerald-700">Desconto retirada: <strong>-{formatCurrency(order.discount_amount)}</strong></p>
            ) : null}
            {!isPickup ? <p>Distância: <strong>{order.distance_km} km</strong></p> : null}
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
  const [pickupConfirmation, setPickupConfirmation] = useState({ order: null, code: '', loading: false });

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
    if (order.fulfillment_type === 'PICKUP' && action.status === 'RETIRADO') {
      setPickupConfirmation({ order, code: '', loading: false });
      return;
    }

    try {
      if (action.action === 'accept') await orderService.accept(order.id);
      else if (action.action === 'reject') await orderService.reject(order.id);
      else if (action.action === 'cancel') await orderService.cancelByCompany(order.id);
      else await orderService.updateStatus(order.id, action.status);

      if (action.action === 'reject' && order.payment_method === 'PIX_ONLINE') {
        toast.success('Pedido recusado e reembolso solicitado/realizado.');
      } else {
        toast.success('Pedido atualizado com sucesso.');
      }
      await loadOrders({ silent: true });
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível atualizar o pedido.'));
    }
  }

  async function confirmPickupOrder() {
    const order = pickupConfirmation.order;
    const code = pickupConfirmation.code.trim();

    if (!order) return;
    if (code.length < 4) {
      toast.error('Informe o código de retirada com 4 dígitos.');
      return;
    }

    setPickupConfirmation((current) => ({ ...current, loading: true }));

    try {
      await orderService.updateStatus(order.id, 'RETIRADO', code);
      toast.success('Retirada confirmada com sucesso.');
      setPickupConfirmation({ order: null, code: '', loading: false });
      await loadOrders({ silent: true });
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível confirmar a retirada.'));
      setPickupConfirmation((current) => ({ ...current, loading: false }));
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

      <Modal
        open={Boolean(pickupConfirmation.order)}
        title="Confirmar retirada"
        description="Digite o código exibido para o cliente para marcar o pedido como retirado."
        onClose={() => {
          if (!pickupConfirmation.loading) {
            setPickupConfirmation({ order: null, code: '', loading: false });
          }
        }}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={pickupConfirmation.loading}
              onClick={() => setPickupConfirmation({ order: null, code: '', loading: false })}
            >
              Cancelar
            </Button>
            <Button type="button" disabled={pickupConfirmation.loading} onClick={confirmPickupOrder}>
              {pickupConfirmation.loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirmar retirada
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert variant="info" title={`Pedido #${pickupConfirmation.order?.id ?? ''}`}>
            Peça ao cliente o código de retirada antes de finalizar o pedido.
          </Alert>
          <InputField
            id="pickup-confirmation-code"
            label="Código de retirada"
            placeholder="0000"
            inputMode="numeric"
            maxLength={4}
            value={pickupConfirmation.code}
            onChange={(event) => {
              const code = event.target.value.replace(/\D/g, '').slice(0, 4);
              setPickupConfirmation((current) => ({ ...current, code }));
            }}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
