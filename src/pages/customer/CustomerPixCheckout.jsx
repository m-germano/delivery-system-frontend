import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckCircle2, CreditCard, ExternalLink, RefreshCw, ShieldCheck, Timer, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { orderService } from '../../services/orderService.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';

const PENDING_STATUSES = new Set(['pending', 'in_process', 'authorized']);
const FINAL_SUCCESS_STATUSES = new Set(['approved']);
const RETRYABLE_STATUSES = new Set(['cancelled', 'canceled', 'expired', 'rejected', 'failed']);

const statusLabel = {
  pending: 'Aguardando pagamento',
  in_process: 'Pagamento em análise',
  authorized: 'Pagamento autorizado',
  approved: 'Pagamento aprovado',
  cancelled: 'Pagamento cancelado',
  canceled: 'Pagamento cancelado',
  expired: 'Pagamento expirado',
  rejected: 'Pagamento rejeitado',
  failed: 'Pagamento com falha',
};

const statusVariant = {
  pending: 'warning',
  in_process: 'info',
  authorized: 'info',
  approved: 'success',
  cancelled: 'danger',
  canceled: 'danger',
  expired: 'danger',
  rejected: 'danger',
  failed: 'danger',
};

function extractCheckoutUrl(data) {
  if (!data) return null;

  const payment = data.payment ?? {};
  const rawResponse = data.raw_response ?? payment.raw_response ?? {};

  return (
    data.checkout_url ??
    data.checkoutUrl ??
    data.init_point ??
    data.sandbox_init_point ??
    data.payment_url ??
    payment.checkout_url ??
    payment.checkoutUrl ??
    payment.init_point ??
    payment.sandbox_init_point ??
    payment.payment_url ??
    rawResponse.init_point ??
    rawResponse.sandbox_init_point ??
    null
  );
}

function extractPreferenceId(data) {
  if (!data) return null;

  const payment = data.payment ?? {};
  const rawResponse = data.raw_response ?? payment.raw_response ?? {};

  return (
    data.checkout_preference_id ??
    data.preference_id ??
    data.provider_order_id ??
    payment.checkout_preference_id ??
    payment.preference_id ??
    payment.provider_order_id ??
    rawResponse.id ??
    rawResponse.preference_id ??
    null
  );
}

function normalizePaymentPayload(data) {
  if (!data) return null;

  const payment = data.payment ?? data;
  const checkoutUrl = extractCheckoutUrl(data);
  const preferenceId = extractPreferenceId(data);

  return {
    id: payment.id ?? data.payment_id,
    order_id: payment.order_id ?? data.order_id,
    provider_payment_id: payment.provider_payment_id ?? data.provider_payment_id,
    provider_order_id: payment.provider_order_id ?? data.provider_order_id,
    checkout_preference_id: preferenceId,
    preference_id: preferenceId,
    status: payment.status ?? data.payment_status,
    checkout_url: checkoutUrl,
    init_point: payment.init_point ?? data.init_point ?? checkoutUrl,
    sandbox_init_point: payment.sandbox_init_point ?? data.sandbox_init_point,
    expires_at: payment.expires_at ?? data.expires_at,
    amount: payment.amount ?? data.amount ?? data.order?.total,
    provider_status: payment.provider_status ?? data.provider_status,
    provider_status_detail: payment.provider_status_detail ?? data.provider_status_detail,
    order_status: data.order_status,
    raw: data,
  };
}

function getRemainingTime(expiresAt) {
  if (!expiresAt) return null;

  const expiresDate = new Date(expiresAt);
  const diffMs = expiresDate.getTime() - Date.now();

  if (Number.isNaN(expiresDate.getTime()) || diffMs <= 0) {
    return { expired: true, label: 'Expirado' };
  }

  const totalSeconds = Math.ceil(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return { expired: false, label: `${hours}h ${String(minutes).padStart(2, '0')}min` };
  }

  return { expired: false, label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` };
}

function getReturnMessage(result) {
  if (result === 'success') {
    return {
      variant: 'success',
      title: 'Pagamento finalizado no Mercado Pago',
      message: 'Estamos conferindo a confirmação do pagamento. Em alguns segundos o pedido será liberado automaticamente.',
    };
  }

  if (result === 'pending') {
    return {
      variant: 'info',
      title: 'Pagamento pendente no Mercado Pago',
      message: 'O pagamento ainda está em processamento. Vamos consultar o status automaticamente.',
    };
  }

  if (result === 'failure') {
    return {
      variant: 'warning',
      title: 'Pagamento não concluído no Mercado Pago',
      message: 'Você pode tentar novamente no Checkout Pro ou mudar para pagamento na entrega.',
    };
  }

  return null;
}

export default function CustomerPixCheckout() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [payment, setPayment] = useState(() => normalizePaymentPayload(location.state));
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const approvedToastShownRef = useRef(false);

  const mercadoPagoReturn = searchParams.get('mp_result');
  const returnMessage = useMemo(() => getReturnMessage(mercadoPagoReturn), [mercadoPagoReturn]);

  const activeOrderId = payment?.order_id ?? Number(orderId);
  const status = payment?.status;
  const isPending = PENDING_STATUSES.has(status);
  const isApproved = FINAL_SUCCESS_STATUSES.has(status);
  const checkoutUrl = payment?.checkout_url ?? payment?.init_point ?? payment?.sandbox_init_point;
  const remainingTime = useMemo(() => getRemainingTime(payment?.expires_at), [payment?.expires_at, nowTick]);
  const isExpired = Boolean(remainingTime?.expired);
  const canRetry = RETRYABLE_STATUSES.has(status) || (!isApproved && isExpired);
  const canSwitchToDelivery = !isApproved && (isPending || canRetry);
  const formattedAmount = payment?.amount !== undefined && payment?.amount !== null ? formatCurrency(payment.amount) : '—';

  const loadPaymentStatus = useCallback(
    async ({ showLoading = false, quiet = false } = {}) => {
      if (showLoading) setLoading(true);
      if (!quiet) setError(null);

      try {
        if (!activeOrderId || Number.isNaN(Number(activeOrderId))) {
          throw new Error('Pedido inválido. Não foi possível identificar o order_id correto.');
        }

        const response = await orderService.getPaymentStatus(activeOrderId);
        const normalized = normalizePaymentPayload(response);
        setPayment((current) => ({
          ...normalized,
          checkout_url: normalized?.checkout_url ?? current?.checkout_url ?? null,
          init_point: normalized?.init_point ?? current?.init_point ?? null,
          sandbox_init_point: normalized?.sandbox_init_point ?? current?.sandbox_init_point ?? null,
          checkout_preference_id: normalized?.checkout_preference_id ?? current?.checkout_preference_id ?? null,
          preference_id: normalized?.preference_id ?? current?.preference_id ?? null,
        }));

        if (FINAL_SUCCESS_STATUSES.has(normalized?.status) && !approvedToastShownRef.current) {
          approvedToastShownRef.current = true;
          toast.success('Pagamento aprovado! Seu pedido foi liberado.');
        }

        return normalized;
      } catch (requestError) {
        const message = getApiErrorMessage(requestError, 'Não foi possível consultar o status do pagamento.');

        if (!quiet) {
          setError(message);
          toast.error(message);
        }

        return null;
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [activeOrderId],
  );

  useEffect(() => {
    loadPaymentStatus({ showLoading: !payment });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrderId]);

  useEffect(() => {
    if (!payment?.order_id || String(payment.order_id) === String(orderId)) return;

    navigate(`/checkout/pix/${payment.order_id}`, {
      replace: true,
      state: location.state,
    });
  }, [location.state, navigate, orderId, payment?.order_id]);

  useEffect(() => {
    if (!isPending) return undefined;

    const intervalId = window.setInterval(() => {
      loadPaymentStatus({ quiet: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isPending, loadPaymentStatus]);

  useEffect(() => {
    if (!payment?.expires_at || !isPending) return undefined;

    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isPending, payment?.expires_at]);

  useEffect(() => {
    if (!isApproved) return;
    setError(null);
  }, [isApproved]);

  function handleOpenMercadoPagoCheckout() {
    if (!checkoutUrl) {
      toast.error('Link do Mercado Pago indisponível. Gere um novo link de pagamento.');
      return;
    }

    window.location.assign(checkoutUrl);
  }

  async function handleCancelPayment() {
    const confirmed = window.confirm('Deseja cancelar este pagamento online pendente?');
    if (!confirmed) return;

    setActionLoading('cancel');

    try {
      const response = await orderService.cancelPixPayment(activeOrderId);
      setPayment(normalizePaymentPayload(response));
      toast.success('Pagamento online cancelado.');
      await loadPaymentStatus({ quiet: true });
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível cancelar o pagamento online.'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRegeneratePayment() {
    setActionLoading('regenerate');

    try {
      const response = await orderService.regenerateOnlinePayment(activeOrderId);
      const normalized = normalizePaymentPayload(response);
      setPayment(normalized);
      setError(null);
      toast.success('Novo link do Mercado Pago gerado.');

      if (normalized?.checkout_url) {
        window.location.assign(normalized.checkout_url);
      }
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível gerar um novo link de pagamento.'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSwitchToDelivery() {
    const confirmed = window.confirm('Deseja mudar este pedido para pagamento na entrega?');
    if (!confirmed) return;

    setActionLoading('switch');

    try {
      await orderService.switchToPayOnDelivery(activeOrderId);
      toast.success('Pedido alterado para pagamento na entrega.');
      navigate('/customer/orders');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível mudar para pagamento na entrega.'));
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Checkout"
        title={`Pagamento online do pedido #${activeOrderId || orderId}`}
        description="Finalize o pagamento no ambiente seguro do Mercado Pago. O pedido será enviado à loja após a confirmação."
        actions={
          <Link to="/customer/orders" className="app-button-secondary">
            <ArrowLeft className="h-4 w-4" />
            Meus pedidos
          </Link>
        }
      />

      {returnMessage ? (
        <Alert variant={returnMessage.variant} title={returnMessage.title}>
          {returnMessage.message}
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="error" title="Atenção">
          {error}
        </Alert>
      ) : null}

      {isApproved ? (
        <section className="app-card space-y-6 p-6 text-center md:p-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-ink-950">Pagamento recebido!</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-ink-600">
              Seu pagamento foi confirmado pelo Mercado Pago e o pedido já foi enviado para a loja.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              Aguarde a loja aceitar e preparar o pedido. Caso a loja recuse, o valor pago será reembolsado.
            </p>
          </div>

          <div className="flex justify-center">
            <Link to="/customer/orders" className="app-button-primary">
              Ir para meus pedidos
            </Link>
          </div>
        </section>
      ) : null}

      {canRetry && !isApproved ? (
        <Alert variant="warning" title="Pagamento não concluído">
          Este pagamento não está mais pendente. Você pode gerar um novo link do Mercado Pago ou mudar para pagamento na entrega.
        </Alert>
      ) : null}

      {!isApproved ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="app-card space-y-6 p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral-600">Checkout Pro Mercado Pago</p>
                <h2 className="mt-2 text-2xl font-black text-ink-950">{formattedAmount}</h2>
              </div>

              <Badge variant={statusVariant[status] ?? 'neutral'}>
                {statusLabel[status] ?? status ?? 'Consultando status'}
              </Badge>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-ink-50 p-4 text-sm text-ink-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Carregando dados do pagamento...
              </div>
            ) : null}

            <div className="rounded-3xl border border-ink-200 bg-white p-6 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-blue-700">
                <CreditCard className="h-8 w-8" />
              </div>

              <h3 className="mt-4 text-xl font-black text-ink-950">Pague no ambiente seguro do Mercado Pago</h3>

              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-ink-500">
                Você será redirecionado para o Checkout Pro do Mercado Pago. Lá poderá escolher Pix, cartão ou outros meios disponíveis.
                Depois do pagamento, o Mercado Pago avisará o backend automaticamente.
              </p>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {checkoutUrl ? (
                  <Button type="button" onClick={handleOpenMercadoPagoCheckout} disabled={loading}>
                    <ExternalLink className="h-4 w-4" />
                    Ir para o Mercado Pago
                  </Button>
                ) : null}

                <Button type="button" variant="secondary" onClick={() => loadPaymentStatus({ showLoading: true })} disabled={loading}>
                  <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                  Atualizar status
                </Button>
              </div>

              {!checkoutUrl && !loading ? (
                <div className="mt-4 rounded-2xl bg-ink-50 p-4 text-sm leading-6 text-ink-600">
                  O link original do Mercado Pago não está disponível nesta consulta. Atualize o status ou gere um novo link de pagamento.
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-ink-50 p-4">
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-coral-700" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">Validade do link</p>
                    <p className="mt-1 text-xl font-black text-ink-950">{remainingTime?.label ?? '—'}</p>
                  </div>
                </div>

                {payment?.expires_at ? (
                  <p className="mt-3 text-xs leading-5 text-ink-500">Expira em {formatDateTime(payment.expires_at)}</p>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-ink-500">
                    A validade é controlada pelo Mercado Pago ou pela configuração da preferência.
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-ink-50 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-700" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">Identificação</p>
                    <p className="mt-1 truncate text-sm font-semibold text-ink-900">
                      {payment?.preference_id ? `Preference ${payment.preference_id}` : 'Aguardando preferência'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="app-card h-fit space-y-5 p-5">
            <div className="space-y-2 text-sm text-ink-600">
              <p className="font-semibold text-ink-900">O que acontece agora?</p>
              <p>Você conclui o pagamento no Mercado Pago.</p>
              <p>Enquanto o pagamento estiver pendente, vamos consultar o backend automaticamente a cada 5 segundos.</p>
              <p>Quando o Mercado Pago confirmar, o pedido é liberado para o estabelecimento.</p>
            </div>

            <div className="space-y-3">
              <Button type="button" variant="secondary" className="w-full" onClick={() => loadPaymentStatus({ showLoading: true })} disabled={loading}>
                <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                Atualizar status
              </Button>

              {checkoutUrl && isPending ? (
                <Button type="button" className="w-full" onClick={handleOpenMercadoPagoCheckout}>
                  <ExternalLink className="h-4 w-4" />
                  Continuar pagamento
                </Button>
              ) : null}

              {isPending ? (
                <Button type="button" variant="danger" className="w-full" onClick={handleCancelPayment} disabled={actionLoading === 'cancel'}>
                  {actionLoading === 'cancel' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Cancelar pagamento online
                </Button>
              ) : null}

              {canRetry || !checkoutUrl ? (
                <Button type="button" className="w-full" onClick={handleRegeneratePayment} disabled={actionLoading === 'regenerate'}>
                  {actionLoading === 'regenerate' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Gerar novo link
                </Button>
              ) : null}

              {canSwitchToDelivery ? (
                <Button type="button" variant="ghost" className="w-full" onClick={handleSwitchToDelivery} disabled={actionLoading === 'switch'}>
                  {actionLoading === 'switch' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Mudar para pagamento na entrega
                </Button>
              ) : null}
            </div>
          </aside>
        </section>
      ) : null}
    </div>
  );
}