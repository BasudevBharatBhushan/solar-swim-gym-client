import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings/Settings';
import { AgeProfiles } from './pages/Settings/AgeProfiles';
import { SubscriptionTerms } from './pages/Settings/SubscriptionTerms';
import { Services } from './pages/Services/Services';
import { MainLayout } from './components/Layout/MainLayout';
import { Typography } from '@mui/material';

import { LayoutProvider } from './context/LayoutContext';

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
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<MainLayout><Navigate to="/settings" replace /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
            <Route path="/settings/age-profiles" element={<MainLayout><AgeProfiles /></MainLayout>} />
            <Route path="/settings/subscription-terms" element={<MainLayout><SubscriptionTerms /></MainLayout>} />
            
            <Route path="/leads" element={<MainLayout><Placeholder title="Leads" /></MainLayout>} />
            <Route path="/accounts" element={<MainLayout><Placeholder title="Accounts" /></MainLayout>} />
            <Route path="/profiles" element={<MainLayout><Placeholder title="Profiles" /></MainLayout>} />
            <Route path="/staff" element={<MainLayout><Placeholder title="Staff Management" /></MainLayout>} />
            <Route path="/subscription" element={<MainLayout><Placeholder title="Subscription" /></MainLayout>} />
            <Route path="/services" element={<MainLayout><Services /></MainLayout>} />
            <Route path="/memberships" element={<MainLayout><Placeholder title="Memberships" /></MainLayout>} />
            <Route path="/discounts" element={<MainLayout><Placeholder title="Discount Codes" /></MainLayout>} />
            <Route path="/email-settings" element={<MainLayout><Placeholder title="Email Settings" /></MainLayout>} />

             {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
        </LayoutProvider>
        </ConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
