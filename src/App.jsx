import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes.jsx';
import { Navbar } from './components/Navbar.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="container">
        <AppRoutes />
      </main>
    </BrowserRouter>
  );
}
