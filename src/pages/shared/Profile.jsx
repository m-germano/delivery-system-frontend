import {
  CalendarDays,
  CheckCircle2,
  CircleOff,
  Clock3,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { getRoleLabel } from '../../config/roles.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { cn } from '../../utils/classNames.js';
import { getInitials } from '../../utils/formatters.js';

function getUserField(user, ...keys) {
  return keys
    .map((key) => user?.[key])
    .find((value) => value !== null && value !== undefined && value !== '') ?? null;
}

function formatValue(value) {
  return value ?? 'Não informado';
}

function formatDate(value) {
  if (!value) return 'Não informado';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Não informado';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getMemberSince(value) {
  if (!value) return 'Não informado';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Não informado';
  }

  return date.getFullYear();
}

function getIsActive(user) {
  const value = getUserField(user, 'is_active', 'active', 'isActive', 'status');

  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return ['active', 'ativo', 'true', '1'].includes(normalized);
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  return null;
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-ink-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-ink-900">
        {formatValue(value)}
      </p>
    </div>
  );
}

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const avatarUrl = user?.avatar_url ?? user?.avatarUrl ?? user?.image_url ?? user?.photo_url;

  const name = getUserField(user, 'name');
  const email = getUserField(user, 'email');
  const phone = getUserField(user, 'phone', 'phone_number', 'phoneNumber');
  const createdAt = getUserField(user, 'created_at', 'createdAt', 'created_on', 'createdOn');
  const updatedAt = getUserField(user, 'updated_at', 'updatedAt', 'updated_on', 'updatedOn');
  const isActive = getIsActive(user);

  return (
    <div className="mx-auto w-full space-y-5">
      <section className="app-card overflow-hidden">
        <div className="border-b border-ink-100 bg-white px-5 py-5 md:px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {avatarUrl ? (
                <img
                  className="h-20 w-20 shrink-0 rounded-2xl border border-ink-200 object-cover"
                  src={avatarUrl}
                  alt={name ?? 'Usuário'}
                />
              ) : (
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-ink-900 text-xl font-semibold text-white">
                  {getInitials(name)}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold text-ink-900 md:text-2xl">
                    {name ?? 'Usuário'}
                  </h2>

                  {isActive !== null ? (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                        isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
                      )}
                    >
                      {isActive ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <CircleOff className="h-3.5 w-3.5" />
                      )}
                      {isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 truncate text-sm font-medium text-ink-500">
                  {email ?? 'E-mail não informado'}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-coral-600" />
                    {getRoleLabel(user)}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                    <CalendarDays className="h-3.5 w-3.5 text-coral-600" />
                    Membro desde {getMemberSince(createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div>
            <h3 className="text-base font-semibold text-ink-900">
              Informações da conta
            </h3>
            <p className="mt-1 text-sm text-ink-500">
              Dados principais do seu perfil no DishDash.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <InfoCard icon={UserRound} label="Nome" value={name} />
            <InfoCard icon={Mail} label="E-mail" value={email} />
            <InfoCard icon={Phone} label="Telefone" value={phone} />
            <InfoCard icon={ShieldCheck} label="Tipo de conta" value={getRoleLabel(user)} />
            <InfoCard icon={CalendarDays} label="Membro desde" value={formatDate(createdAt)} />
            <InfoCard icon={Clock3} label="Última atualização" value={formatDate(updatedAt)} />
          </div>
        </div>
      </section>
    </div>
  );
}