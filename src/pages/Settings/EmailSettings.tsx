import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogContent
} from '@mui/material';
import { Visibility, VisibilityOff, Email } from '@mui/icons-material';
import { PageHeader } from '../../components/Common/PageHeader';
import { emailConfigService, EmailConfig } from '../../services/emailConfigService';
import { useAuth } from '../../context/AuthContext';
import { TemplateList } from '../../components/Email/TemplateList';
import { EmailComposer } from '../../components/Email/EmailComposer';

export const EmailSettings = () => {
    const { currentLocationId: locationId } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [openTestEmail, setOpenTestEmail] = useState(false);
    
    const INITIAL_CONFIG: Partial<EmailConfig> = {
        smtp_host: '',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '', // Usually empty on load for security, or masked
        is_secure: false,
        sender_email: '',
        is_active: false
    };

    // Test Email State
    const [testEmail, setTestEmail] = useState({
        to: '',
        cc: '',
        bcc: '',
        subject: 'Test Email from Glass Court Swim and Fitness',
        body: 'This is a test email to verify your SMTP configuration.'
    });

    // Config State
    const [config, setConfig] = useState<Partial<EmailConfig>>(INITIAL_CONFIG);

    useEffect(() => {
        if (locationId) {
            fetchConfig();
        } else {
            setConfig(INITIAL_CONFIG);
        }
    }, [locationId]);

    const fetchConfig = async () => {
        if (!locationId) return;
        setLoading(true);
        try {
            const data = await emailConfigService.getEmailConfig(locationId!);
            if (data) {
                setConfig({
                    ...data,
                    // keep password field empty or masked if not provided
                    smtp_password: data.smtp_password || '' 
                });
                // Initialize test recipient if not set
                setTestEmail(prev => ({
                    ...prev,
                    to: prev.to || data.sender_email || ''
                }));
            } else {
                setConfig(INITIAL_CONFIG);
            }
        } catch (err: any) {
            console.error("Failed to load email config", err);
            setConfig(INITIAL_CONFIG);
            // Don't show error immediately on load if it's just 404 (not configured yet)
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof EmailConfig, value: any) => {
        setConfig({ ...config, [field]: value });
    };

    const handleSave = async () => {
        if (!locationId) {
            setError("No location selected");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await emailConfigService.updateEmailConfig(locationId!, config);
            setSuccessMessage("Email configuration saved successfully.");
        } catch (err: any) {
            setError(err.message || "Failed to save configuration.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
            <PageHeader
                title="Email Settings"
                description="Configure your SMTP server and email automation preferences to ensure reliable student communications and reliable notification delivery."
                breadcrumbs={[
                    { label: 'Settings', href: '/admin/settings' },
                    { label: 'Email SMTP', active: true }
                ]}
            />
            
            <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)}>
                <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Left Column: SMTP Configuration */}
                <Grid size={{ xs: 12, md: 7, lg: 7 }}>
                    <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid #E0E0E0', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ 
                                    bgcolor: '#E3F2FD', 
                                    p: 1.5, 
                                    borderRadius: 1.5,
                                    display: 'flex'
                                }}>
                                    <Email sx={{ color: '#1976D2' }} />
                                </Box>
                                <Typography variant="h6" fontWeight="bold">SMTP Configuration</Typography>
                            </Box>
                        </Box>
                        
                        <Divider sx={{ mb: 4 }} />

                        <Box component="form" noValidate autoComplete="off">
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block' }}>SMTP SERVER</Typography>
                                    <TextField 
                                        fullWidth 
                                        variant="outlined" 
                                        value={config.smtp_host || ''}
                                        onChange={(e) => handleChange('smtp_host', e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block' }}>PORT</Typography>
                                    <TextField 
                                        fullWidth 
                                        variant="outlined" 
                                        value={config.smtp_port || ''}
                                        onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block' }}>USERNAME / API KEY</Typography>
                                    <TextField 
                                        fullWidth 
                                        variant="outlined" 
                                        value={config.smtp_username || ''}
                                        onChange={(e) => handleChange('smtp_username', e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block' }}>PASSWORD / SECRET</Typography>
                                    <TextField 
                                        fullWidth 
                                        type={showPassword ? 'text' : 'password'}
                                        variant="outlined" 
                                        value={config.smtp_password || ''}
                                        onChange={(e) => handleChange('smtp_password', e.target.value)}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block' }}>ENCRYPTION TYPE</Typography>
                                    <FormControl fullWidth>
                                        <Select
                                            value={config.is_secure ? "SSL" : "NONE"}
                                            onChange={(e) => handleChange('is_secure', e.target.value === "SSL")}
                                            sx={{ borderRadius: 1.5 }}
                                        >
                                            <MenuItem value="STARTTLS">STARTTLS</MenuItem>
                                            <MenuItem value="SSL">SSL / Secure</MenuItem>
                                            <MenuItem value="TLS">TLS</MenuItem>
                                            <MenuItem value="NONE">None</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, display: 'block' }}>SENDER EMAIL</Typography>
                                    <TextField 
                                        fullWidth 
                                        variant="outlined" 
                                        value={config.sender_email || ''}
                                        onChange={(e) => handleChange('sender_email', e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 5, pt: 3, borderTop: '1px dashed #E0E0E0' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#546E7A', mb: 2, textTransform: 'uppercase' }}>
                                    Test Send Configuration
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>RECIPIENT (TO)</Typography>
                                        <TextField 
                                            fullWidth 
                                            size="small"
                                            value={testEmail.to}
                                            onChange={(e) => setTestEmail({ ...testEmail, to: e.target.value })}
                                            placeholder="test@example.com"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>CC</Typography>
                                        <TextField 
                                            fullWidth 
                                            size="small"
                                            value={testEmail.cc}
                                            onChange={(e) => setTestEmail({ ...testEmail, cc: e.target.value })}
                                            placeholder="cc@example.com"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>BCC</Typography>
                                        <TextField 
                                            fullWidth 
                                            size="small"
                                            value={testEmail.bcc}
                                            onChange={(e) => setTestEmail({ ...testEmail, bcc: e.target.value })}
                                            placeholder="bcc@example.com"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>SUBJECT</Typography>
                                        <TextField 
                                            fullWidth 
                                            size="small"
                                            value={testEmail.subject}
                                            onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>BODY</Typography>
                                        <TextField 
                                            fullWidth 
                                            size="small"
                                            multiline
                                            rows={3}
                                            value={testEmail.body}
                                            onChange={(e) => setTestEmail({ ...testEmail, body: e.target.value })}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="contained" 
                                    size="large"
                                    onClick={handleSave}
                                    disabled={loading}
                                    sx={{ 
                                        bgcolor: '#2196F3', 
                                        textTransform: 'none', 
                                        fontWeight: 700,
                                        px: 4,
                                        borderRadius: 1.5,
                                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                                    }}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    size="large"
                                    sx={{ 
                                        color: '#424242', 
                                        borderColor: '#E0E0E0', 
                                        textTransform: 'none', 
                                        fontWeight: 600,
                                        px: 4,
                                        borderRadius: 1.5,
                                        '&:hover': {
                                            borderColor: '#BDBDBD',
                                            bgcolor: 'rgba(0,0,0,0.02)'
                                        }
                                    }}
                                    onClick={() => setOpenTestEmail(true)}
                                >
                                    Send Test Email
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column: Email Templates & Newsletter */}
                <Grid size={{ xs: 12, md: 5, lg: 5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
                        
                        {/* Templates Card */}
                        <TemplateList />

                        {/* Newsletter Card */}
                        <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid #E0E0E0' }}>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#546E7A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Newsletter Subscription
                                </Typography>
                                <Typography variant="caption" sx={{ color: config.is_active ? '#2E7D32' : '#FF5252', fontWeight: 700 }}>
                                    {config.is_active ? "Enabled" : "Disabled"}
                                </Typography>
                           </Box> 
                           <Box sx={{ mt: 2, height: 8, bgcolor: '#F5F5F5', borderRadius: 4, overflow: 'hidden' }}>
                                <Box sx={{ width: config.is_active ? '100%' : '30%', height: '100%', bgcolor: config.is_active ? '#66BB6A' : '#ECEFF1' }} />
                           </Box>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>

            {/* Notification Preferences Footer */}
            <Paper sx={{ mt: 3, p: 4, borderRadius: 2, mb: 4, border: '1px solid #E0E0E0' }}>
                <Typography variant="h6" fontWeight="bold">Notification Preferences</Typography>
            </Paper>
            
            <Dialog open={openTestEmail} onClose={() => setOpenTestEmail(false)} maxWidth="md" fullWidth>
                <DialogContent>
                    <EmailComposer 
                        onClose={() => setOpenTestEmail(false)} 
                        initialTo={testEmail.to}
                        initialCc={testEmail.cc}
                        initialBcc={testEmail.bcc}
                        initialSubject={testEmail.subject}
                        initialBody={testEmail.body}
                    />
                </DialogContent>
            </Dialog>

        </Box>
    );
};

