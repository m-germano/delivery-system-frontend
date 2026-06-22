import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle2, ClipboardList, KeyRound, MapPin, MapPinned, RefreshCw, Square, Store, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { deliveryService } from '../../services/deliveryService.js';
import { formatCurrency } from '../../utils/formatters.js';

const statusVariant = {
  DISPONIVEL: 'orange',
  ACEITA: 'blue',
  RETIRADA: 'blue',
  EM_ROTA: 'blue',
  FINALIZADA: 'green',
  CANCELADA: 'red',
};

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 4);
}

function DeliveryCard({ delivery, sharing, onStartSharing, onStopSharing, onOpenFinish }) {
  const order = delivery.order;
  const company = order?.company;
  const address = order?.customer_address;
  const canFinish = ['ACEITA', 'RETIRADA', 'EM_ROTA'].includes(delivery.status) && order?.status === 'EM_ENTREGA';
  const canShareLocation = canFinish;

  return (
    <article className="app-card space-y-5 p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-ink-900 md:text-xl">Entrega #{delivery.id}</h3>
            <Badge variant={statusVariant[delivery.status] ?? 'slate'}>{delivery.status}</Badge>
            {order?.status ? <Badge variant="slate">Pedido {order.status}</Badge> : null}
            {sharing ? <Badge variant="green">Localização ativa</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Pedido #{delivery.order_id} · taxa {formatCurrency(delivery.delivery_fee)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canShareLocation ? (
            sharing ? (
              <Button type="button" variant="secondary" onClick={onStopSharing}>
                <Square className="h-4 w-4" />
                Parar localização
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => onStartSharing(delivery)}>
                <MapPinned className="h-4 w-4" />
                Compartilhar localização
              </Button>
            )
          ) : null}

          {canFinish ? (
            <Button type="button" onClick={() => onOpenFinish(delivery)}>
              <KeyRound className="h-4 w-4" />
              Finalizar com código
            </Button>
          ) : null}
        </div>
      </div>

      {canFinish ? (
        <Alert variant="info" title="Código de confirmação obrigatório">
          Peça ao cliente o código de 4 dígitos mostrado no pedido antes de finalizar a entrega.
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-600">
          <div className="flex items-center gap-2 font-semibold text-ink-900">
            <Store className="h-4 w-4 text-coral-600" />
            Retirada
          </div>
          <p className="mt-2 font-medium text-ink-800">{company?.name ?? 'Empresa'}</p>
          {company?.address ? (
            <p className="mt-1 text-ink-500">
              {company.address.street}, {company.address.number} · {company.address.city}/{company.address.state}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-600">
          <div className="flex items-center gap-2 font-semibold text-ink-900">
            <MapPin className="h-4 w-4 text-coral-600" />
            Entrega
          </div>
          {address ? (
            <p className="mt-2">
              {address.street}, {address.number} · {address.neighborhood} · {address.city}/{address.state}
            </p>
          ) : null}
          <p className="mt-3">
            Distância: <strong>{delivery.distance_km} km</strong>
          </p>
        </div>
      </div>

      {order?.items?.length ? (
        <div className="rounded-2xl border border-ink-200 p-4">
          <p className="text-sm font-semibold text-ink-900">Itens do pedido</p>
          <div className="mt-3 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm text-ink-600">
                <span>
                  {item.quantity}x {item.product_name}
                </span>
                <strong className="text-ink-800">{formatCurrency(item.total_price)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function FinishDeliveryModal({ delivery, code, saving, onCodeChange, onClose, onSubmit }) {
  if (!delivery) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-4 sm:items-center">
      <form className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-5 shadow-xl" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink-900">Finalizar entrega #{delivery.id}</h3>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Digite o código de 4 dígitos informado pelo cliente para confirmar a entrega.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="app-label mb-1.5 block">Código de entrega</span>
          <input
            className="app-input text-center text-2xl font-semibold tracking-[0.5em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="0000"
            value={code}
            onChange={(event) => onCodeChange(onlyDigits(event.target.value))}
            maxLength={4}
            required
          />
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || code.length !== 4}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Confirmar entrega
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CourierMyDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [locationNotice, setLocationNotice] = useState(null);
  const [sharingDeliveryId, setSharingDeliveryId] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const watchIdRef = useRef(null);
  const lastSentAtRef = useRef(0);

  const activeDeliveries = useMemo(
    () => deliveries.filter((delivery) => !['FINALIZADA', 'CANCELADA'].includes(delivery.status)),
    [deliveries],
  );

  function stopLocationSharing({ showToast = true } = {}) {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = null;
    lastSentAtRef.current = 0;
    setSharingDeliveryId(null);

    if (showToast) {
      toast.info('Compartilhamento de localização encerrado.');
    }
  }

  async function loadDeliveries() {
    setLoading(true);
    setError(null);

    try {
      const response = await deliveryService.listMine({ limit: 100 });
      setDeliveries(response?.items ?? []);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível carregar suas entregas.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveries();

    return () => {
      stopLocationSharing({ showToast: false });
    };
  }, []);

  function handleStartSharing(delivery) {
    if (!navigator.geolocation) {
      setLocationNotice({
        variant: 'warning',
        title: 'Localização indisponível',
        message: 'Seu navegador não oferece suporte à geolocalização. O cliente verá que a localização não está sendo compartilhada.',
      });
      return;
    }

    stopLocationSharing({ showToast: false });
    setSharingDeliveryId(delivery.id);
    setLocationNotice({
      variant: 'info',
      title: 'Permissão de localização',
      message: 'Permita o acesso à localização para que o cliente acompanhe a entrega no mapa.',
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastSentAtRef.current < 3000) return;
        lastSentAtRef.current = now;

        try {
          await deliveryService.updateLocation(delivery.id, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
          });

          setLocationNotice({
            variant: 'success',
            title: 'Localização em tempo real ativa',
            message: 'O cliente consegue acompanhar sua posição no mapa enquanto a entrega estiver em andamento.',
          });
        } catch (requestError) {
          stopLocationSharing({ showToast: false });
          setLocationNotice({
            variant: 'warning',
            title: 'Compartilhamento pausado',
            message: getApiErrorMessage(requestError, 'Não foi possível enviar sua localização. Tente ativar o compartilhamento novamente.'),
          });
        }
      },
      () => {
        stopLocationSharing({ showToast: false });
        setLocationNotice({
          variant: 'warning',
          title: 'Localização não compartilhada',
          message: 'Não foi possível acessar sua localização. Verifique a permissão do navegador e tente novamente.',
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      },
    );
  }

  function openFinishModal(delivery) {
    setSelectedDelivery(delivery);
    setConfirmationCode('');
  }

  function closeFinishModal() {
    if (saving) return;
    setSelectedDelivery(null);
    setConfirmationCode('');
  }

  async function handleFinish(event) {
    event.preventDefault();

    if (!selectedDelivery || confirmationCode.length !== 4) {
      toast.error('Informe o código de 4 dígitos.');
      return;
    }

    setSaving(true);

    try {
      if (sharingDeliveryId === selectedDelivery.id) {
        stopLocationSharing({ showToast: false });
      }

      await deliveryService.finish(selectedDelivery.id, {
        confirmation_code: confirmationCode,
      });

      toast.success('Entrega finalizada com sucesso.');
      closeFinishModal();
      await loadDeliveries();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível finalizar a entrega.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entregador"
        title="Minhas entregas"
        description="Compartilhe sua localização durante a corrida e finalize a entrega com o código informado pelo cliente."
        actions={
          <Button type="button" variant="secondary" onClick={loadDeliveries} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Atualizar
          </Button>
        }
      />

      {locationNotice ? (
        <Alert variant={locationNotice.variant} title={locationNotice.title}>
          {locationNotice.message}
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="error" title="Atenção">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="app-card flex items-center gap-3 p-6 text-sm text-ink-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando entregas...
        </div>
      ) : null}

      {!loading && deliveries.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma entrega aceita" description="Aceite uma entrega disponível para começar uma corrida." />
      ) : null}

      {!loading && deliveries.length > 0 && activeDeliveries.length === 0 ? (
        <Alert variant="success" title="Nenhuma entrega em andamento">
          Você não possui entregas ativas no momento.
        </Alert>
      ) : null}

      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <DeliveryCard
            key={delivery.id}
            delivery={delivery}
            sharing={sharingDeliveryId === delivery.id}
            onStartSharing={handleStartSharing}
            onStopSharing={() => stopLocationSharing()}
            onOpenFinish={openFinishModal}
          />
        ))}
      </div>

      <FinishDeliveryModal
        delivery={selectedDelivery}
        code={confirmationCode}
        saving={saving}
        onCodeChange={setConfirmationCode}
        onClose={closeFinishModal}
        onSubmit={handleFinish}
      />
    </div>
  );
}
