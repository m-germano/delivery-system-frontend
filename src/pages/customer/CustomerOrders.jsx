import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ClipboardList, KeyRound, MapPinned, QrCode, RefreshCw, Star, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StarRating from '../../components/ui/StarRating.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { orderService } from '../../services/orderService.js';
import { reviewService } from '../../services/reviewService.js';
import { formatCurrency } from '../../utils/formatters.js';

const statusVariant = {
  AGUARDANDO_PAGAMENTO: 'warning',
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

function OrderCard({ order, onCancel, onReview }) {
  const isPickup = order.fulfillment_type === 'PICKUP';
  const canCustomerCancel = order.status === 'ABERTO';
  const canPayPix = order.status === 'AGUARDANDO_PAGAMENTO' && order.payment_method === 'PIX_ONLINE';
  const canTrack = !isPickup && order.status === 'EM_ENTREGA';
  const deliveryConfirmationCode = order.delivery_confirmation_code;
  const pickupConfirmationCode = order.pickup_confirmation_code;

  return (
    <article className="app-card space-y-5 p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-ink-900 md:text-xl">Pedido #{order.id}</h3>
            <Badge variant={statusVariant[order.status] ?? 'slate'}>{order.status}</Badge>
            <Badge variant={isPickup ? 'blue' : 'green'}>{isPickup ? 'Retirada' : 'Delivery'}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {order.company?.name ?? 'Empresa'} · {order.payment_method === 'PIX_ONLINE' ? 'Pix online' : `pagamento ${isPickup ? 'na retirada' : 'na entrega'}: ${order.payment_method}`}
          </p>
        </div>
        <p className="text-xl font-semibold text-coral-700 md:text-2xl">{formatCurrency(order.total)}</p>
      </div>

      <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
        <p className="text-sm font-semibold text-ink-900">Itens</p>
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

      <div className="grid gap-3 text-sm text-ink-600 md:grid-cols-3">
        <div className="rounded-2xl border border-ink-200 p-3">
          <span className="block text-xs font-medium uppercase text-ink-400">Subtotal</span>
          <strong className="mt-1 block text-ink-800">{formatCurrency(order.subtotal)}</strong>
        </div>
        <div className="rounded-2xl border border-ink-200 p-3">
          <span className="block text-xs font-medium uppercase text-ink-400">{isPickup ? 'Desconto retirada' : 'Entrega'}</span>
          <strong className="mt-1 block text-ink-800">
            {isPickup ? `-${formatCurrency(order.discount_amount ?? 0)}` : formatCurrency(order.delivery_fee)}
          </strong>
        </div>
        <div className="rounded-2xl border border-ink-200 p-3">
          <span className="block text-xs font-medium uppercase text-ink-400">{isPickup ? 'Modalidade' : 'Distância'}</span>
          <strong className="mt-1 block text-ink-800">{isPickup ? 'Retirada na loja' : `${order.distance_km} km`}</strong>
        </div>
      </div>

      {canTrack && deliveryConfirmationCode ? (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-coral-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">Código de confirmação da entrega</p>
              <p className="mt-1 text-sm leading-6 text-ink-600">
                Informe este código ao entregador apenas quando o pedido chegar.
              </p>
              <p className="mt-3 inline-flex rounded-xl border border-coral-200 bg-white px-4 py-2 text-2xl font-semibold tracking-[0.35em] text-coral-700">
                {deliveryConfirmationCode}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {canTrack && !deliveryConfirmationCode ? (
        <Alert variant="info" title="Pedido saiu para entrega">
          O pedido está em rota. O código de confirmação será exibido assim que estiver disponível.
        </Alert>
      ) : null}

      {isPickup && order.status === 'PRONTO_PARA_RETIRADA' && pickupConfirmationCode ? (
        <div className="rounded-2xl border border-coral-200 bg-coral-50 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-coral-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">Código de confirmação da retirada</p>
              <p className="mt-1 text-sm leading-6 text-ink-600">
                Informe este código à loja somente quando for retirar o pedido.
              </p>
              <p className="mt-3 inline-flex rounded-xl border border-coral-200 bg-white px-4 py-2 text-2xl font-semibold tracking-[0.35em] text-coral-700">
                {pickupConfirmationCode}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isPickup && order.status === 'PRONTO_PARA_RETIRADA' && !pickupConfirmationCode ? (
        <Alert variant="info" title="Pedido pronto para retirada">
          Seu pedido está pronto. Atualize a tela se o código de retirada ainda não apareceu.
        </Alert>
      ) : null}

      {order.status === 'RECUSADO' && order.payment_method === 'PIX_ONLINE' ? (
        <Alert variant="success" title="Pedido recusado">
          Pedido recusado. Pagamento reembolsado.
        </Alert>
      ) : null}

      {order.has_review ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <StarRating rating={order.review?.rating ?? 0} readOnly />
            <p className="text-sm font-semibold text-ink-800">Avaliação enviada</p>
          </div>
          {order.review?.comment ? <p className="mt-2 text-sm text-ink-600">{order.review.comment}</p> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canPayPix ? (
          <Link to={`/checkout/pix/${order.id}`} className="app-button-primary">
            <QrCode className="h-4 w-4" />
            Pagar com Pix
          </Link>
        ) : null}
        {canTrack ? (
          <Link to={`/customer/orders/${order.id}/tracking`} className="app-button-secondary">
            <MapPinned className="h-4 w-4" />
            Acompanhar entrega
          </Link>
        ) : null}
        {canCustomerCancel ? (
          <Button type="button" variant="danger" onClick={() => onCancel(order)}>
            <X className="h-4 w-4" />
            Cancelar pedido
          </Button>
        ) : null}
        {order.can_review ? (
          <Button type="button" variant="secondary" onClick={() => onReview(order)}>
            <Star className="h-4 w-4" />
            Avaliar restaurante
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModal, setReviewModal] = useState({
    open: false,
    order: null,
    rating: 0,
    comment: '',
    submitting: false,
  });

  async function loadOrders() {
    setLoading(true);
    setError(null);

    try {
      const response = await orderService.listMine({ limit: 100 });
      setOrders(response?.items ?? []);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível carregar seus pedidos.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleCancel(order) {
    try {
      await orderService.cancelByCustomer(order.id);
      toast.success('Pedido cancelado com sucesso.');
      await loadOrders();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível cancelar o pedido.'));
    }
  }

  function openReviewModal(order) {
    setReviewModal({
      open: true,
      order,
      rating: 0,
      comment: '',
      submitting: false,
    });
  }

  function closeReviewModal() {
    if (reviewModal.submitting) return;
    setReviewModal((current) => ({ ...current, open: false }));
  }

  async function submitReview() {
    if (!reviewModal.order) return;

    if (reviewModal.rating < 1 || reviewModal.rating > 5) {
      toast.error('Escolha uma nota de 1 a 5 estrelas.');
      return;
    }

    setReviewModal((current) => ({ ...current, submitting: true }));

    try {
      await reviewService.createOrderReview(reviewModal.order.id, {
        rating: reviewModal.rating,
        comment: reviewModal.comment.trim() || null,
      });
      toast.success('Avaliação enviada.');
      setReviewModal({
        open: false,
        order: null,
        rating: 0,
        comment: '',
        submitting: false,
      });
      await loadOrders();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível enviar a avaliação.'));
      setReviewModal((current) => ({ ...current, submitting: false }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cliente"
        title="Meus pedidos"
        description="Acompanhe seus pedidos. Quando o pedido sair para entrega, você verá o mapa e o código de confirmação."
        actions={
          <Button type="button" variant="secondary" onClick={loadOrders} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Atualizar
          </Button>
        }
      />

      {error ? (
        <Alert variant="error" title="Atenção">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="app-card flex items-center gap-3 p-6 text-sm text-ink-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando pedidos...
        </div>
      ) : null}

      {!loading && orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhum pedido criado" description="Entre em um restaurante pela tela Explorar para montar seu carrinho." />
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onCancel={handleCancel} onReview={openReviewModal} />
        ))}
      </div>

      <Modal
        open={reviewModal.open}
        title="Avaliar restaurante"
        description={reviewModal.order ? `Pedido #${reviewModal.order.id} · ${reviewModal.order.company?.name ?? 'Restaurante'}` : ''}
        onClose={closeReviewModal}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeReviewModal} disabled={reviewModal.submitting}>
              Cancelar
            </Button>
            <Button type="button" onClick={submitReview} disabled={reviewModal.submitting || reviewModal.rating < 1}>
              {reviewModal.submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
              Enviar avaliação
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-800">Sua nota</p>
            <StarRating
              rating={reviewModal.rating}
              size="lg"
              onChange={(rating) => setReviewModal((current) => ({ ...current, rating }))}
            />
          </div>
          <div className="space-y-2">
            <label className="app-label" htmlFor="review-comment">Comentário opcional</label>
            <textarea
              id="review-comment"
              className="app-input min-h-28 resize-y"
              maxLength={1000}
              placeholder="Conte como foi sua experiência com o restaurante..."
              value={reviewModal.comment}
              onChange={(event) => setReviewModal((current) => ({ ...current, comment: event.target.value }))}
              disabled={reviewModal.submitting}
            />
            <p className="text-xs text-ink-400">{reviewModal.comment.length}/1000</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
