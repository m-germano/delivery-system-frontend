import { useEffect, useMemo, useState } from 'react';
import { Bike, Store, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Alert from '../../components/ui/Alert.jsx';
import { PUBLIC_REGISTER_ROLES, ROLE_IDS } from '../../config/roles.js';
import { resolvePostLoginRedirect } from '../../utils/authRedirect.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { cn } from '../../utils/classNames.js';
import logo from '../../assets/dishdash-light.png';

const roleVisuals = {
  [ROLE_IDS.COMPANY]: {
    icon: Store,
    title: 'Empresa',
    description: 'Cadastre seu restaurante e gerencie produtos e pedidos.',
  },
  [ROLE_IDS.COURIER]: {
    icon: Bike,
    title: 'Entregador',
    description: 'Aceite corridas, compartilhe localização e finalize entregas.',
  },
  [ROLE_IDS.CUSTOMER]: {
    icon: UserRound,
    title: 'Cliente',
    description: 'Explore restaurantes, monte seu carrinho e acompanhe pedidos.',
  },
};

function DishDashLogo({ className = '', compact = false }) {
  return (
    <div className={cn('flex w-full justify-start', className)}>
      <img src={logo} alt="DishDash" className={cn('block object-contain', compact ? 'h-11' : 'h-14')} />
    </div>
  );
}

function TextInput({ id, label, ...props }) {
  return (
    <label className="block" htmlFor={id}>
      <span className="app-label mb-1.5 block">{label}</span>
      <input id={id} className="app-input" {...props} />
    </label>
  );
}

function RoleChoiceCard({ role, selected, onSelect }) {
  const visual = roleVisuals[role.value];
  const Icon = visual?.icon ?? UserRound;

  return (
    <button
      type="button"
      className={cn(
        'group flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition',
        selected
          ? 'border-coral-400 bg-coral-50/60 ring-1 ring-coral-200'
          : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/60',
      )}
      onClick={() => onSelect(role.value)}
      aria-pressed={selected}
    >
      <div
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-lg transition',
          selected ? 'bg-coral-500 text-white' : 'bg-ink-100 text-ink-500 group-hover:bg-ink-200',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink-900">{visual?.title ?? role.label}</h3>
        <p className="mt-0.5 text-[13px] leading-5 text-ink-500">{visual?.description}</p>
      </div>
    </button>
  );
}

export default function Login({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const status = useAuthStore((state) => state.status);

  const [mode, setMode] = useState(initialMode);
  const [registerStep, setRegisterStep] = useState('role');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role_id: ROLE_IDS.CUSTOMER,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isRegisterMode = mode === 'register';
  const isRoleStep = registerStep === 'role';
  const isLoading = status === 'loading';
  const selectedRoleVisual = useMemo(() => roleVisuals[registerForm.role_id] ?? roleVisuals[ROLE_IDS.CUSTOMER], [registerForm.role_id]);
  const SelectedRoleIcon = selectedRoleVisual.icon;

  useEffect(() => {
    setMode(initialMode);
    if (initialMode === 'register') setRegisterStep('role');
  }, [initialMode]);

  function resetMessages() {
    setError('');
    setSuccess('');
  }

  function showLogin() {
    resetMessages();
    setMode('login');
  }

  function showRegister() {
    resetMessages();
    setMode('register');
    setRegisterStep('role');
  }

  function chooseRegisterRole(roleId) {
    resetMessages();
    setRegisterForm((current) => ({ ...current, role_id: Number(roleId) }));
    setRegisterStep('form');
  }

  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    resetMessages();

    try {
      const user = await login(loginForm);
      const redirectTo = resolvePostLoginRedirect(user, location.state?.from?.pathname);
      navigate(redirectTo, { replace: true, state: null });
    } catch (loginError) {
      setError(loginError.message);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    resetMessages();

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    try {
      await register({
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone || null,
        password: registerForm.password,
        role_id: registerForm.role_id,
      });
      setLoginForm({ email: registerForm.email, password: '' });
      setSuccess('Conta criada. Entre com sua senha para continuar.');
      setMode('login');
      setRegisterStep('role');
    } catch (registerError) {
      setError(registerError.message);
    }
  }

  return (
    <main className="min-h-dvh bg-ink-50 lg:flex lg:items-center lg:justify-center lg:p-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative grid min-h-dvh grid-cols-1 bg-white lg:min-h-[min(760px,calc(100dvh-3rem))] lg:grid-cols-2 lg:overflow-hidden lg:rounded-[28px] lg:border lg:border-ink-200/70 lg:shadow-sm">
          <div
            className={cn(
              'relative z-10 flex min-h-0 flex-col bg-white px-5 py-6 sm:px-8 sm:py-8 lg:px-14 lg:py-10',
              isRegisterMode ? 'lg:order-2' : 'lg:order-1',
            )}
          >
            <DishDashLogo className="mb-8 lg:mb-8" />

            <div className="flex flex-1 flex-col justify-center pb-6 lg:pb-0">
              {!isRegisterMode ? (
                <div className="w-full max-w-sm">
                  <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Entrar</h1>
                  <p className="mt-1.5 text-sm text-ink-500">Acesse sua conta para continuar no DishDash.</p>

                  <div aria-live="polite" className="mt-4 space-y-3">
                    {error ? (
                      <Alert variant="error" title="Não foi possível entrar">
                        {error}
                      </Alert>
                    ) : null}
                    {success ? (
                      <Alert variant="success" title="Tudo certo">
                        {success}
                      </Alert>
                    ) : null}
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
                    <TextInput
                      id="login-email"
                      label="E-mail"
                      name="email"
                      type="email"
                      placeholder="voce@email.com"
                      autoComplete="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      required
                    />
                    <TextInput
                      id="login-password"
                      label="Senha"
                      name="password"
                      type="password"
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      required
                    />
                    <button type="submit" className="app-button-primary w-full" disabled={isLoading}>
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm text-ink-500 lg:hidden">
                    Não tem conta?{' '}
                    <button type="button" className="font-semibold text-coral-600 hover:text-coral-700" onClick={showRegister}>
                      Criar conta
                    </button>
                  </p>
                </div>
              ) : (
                <div className="w-full max-w-md">
                  <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Criar conta</h1>
                  <p className="mt-1.5 text-sm text-ink-500">
                    {isRoleStep ? 'Primeiro, escolha como você quer usar o DishDash.' : 'Preencha seus dados para finalizar o cadastro.'}
                  </p>

                  <div aria-live="polite" className="mt-4">
                    {error ? (
                      <Alert variant="error" title="Não foi possível cadastrar">
                        {error}
                      </Alert>
                    ) : null}
                  </div>

                  {isRoleStep ? (
                    <div className="mt-5 space-y-2.5">
                      {PUBLIC_REGISTER_ROLES.map((role) => (
                        <RoleChoiceCard key={role.key} role={role} selected={registerForm.role_id === role.value} onSelect={chooseRegisterRole} />
                      ))}
                    </div>
                  ) : (
                    <form className="mt-5 space-y-4" onSubmit={handleRegisterSubmit}>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <SelectedRoleIcon className="h-4 w-4 text-coral-600" />
                          <span className="text-sm font-medium text-ink-800">{selectedRoleVisual.title}</span>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-semibold text-coral-600 hover:text-coral-700"
                          onClick={() => setRegisterStep('role')}
                        >
                          Trocar
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextInput id="register-name" label="Nome" name="name" value={registerForm.name} onChange={handleRegisterChange} required />
                        <TextInput id="register-phone" label="Telefone" name="phone" value={registerForm.phone} onChange={handleRegisterChange} />
                      </div>

                      <TextInput
                        id="register-email"
                        label="E-mail"
                        name="email"
                        type="email"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                        required
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextInput
                          id="register-password"
                          label="Senha"
                          name="password"
                          type="password"
                          value={registerForm.password}
                          onChange={handleRegisterChange}
                          required
                        />
                        <TextInput
                          id="register-confirm-password"
                          label="Confirmar senha"
                          name="confirmPassword"
                          type="password"
                          value={registerForm.confirmPassword}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <button type="submit" className="app-button-primary w-full" disabled={isLoading}>
                        {isLoading ? 'Criando...' : 'Cadastrar'}
                      </button>
                    </form>
                  )}

                  <p className="mt-6 text-center text-sm text-ink-500 lg:hidden">
                    Já tem conta?{' '}
                    <button type="button" className="font-semibold text-coral-600 hover:text-coral-700" onClick={showLogin}>
                      Entrar
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className={cn('relative hidden overflow-hidden bg-coral-500 p-10 text-white lg:flex', isRegisterMode ? 'lg:order-1' : 'lg:order-2')}>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10" />

            <div className="relative flex w-full flex-col justify-between">
              <span className="w-fit rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">

              </span>

              <div className="mx-auto max-w-[300px] text-center">
                <h2 className="text-3xl font-semibold leading-snug">
                  {isRegisterMode ? 'Já tem conta?' : 'Novo no DishDash?'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-coral-50/90">
                  {isRegisterMode
                    ? 'Entre para acompanhar pedidos, entregas e operações do seu jeito.'
                    : 'Escolha como deseja usar a plataforma e crie sua conta em poucos passos.'}
                </p>
                <button
                  type="button"
                  className="mt-6 rounded-xl border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-coral-700"
                  onClick={isRegisterMode ? showLogin : showRegister}
                >
                  {isRegisterMode ? 'Entrar' : 'Criar conta'}
                </button>
              </div>

              <p className="text-center text-xs text-coral-100/80">© {new Date().getFullYear()} DishDash</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

