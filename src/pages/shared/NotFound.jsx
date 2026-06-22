import { Link } from 'react-router-dom';
import Brand from '../../components/layout/Brand.jsx';
import Button from '../../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-10">
      <div className="max-w-lg text-center">
        <div className="flex justify-center">
          <Brand />
        </div>
        <p className="mt-10 text-sm font-bold uppercase tracking-[0.2em] text-orange-500">404</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Página não encontrada</h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">A rota acessada não existe ou ainda não foi criada.</p>
        <Link to="/">
          <Button className="mt-6">Voltar ao painel</Button>
        </Link>
      </div>
    </main>
  );
}
