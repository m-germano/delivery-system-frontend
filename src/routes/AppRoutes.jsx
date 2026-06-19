import { Route, Routes } from 'react-router-dom';
import { Home } from '../pages/Home.jsx';
import { Login } from '../pages/Login.jsx';
import { Products } from '../pages/Products.jsx';
import { Orders } from '../pages/Orders.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/products" element={<Products />} />
      <Route path="/orders" element={<Orders />} />
    </Routes>
  );
}
