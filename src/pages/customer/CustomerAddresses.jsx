import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Home, MapPin, Pencil, RefreshCw, Save, Star, Trash2, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import InputField from '../../components/ui/InputField.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { addressService } from '../../services/addressService.js';
import { getApiErrorMessage } from '../../services/api.js';
import { customerAddressService } from '../../services/customerAddressService.js';
import { useAuthStore } from '../../stores/useAuthStore.js';

const emptyForm = {
  id: null,
  label: '',
  zip_code: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  latitude: '',
  longitude: '',
  is_default: true,
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

function addressToForm(address) {
  return {
    id: address.id,
    label: toAddressValue(address.label),
    zip_code: toAddressValue(address.zip_code),
    street: toAddressValue(address.street),
    number: toAddressValue(address.number),
    complement: toAddressValue(address.complement),
    neighborhood: toAddressValue(address.neighborhood),
    city: toAddressValue(address.city),
    state: toAddressValue(address.state),
    latitude: toAddressValue(address.latitude),
    longitude: toAddressValue(address.longitude),
    is_default: Boolean(address.is_default),
  };
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

function AddressCard({ address, onEdit, onSetDefault, onDelete }) {
  return (
    <article className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-700">
            <Home className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-ink-900">{address.label || 'Endereço'}</h3>
              {address.is_default ? <Badge variant="green">Padrão</Badge> : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              {address.street}, {address.number}
              {address.complement ? ` - ${address.complement}` : ''}
            </p>
            <p className="text-sm leading-6 text-ink-500">
              {[address.neighborhood, address.city, address.state].filter(Boolean).join(' - ')} · CEP {address.zip_code}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onEdit(address)}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        {!address.is_default ? (
          <Button variant="ghost" onClick={() => onSetDefault(address)}>
            <Star className="h-4 w-4" />
            Tornar padrão
          </Button>
        ) : null}
        <Button variant="danger" onClick={() => onDelete(address)}>
          <Trash2 className="h-4 w-4" />
          Remover
        </Button>
      </div>
    </article>
  );
}

export default function CustomerAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const loadCompletionStatus = useAuthStore((state) => state.loadCompletionStatus);

  const cleanZipCode = useMemo(() => onlyDigits(form.zip_code), [form.zip_code]);
  const isEditing = Boolean(form.id);
  const hasResolvedAddress = Boolean(form.street && form.neighborhood && form.city && form.state && form.latitude && form.longitude);

  async function loadAddresses() {
    setLoading(true);
    setError(null);

    try {
      const response = await customerAddressService.listMine();
      setAddresses(response?.items ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível carregar seus endereços.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

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

  function resetForm() {
    setForm({ ...emptyForm, is_default: addresses.length === 0 });
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
      auto_fill_address: true,
      auto_geocode: true,
      address: {
        label: toNullableString(form.label),
        zip_code: cleanZipCode,
        street: toNullableString(form.street),
        number: form.number.trim(),
        complement: toNullableString(form.complement),
        neighborhood: toNullableString(form.neighborhood),
        city: toNullableString(form.city),
        state: toNullableString(form.state)?.toUpperCase() ?? null,
        latitude: toNullableString(form.latitude),
        longitude: toNullableString(form.longitude),
        is_default: Boolean(form.is_default),
      },
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

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

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditing) {
        await customerAddressService.update(form.id, buildPayload());
        setSuccess('Endereço atualizado com sucesso.');
      } else {
        await customerAddressService.create(buildPayload());
        setSuccess('Endereço cadastrado com sucesso.');
      }

      resetForm();
      await loadAddresses();
      await loadCompletionStatus();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível salvar o endereço.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(address) {
    setError(null);
    setSuccess(null);

    try {
      await customerAddressService.setDefault(address.id);
      setSuccess('Endereço padrão atualizado.');
      await loadAddresses();
      await loadCompletionStatus();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível alterar o endereço padrão.'));
    }
  }

  async function handleDelete(address) {
    const confirmDelete = window.confirm(`Deseja remover o endereço "${address.label || address.street}"?`);
    if (!confirmDelete) return;

    setError(null);
    setSuccess(null);

    try {
      await customerAddressService.remove(address.id);
      setSuccess('Endereço removido com sucesso.');
      await loadAddresses();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível remover o endereço.'));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader

        title="Endereços de entrega"
        description="Informe CEP e número. O restante será preenchido automaticamente para liberar pedidos e entregas."
      />

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

      <form className="app-card space-y-5 p-5 md:p-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink-900">{isEditing ? 'Editar endereço' : 'Novo endereço'}</h3>
            <p className="mt-1 text-sm text-ink-500">Digite CEP e número e use o preenchimento automático.</p>
          </div>
          {isEditing ? (
            <Button type="button" variant="ghost" onClick={resetForm}>
              <X className="h-4 w-4" />
              Cancelar edição
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InputField id="address-label" label="Apelido" placeholder="Casa" value={form.label} onChange={(event) => updateField('label', event.target.value)} />
          <InputField id="address-zip" label="CEP" placeholder="01001000" value={form.zip_code} onChange={(event) => updateField('zip_code', event.target.value)} required />
          <InputField id="address-number" label="Número" placeholder="100" value={form.number} onChange={(event) => updateField('number', event.target.value)} required />
        </div>

        <InputField id="address-complement" label="Complemento" placeholder="Apto, bloco, referência..." value={form.complement} onChange={(event) => updateField('complement', event.target.value)} />

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={handleResolveAddress} disabled={Boolean(actionLoading) || saving}>
            {actionLoading === 'resolve' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            Preencher endereço automaticamente
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label="Rua" value={form.street} />
          <ReadOnlyField label="Bairro" value={form.neighborhood} />
          <ReadOnlyField label="Cidade" value={form.city} />
          <ReadOnlyField label="UF" value={form.state} />
        </div>

        {hasResolvedAddress ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Endereço pronto para salvar.
          </div>
        ) : null}

        <label className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm font-semibold text-ink-700">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(event) => updateField('is_default', event.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-coral-600 focus:ring-coral-500"
          />
          Usar como endereço padrão
        </label>

        <Button type="submit" disabled={saving || Boolean(actionLoading)}>
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEditing ? 'Salvar endereço' : 'Cadastrar endereço'}
        </Button>
      </form>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Endereços cadastrados
        </div>

        {loading ? (
          <div className="app-card flex items-center gap-3 p-6 text-sm text-ink-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando endereços...
          </div>
        ) : null}

        {!loading && addresses.length === 0 ? (
          <EmptyState title="Nenhum endereço cadastrado" description="Cadastre um endereço padrão para ativar sua localização no sistema." />
        ) : null}

        <div className="grid gap-5 xl:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={(item) => setForm(addressToForm(item))}
              onSetDefault={handleSetDefault}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
