import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, KeyRound, MapPinned, RefreshCw } from 'lucide-react';
import DeliveryTrackingMap from '../../components/map/DeliveryTrackingMap.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { orderService } from '../../services/orderService.js';
import { routeService } from '../../services/routeService.js';
import { trackingService } from '../../services/trackingService.js';
import { connectOrderTrackingSocket } from '../../services/trackingSocket.js';
import { formatCurrency } from '../../utils/formatters.js';

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

function getRouteOrigin(snapshot) {
  if (snapshot?.courier_location) {
    return snapshot.courier_location;
  }

  return snapshot?.company;
}

function getConnectionLabel(status) {
  if (status === 'connected') return 'Tempo real conectado';
  if (status === 'error') return 'Tempo real indisponível';
  if (status === 'closed') return 'Tempo real desconectado';
  return 'Conectando tempo real';
}

export default function CustomerOrderTracking() {
  const { orderId } = useParams();
  const [snapshot, setSnapshot] = useState(null);
  const [order, setOrder] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const deliveryConfirmationCode = order?.delivery_confirmation_code;
  const isOutForDelivery = snapshot?.order_status === 'EM_ENTREGA' || order?.status === 'EM_ENTREGA';
  const courierIsSharingLocation = Boolean(snapshot?.courier_location);

  async function loadData({ showLoading = true } = {}) {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const [trackingSnapshot, orderData] = await Promise.all([
        trackingService.getOrderTracking(orderId),
        orderService.getById(orderId),
      ]);

      setSnapshot(trackingSnapshot);
      setOrder(orderData);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível carregar o acompanhamento do pedido.');
      setError(message);
      toast.error(message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [orderId]);

  useEffect(() => {
    const socket = connectOrderTrackingSocket(orderId, {
      onOpen: () => setConnectionStatus('connected'),
      onClose: () => setConnectionStatus('closed'),
      onError: () => setConnectionStatus('error'),
      onMessage: (event) => {
        if (!event?.type) return;

        if (['TRACKING_SNAPSHOT', 'ORDER_STATUS_UPDATED', 'DELIVERY_STATUS_UPDATED'].includes(event.type)) {
          setSnapshot(event.data);
          loadData({ showLoading: false });
          return;
        }

        if (event.type === 'DELIVERY_LOCATION_UPDATED') {
          setSnapshot((current) => {
            if (!current) return current;

            return {
              ...current,
              order_status: event.data?.order_status ?? current.order_status,
              delivery: current.delivery
                ? { ...current.delivery, status: event.data?.delivery_status ?? current.delivery.status }
                : current.delivery,
              courier_location: event.data?.courier_location ?? current.courier_location,
              updated_at: new Date().toISOString(),
            };
          });
        }
      },
    });

    socketRef.current = socket;

    return () => {
      socket?.close();
      socketRef.current = null;
    };
  }, [orderId]);

  const routeKey = useMemo(() => {
    const origin = getRouteOrigin(snapshot);
    const destination = snapshot?.customer;
    return [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude].join('|');
  }, [snapshot]);

  useEffect(() => {
    let isMounted = true;

    async function loadRoute() {
      const origin = getRouteOrigin(snapshot);
      const destination = snapshot?.customer;

      if (!origin || !destination) {
        setRouteCoordinates([]);
        return;
      }

      try {
        const route = await routeService.getRoute(origin, destination);
        if (isMounted) setRouteCoordinates(route);
      } catch {
        if (isMounted) setRouteCoordinates([]);
      }
    }

    loadRoute();

    return () => {
      isMounted = false;
    };
  }, [routeKey, snapshot]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cliente"
        title={`Acompanhamento do pedido #${orderId}`}
        description="Veja o status do pedido e, quando disponível, a localização do entregador em tempo real."
        actions={
          <Link to="/customer/orders" className="app-button-secondary">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        }
      />

      {error ? (
        <Alert variant="error" title="Atenção">
          {error}
        </Alert>
      ) : null}

      <section className="app-card p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-700">
              <MapPinned className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-400">Status atual</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {snapshot?.order_status ? <Badge variant={statusVariant[snapshot.order_status] ?? 'slate'}>{snapshot.order_status}</Badge> : null}
                {snapshot?.delivery?.status ? <Badge variant="slate">Entrega {snapshot.delivery.status}</Badge> : null}
                <Badge variant={connectionStatus === 'connected' ? 'green' : 'orange'}>{getConnectionLabel(connectionStatus)}</Badge>
              </div>
            </div>
          </div>

          <Button type="button" variant="secondary" onClick={() => loadData()} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Atualizar
          </Button>
        </div>
      </section>

      {loading ? (
        <div className="app-card flex items-center gap-3 p-6 text-sm text-ink-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando acompanhamento...
        </div>
      ) : null}

      {snapshot ? (
        <>
          {isOutForDelivery && deliveryConfirmationCode ? (
            <section className="rounded-2xl border border-coral-200 bg-coral-50 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-coral-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">Código de confirmação</p>
                  <p className="mt-1 text-sm leading-6 text-ink-600">
                    Informe este código ao entregador somente quando o pedido estiver em mãos.
                  </p>
                  <p className="mt-3 inline-flex rounded-xl border border-coral-200 bg-white px-4 py-2 text-2xl font-semibold tracking-[0.35em] text-coral-700">
                    {deliveryConfirmationCode}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {isOutForDelivery && !courierIsSharingLocation ? (
            <Alert variant="info" title="Localização ainda não compartilhada">
              O entregador ainda não está compartilhando a localização. Você pode continuar acompanhando o status do pedido por aqui.
            </Alert>
          ) : null}

          <DeliveryTrackingMap snapshot={snapshot} routeCoordinates={routeCoordinates} />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="app-card p-5">
              <p className="text-sm font-medium text-ink-400">Restaurante</p>
              <h3 className="mt-1 font-semibold text-ink-900">{snapshot.company?.name}</h3>
              <p className="mt-2 text-sm text-ink-500">{snapshot.company?.address}</p>
            </div>
            <div className="app-card p-5">
              <p className="text-sm font-medium text-ink-400">Destino</p>
              <h3 className="mt-1 font-semibold text-ink-900">Endereço de entrega</h3>
              <p className="mt-2 text-sm text-ink-500">{snapshot.customer?.address}</p>
            </div>
            <div className="app-card p-5">
              <p className="text-sm font-medium text-ink-400">Entrega</p>
              <h3 className="mt-1 font-semibold text-ink-900">#{snapshot.delivery?.id ?? '-'}</h3>
              <p className="mt-2 text-sm text-ink-500">
                Taxa: {formatCurrency(snapshot.delivery?.delivery_fee)} · Distância: {snapshot.delivery?.distance_km ?? '-'} km
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
