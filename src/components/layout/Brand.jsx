import { Link } from 'react-router-dom';
import logo from '../../assets/dishdash-light.png';
import { cn } from '../../utils/classNames.js';

export default function Brand({ collapsed = false }) {
  return (
    <Link
      to="/dashboard"
      className={cn(
        'flex min-w-0 items-center transition-all duration-200',
        collapsed ? 'w-full justify-center' : 'w-full justify-start',
      )}
      aria-label="DishDash"
    >
      {collapsed ? (
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-coral-50">
          <img src={logo} alt="" className="h-6 w-6 object-contain" />
        </div>
      ) : (
        <div className="flex w-full items-center">
          <img src={logo} alt="DishDash" className="h-7 w-auto max-w-[140px] object-contain" />
        </div>
      )}
    </Link>
  );
}
