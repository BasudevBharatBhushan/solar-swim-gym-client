import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { Login } from './pages/Login';

import { AgeProfiles } from './pages/Settings/AgeProfiles';
import { SubscriptionTerms } from './pages/Settings/SubscriptionTerms';
import { Sessions } from './pages/Settings/Sessions';
import { Services } from './pages/Services/Services';
import { BasePlan } from './pages/Settings/BasePlan';
import { Memberships } from './pages/Settings/Memberships';
import { DiscountCodes } from './pages/Settings/DiscountCodes';
import { EmailSettings } from './pages/Settings/EmailSettings';
import { WaiverPrograms } from './pages/Settings/WaiverPrograms';
import { WaiverTemplates } from './pages/Settings/WaiverTemplates';
import { DropdownValues } from './pages/Settings/DropdownValues';
import { MainLayout } from './components/Layout/MainLayout';
import { Leads } from './pages/Leads/Leads';
import { Accounts } from './pages/Accounts/Accounts';
import { AccountDetail } from './pages/Accounts/AccountDetail';
import { Marketplace } from './pages/Marketplace/Marketplace';
import { ActivateAccount } from './pages/ActivateAccount';
import { UserLogin } from './pages/UserLogin';
import { UserPortalLayout } from './components/Layout/UserPortalLayout';
import { MyAccount } from './pages/Portal/MyAccount';
import { LayoutProvider } from './context/LayoutContext';
import { StaffManagement } from './pages/Settings/StaffManagement';
import { AdminActivation } from './pages/AdminActivation';
import { Profiles } from './pages/Profiles/Profiles';



import { ComingSoon } from './components/Common/ComingSoon';
import { CreditCard, Subscriptions } from '@mui/icons-material';
import { getLocationConfig } from './utils/locationConfig';

const LoginRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  const locations = getLocationConfig();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={role === 'MEMBER' ? '/portal' : '/admin/leads'} replace />;
  }

  if (locations.length > 0) {
    return <Navigate to={`/${locations[0].slug}/login${location.search}`} replace />;
  }
  return <UserLogin />;
};

const AppRoutes = () => {
  const { isAuthenticated, role } = useAuth();
  const homeRedirect = isAuthenticated
    ? (role === 'MEMBER' ? '/portal' : '/admin/leads')
    : '/login';
  const adminRedirect = isAuthenticated ? '/admin/leads' : '/admin/login';
  const locations = getLocationConfig();

  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      
      {/* Dynamic Location Login Routes */}
      {locations.map((loc) => (
        <Route 
          key={loc.slug} 
          path={`/${loc.slug}/login`} 
          element={<UserLogin companyName={loc.name} locationId={loc.id} />} 
        />
      ))}

      {/* Redirect generic login to first location if configured, otherwise fallback */}
      <Route path="/login" element={<LoginRedirect />} />

      <Route path="/activate" element={<ActivateAccount />} />
      <Route path="/admin/activate" element={<AdminActivation />} />

      {/* User Portal Routes */}
      <Route path="/portal" element={isAuthenticated ? <UserPortalLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<MyAccount />} />
        <Route path="my-account" element={<MyAccount />} />
        <Route path="marketplace" element={<Marketplace />} />
      </Route>

      {/* Protected Routes */}
      <Route path="/" element={<Navigate to={homeRedirect} replace />} />
      <Route path="/admin" element={<Navigate to={adminRedirect} replace />} />

      <Route path="/admin/settings" element={<Navigate to="/admin/leads" replace />} />
      <Route path="/admin/settings/age-profiles" element={<MainLayout><AgeProfiles /></MainLayout>} />
      <Route path="/admin/settings/subscription-terms" element={<MainLayout><SubscriptionTerms /></MainLayout>} />
      <Route path="/admin/settings/sessions" element={<MainLayout><Sessions /></MainLayout>} />
      <Route path="/admin/settings/base-plan" element={<MainLayout><BasePlan /></MainLayout>} />

      <Route path="/admin/leads" element={<MainLayout><Leads /></MainLayout>} />
      <Route path="/admin/accounts" element={<MainLayout><Accounts /></MainLayout>} />
      <Route path="/admin/accounts/:accountId" element={<MainLayout><AccountDetail /></MainLayout>} />
      <Route path="/admin/accounts/:accountId/marketplace" element={<MainLayout><Marketplace /></MainLayout>} />
      <Route path="/admin/profiles" element={<MainLayout><Profiles /></MainLayout>} />
      <Route path="/admin/staff" element={<MainLayout><StaffManagement /></MainLayout>} />
      <Route path="/admin/subscription" element={<MainLayout><ComingSoon title="Subscription" icon={<Subscriptions sx={{ fontSize: 60, color: '#3b82f6' }} />} breadcrumbs={[{ label: 'System', href: '/admin' }, { label: 'Subscription', active: true }]} /></MainLayout>} />
      <Route path="/admin/billing" element={<MainLayout><ComingSoon title="Billing" icon={<CreditCard sx={{ fontSize: 60, color: '#3b82f6' }} />} breadcrumbs={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Billing', active: true }]} /></MainLayout>} />
      <Route path="/admin/services" element={<MainLayout><Services /></MainLayout>} />
      <Route path="/admin/memberships"  element={<MainLayout><Memberships /></MainLayout>} />
      <Route path="/admin/discounts" element={<MainLayout><DiscountCodes /></MainLayout>} />
      <Route path="/admin/email-settings" element={<MainLayout><EmailSettings /></MainLayout>} />
      <Route path="/admin/settings/waiver-programs" element={<MainLayout><WaiverPrograms /></MainLayout>} />
      <Route path="/admin/settings/waiver-templates" element={<MainLayout><WaiverTemplates /></MainLayout>} />
      <Route path="/admin/settings/dropdown-values" element={<MainLayout><DropdownValues /></MainLayout>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={homeRedirect} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <ConfigProvider>
          <LayoutProvider>
            <Router>
              <AppRoutes />
            </Router>
          </LayoutProvider>
        </ConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
