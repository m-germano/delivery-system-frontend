import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Bike, Bell, BellOff, MapPin, PackageCheck, RefreshCw, Store, Wifi, WifiOff } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { deliveryService } from '../../services/deliveryService.js';
import { connectRealtime } from '../../services/realtimeService.js';
import { formatCurrency } from '../../utils/formatters.js';

function DeliveryCard({ delivery, onAccept }) {
  const order = delivery.order;
  const company = order?.company;
  const address = order?.customer_address;

  return (
    <article className="app-card space-y-5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-slate-950">Entrega #{delivery.id}</h3>
            <Badge variant="orange">{delivery.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">Pedido #{delivery.order_id} · taxa de entrega {formatCurrency(delivery.delivery_fee)}</p>
        </div>
        <Button type="button" onClick={() => onAccept(delivery)}>
          <PackageCheck className="h-4 w-4" />
          Aceitar entrega
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Store className="h-4 w-4 text-orange-600" />
            Retirada
          </div>
          <p className="mt-2">{company?.name ?? 'Empresa'}</p>
          {company?.address ? (
            <p className="mt-1 text-slate-500">
              {company.address.street}, {company.address.number} · {company.address.city}/{company.address.state}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <MapPin className="h-4 w-4 text-orange-600" />
            Entrega
          </div>
          {address ? (
            <p className="mt-2">
              {address.street}, {address.number} · {address.neighborhood} · {address.city}/{address.state}
            </p>
          ) : null}
          <p className="mt-3">Distância: <strong>{delivery.distance_km} km</strong></p>
        </div>
      </div>

      {order?.items?.length ? (
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-900">Resumo do pedido</p>
          <div className="mt-3 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm text-slate-600">
                <span>{item.quantity}x {item.product_name}</span>
                <strong>{formatCurrency(item.total_price)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function CourierAvailableDeliveries() {
  const reconnectTimerRef = useRef(null);
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const loadDeliveries = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await deliveryService.listAvailable({ limit: 100 });
      setDeliveries(response?.items ?? []);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível carregar entregas disponíveis.');
      setError(message);
      if (!silent) toast.error(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  function playNotificationSound({ force = false } = {}) {
    if ((!soundEnabled && !force) || !audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);

    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.36);
  }

  async function enableSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      toast.error('Seu navegador não suporta notificação sonora.');
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    await audioContextRef.current.resume();
    setSoundEnabled(true);

    window.setTimeout(() => {
      playNotificationSound({ force: true });
    }, 0);

    toast.success('Notificações sonoras ativadas.');
  }

  useEffect(() => {
    let shouldReconnect = true;

    function scheduleReconnect() {
      if (!shouldReconnect) return;
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(connect, 3000);
    }

    function connect() {
      socketRef.current?.close();
      socketRef.current = connectRealtime('/ws/courier/deliveries', {
        onOpen: () => setRealtimeConnected(true),
        onMessage: (event) => {
          if (event.type === 'connection.ready') return;

          if (event.type === 'delivery.available') {
            toast.info(event.message ?? 'Nova entrega disponível.');
            playNotificationSound();
          }

          if (event.type?.startsWith('delivery.')) {
            loadDeliveries({ silent: true });
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
  }, [loadDeliveries, soundEnabled]);

  async function handleAccept(delivery) {
    try {
      await deliveryService.accept(delivery.id);
      toast.success('Entrega aceita. O pedido saiu para entrega.');
      await loadDeliveries({ silent: true });
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível aceitar a entrega.'));
      await loadDeliveries({ silent: true });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader

        title="Entregas disponíveis"
        description="As entregas liberadas pela empresa aparecem aqui automaticamente."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
              {realtimeConnected ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-slate-400" />}
              {realtimeConnected ? 'Tempo real ativo' : 'Reconectando'}
            </span>

            <Button type="button" variant={soundEnabled ? 'secondary' : 'primary'} onClick={enableSound} disabled={soundEnabled}>
              {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {soundEnabled ? 'Som ativo' : 'Ativar som'}
            </Button>

            <Button type="button" variant="secondary" onClick={() => loadDeliveries()} disabled={loading}>
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
          Carregando entregas disponíveis...
        </div>
      ) : null}

      {!loading && deliveries.length === 0 ? (
        <EmptyState icon={Bike} title="Nenhuma entrega disponível" description="Quando uma empresa liberar um pedido para entrega, ele aparecerá aqui em tempo real." />
      ) : null}

      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <DeliveryCard key={delivery.id} delivery={delivery} onAccept={handleAccept} />
        ))}
      </div>
    </div>
  );
}
