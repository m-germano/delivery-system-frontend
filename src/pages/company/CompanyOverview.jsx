import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Pencil, RefreshCw, Store } from 'lucide-react';
import CompanyLocationMap from '../../components/map/CompanyLocationMap.jsx';
import Alert from '../../components/ui/Alert.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { companyService } from '../../services/companyService.js';

function InfoItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink-800">{value || 'Não informado'}</dd>
    </div>
  );
}

export default function CompanyOverview() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCompany() {
      setLoading(true);
      setError(null);

      try {
        const currentCompany = await companyService.getMine();
        if (!isMounted) return;
        setCompany(currentCompany);
      } catch (requestError) {
        if (!isMounted) return;

        if (requestError?.response?.status === 404) {
          setCompany(null);
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

  const address = company?.address;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha empresa"
        description="Resumo do cadastro comercial e endereço da empresa."
      />

      <div className="flex justify-end">
        <Link to="/company/settings" className="app-button-primary">
          <Pencil className="h-4 w-4" />
          {company ? 'Editar cadastro' : 'Cadastrar empresa'}
        </Link>
      </div>

      {loading ? (
        <div className="app-card flex items-center gap-3 p-6 text-sm text-ink-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando dados da empresa...
        </div>
      ) : null}

      {error ? (
        <Alert variant="error" title="Atenção">
          {error}
        </Alert>
      ) : null}

      {!loading && !company ? (
        <Alert variant="warning" title="Empresa não cadastrada">
          Cadastre a empresa e o endereço para usar as rotas de empresa.
        </Alert>
      ) : null}

      {company ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="app-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-700">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-coral-500">Dados comerciais</p>
                <h3 className="mt-1 text-2xl font-black text-ink-900">{company.name}</h3>
                {company.description ? <p className="mt-2 text-sm leading-6 text-ink-500">{company.description}</p> : null}
              </div>
            </div>

            <dl className="mt-6 grid gap-5 md:grid-cols-2">
              <InfoItem label="Telefone" value={company.phone} />
              <InfoItem label="Documento" value={company.document} />
              <InfoItem label="Status" value={company.is_active ? 'Ativa' : 'Inativa'} />
              <InfoItem label="ID da empresa" value={company.id} />
            </dl>
          </section>

          <section className="app-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-700">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-coral-500">Endereço</p>
                <h3 className="mt-1 text-xl font-black text-ink-900">
                  {address?.street}, {address?.number}
                </h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  {[address?.neighborhood, address?.city, address?.state].filter(Boolean).join(' - ')}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-5 md:grid-cols-2">
              <InfoItem label="CEP" value={address?.zip_code} />
              <InfoItem label="Complemento" value={address?.complement} />
            </dl>
          </section>
        </div>
      ) : null}

      {company ? (
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-black text-ink-900">Mapa da empresa</h3>
            <p className="mt-1 text-sm text-ink-500">Localização cadastrada para retirada dos pedidos.</p>
          </div>
          <CompanyLocationMap company={company} />
        </section>
      ) : null}

      {company ? (
        <section className="app-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-ink-900">Cadastro configurado</h3>
              <p className="mt-1 text-sm text-ink-500">A empresa possui dados comerciais e endereço salvos.</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
