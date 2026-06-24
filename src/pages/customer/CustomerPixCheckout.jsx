import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckCircle2, Clipboard, QrCode, RefreshCw, Timer, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { orderService } from '../../services/orderService.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';

const PENDING_STATUSES = new Set(['pending', 'in_process']);
const FINAL_SUCCESS_STATUSES = new Set(['approved']);
const RETRYABLE_STATUSES = new Set(['cancelled', 'canceled', 'expired', 'rejected', 'failed']);

const statusLabel = {
  pending: 'Aguardando pagamento',
  in_process: 'Pagamento em análise',
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
  approved: 'success',
  cancelled: 'danger',
  canceled: 'danger',
  expired: 'danger',
  rejected: 'danger',
  failed: 'danger',
};

function normalizePaymentPayload(data) {
  if (!data) return null;

  const payment = data.payment ?? data;

  return {
    id: payment.id ?? data.payment_id,
    order_id: payment.order_id ?? data.order_id,
    provider_payment_id: payment.provider_payment_id ?? data.provider_payment_id,
    status: payment.status ?? data.payment_status,
    qr_code: payment.qr_code ?? data.qr_code,
    qr_code_base64: payment.qr_code_base64 ?? data.qr_code_base64,
    expires_at: payment.expires_at ?? data.expires_at,
    amount: payment.amount ?? data.amount ?? data.order?.total,
    provider_status: payment.provider_status ?? data.provider_status,
    provider_status_detail: payment.provider_status_detail ?? data.provider_status_detail,
    raw: data,
  };
}

function sanitizeForConsole(data) {
  if (!data || typeof data !== 'object') return data;

  return JSON.parse(JSON.stringify(data, (key, value) => {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey.includes('token')
      || normalizedKey.includes('secret')
      || normalizedKey.includes('authorization')
    ) {
      return '[removido]';
    }
    return value;
  }));
}

function getQrCodeImageSrc(qrCodeBase64) {
  if (!qrCodeBase64) return null;
  if (qrCodeBase64.startsWith('data:')) return qrCodeBase64;
  return `data:image/png;base64,${qrCodeBase64}`;
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

export default function CustomerPixCheckout() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(() => normalizePaymentPayload(location.state));
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const missingPixDataLoggedRef = useRef(false);

  const activeOrderId = payment?.order_id ?? Number(orderId);
  const status = payment?.status;
  const isPending = PENDING_STATUSES.has(status);
  const isApproved = FINAL_SUCCESS_STATUSES.has(status);
  const canRetry = RETRYABLE_STATUSES.has(status) || (!isApproved && getRemainingTime(payment?.expires_at)?.expired);
  const canSwitchToDelivery = !isApproved && (isPending || canRetry);
  const qrCodeImageSrc = useMemo(() => getQrCodeImageSrc(payment?.qr_code_base64), [payment?.qr_code_base64]);
  const remainingTime = useMemo(() => getRemainingTime(payment?.expires_at), [payment?.expires_at, nowTick]);
  const formattedAmount = payment?.amount !== undefined && payment?.amount !== null ? formatCurrency(payment.amount) : '—';
  const hasMissingPixData = Boolean(payment && !isApproved && (!payment.qr_code || !payment.qr_code_base64));

  const loadPaymentStatus = useCallback(
    async ({ showLoading = false, quiet = false } = {}) => {
      if (showLoading) setLoading(true);
      if (!quiet) setError(null);

      try {
        if (!activeOrderId || Number.isNaN(Number(activeOrderId))) {
          throw new Error('Pedido Pix inválido. Não foi possível identificar o order_id correto.');
        }

        const response = await orderService.getPaymentStatus(activeOrderId);
        const normalized = normalizePaymentPayload(response);
        setPayment(normalized);

        if (FINAL_SUCCESS_STATUSES.has(normalized?.status)) {
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
    if (!hasMissingPixData || missingPixDataLoggedRef.current) return;

    missingPixDataLoggedRef.current = true;
    console.error(
      'Backend não retornou qr_code e/ou qr_code_base64 para o Pix.',
      sanitizeForConsole(payment?.raw ?? payment),
    );
    setError('O backend criou/retornou o pagamento, mas não retornou QR Code Pix ou código Pix copia e cola.');
  }, [hasMissingPixData, payment]);

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
    if (!isApproved) return undefined;

    const timeoutId = window.setTimeout(() => {
      navigate(`/customer/orders/${activeOrderId}/tracking`, { replace: true });
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [activeOrderId, isApproved, navigate]);

  async function handleCopyPixCode() {
    if (!payment?.qr_code) return;

    try {
      await navigator.clipboard.writeText(payment.qr_code);
      setCopied(true);
      toast.success('Código Pix copiado.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Não foi possível copiar automaticamente. Selecione o código e copie manualmente.');
    }
  }

  async function handleCancelPayment() {
    const confirmed = window.confirm('Deseja cancelar este pagamento Pix pendente?');
    if (!confirmed) return;

    setActionLoading('cancel');

    try {
      const response = await orderService.cancelPixPayment(activeOrderId);
      setPayment(normalizePaymentPayload(response));
      toast.success('Pagamento Pix cancelado.');
      await loadPaymentStatus({ quiet: true });
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível cancelar o pagamento Pix.'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRegeneratePayment() {
    setActionLoading('regenerate');

    try {
      const response = await orderService.regeneratePixPayment(activeOrderId);
      setPayment(normalizePaymentPayload(response));
      setError(null);
      toast.success('Novo QR Code Pix gerado.');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível gerar um novo QR Code Pix.'));
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
      navigate(`/customer/orders/${activeOrderId}/tracking`);
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
        title={`Pagamento Pix do pedido #${activeOrderId || orderId}`}
        description="Escaneie o QR Code ou copie o código Pix. O pedido será enviado ao estabelecimento após a confirmação do pagamento."
        actions={
          <Link to="/customer/orders" className="app-button-secondary">
            <ArrowLeft className="h-4 w-4" />
            Meus pedidos
          </Link>
        }
      />

      {error ? (
        <Alert variant="error" title="Atenção">
          {error}
        </Alert>
      ) : null}

      {isApproved ? (
        <Alert variant="success" title="Pagamento aprovado">
          Pronto! Vamos abrir a tela de acompanhamento do pedido em instantes.
        </Alert>
      ) : null}

      {canRetry && !isApproved ? (
        <Alert variant="warning" title="Pagamento não concluído">
          Este Pix não está mais pendente. Você pode gerar um novo QR Code ou mudar para pagamento na entrega.
        </Alert>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="app-card space-y-5 p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral-600">Aguardando pagamento via Pix</p>
              <h2 className="mt-2 text-2xl font-black text-ink-950">{formattedAmount}</h2>
            </div>
            <Badge variant={statusVariant[status] ?? 'neutral'}>{statusLabel[status] ?? status ?? 'Consultando status'}</Badge>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl bg-ink-50 p-4 text-sm text-ink-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Carregando dados do Pix...
            </div>
          ) : null}

          {qrCodeImageSrc ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-ink-200 bg-white p-5">
              <img src={qrCodeImageSrc} alt="QR Code Pix" className="h-64 w-64 rounded-2xl object-contain" />
              <p className="max-w-md text-center text-sm leading-6 text-ink-500">
                Abra o app do seu banco, escolha Pix com QR Code e escaneie a imagem acima.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-ink-200 p-8 text-center text-ink-500">
              <QrCode className="h-10 w-10" />
              <p className="text-sm">QR Code indisponível. Atualize o status ou gere um novo Pix se o pagamento expirou.</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="app-label" htmlFor="pix-copy-code">Pix copia e cola</label>
            <textarea
              id="pix-copy-code"
              className="app-input min-h-28 resize-y font-mono text-xs"
              value={payment?.qr_code ?? ''}
              readOnly
              placeholder="O código Pix aparecerá aqui."
            />
            <Button type="button" className="w-full" onClick={handleCopyPixCode} disabled={!payment?.qr_code}>
              <Clipboard className="h-4 w-4" />
              {copied ? 'Código copiado' : 'Copiar código Pix'}
            </Button>
          </div>
        </div>

        <aside className="app-card h-fit space-y-5 p-5">
          <div className="rounded-2xl bg-ink-50 p-4">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-coral-700" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-400">Tempo restante</p>
                <p className="mt-1 text-xl font-black text-ink-950">{remainingTime?.label ?? '—'}</p>
              </div>
            </div>
            {payment?.expires_at ? (
              <p className="mt-3 text-xs leading-5 text-ink-500">Expira em {formatDateTime(payment.expires_at)}</p>
            ) : null}
          </div>

          <div className="space-y-2 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">O que acontece agora?</p>
            <p>Enquanto o pagamento estiver pendente, vamos consultar o backend automaticamente a cada 5 segundos.</p>
            <p>Quando o Mercado Pago confirmar, o pedido é liberado para o estabelecimento.</p>
          </div>

          <div className="space-y-3">
            <Button type="button" variant="secondary" className="w-full" onClick={() => loadPaymentStatus({ showLoading: true })} disabled={loading}>
              <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Atualizar status
            </Button>

            {isPending ? (
              <Button type="button" variant="danger" className="w-full" onClick={handleCancelPayment} disabled={actionLoading === 'cancel'}>
                {actionLoading === 'cancel' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Cancelar pagamento Pix
              </Button>
            ) : null}

            {canRetry ? (
              <Button type="button" className="w-full" onClick={handleRegeneratePayment} disabled={actionLoading === 'regenerate'}>
                {actionLoading === 'regenerate' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                Gerar novo QR Code
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
    </div>
  );
}
