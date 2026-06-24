import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, MapPin, Minus, Plus, RefreshCw, ShoppingCart, Store, Trash2 } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { companyService } from '../../services/companyService.js';
import { customerAddressService } from '../../services/customerAddressService.js';
import { orderService } from '../../services/orderService.js';
import { productService } from '../../services/productService.js';
import { useCartStore } from '../../stores/useCartStore.js';
import { formatCurrency } from '../../utils/formatters.js';

const paymentMethods = [
  { value: 'CREDITO', label: 'Crédito na entrega' },
  { value: 'DEBITO', label: 'Débito na entrega' },
  { value: 'PIX', label: 'Pix na entrega' },
  { value: 'DINHEIRO', label: 'Dinheiro na entrega' },
];

const PIX_ONLINE_PAYMENT_METHOD = 'PIX_ONLINE';
const pixOnlinePaymentMethod = { value: 'PIX_ONLINE', label: 'Pix online' };
const FULFILLMENT_DELIVERY = 'DELIVERY';
const FULFILLMENT_PICKUP = 'PICKUP';

const defaultOrderSettings = {
  accepts_delivery: true,
  accepts_pickup: false,
  pickup_discount_percent: 0,
  minimum_order_value: 0,
};

function ProductCard({ product, company, onAdd }) {
  return (
    <article className="app-card overflow-hidden">
      <div className="aspect-[16/9] bg-slate-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Sem imagem</div>
        )}
      </div>
      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black text-slate-950">{product.name}</h3>
            <Badge variant="green">Disponível</Badge>
          </div>
          <p className="mt-1 text-sm font-bold text-orange-600">{formatCurrency(product.price)}</p>
        </div>
        {product.category?.name ? <Badge variant="blue">{product.category.name}</Badge> : null}
        {product.description ? <p className="text-sm leading-6 text-slate-500">{product.description}</p> : null}
        <Button type="button" className="w-full" onClick={() => onAdd(company, product)}>
          <Plus className="h-4 w-4" />
          Adicionar ao carrinho
        </Button>
      </div>
    </article>
  );
}

export default function CustomerRestaurant() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [locationStatus, setLocationStatus] = useState(null);
  const [orderSettings, setOrderSettings] = useState(defaultOrderSettings);
  const [fulfillmentType, setFulfillmentType] = useState(FULFILLMENT_DELIVERY);
  const [paymentAvailability, setPaymentAvailability] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [error, setError] = useState(null);

  const cartCompany = useCartStore((state) => state.company);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const cartSubtotal = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.price) * item.quantity, 0),
    [cartItems],
  );
  const isCartFromThisCompany = cartCompany?.id === Number(companyId);
  const visibleCartItems = isCartFromThisCompany ? cartItems : [];
  const acceptsDelivery = Boolean(orderSettings?.accepts_delivery);
  const acceptsPickup = Boolean(orderSettings?.accepts_pickup);
  const isPickup = fulfillmentType === FULFILLMENT_PICKUP;
  const isDelivery = fulfillmentType === FULFILLMENT_DELIVERY;
  const canCheckout =
    visibleCartItems.length > 0 &&
    (acceptsPickup || (acceptsDelivery && locationStatus?.has_active_location));
  const pixOnlineAvailable = Boolean(paymentAvailability?.pix_online_available);
  const availablePaymentMethods = useMemo(
    () => {
      const labels = isPickup
        ? [
            { value: 'CREDITO', label: 'Crédito na retirada' },
            { value: 'DEBITO', label: 'Débito na retirada' },
            { value: 'PIX', label: 'Pix na retirada' },
            { value: 'DINHEIRO', label: 'Dinheiro na retirada' },
          ]
        : paymentMethods;

      if (!pixOnlineAvailable) return labels;
      return [
        ...labels,
        isPickup ? { value: 'PIX_ONLINE', label: 'Pix online / pagar agora' } : pixOnlinePaymentMethod,
      ];
    },
    [isPickup, pixOnlineAvailable],
  );

  async function loadPage() {
    setLoading(true);
    setError(null);

    try {
      const [companyResponse, statusResponse, availabilityResponse, orderSettingsResponse] = await Promise.all([
        companyService.getById(companyId),
        customerAddressService.getLocationStatus(),
        orderService.getCompanyPaymentAvailability(companyId).catch(() => null),
        companyService.getOrderSettings(companyId).catch(() => defaultOrderSettings),
      ]);

      setCompany(companyResponse);
      setLocationStatus(statusResponse);
      setPaymentAvailability(availabilityResponse);
      const resolvedSettings = orderSettingsResponse ?? defaultOrderSettings;
      setOrderSettings(resolvedSettings);

      if ((!resolvedSettings.accepts_delivery || !statusResponse?.has_active_location) && resolvedSettings.accepts_pickup) {
        setFulfillmentType(FULFILLMENT_PICKUP);
      } else {
        setFulfillmentType(FULFILLMENT_DELIVERY);
      }

      const productsResponse = await productService.list({ company_id: companyId, limit: 100 });
      setProducts(productsResponse?.items ?? []);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível carregar a empresa.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  useEffect(() => {
    if (paymentMethod === PIX_ONLINE_PAYMENT_METHOD && !pixOnlineAvailable) {
      setPaymentMethod('PIX');
    }
  }, [paymentMethod, pixOnlineAvailable]);

  function handleAddItem(selectedCompany, product) {
    const result = addItem(
      {
        id: selectedCompany.id,
        name: selectedCompany.name,
      },
      product,
      1,
    );

    if (result === 'replaced') {
      toast.info('Carrinho substituído para esta empresa.');
    } else {
      toast.success('Produto adicionado ao carrinho.');
    }
  }

  async function openCheckout() {
    if (!canCheckout) return;
    setCheckoutOpen(true);
    setCalculation(null);

    try {
      const response = await orderService.calculate(buildOrderPayload(paymentMethod, fulfillmentType));
      setCalculation(response);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível calcular o pedido.'));
    }
  }

  function buildOrderPayload(selectedPaymentMethod = paymentMethod, selectedFulfillmentType = fulfillmentType) {
    const payload = {
      company_id: Number(companyId),
      fulfillment_type: selectedFulfillmentType,
      payment_method: selectedPaymentMethod,
      notes: notes.trim() || null,
      items: visibleCartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    if (selectedFulfillmentType === FULFILLMENT_DELIVERY) {
      payload.customer_address_id = locationStatus?.default_address?.id;
    }

    return payload;
  }

  async function recalculateCheckout(selectedPaymentMethod, selectedFulfillmentType) {
    setCalculation(null);
    try {
      const response = await orderService.calculate(buildOrderPayload(selectedPaymentMethod, selectedFulfillmentType));
      setCalculation(response);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível calcular o pedido.'));
    }
  }

  function handlePaymentMethodChange(event) {
    const nextPaymentMethod = event.target.value;
    setPaymentMethod(nextPaymentMethod);
    if (checkoutOpen) {
      recalculateCheckout(nextPaymentMethod, fulfillmentType);
    }
  }

  function handleFulfillmentTypeChange(event) {
    const nextFulfillmentType = event.target.value;
    const nextPaymentMethod = paymentMethod;
    setFulfillmentType(nextFulfillmentType);
    setPaymentMethod(nextPaymentMethod);
    if (checkoutOpen) {
      recalculateCheckout(nextPaymentMethod, nextFulfillmentType);
    }
  }

  async function submitOrder() {
    const selectedPaymentMethod = paymentMethod;
    const payload = buildOrderPayload(selectedPaymentMethod);

    if (selectedPaymentMethod === PIX_ONLINE_PAYMENT_METHOD && !pixOnlineAvailable) {
      toast.error('Pix online não está disponível para esta empresa.');
      return;
    }

    setSubmittingOrder(true);

    try {
      if (selectedPaymentMethod === PIX_ONLINE_PAYMENT_METHOD) {
        const pixResponse = await orderService.createPix(payload);

        if (!pixResponse?.order_id) {
          console.error('Resposta de criação Pix sem order_id.', pixResponse);
          throw new Error('O backend não retornou o identificador do pedido Pix.');
        }

        if (!pixResponse?.qr_code || !pixResponse?.qr_code_base64) {
          console.error('Resposta de criação Pix sem QR Code ou Pix copia e cola.', pixResponse);
          toast.error('Pedido Pix criado, mas o backend não retornou os dados do QR Code.');
        }

        toast.success('Pedido criado. Conclua o pagamento via Pix.');
        clearCart();
        setCheckoutOpen(false);
        setCalculation(null);
        setNotes('');
        navigate(`/checkout/pix/${pixResponse.order_id}`, { state: pixResponse });
        return;
      }

      await orderService.create(payload);
      toast.success('Pedido enviado para o estabelecimento.');
      clearCart();
      setCheckoutOpen(false);
      setCalculation(null);
      setNotes('');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível criar o pedido.'));
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex">
        <Link to="/customer/explore" className="app-button-secondary">
          <ArrowLeft className="h-4 w-4" />
          Voltar para explorar
        </Link>
      </div>

      {loading ? (
        <div className="app-card flex items-center gap-3 p-6 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando empresa...
        </div>
      ) : null}

      {error ? <Alert variant="error" title="Atenção">{error}</Alert> : null}

      {company ? (
        <PageHeader
          title={company.name}
          description={company.description || 'Escolha os produtos e finalize o pedido para delivery ou retirada.'}
          actions={
            <Button type="button" variant="secondary" onClick={loadPage} disabled={loading}>
              <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Atualizar
            </Button>
          }
        />
      ) : null}

      {!loading && acceptsDelivery && !locationStatus?.has_active_location ? (
        <Alert variant="warning" title="Localização não configurada">
          Cadastre um endereço padrão para pedidos delivery. Se a empresa aceitar retirada, você ainda pode retirar na loja.{' '}
          <Link to="/customer/addresses" className="font-bold underline">Configurar endereço</Link>
        </Alert>
      ) : null}

      {!loading && !acceptsDelivery && !acceptsPickup ? (
        <Alert variant="error" title="Empresa indisponível">
          Esta empresa não está aceitando delivery nem retirada no momento.
        </Alert>
      ) : null}

      {company?.address ? (
        <div className="app-card flex items-start gap-3 p-4 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-5 w-5 text-orange-600" />
          <p>
            {company.address.street}, {company.address.number} · {company.address.city}/{company.address.state}
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {!loading && products.length === 0 ? (
            <EmptyState icon={Store} title="Nenhum produto disponível" description="Esta empresa ainda não possui produtos ativos." />
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} company={company} onAdd={handleAddItem} />
            ))}
          </div>
        </section>

        <aside className="app-card h-fit space-y-5 p-5 xl:sticky xl:top-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-500">Carrinho</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">{cartCompany?.name || 'Vazio'}</h3>
            </div>
            <ShoppingCart className="h-6 w-6 text-orange-500" />
          </div>

          {!isCartFromThisCompany && cartItems.length > 0 ? (
            <Alert variant="warning" title="Carrinho de outra empresa">
              Seu carrinho atual pertence a {cartCompany?.name}. Ao adicionar um produto daqui, ele será substituído.
            </Alert>
          ) : null}

          {visibleCartItems.length === 0 ? <p className="text-sm text-slate-500">Adicione produtos para montar o pedido.</p> : null}

          <div className="space-y-3">
            {visibleCartItems.map((item) => (
              <div key={item.product_id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs font-semibold text-orange-600">{formatCurrency(item.price)}</p>
                  </div>
                  <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => removeItem(item.product_id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" className="px-3 py-2" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="min-w-8 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                    <Button type="button" variant="secondary" className="px-3 py-2" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm font-black text-slate-900">{formatCurrency(Number(item.price) * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between text-sm font-bold text-slate-700">
              <span>Subtotal</span>
              <span>{formatCurrency(isCartFromThisCompany ? cartSubtotal : 0)}</span>
            </div>
          </div>

          <Button type="button" className="w-full" disabled={!canCheckout} onClick={openCheckout}>
            Finalizar pedido
          </Button>
        </aside>
      </div>

      <Modal
        open={checkoutOpen}
        title="Finalizar pedido"
        description={isPickup ? 'Retirada na loja: sem taxa de entrega, com pagamento presencial ou Pix online.' : 'Delivery: escolha o pagamento e acompanhe seu pedido.'}
        onClose={() => {
          if (!submittingOrder) setCheckoutOpen(false);
        }}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setCheckoutOpen(false)} disabled={submittingOrder}>Cancelar</Button>
            <Button type="button" disabled={submittingOrder || !calculation} onClick={submitOrder}>
              {submittingOrder ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              Confirmar pedido
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="app-label" htmlFor="fulfillment-type">Como deseja receber?</label>
            <select
              id="fulfillment-type"
              className="app-input"
              value={fulfillmentType}
              onChange={handleFulfillmentTypeChange}
              disabled={submittingOrder || (!acceptsDelivery && acceptsPickup) || (acceptsDelivery && !acceptsPickup)}
            >
              {acceptsDelivery ? <option value={FULFILLMENT_DELIVERY}>Delivery</option> : null}
              {acceptsPickup ? <option value={FULFILLMENT_PICKUP}>Retirada na loja</option> : null}
            </select>
            {isPickup ? (
              <Alert variant="info" title="Retirada na loja">
                Você retira o pedido no endereço da empresa. Não há taxa de entrega nem endereço do cliente nesta modalidade.
              </Alert>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="app-label" htmlFor="payment-method">Forma de pagamento</label>
            <select
              id="payment-method"
              className="app-input"
              value={paymentMethod}
              onChange={handlePaymentMethodChange}
              disabled={submittingOrder}
            >
              {availablePaymentMethods.map((method) => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
            {!pixOnlineAvailable ? (
              <p className="text-xs font-medium text-slate-500">
                Pix online aparece aqui quando a empresa tem Mercado Pago conectado e ativo.
              </p>
            ) : null}
            {paymentMethod === PIX_ONLINE_PAYMENT_METHOD ? (
              <Alert variant="info" title="Pix online">
                O pedido será criado como aguardando pagamento. Após o Pix ser aprovado, ele será liberado para o estabelecimento.
              </Alert>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="app-label" htmlFor="order-notes">Observações</label>
            <textarea
              id="order-notes"
              className="app-input min-h-24 resize-y"
              placeholder="Ex: sem cebola, troco para R$ 100..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {isDelivery ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-bold text-slate-900">Endereço de entrega</p>
              {locationStatus?.default_address ? (
                <p className="mt-1">
                  {locationStatus.default_address.street}, {locationStatus.default_address.number} · {locationStatus.default_address.city}/{locationStatus.default_address.state}
                </p>
              ) : (
                <p className="mt-1 text-red-600">Configure um endereço padrão para delivery.</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-bold text-slate-900">Endereço de retirada</p>
              {company?.address ? (
                <p className="mt-1">
                  {company.address.street}, {company.address.number} · {company.address.city}/{company.address.state}
                </p>
              ) : null}
            </div>
          )}

          {calculation ? (
            <div className="space-y-2 rounded-2xl border border-slate-200 p-4">
              <div className="flex justify-between text-sm"><span>Subtotal</span><strong>{formatCurrency(calculation.subtotal)}</strong></div>
              {Number(calculation.discount_amount ?? 0) > 0 ? (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Desconto retirada ({calculation.pickup_discount_percent}%)</span>
                  <strong>-{formatCurrency(calculation.discount_amount)}</strong>
                </div>
              ) : null}
              {calculation.fulfillment_type === FULFILLMENT_DELIVERY ? (
                <>
                  <div className="flex justify-between text-sm"><span>Distância</span><strong>{calculation.distance_km} km</strong></div>
                  <div className="flex justify-between text-sm"><span>Entrega</span><strong>{formatCurrency(calculation.delivery_fee)}</strong></div>
                </>
              ) : (
                <div className="flex justify-between text-sm"><span>Entrega</span><strong>{formatCurrency(0)}</strong></div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-black text-slate-950">
                <span>Total</span><span>{formatCurrency(calculation.total)}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Calculando pedido...
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
