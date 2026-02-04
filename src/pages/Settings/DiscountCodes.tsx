import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Chip,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Stack,
  Tabs,
  Tab,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import { Add, FilterList, Download, Edit, Delete, LocalOffer, MonetizationOn } from '@mui/icons-material';
import { PageHeader } from '../../components/Common/PageHeader';
import { discountService, Discount } from '../../services/discountService';
import { useAuth } from '../../context/AuthContext';

export const DiscountCodes = () => {
    const { currentLocationId: locationId } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    
    // Form State
    const [discountName, setDiscountName] = useState('FLASH20');
    const [discountType, setDiscountType] = useState<'Percentage' | 'Flat'>('Percentage');
    const [discountValue, setDiscountValue] = useState('15');
    const [usageLimit, setUsageLimit] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success'|'error', text: string } | null>(null);

    useEffect(() => {
        if (locationId) {
            loadDiscounts();
        }
    }, [locationId]);

    const loadDiscounts = async () => {
        if (!locationId) return;
        try {
            const data = await discountService.getAllDiscounts(locationId!);
            setDiscounts(data);
        } catch (error) {
            console.error("Failed to load discounts", error);
        }
    };

    const handleCreateDiscount = async () => {
        if (!locationId) {
            setMessage({ type: 'error', text: 'No location selected' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const finalValue = discountType === 'Percentage' ? `${discountValue}%` : discountValue;
            
            await discountService.createDiscount(locationId!, {
                discount_code: discountName,
                discount: finalValue,
                is_active: isActive,
            });
            setMessage({ type: 'success', text: 'Discount code created successfully' });
            loadDiscounts(); // Refresh list
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to create discount' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
            <PageHeader 
                title="Discount Code Management"
                description="Create, monitor, and manage promotional offers for swim programs."
                breadcrumbs={[
                    { label: 'Settings', href: '/settings' },
                    { label: 'Discount Codes', active: true }
                ]}
                action={
                    <Button 
                        variant="contained" 
                        startIcon={<Add />}
                        sx={{ 
                            textTransform: 'none', 
                            fontWeight: 700, 
                            bgcolor: '#42A5F5',
                            boxShadow: '0 4px 10px rgba(66, 165, 245, 0.3)',
                            borderRadius: 1.5,
                            px: 3,
                            py: 1
                        }}
                    >
                        Add New Discount
                    </Button>
                }
            />

            {message && (
                <Snackbar open={true} autoHideDuration={6000} onClose={() => setMessage(null)}>
                    <Alert severity={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
                </Snackbar>
            )}

            <Grid container spacing={3}>
                {/* Left Column: List */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E0E0E0', minHeight: 600 }}>
                        {/* Toolbar */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Tabs 
                                value={tabValue} 
                                onChange={(_, v) => setTabValue(v)}
                                sx={{ 
                                    minHeight: 0,
                                    '& .MuiTab-root': { 
                                        textTransform: 'none', 
                                        fontWeight: 600, 
                                        minHeight: 0, 
                                        minWidth: 80,
                                        px: 2,
                                        py: 1,
                                        borderRadius: 1,
                                        mr: 1
                                    },
                                    '& .Mui-selected': {
                                        bgcolor: '#E3F2FD',
                                        color: '#1976D2'
                                    },
                                    '& .MuiTabs-indicator': {
                                        display: 'none'
                                    }
                                }}
                            >
                                <Tab label="All Codes" />
                                <Tab label="Active" />
                                <Tab label="Archived" />
                            </Tabs>

                            <Stack direction="row" spacing={1}>
                                <Button variant="outlined" startIcon={<FilterList />} size="small" sx={{ textTransform: 'none', color: '#546E7A', borderColor: '#CFD8DC' }}>Filter</Button>
                                <Button variant="outlined" startIcon={<Download />} size="small" sx={{ textTransform: 'none', color: '#546E7A', borderColor: '#CFD8DC' }}>Export</Button>
                            </Stack>
                        </Box>

                        <TableContainer>
                            <Table size="medium">
                                <TableHead component="div" sx={{ display: 'table-header-group' }}>
                                    <TableRow component="div" sx={{ display: 'table-row' }}>
                                        <TableCell component="div" sx={{ color: '#90A4AE', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>CODE</TableCell>
                                        <TableCell component="div" sx={{ color: '#90A4AE', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>TYPE</TableCell>
                                        <TableCell component="div" sx={{ color: '#90A4AE', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>VALUE</TableCell>
                                        <TableCell component="div" sx={{ color: '#90A4AE', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>STATUS</TableCell>
                                        <TableCell component="div" sx={{ color: '#90A4AE', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>CREATED</TableCell>
                                        <TableCell component="div" align="right" sx={{ color: '#90A4AE', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody component="div" sx={{ display: 'table-row-group' }}>
                                    {discounts.map((discount) => {
                                        const isPercentage = discount.discount.includes('%');
                                        const displayType = isPercentage ? 'Percentage' : 'Flat Amount';
                                        const displayValue = discount.discount;
                                        
                                        return (
                                        <TableRow key={discount.discount_id} component="div" sx={{ display: 'table-row', borderTop: '1px solid #F5F5F5' }}>
                                            <TableCell component="div">
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, bgcolor: '#F5F5F5', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                                    {discount.discount_code}
                                                </Typography>
                                            </TableCell>
                                            <TableCell component="div">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {isPercentage ? 
                                                        <LocalOffer sx={{ fontSize: 16, color: '#2196F3' }} /> : 
                                                        <MonetizationOn sx={{ fontSize: 16, color: '#2196F3' }} />
                                                    }
                                                    <Typography variant="body2" sx={{ color: '#455A64' }}>{displayType}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell component="div">
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{displayValue}</Typography>
                                            </TableCell>
                                            <TableCell component="div">
                                                <Chip 
                                                    label={discount.is_active ? '● ACTIVE' : '● INACTIVE'} 
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: discount.is_active ? '#E8F5E9' : '#ECEFF1', 
                                                        color: discount.is_active ? '#2E7D32' : '#78909C',
                                                        fontWeight: 800,
                                                        fontSize: '0.65rem',
                                                        borderRadius: 4
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell component="div">
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#263238' }}>
                                                        {discount.created_at ? new Date(discount.created_at).toLocaleDateString() : 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#90A4AE', fontSize: '0.65rem' }}>{discount.staff_name || 'Admin'}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell component="div" align="right">
                                                <IconButton size="small" sx={{ color: '#90A4AE' }}><Edit fontSize="small" /></IconButton>
                                                <IconButton size="small" sx={{ color: '#90A4AE' }}><Delete fontSize="small" /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, px: 1 }}>
                            <Typography variant="caption" color="text.secondary">Showing {discounts.length} codes</Typography>
                            <Box>
                                <Button variant="outlined" disabled sx={{ minWidth: 40, px: 0, mr: 1, borderColor: '#EEEEEE' }}>&lt;</Button>
                                <Button variant="outlined" sx={{ minWidth: 40, px: 0, borderColor: '#EEEEEE', color: '#546E7A' }}>&gt;</Button>
                            </Box>
                        </Box>

                    </Paper>
                </Grid>

                {/* Right Column: Define New Discount */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #E0E0E0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <Box sx={{ bgcolor: '#42A5F5', borderRadius: '50%', color: 'white', p: 0.5, display: 'flex' }}><Add sx={{ fontSize: 20 }} /></Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">Define New Discount</Typography>
                                <Typography variant="caption" color="text.secondary">Configure rule parameters for the promo code.</Typography>
                            </Box>
                        </Box>
                        
                        <Divider sx={{ mb: 3 }} />

                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#546E7A', mb: 1, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem' }}>DISCOUNT CODE NAME</Typography>
                                <TextField 
                                    fullWidth 
                                    placeholder="E.G. FLASH20" 
                                    value={discountName}
                                    onChange={(e) => setDiscountName(e.target.value)}
                                    size="medium"
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#FFFFFF' } 
                                    }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#546E7A', mb: 1, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem' }}>DISCOUNT TYPE</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Paper 
                                            variant="outlined" 
                                            sx={{ 
                                                p: 2, 
                                                cursor: 'pointer',
                                                borderRadius: 1.5,
                                                bgcolor: discountType === 'Percentage' ? '#E3F2FD' : 'white',
                                                borderColor: discountType === 'Percentage' ? '#2196F3' : '#E0E0E0',
                                                borderWidth: discountType === 'Percentage' ? 2 : 1
                                            }}
                                            onClick={() => setDiscountType('Percentage')}
                                        >
                                           <LocalOffer sx={{ color: discountType === 'Percentage' ? '#2196F3' : '#90A4AE', mb: 1 }} />
                                           <Typography variant="subtitle2" sx={{ fontWeight: 700, color: discountType === 'Percentage' ? '#1976D2' : '#455A64' }}>Percentage</Typography>
                                           <Typography variant="caption" sx={{ color: '#78909C', fontSize: '0.65rem' }}>Deduct from total</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Paper 
                                            variant="outlined" 
                                            sx={{ 
                                                p: 2, 
                                                cursor: 'pointer',
                                                borderRadius: 1.5,
                                                bgcolor: discountType === 'Flat' ? '#E3F2FD' : 'white',
                                                borderColor: discountType === 'Flat' ? '#2196F3' : '#E0E0E0',
                                                borderWidth: discountType === 'Flat' ? 2 : 1
                                            }}
                                            onClick={() => setDiscountType('Flat')}
                                        >
                                           <MonetizationOn sx={{ color: discountType === 'Flat' ? '#2196F3' : '#90A4AE', mb: 1 }} />
                                           <Typography variant="subtitle2" sx={{ fontWeight: 700, color: discountType === 'Flat' ? '#1976D2' : '#455A64' }}>Flat Amount</Typography>
                                           <Typography variant="caption" sx={{ color: '#78909C', fontSize: '0.65rem' }}>Fixed dollar value</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#546E7A', mb: 1, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem' }}>DISCOUNT VALUE</Typography>
                                <TextField 
                                    fullWidth 
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start" sx={{ fontWeight: 800, color: '#546E7A' }}>{discountType === 'Percentage' ? '%' : '$'}</InputAdornment>
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#546E7A', mb: 1, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem' }}>USAGE LIMIT (OPTIONAL)</Typography>
                                <TextField 
                                    fullWidth 
                                    placeholder="e.g. 100"
                                    value={usageLimit}
                                    onChange={(e) => setUsageLimit(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>

                            <Box>
                                <FormControlLabel 
                                    control={
                                        <Switch 
                                            checked={isActive} 
                                            onChange={(e) => setIsActive(e.target.checked)}
                                            color="success"
                                        />
                                    } 
                                    label={<Typography variant="body2" fontWeight="bold">Active Immediately</Typography>} 
                                />
                            </Box>
                        </Stack>

                        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                            <Button fullWidth variant="outlined" sx={{ color: '#546E7A', borderColor: '#CFD8DC', borderRadius: 1.5, textTransform: 'none', fontWeight: 600, py: 1 }}>Cancel</Button>
                            <Button 
                                fullWidth 
                                variant="contained" 
                                onClick={handleCreateDiscount}
                                disabled={loading}
                                sx={{ bgcolor: '#42A5F5',  borderRadius: 1.5, textTransform: 'none', fontWeight: 700, py: 1, boxShadow: 'none' }}
                            >
                                {loading ? 'Saving...' : 'Save Discount'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
