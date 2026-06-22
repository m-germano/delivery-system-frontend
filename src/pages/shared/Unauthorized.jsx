import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="app-card max-w-lg p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-500">Acesso negado</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Você não tem permissão para esta área.</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          A aplicação protege rotas por role. Use o menu lateral para acessar apenas as telas disponíveis para o seu perfil.
        </p>
        <Button className="mt-6" onClick={() => navigate('/')}>
          Voltar ao painel
        </Button>
      </div>
    </div>
  );
}
