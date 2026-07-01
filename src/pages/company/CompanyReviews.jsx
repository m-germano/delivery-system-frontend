import { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StarRating from '../../components/ui/StarRating.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { reviewService } from '../../services/reviewService.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';

function ReviewCard({ review }) {
  return (
    <article className="app-card space-y-3 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-lg font-black text-slate-950">{review.customer?.name ?? 'Cliente'}</p>
          <p className="mt-1 text-sm text-slate-500">
            Pedido #{review.order_id}
            {review.order?.fulfillment_type ? ` · ${review.order.fulfillment_type === 'PICKUP' ? 'Retirada' : 'Delivery'}` : ''}
            {review.order?.total ? ` · ${formatCurrency(review.order.total)}` : ''}
          </p>
        </div>
        <StarRating rating={review.rating} readOnly />
      </div>
      {review.comment ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{review.comment}</p>
      ) : (
        <p className="text-sm text-slate-400">Cliente avaliou sem comentário.</p>
      )}
      <p className="text-xs font-semibold text-slate-400">{formatDateTime(review.created_at)}</p>
    </article>
  );
}

export default function CompanyReviews() {
  const [reviews, setReviews] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0,
    average_rating: null,
    reviews_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  async function loadReviews(page = 1, append = false) {
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await reviewService.listMyCompanyReviews({ page, limit: 10 });
      setReviews((current) => ({
        ...response,
        items: append ? [...current.items, ...(response?.items ?? [])] : response?.items ?? [],
      }));
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível carregar suas avaliações.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Empresa"
        title="Avaliações"
        description="Veja as avaliações recebidas dos clientes após pedidos entregues ou retirados."
        actions={
          <Button type="button" variant="secondary" onClick={() => loadReviews()} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Atualizar
          </Button>
        }
      />

      <section className="app-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-500">Resumo</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            {reviews.reviews_count} {reviews.reviews_count === 1 ? "Avaliação" : "Avaliações"}
          </h2>
        </div>
        <StarRating rating={reviews.average_rating ?? 0} readOnly size="lg" showValue count={reviews.reviews_count} />
      </section>

      {error ? (
        <Alert variant="error" title="Atenção">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="app-card flex items-center gap-3 p-6 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando avaliações...
        </div>
      ) : null}

      {!loading && reviews.items.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Nenhuma avaliação recebida" description="As avaliações aparecerão aqui quando clientes avaliarem pedidos finalizados." />
      ) : null}

      <div className="space-y-4">
        {reviews.items.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {reviews.page < reviews.total_pages ? (
        <Button type="button" variant="secondary" onClick={() => loadReviews(reviews.page + 1, true)} disabled={loadingMore}>
          <RefreshCw className={loadingMore ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Carregar mais
        </Button>
      ) : null}
    </div>
  );
}
