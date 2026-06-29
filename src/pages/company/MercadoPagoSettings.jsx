import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink, RefreshCw, ShieldCheck, Unplug } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { companyService } from '../../services/companyService.js';
import { paymentAccountService } from '../../services/paymentAccountService.js';
import { formatDateTime } from '../../utils/formatters.js';

function normalizeAccountsResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function getFriendlyError(error, fallback) {
  const status = error?.response?.status;

  if (status === 401 || status === 403) {
    return 'Você não tem permissão para gerenciar a conta Mercado Pago desta empresa.';
  }

  if (!error?.response) {
    return 'Não foi possível conectar com a API. Verifique se o backend está rodando em http://localhost:8000.';
  }

  return getApiErrorMessage(error, fallback);
}

function InfoItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-ink-800">{value || 'Não informado'}</dd>
    </div>
  );
}

function AccountStatusCard({ account, loading }) {
  if (loading) {
    return (
      <section className="app-card flex items-center gap-3 p-6 text-sm text-ink-500">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Carregando status da conexão...
      </section>
    );
  }

  if (!account) {
    return (
      <section className="app-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">Status</p>
              <h3 className="mt-1 text-xl font-black text-ink-900">Não conectado</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Nenhuma conta Mercado Pago ativa foi vinculada a esta empresa.
              </p>
            </div>
          </div>
          <Badge variant="neutral">Não conectado</Badge>
        </div>
      </section>
    );
  }

  return (
    <section className="app-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600">Status</p>
            <h3 className="mt-1 text-xl font-black text-ink-900">Conectado</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Sua conta Mercado Pago está vinculada. Tokens e credenciais sensíveis nunca são exibidos aqui.
            </p>
          </div>
        </div>
        <Badge variant="success">Conectado</Badge>
      </div>

      <dl className="mt-6 grid gap-5 md:grid-cols-2">
        <InfoItem label="Provider" value={account.provider} />
        <InfoItem label="ID da conta Mercado Pago" value={account.provider_user_id} />
        <InfoItem label="Public key" value={account.public_key} />
        <InfoItem label="Data de conexão" value={formatDateTime(account.connected_at)} />
      </dl>
    </section>
  );
}

export default function MercadoPagoSettings() {
  const [company, setCompany] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeAccount = useMemo(
    () => accounts.find((account) => account.provider === 'mercado_pago' && account.is_active),
    [accounts],
  );

  const loadData = useCallback(async ({ preserveMessages = false } = {}) => {
    setLoading(true);
    if (!preserveMessages) {
      setError(null);
      setSuccess(null);
    }

    try {
      const currentCompany = await companyService.getMine();
      setCompany(currentCompany);

      const response = await paymentAccountService.listCompanyPaymentAccounts(currentCompany.id);
      setAccounts(normalizeAccountsResponse(response));
    } catch (requestError) {
      if (requestError?.response?.status === 404) {
        setCompany(null);
        setAccounts([]);
        setError('Cadastre sua empresa antes de conectar uma conta Mercado Pago.');
        return;
      }

      setError(getFriendlyError(requestError, 'Não foi possível carregar o status do Mercado Pago.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const connected = searchParams.get('connected');

    if (connected === 'true') {
      setSuccess('Conta Mercado Pago conectada com sucesso.');
      navigate('/company/mercado-pago', { replace: true });
      loadData({ preserveMessages: true });
      return;
    }

    if (connected === 'false') {
      setError('Não foi possível conectar a conta Mercado Pago.');
      navigate('/company/mercado-pago', { replace: true });
      loadData({ preserveMessages: true });
      return;
    }

    loadData();
  }, [loadData, navigate, searchParams]);

  async function handleConnect() {
    if (!company?.id) {
      setError('Cadastre sua empresa antes de conectar uma conta Mercado Pago.');
      return;
    }

    setConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await paymentAccountService.getMercadoPagoConnectUrl(company.id);
      const authorizationUrl = response?.authorization_url;

      if (!authorizationUrl) {
        throw new Error('A API não retornou a URL de autorização do Mercado Pago.');
      }

      window.location.href = authorizationUrl;
    } catch (requestError) {
      setError(getFriendlyError(requestError, 'Não foi possível iniciar a conexão com o Mercado Pago.'));
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!company?.id || !activeAccount?.id) return;

    const confirmed = window.confirm('Tem certeza que deseja desconectar o Mercado Pago?');
    if (!confirmed) return;

    setDisconnecting(true);
    setError(null);
    setSuccess(null);

    try {
      await paymentAccountService.disconnectCompanyPaymentAccount(company.id, activeAccount.id);
      setSuccess('Mercado Pago desconectado com sucesso.');

      const response = await paymentAccountService.listCompanyPaymentAccounts(company.id);
      setAccounts(normalizeAccountsResponse(response));
    } catch (requestError) {
      setError(getFriendlyError(requestError, 'Não foi possível desconectar o Mercado Pago.'));
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mercado Pago"
        description="Conecte sua conta Mercado Pago para receber pagamentos dos pedidos diretamente na sua conta."
        actions={
          activeAccount ? (
            <Button type="button" variant="danger" onClick={handleDisconnect} disabled={disconnecting || connecting}>
              {disconnecting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
              Desconectar Mercado Pago
            </Button>
          ) : (
            <Button type="button" onClick={handleConnect} disabled={loading || connecting || !company?.id}>
              {connecting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Conectar Mercado Pago
            </Button>
          )
        }
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

      <AccountStatusCard account={activeAccount} loading={loading} />

      <Alert variant="info" title="Como funciona">
        Você será redirecionado para o Mercado Pago para autorizar a conexão. Após a autorização, voltará automaticamente para esta tela.
      </Alert>

      <section className="app-card p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-ink-900">Segurança da conexão</h3>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              O frontend não recebe, exibe, armazena ou troca tokens do Mercado Pago. O callback OAuth e o armazenamento criptografado ficam no backend.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
