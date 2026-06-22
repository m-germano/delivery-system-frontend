import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Bike, CircleCheckBig, CircleOff, RefreshCw, Save } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import InputField from '../../components/ui/InputField.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { deliveryService } from '../../services/deliveryService.js';

const initialForm = {
  is_available: false,
  vehicle_type: '',
  vehicle_plate: '',
  current_latitude: '',
  current_longitude: '',
};

function toForm(profile) {
  return {
    is_available: Boolean(profile?.is_available),
    vehicle_type: profile?.vehicle_type ?? '',
    vehicle_plate: profile?.vehicle_plate ?? '',
    current_latitude: profile?.current_latitude ?? '',
    current_longitude: profile?.current_longitude ?? '',
  };
}

function toPayload(form) {
  return {
    is_available: Boolean(form.is_available),
    vehicle_type: form.vehicle_type || null,
    vehicle_plate: form.vehicle_plate || null,
    current_latitude: form.current_latitude === '' ? null : Number(form.current_latitude),
    current_longitude: form.current_longitude === '' ? null : Number(form.current_longitude),
  };
}

export default function CourierAvailability() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function loadProfile() {
    setLoading(true);
    setError(null);

    try {
      const response = await deliveryService.getCourierProfile();
      setProfile(response);
      setForm(toForm(response));
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível carregar seu status de entregador.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await deliveryService.updateAvailability(toPayload(form));
      setProfile(response);
      setForm(toForm(response));
      toast.success('Dados do entregador salvos.');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível salvar os dados do entregador.'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability() {
    const nextForm = { ...form, is_available: !form.is_available };
    setForm(nextForm);
    setSaving(true);

    try {
      const response = await deliveryService.updateAvailability(toPayload(nextForm));
      setProfile(response);
      setForm(toForm(response));
      toast.success(response.is_available ? 'Você está disponível para entregas.' : 'Você ficou indisponível para entregas.');
    } catch (requestError) {
      setForm(form);
      toast.error(getApiErrorMessage(requestError, 'Não foi possível atualizar sua disponibilidade.'));
    } finally {
      setSaving(false);
    }
  }

  const available = Boolean(profile?.is_available);

  return (
    <div className="space-y-6">
      <PageHeader

        title="Disponibilidade"
        description="Controle quando você pode receber novas entregas."
        actions={
          <Button type="button" variant="secondary" onClick={loadProfile} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Atualizar
          </Button>
        }
      />

      {error ? <Alert variant="error" title="Atenção">{error}</Alert> : null}

      <div className="app-card p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-coral-50 p-4 text-coral-600">
              <Bike className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-ink-900">Status do entregador</h3>
                <Badge variant={available ? 'green' : 'slate'}>{available ? 'Disponível' : 'Indisponível'}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-500">Você precisa estar disponível para aceitar uma entrega.</p>
            </div>
          </div>
          <Button type="button" variant={available ? 'danger' : 'primary'} onClick={toggleAvailability} disabled={saving || loading}>
            {available ? <CircleOff className="h-4 w-4" /> : <CircleCheckBig className="h-4 w-4" />}
            {available ? 'Ficar indisponível' : 'Ficar disponível'}
          </Button>
        </div>
      </div>

      <form className="app-card space-y-5 p-5 md:p-6" onSubmit={handleSubmit}>
        <div>
          <h3 className="text-lg font-semibold text-ink-900">Dados operacionais</h3>
          <p className="mt-1 text-sm text-ink-500">Essas informações ajudam a identificar o entregador durante a corrida.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            id="vehicle_type"
            label="Tipo de veículo"
            placeholder="Moto, bike, carro..."
            value={form.vehicle_type}
            onChange={(event) => updateField('vehicle_type', event.target.value)}
          />
          <InputField
            id="vehicle_plate"
            label="Placa"
            placeholder="Opcional"
            value={form.vehicle_plate}
            onChange={(event) => updateField('vehicle_plate', event.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || loading}>
            <Save className="h-4 w-4" />
            Salvar dados
          </Button>
        </div>
      </form>
    </div>
  );
}
