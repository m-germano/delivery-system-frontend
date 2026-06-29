import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MapPin, RefreshCw, Save } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import InputField from '../../components/ui/InputField.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { addressService } from '../../services/addressService.js';
import { companyService } from '../../services/companyService.js';
import { useAuthStore } from '../../stores/useAuthStore.js';

const emptyForm = {
  name: '',
  description: '',
  phone: '',
  document: '',
  image_url: '',
  zip_code: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  latitude: '',
  longitude: '',
};

const defaultOrderSettingsForm = {
  accepts_delivery: true,
  accepts_pickup: false,
  pickup_discount_percent: '0',
  minimum_order_value: '0',
};

function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function toNullableString(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toAddressValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

function companyToForm(company) {
  const address = company?.address ?? {};

  return {
    name: toAddressValue(company?.name),
    description: toAddressValue(company?.description),
    phone: toAddressValue(company?.phone),
    document: toAddressValue(company?.document),
    image_url: toAddressValue(company?.image_url),
    zip_code: toAddressValue(address.zip_code),
    street: toAddressValue(address.street),
    number: toAddressValue(address.number),
    complement: toAddressValue(address.complement),
    neighborhood: toAddressValue(address.neighborhood),
    city: toAddressValue(address.city),
    state: toAddressValue(address.state),
    latitude: toAddressValue(address.latitude),
    longitude: toAddressValue(address.longitude),
  };
}

function Section({ title, description, children }) {
  return (
    <section className="app-card p-5 md:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-ink-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ReadOnlyField({ label, value, placeholder = 'Preenchido automaticamente' }) {
  return (
    <div className="space-y-1.5">
      <span className="app-label block">{label}</span>
      <div className="min-h-[42px] rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700">
        {value || <span className="text-ink-400">{placeholder}</span>}
      </div>
    </div>
  );
}

export default function CompanySettings() {
  const [form, setForm] = useState(emptyForm);
  const [orderSettingsForm, setOrderSettingsForm] = useState(defaultOrderSettingsForm);
  const [company, setCompany] = useState(null);
  const [mode, setMode] = useState('create');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const loadCompletionStatus = useAuthStore((state) => state.loadCompletionStatus);

  const cleanZipCode = useMemo(() => onlyDigits(form.zip_code), [form.zip_code]);
  const hasResolvedAddress = Boolean(form.street && form.neighborhood && form.city && form.state && form.latitude && form.longitude);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === 'zip_code' || field === 'number') {
        next.street = '';
        next.neighborhood = '';
        next.city = '';
        next.state = '';
        next.latitude = '';
        next.longitude = '';
      }

      return next;
    });
    setError(null);
    setSuccess(null);
  }

  function updateOrderSettingsField(field, value) {
    setOrderSettingsForm((current) => ({ ...current, [field]: value }));
    setError(null);
    setSuccess(null);
  }

  function mergeAddress(address) {
    setForm((current) => ({
      ...current,
      zip_code: toAddressValue(address.zip_code ?? current.zip_code),
      street: toAddressValue(address.street ?? current.street),
      number: toAddressValue(address.number ?? current.number),
      complement: toAddressValue(address.complement ?? current.complement),
      neighborhood: toAddressValue(address.neighborhood ?? current.neighborhood),
      city: toAddressValue(address.city ?? current.city),
      state: toAddressValue(address.state ?? current.state).toUpperCase(),
      latitude: toAddressValue(address.latitude ?? current.latitude),
      longitude: toAddressValue(address.longitude ?? current.longitude),
    }));
  }

  useEffect(() => {
    let isMounted = true;

    async function loadCompany() {
      setLoading(true);
      setError(null);

      try {
        const currentCompany = await companyService.getMine();
        if (!isMounted) return;

        setCompany(currentCompany);
        setForm(companyToForm(currentCompany));
        setMode('edit');

        const settings = await companyService.getMyOrderSettings().catch(() => null);
        if (!isMounted) return;
        if (settings) {
          setOrderSettingsForm({
            accepts_delivery: Boolean(settings.accepts_delivery),
            accepts_pickup: Boolean(settings.accepts_pickup),
            pickup_discount_percent: String(settings.pickup_discount_percent ?? 0),
            minimum_order_value: String(settings.minimum_order_value ?? 0),
          });
        }
      } catch (requestError) {
        if (!isMounted) return;

        if (requestError?.response?.status === 404) {
          setCompany(null);
          setForm(emptyForm);
          setOrderSettingsForm(defaultOrderSettingsForm);
          setMode('create');
          return;
        }

        setError(getApiErrorMessage(requestError, 'Não foi possível carregar os dados da empresa.'));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCompany();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleResolveAddress() {
    if (cleanZipCode.length !== 8) {
      setError('Informe um CEP com 8 dígitos.');
      return;
    }

    if (!form.number.trim()) {
      setError('Informe o número antes de preencher o endereço.');
      return;
    }

    setActionLoading('resolve');
    setError(null);
    setSuccess(null);

    try {
      const resolvedAddress = await addressService.resolve({
        zip_code: cleanZipCode,
        number: form.number.trim(),
        complement: toNullableString(form.complement),
      });
      mergeAddress(resolvedAddress);
      setSuccess('Endereço preenchido automaticamente.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível preencher o endereço automaticamente.'));
    } finally {
      setActionLoading(null);
    }
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      description: toNullableString(form.description),
      phone: toNullableString(form.phone),
      document: toNullableString(form.document),
      image_url: toNullableString(form.image_url),
      auto_fill_address: true,
      auto_geocode: true,
      address: {
        zip_code: cleanZipCode,
        street: toNullableString(form.street),
        number: form.number.trim(),
        complement: toNullableString(form.complement),
        neighborhood: toNullableString(form.neighborhood),
        city: toNullableString(form.city),
        state: toNullableString(form.state)?.toUpperCase() ?? null,
        latitude: toNullableString(form.latitude),
        longitude: toNullableString(form.longitude),
      },
    };
  }

  function buildOrderSettingsPayload() {
    return {
      accepts_delivery: Boolean(orderSettingsForm.accepts_delivery),
      accepts_pickup: Boolean(orderSettingsForm.accepts_pickup),
      pickup_discount_percent: Number(orderSettingsForm.pickup_discount_percent || 0),
      minimum_order_value: Number(orderSettingsForm.minimum_order_value || 0),
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Informe o nome da empresa.');
      return;
    }

    if (cleanZipCode.length !== 8) {
      setError('Informe um CEP com 8 dígitos.');
      return;
    }

    if (!form.number.trim()) {
      setError('Informe o número do endereço.');
      return;
    }

    if (!hasResolvedAddress) {
      setError('Clique em "Preencher endereço automaticamente" antes de salvar.');
      return;
    }

    const orderSettingsPayload = buildOrderSettingsPayload();
    if (!orderSettingsPayload.accepts_delivery && !orderSettingsPayload.accepts_pickup) {
      setError('Ative delivery, retirada ou ambos.');
      return;
    }

    if (orderSettingsPayload.pickup_discount_percent < 0 || orderSettingsPayload.pickup_discount_percent > 100) {
      setError('O desconto para retirada deve estar entre 0% e 100%.');
      return;
    }

    if (orderSettingsPayload.minimum_order_value < 0) {
      setError('O pedido mínimo não pode ser negativo.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = buildPayload();
      const savedCompany = mode === 'edit' ? await companyService.updateMine(payload) : await companyService.create(payload);
      const savedSettings = await companyService.updateMyOrderSettings(orderSettingsPayload);

      setCompany(savedCompany);
      setForm(companyToForm(savedCompany));
      setOrderSettingsForm({
        accepts_delivery: Boolean(savedSettings.accepts_delivery),
        accepts_pickup: Boolean(savedSettings.accepts_pickup),
        pickup_discount_percent: String(savedSettings.pickup_discount_percent ?? 0),
        minimum_order_value: String(savedSettings.minimum_order_value ?? 0),
      });
      setMode('edit');
      await loadCompletionStatus();
      setSuccess('Empresa salva com sucesso.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível salvar a empresa.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configurações da empresa" />
        <div className="app-card p-6 text-sm text-ink-500">Carregando dados da empresa...</div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <PageHeader

        title="Configurações da empresa"
        description="Cadastre os dados comerciais e informe CEP e número para localizar a empresa automaticamente."
        actions={
          <Button type="submit" disabled={saving || Boolean(actionLoading)}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === 'edit' ? 'Salvar alterações' : 'Salvar empresa'}
          </Button>
        }
      />

      {mode === 'create' ? (
        <Alert variant="warning" title="Empresa ainda não cadastrada">
          Preencha os dados abaixo para liberar produtos, pedidos e entregas.
        </Alert>
      ) : null}

      {success ? (
        <Alert variant="success" title="Tudo certo">
          {success}
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="error" title="Atenção">
          {error}
        </Alert>
      ) : null}

      <Section title="Dados comerciais" description="Essas informações identificam a empresa para os clientes.">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            id="company-name"
            label="Nome da empresa"
            placeholder="Ex: Pizzaria MVP"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            required
          />
          <InputField
            id="company-phone"
            label="Telefone"
            placeholder="Ex: 11999999999"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />
          <InputField
            id="company-document"
            label="Documento"
            placeholder="CNPJ ou CPF"
            value={form.document}
            onChange={(event) => updateField('document', event.target.value)}
          />
          <InputField
            id="company-image"
            label="URL da imagem"
            placeholder="https://..."
            value={form.image_url}
            onChange={(event) => updateField('image_url', event.target.value)}
          />
        </div>
        <div className="mt-4 space-y-2">
          <label className="app-label" htmlFor="company-description">
            Descrição
          </label>
          <textarea
            id="company-description"
            className="app-input min-h-28 resize-y"
            placeholder="Descreva a empresa, tipo de cozinha ou informações importantes."
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </div>
      </Section>

      <Section title="Endereço da empresa" description="Digite CEP e número. O restante será preenchido automaticamente.">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <InputField
            id="company-zip-code"
            label="CEP"
            placeholder="01001000"
            value={form.zip_code}
            onChange={(event) => updateField('zip_code', event.target.value)}
            required
          />
          <InputField
            id="company-number"
            label="Número"
            placeholder="100"
            value={form.number}
            onChange={(event) => updateField('number', event.target.value)}
            required
          />
          <InputField
            id="company-complement"
            label="Complemento"
            placeholder="Loja 1"
            value={form.complement}
            onChange={(event) => updateField('complement', event.target.value)}
          />
          <Button type="button" variant="secondary" onClick={handleResolveAddress} disabled={Boolean(actionLoading) || saving}>
            {actionLoading === 'resolve' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            Preencher endereço automaticamente
          </Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ReadOnlyField label="Rua" value={form.street} />
          <ReadOnlyField label="Bairro" value={form.neighborhood} />
          <ReadOnlyField label="Cidade" value={form.city} />
          <ReadOnlyField label="UF" value={form.state} />
        </div>

        {hasResolvedAddress ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Endereço pronto para salvar.
          </div>
        ) : null}
      </Section>

      <Section title="Entrega e retirada" description="Defina como os clientes podem receber seus pedidos e as regras comerciais básicas.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-ink-300 text-orange-600"
              checked={orderSettingsForm.accepts_delivery}
              onChange={(event) => updateOrderSettingsField('accepts_delivery', event.target.checked)}
            />
            <span>
              <span className="block text-sm font-bold text-ink-900">Aceita delivery</span>
              <span className="mt-1 block text-xs leading-5 text-ink-500">Pedidos com endereço, taxa de entrega e fluxo de motoboy.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-ink-300 text-orange-600"
              checked={orderSettingsForm.accepts_pickup}
              onChange={(event) => updateOrderSettingsField('accepts_pickup', event.target.checked)}
            />
            <span>
              <span className="block text-sm font-bold text-ink-900">Aceita retirada na loja</span>
              <span className="mt-1 block text-xs leading-5 text-ink-500">Pedidos sem endereço, sem taxa e sem envio para motoboy.</span>
            </span>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InputField
            id="pickup-discount-percent"
            label="Desconto para retirada (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={orderSettingsForm.pickup_discount_percent}
            onChange={(event) => updateOrderSettingsField('pickup_discount_percent', event.target.value)}
          />
          <InputField
            id="minimum-order-value"
            label="Pedido mínimo (R$)"
            type="number"
            min="0"
            step="0.01"
            value={orderSettingsForm.minimum_order_value}
            onChange={(event) => updateOrderSettingsField('minimum_order_value', event.target.value)}
          />
        </div>
      </Section>
    </form>
  );
}
