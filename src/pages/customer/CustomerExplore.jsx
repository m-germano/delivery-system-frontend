import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, ChevronDown, MapPin, RefreshCw, Search, SlidersHorizontal, Store, Utensils, X } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { companyService } from '../../services/companyService.js';
import { customerAddressService } from '../../services/customerAddressService.js';

const DISTANCE_FILTERS = [
  { label: 'Qualquer distância', value: 'all' },
  { label: 'Até 2 km', value: '2' },
  { label: 'Até 5 km', value: '5' },
  { label: 'Até 10 km', value: '10' },
];

const SORT_OPTIONS = [
  { label: 'Mais próximos', value: 'distance' },
  { label: 'Menor taxa', value: 'fee' },
  { label: 'Nome', value: 'name' },
];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDistance(distanceKm) {
  const value = toNumber(distanceKm);
  if (value === null) return 'Distância indisponível';
  if (value < 1) return `${Math.round(value * 1000)} m de você`;
  return `${value.toFixed(1).replace('.', ',')} km de você`;
}

function formatCurrency(value) {
  const numberValue = toNumber(value);
  if (numberValue === null) return 'Taxa indisponível';
  if (numberValue <= 0) return 'Grátis';

  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatAddress(address) {
  if (!address) return '';

  return [address.neighborhood, [address.city, address.state].filter(Boolean).join('/')]
    .filter(Boolean)
    .join(' · ');
}

function getRestaurantImage(company) {
  return company?.image_url ?? company?.imageUrl ?? null;
}

function getRestaurantType(company) {
  return company?.category_name ?? company?.type ?? company?.segment ?? company?.description ?? 'Restaurante';
}

function RestaurantCard({ restaurant }) {
  const imageUrl = getRestaurantImage(restaurant);
  const deliveryFee = toNumber(restaurant.delivery_fee);
  const isFreeDelivery = deliveryFee !== null && deliveryFee <= 0;

  return (
    <Link
      to={`/customer/explore/${restaurant.id}`}
      className="group block rounded-2xl border border-ink-200/70 bg-white p-3 transition hover:border-ink-300 hover:shadow-sm"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink-100 bg-ink-50 sm:h-24 sm:w-24">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={restaurant.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <Store className="h-8 w-8 text-ink-300" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ink-900 sm:text-base">{restaurant.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-ink-500">
                <span>{getRestaurantType(restaurant)}</span>
                <span>•</span>
                <span>{formatDistance(restaurant.distance_km)}</span>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              Aberto
            </span>
          </div>

          {formatAddress(restaurant.address) ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" />
              <span className="truncate">{formatAddress(restaurant.address)}</span>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Bike className="h-3.5 w-3.5 text-coral-600" />
              Entrega
            </span>
            <span>•</span>
            <span className={isFreeDelivery ? 'font-semibold text-emerald-700' : ''}>{formatCurrency(deliveryFee)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="relative shrink-0">
      <span className="sr-only">{label}</span>
      <select
        className="h-10 appearance-none rounded-full border border-ink-200 bg-white pl-4 pr-9 text-sm font-medium text-ink-700 outline-none transition hover:border-ink-300 focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </label>
  );
}

export default function CustomerExplore() {
  const [restaurants, setRestaurants] = useState([]);
  const [locationStatus, setLocationStatus] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadRestaurants() {
    setLoading(true);
    setError(null);

    try {
      const [status, addressesResponse] = await Promise.all([
        customerAddressService.getLocationStatus(),
        customerAddressService.listMine(),
      ]);

      const addresses = addressesResponse?.items ?? [];
      const selectedAddress = addresses.find((address) => address.is_default) ?? addresses[0] ?? null;

      setLocationStatus(status);
      setDefaultAddress(selectedAddress);

      if (!status?.has_active_location) {
        setRestaurants([]);
        return;
      }

      const restaurantsResponse = await companyService.listNearby({ limit: 100 });
      setRestaurants(restaurantsResponse?.items ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível carregar os restaurantes próximos.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const maxDistance = distanceFilter === 'all' ? null : Number(distanceFilter);

    return restaurants
      .filter((restaurant) => {
        if (!normalizedSearch) return true;

        const searchableText = [
          restaurant.name,
          restaurant.description,
          restaurant.address?.neighborhood,
          restaurant.address?.city,
          restaurant.address?.state,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .filter((restaurant) => {
        if (maxDistance === null) return true;
        const distanceKm = toNumber(restaurant.distance_km);
        return distanceKm !== null && distanceKm <= maxDistance;
      })
      .filter((restaurant) => {
        if (!freeDeliveryOnly) return true;
        const deliveryFee = toNumber(restaurant.delivery_fee);
        return deliveryFee !== null && deliveryFee <= 0;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);

        if (sortBy === 'fee') {
          const feeA = toNumber(a.delivery_fee);
          const feeB = toNumber(b.delivery_fee);
          if (feeA === null && feeB === null) return a.name.localeCompare(b.name);
          if (feeA === null) return 1;
          if (feeB === null) return -1;
          return feeA - feeB;
        }

        const distanceA = toNumber(a.distance_km);
        const distanceB = toNumber(b.distance_km);
        if (distanceA === null && distanceB === null) return a.name.localeCompare(b.name);
        if (distanceA === null) return 1;
        if (distanceB === null) return -1;
        return distanceA - distanceB;
      });
  }, [distanceFilter, freeDeliveryOnly, restaurants, searchTerm, sortBy]);

  const hasActiveFilters = distanceFilter !== 'all' || freeDeliveryOnly || sortBy !== 'distance' || Boolean(searchTerm.trim());

  function clearFilters() {
    setSearchTerm('');
    setDistanceFilter('all');
    setSortBy('distance');
    setFreeDeliveryOnly(false);
  }

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Restaurantes"
        description="Encontre opções próximas de você e veja o cardápio."
        actions={
          <Button type="button" variant="secondary" onClick={loadRestaurants} disabled={loading}>
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

      {!loading && !locationStatus?.has_active_location ? (
        <Alert variant="warning" title="Endereço não configurado">
          Cadastre um endereço padrão para ver restaurantes próximos, distância e taxa de entrega.{' '}
          <Link to="/customer/addresses" className="font-semibold underline">
            Configurar endereço
          </Link>
        </Alert>
      ) : null}

      <section className="app-card w-full overflow-hidden">
        <div className="border-b border-ink-100 bg-white p-4">
          <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5">
            <Search className="h-4 w-4 text-ink-400" />
            <input
              className="w-full bg-transparent text-sm font-medium text-ink-900 outline-none placeholder:text-ink-400"
              placeholder="Buscar restaurantes ou bairros"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            {searchTerm ? (
              <button
                type="button"
                className="rounded-lg p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                onClick={() => setSearchTerm('')}
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>

            <FilterSelect label="Distância" value={distanceFilter} onChange={setDistanceFilter} options={DISTANCE_FILTERS} />
            <FilterSelect label="Ordenar" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />

            <button
              type="button"
              className={[
                'inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition',
                freeDeliveryOnly
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50',
              ].join(' ')}
              onClick={() => setFreeDeliveryOnly((current) => !current)}
            >
              Frete grátis
            </button>
          </div>

          {filtersOpen ? (
            <div className="mt-3 rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm text-ink-600">
              <p className="font-medium text-ink-800">Filtros ativos</p>
              <p className="mt-1 leading-6">Distância e taxa vêm do backend com base no seu endereço padrão.</p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-coral-600 transition hover:text-coral-700"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </button>
              ) : null}
            </div>
          ) : null}

          {defaultAddress ? (
            <div className="mt-3 flex items-start gap-2 text-xs font-medium text-ink-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral-600" />
              <span>
                Mostrando opções próximas de {defaultAddress.street}, {defaultAddress.number}
              </span>
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-ink-100 bg-ink-50/40">
          {loading ? (
            <div className="flex items-center gap-3 bg-white p-5 text-sm text-ink-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Carregando restaurantes...
            </div>
          ) : null}

          {!loading && filteredRestaurants.length === 0 ? (
            <div className="bg-white p-6">
              <EmptyState title="Nenhum restaurante encontrado" description="Tente remover os filtros ou atualizar a lista." />
            </div>
          ) : null}

          {!loading
            ? filteredRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white p-3">
                <RestaurantCard restaurant={restaurant} />
              </div>
            ))
            : null}
        </div>
      </section>

      <div className="h-4" />
    </div>
  );
}
