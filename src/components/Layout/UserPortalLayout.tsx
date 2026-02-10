import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import LogoutIcon from '@mui/icons-material/Logout';

export const UserPortalLayout = () => {
    const { logout, userParams } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Toolbar>
                    <Box 
                        component="img" 
                        src={logo} 
                        sx={{ height: 40, mr: 2, cursor: 'pointer' }} 
                        onClick={() => navigate('/portal')}
                    />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 'bold' }}>
                        Zalexy
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                            Welcome, {userParams?.first_name || 'Member'}
                        </Typography>
                        <Button 
                            color="inherit" 
                            onClick={handleLogout}
                            startIcon={<LogoutIcon />}
                            sx={{ color: 'text.primary', textTransform: 'none' }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>
            
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
                <Outlet />
            </Container>

            <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: '#fff', borderTop: '1px solid', borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Typography variant="body2" color="text.secondary" align="center">
                        © {new Date().getFullYear()} Zalexy. All rights reserved.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};
