import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import AdminCompanies from '../pages/admin/AdminCompanies.jsx';
import AdminOrders from '../pages/admin/AdminOrders.jsx';
import AdminOverview from '../pages/admin/AdminOverview.jsx';
import AdminUsers from '../pages/admin/AdminUsers.jsx';
import Login from '../pages/auth/Login.jsx';
import CompanyOrders from '../pages/company/CompanyOrders.jsx';
import CompanyOverview from '../pages/company/CompanyOverview.jsx';
import CompanyProducts from '../pages/company/CompanyProducts.jsx';
import CompanyReviews from '../pages/company/CompanyReviews.jsx';
import CompanySettings from '../pages/company/CompanySettings.jsx';
import MercadoPagoSettings from '../pages/company/MercadoPagoSettings.jsx';
import CourierAvailability from '../pages/courier/CourierAvailability.jsx';
import CourierAvailableDeliveries from '../pages/courier/CourierAvailableDeliveries.jsx';
import CourierMyDeliveries from '../pages/courier/CourierMyDeliveries.jsx';
import CustomerAddresses from '../pages/customer/CustomerAddresses.jsx';
import CustomerExplore from '../pages/customer/CustomerExplore.jsx';
import CustomerOrders from '../pages/customer/CustomerOrders.jsx';
import CustomerOrderTracking from '../pages/customer/CustomerOrderTracking.jsx';
import CustomerPixCheckout from '../pages/customer/CustomerPixCheckout.jsx';
import CustomerRestaurant from '../pages/customer/CustomerRestaurant.jsx';
import NotFound from '../pages/shared/NotFound.jsx';
import Profile from '../pages/shared/Profile.jsx';
import Unauthorized from '../pages/shared/Unauthorized.jsx';
import { AuthGuard, OnboardingGuard, PublicOnlyRoute, RoleGuard } from './Guards.jsx';
import RoleHomeRedirect from './RoleHomeRedirect.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Login initialMode="register" />
          </PublicOnlyRoute>
        }
      />

      <Route element={<AuthGuard />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<RoleHomeRedirect />} />
          <Route path="dashboard" element={<RoleHomeRedirect />} />
          <Route path="profile" element={<Profile />} />
          <Route path="unauthorized" element={<Unauthorized />} />

          <Route element={<RoleGuard roles={['ADMIN']} />}>
            <Route path="admin/overview" element={<AdminOverview />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/companies" element={<AdminCompanies />} />
            <Route path="admin/orders" element={<AdminOrders />} />
          </Route>

          <Route element={<RoleGuard roles={['COMPANY']} />}>
            <Route element={<OnboardingGuard />}>
              <Route path="company/overview" element={<CompanyOverview />} />
              <Route path="company/products" element={<CompanyProducts />} />
              <Route path="company/orders" element={<CompanyOrders />} />
              <Route path="company/reviews" element={<CompanyReviews />} />
              <Route path="company/mercado-pago" element={<MercadoPagoSettings />} />
              <Route path="empresa/mercado-pago" element={<MercadoPagoSettings />} />
              <Route path="company/settings" element={<CompanySettings />} />
            </Route>
          </Route>

          <Route element={<RoleGuard roles={['CUSTOMER']} />}>
            <Route element={<OnboardingGuard />}>
              <Route path="customer/explore" element={<CustomerExplore />} />
              <Route path="customer/explore/:companyId" element={<CustomerRestaurant />} />
              <Route path="checkout/pix/:orderId" element={<CustomerPixCheckout />} />
              <Route path="customer/orders" element={<CustomerOrders />} />
              <Route path="customer/orders/:orderId/tracking" element={<CustomerOrderTracking />} />
              <Route path="customer/addresses" element={<CustomerAddresses />} />
            </Route>
          </Route>

          <Route element={<RoleGuard roles={['COURIER']} />}>
            <Route element={<OnboardingGuard />}>
              <Route path="courier/availability" element={<CourierAvailability />} />
              <Route path="courier/available-deliveries" element={<CourierAvailableDeliveries />} />
              <Route path="courier/my-deliveries" element={<CourierMyDeliveries />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
