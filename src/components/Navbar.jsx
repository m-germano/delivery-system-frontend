import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">Delivery System</Link>
      <nav>
        <Link to="/products">Produtos</Link>
        <Link to="/orders">Pedidos</Link>
        <Link to="/login">Login</Link>
      </nav>
    </header>
  );
}
