import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { Login } from './pages/Login';

import { AgeProfiles } from './pages/Settings/AgeProfiles';
import { SubscriptionTerms } from './pages/Settings/SubscriptionTerms';
import { Services } from './pages/Services/Services';
import { BasePlan } from './pages/Settings/BasePlan';
import { Memberships } from './pages/Settings/Memberships';
import { DiscountCodes } from './pages/Settings/DiscountCodes';
import { EmailSettings } from './pages/Settings/EmailSettings';
import { WaiverPrograms } from './pages/Settings/WaiverPrograms';
import { WaiverTemplates } from './pages/Settings/WaiverTemplates';
import { MainLayout } from './components/Layout/MainLayout';
import { Leads } from './pages/Leads/Leads';
import { Accounts } from './pages/Accounts/Accounts';
import { AccountDetail } from './pages/Accounts/AccountDetail';
import { Marketplace } from './pages/Marketplace/Marketplace';
import { Typography } from '@mui/material';
import { ActivateAccount } from './pages/ActivateAccount';
import { UserLogin } from './pages/UserLogin';
import { UserPortalLayout } from './components/Layout/UserPortalLayout';
import { MyAccount } from './pages/Portal/MyAccount';



import { LayoutProvider } from './context/LayoutContext';

import { StaffManagement } from './pages/Settings/StaffManagement';
import { AdminActivation } from './pages/AdminActivation';

// Placeholder Component
const Placeholder = ({ title }: { title: string }) => (
  <Typography variant="h4">{title} (Coming Soon)</Typography>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <ConfigProvider>
          <LayoutProvider>
            <Router>
            <Routes>
            <Route path="/admin/login" element={<Login />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/activate" element={<ActivateAccount />} />
            <Route path="/admin/activate" element={<AdminActivation />} />

            {/* User Portal Routes */}
            <Route path="/portal" element={<UserPortalLayout />}>
              <Route index element={<MyAccount />} />
              <Route path="my-account" element={<MyAccount />} />
              <Route path="marketplace" element={<Marketplace />} />
            </Route>


            
            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/admin/leads" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/leads" replace />} />
            
            <Route path="/admin/settings" element={<Navigate to="/admin/leads" replace />} />
            <Route path="/admin/settings/age-profiles" element={<MainLayout><AgeProfiles /></MainLayout>} />
            <Route path="/admin/settings/subscription-terms" element={<MainLayout><SubscriptionTerms /></MainLayout>} />
            <Route path="/admin/settings/base-plan" element={<MainLayout><BasePlan /></MainLayout>} />
            
            <Route path="/admin/leads" element={<MainLayout><Leads /></MainLayout>} />
            <Route path="/admin/accounts" element={<MainLayout><Accounts /></MainLayout>} />
            <Route path="/admin/accounts/:accountId" element={<MainLayout><AccountDetail /></MainLayout>} />
            <Route path="/admin/accounts/:accountId/marketplace" element={<MainLayout><Marketplace /></MainLayout>} />
            <Route path="/admin/profiles" element={<MainLayout><Placeholder title="Profiles" /></MainLayout>} />
            <Route path="/admin/staff" element={<MainLayout><StaffManagement /></MainLayout>} />
            <Route path="/admin/subscription" element={<MainLayout><Placeholder title="Subscription" /></MainLayout>} />
            <Route path="/admin/services" element={<MainLayout><Services /></MainLayout>} />
            <Route path="/admin/memberships"  element={<MainLayout><Memberships /></MainLayout>} />
            <Route path="/admin/discounts" element={<MainLayout><DiscountCodes /></MainLayout>} />
            <Route path="/admin/email-settings" element={<MainLayout><EmailSettings /></MainLayout>} />
            <Route path="/admin/settings/waiver-programs" element={<MainLayout><WaiverPrograms /></MainLayout>} />
            <Route path="/admin/settings/waiver-templates" element={<MainLayout><WaiverTemplates /></MainLayout>} />

             {/* Catch all */}
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </Router>
      </LayoutProvider>
    </ConfigProvider>
  </AuthProvider>
</ThemeProvider>
  );
}

export default App;
