import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Package, RefreshCw, Search, ShoppingBag } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import InputField from '../../components/ui/InputField.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { companyService } from '../../services/companyService.js';
import { customerAddressService } from '../../services/customerAddressService.js';
import { productService } from '../../services/productService.js';
import { formatCurrency } from '../../utils/formatters.js';

function ProductCard({ product, company }) {
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

        {company ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <ShoppingBag className="h-3.5 w-3.5" />
            {company.name}
          </p>
        ) : null}

        {product.category?.name ? <Badge variant="blue">{product.category.name}</Badge> : null}
        {product.description ? <p className="text-sm leading-6 text-slate-500">{product.description}</p> : null}
      </div>
    </article>
  );
}

export default function CustomerProducts() {
  const [searchParams] = useSearchParams();
  const initialCompanyId = searchParams.get('company_id') ?? '';
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId);
  const [search, setSearch] = useState('');
  const [locationStatus, setLocationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const companyById = new Map(companies.map((company) => [company.id, company]));
  const hasActiveLocation = Boolean(locationStatus?.has_active_location);

  async function loadPage() {
    setLoading(true);
    setError(null);

    try {
      const status = await customerAddressService.getLocationStatus();
      setLocationStatus(status);

      if (!status.has_active_location) {
        setProducts([]);
        const companiesResponse = await companyService.list({ limit: 100 });
        setCompanies(companiesResponse?.items ?? []);
        return;
      }

      const [companiesResponse, productsResponse] = await Promise.all([
        companyService.list({ limit: 100 }),
        productService.list({
          company_id: selectedCompanyId || undefined,
          search: search || undefined,
          limit: 100,
        }),
      ]);

      setCompanies(companiesResponse?.items ?? []);
      setProducts(productsResponse?.items ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível carregar produtos disponíveis.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    await loadPage();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos disponíveis"
        description="Visualize produtos ativos de empresas com endereço configurado."
        actions={
          <Button type="button" variant="secondary" onClick={loadPage} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Atualizar
          </Button>
        }
      />

      {error ? (
        <Alert variant="error" title="Atenção">
          {error.includes('endereço') || error.includes('latitude') || error.includes('localização') ? (
            <>
              {error}{' '}
              <Link to="/customer/addresses" className="font-bold underline">
                Configurar endereço
              </Link>
            </>
          ) : (
            error
          )}
        </Alert>
      ) : null}

      {!loading && !hasActiveLocation ? (
        <Alert variant="warning" title="Localização não configurada">
          Cadastre um endereço padrão para visualizar produtos disponíveis.{' '}
          <Link to="/customer/addresses" className="font-bold underline">
            Configurar endereço
          </Link>
        </Alert>
      ) : null}

      {hasActiveLocation && locationStatus?.default_address ? (
        <div className="app-card flex items-start gap-3 p-4 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-5 w-5 text-orange-600" />
          <div>
            <p className="font-bold text-slate-800">Endereço padrão ativo</p>
            <p className="mt-1">
              {locationStatus.default_address.street}, {locationStatus.default_address.number} · {locationStatus.default_address.city}/{locationStatus.default_address.state}
            </p>
          </div>
        </div>
      ) : null}

      <form className="app-card grid gap-4 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={handleSearch}>
        <InputField
          id="customer-product-search"
          label="Buscar produto"
          placeholder="Pizza, lanche, bebida..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={!hasActiveLocation}
        />
        <div className="space-y-2">
          <label className="app-label" htmlFor="customer-company-filter">
            Empresa
          </label>
          <select
            id="customer-company-filter"
            className="app-input"
            value={selectedCompanyId}
            onChange={(event) => setSelectedCompanyId(event.target.value)}
            disabled={!hasActiveLocation}
          >
            <option value="">Todas as empresas</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" disabled={loading || !hasActiveLocation}>
          <Search className="h-4 w-4" />
          Buscar
        </Button>
      </form>

      {loading ? (
        <div className="app-card flex items-center gap-3 p-6 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando produtos...
        </div>
      ) : null}

      {!loading && hasActiveLocation && products.length === 0 ? (
        <EmptyState title="Nenhum produto disponível" description="Não encontramos produtos ativos para os filtros informados." />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} company={companyById.get(product.company_id)} />
        ))}
      </div>
    </div>
  );
}
