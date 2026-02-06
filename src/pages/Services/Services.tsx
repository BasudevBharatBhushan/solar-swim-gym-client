import { useEffect, useState, memo, useCallback } from 'react';
import { 
  Box, Button, Typography, Paper, TextField, MenuItem, Alert, Snackbar, Grid, InputAdornment, Chip, Switch, Dialog, DialogTitle, 
  DialogContent, DialogActions, IconButton, List, ListItemText,
  ListItemButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { serviceCatalog, ServicePack, ServicePrice } from '../../services/serviceCatalog';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { PageHeader } from '../../components/Common/PageHeader';
import { dropdownOptions } from '../../lib/dropdownOptions';

// Types
interface LocalService {
  service_id?: string;
  id?: string;
  name: string;
  description: string;
  type: string;
  service_type: string;
  is_active: boolean;
  is_addon_only?: boolean;
  image_url?: string;
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

const ServiceListItem = memo(({ 
  service, 
  isSelected, 
  onClick 
}: { 
  service: LocalService, 
  isSelected: boolean, 
  onClick: (s: LocalService) => void 
}) => (
    <Box 
        onClick={() => onClick(service)}
        sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: '#f1f5f9',
            cursor: 'pointer',
            bgcolor: isSelected ? '#eff6ff' : 'transparent',
            '&:hover': { bgcolor: isSelected ? '#eff6ff' : '#f8fafc' },
            transition: 'all 0.2s',
            position: 'relative'
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isSelected ? '#3b82f6' : '#1e293b', fontSize: '0.875rem' }}>
                {service.name}
            </Typography>
            <Chip 
                label={service.is_active ? "ACTIVE" : "INACTIVE"} 
                size="small" 
                sx={{ 
                    height: 18, 
                    fontSize: '0.65rem', 
                    fontWeight: 800,
                    bgcolor: service.is_active ? '#ecfdf5' : '#fef2f2', 
                    color: service.is_active ? '#10b981' : '#ef4444',
                    borderRadius: '4px',
                    '& .MuiChip-label': { px: 1 }
                }} 
            />
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', lineHeight: 1.4 }}>
            {service.description || 'No description'}
        </Typography>
    </Box>
));



const ServiceBasicInfo = memo(({
    name, type, serviceType, isActive, imageUrl, isCreating,
    onNameChange, onTypeChange, onServiceTypeChange, onActiveChange, onSave, onImageUpload
}: any) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onImageUpload(event.target.files[0]);
        }
    };

    return (
        <Paper elevation={0} sx={{ mb: 3, borderRadius: 1, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                    {isCreating ? 'New Service' : 'Service Details'}
                </Typography>
                <Box>
                    <Button variant="outlined" size="small" sx={{ mr: 1, color: '#64748b', borderColor: '#e2e8f0', textTransform: 'none', fontWeight: 600, px: 2 }}>
                        Discard
                    </Button>
                    <Button variant="contained" startIcon={<SaveIcon sx={{ fontSize: '1rem !important' }} />} onClick={onSave} size="small" sx={{ bgcolor: '#1e293b', textTransform: 'none', fontWeight: 700, px: 2 }}>
                        Save
                    </Button>
                </Box>
            </Box>
            <Grid container spacing={5} sx={{ p: 4 }}>
                {/* Image Section */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, mb: 1.5, display: 'block', letterSpacing: '0.02em' }}>
                        Service Image
                    </Typography>
                    <Box 
                        sx={{ 
                            position: 'relative', 
                            width: '100%', 
                            aspectRatio: '1.4',
                            bgcolor: '#f1f5f9', 
                            borderRadius: '12px', 
                            overflow: 'hidden',
                            '&:hover .overlay': { opacity: isCreating ? 0 : 1 },
                            cursor: isCreating ? 'not-allowed' : 'default'
                        }}
                    >
                        {imageUrl ? (
                            <Box component="img" src={imageUrl} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'text.disabled' }}>
                                <Box component="span" sx={{ fontSize: '2.5rem', opacity: 0.2 }}>📷</Box>
                                {isCreating && <Typography variant="caption" sx={{ mt: 1, fontWeight: 700, color: '#94a3b8' }}>Save to upload</Typography>}
                            </Box>
                        )}
                        
                        {!isCreating && (
                            <Box 
                                className="overlay"
                                component="label"
                                sx={{
                                    position: 'absolute',
                                    top: 0, left: 0, width: '100%', height: '100%',
                                    bgcolor: 'rgba(0,0,0,0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    cursor: 'pointer',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.875rem'
                                }}
                            >
                                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                                {imageUrl ? 'Change Image' : 'Upload Image'}
                            </Box>
                        )}
                    </Box>
                </Grid>

                {/* Form Fields */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, mb: 1, display: 'block', letterSpacing: '0.02em' }}>
                                Service Name
                            </Typography>
                            <TextField 
                                fullWidth 
                                value={name} 
                                onChange={(e) => onNameChange(e.target.value)} 
                                size="small" 
                                placeholder="Swim Clinic (Group)" 
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        bgcolor: '#f8fafc', 
                                        borderRadius: '8px',
                                        '& fieldset': { borderColor: '#f1f5f9' },
                                        '& input': { fontWeight: 500 }
                                    } 
                                }}
                            />
                        </Grid>
                        
                        <Grid size={{ xs: 6 }}>
                         <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, mb: 1, display: 'block', letterSpacing: '0.02em' }}>
                            Category
                        </Typography>
                        <TextField 
                            fullWidth 
                            select 
                            value={serviceType} 
                            onChange={(e) => onServiceTypeChange(e.target.value)} 
                            size="small"
                            sx={{ 
                                '& .MuiOutlinedInput-root': { 
                                    bgcolor: '#ffffff', 
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: '#e2e8f0' }
                                } 
                            }}
                        >
                            {dropdownOptions.serviceCategory.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, mb: 1, display: 'block', letterSpacing: '0.02em' }}>
                            Type
                        </Typography>
                         <TextField 
                            fullWidth 
                            select 
                            value={type} 
                            onChange={(e) => onTypeChange(e.target.value)} 
                            size="small"
                            sx={{ 
                                '& .MuiOutlinedInput-root': { 
                                    bgcolor: '#ffffff', 
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: '#e2e8f0' }
                                } 
                            }}
                        >
                            {dropdownOptions.serviceType.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc', p: 1.5, px: 2, borderRadius: 2, border: '1px solid #f1f5f9', mt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.875rem' }}>Published Status</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, mr: 1.5, color: isActive ? '#10b981' : '#94a3b8', letterSpacing: '0.05em' }}>
                                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                                </Typography>
                                <Switch 
                                    checked={isActive} 
                                    onChange={(e) => onActiveChange(e.target.checked)} 
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' }
                                    }}
                                />
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    </Paper>
);
});

const PricingPanel = memo(({ pack, ageGroups, onSave }: { pack: ServicePack, ageGroups: any[], onSave: (prices: Record<string, number>) => Promise<void> }) => {
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPrices = async () => {
            if (!pack.service_pack_id) return;
            setLoading(true);
            try {
                const res = await serviceCatalog.getPackPrices(pack.service_pack_id);
                const map: Record<string, string> = {};
                res.forEach((p: ServicePrice) => {
                    map[p.age_group_id] = p.price.toString();
                });
                setPrices(map);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchPrices();
    }, [pack]);

    const handleChange = (ageId: string, val: string) => {
        setPrices(prev => ({ ...prev, [ageId]: val }));
    };

    const handleSave = async () => {
        setLoading(true);
        const toSave: Record<string, number> = {};
        Object.entries(prices).forEach(([id, val]) => {
            const num = parseFloat(val);
            if (!isNaN(num)) toSave[id] = num;
        });
        await onSave(toSave);
        setLoading(false);
    };

    return (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                        PACK PRICES
                    </Typography>
                    <Chip 
                        label={pack.name.toUpperCase()} 
                        size="small" 
                        sx={{ 
                            bgcolor: '#dbeafe', 
                            color: '#2563eb', 
                            fontSize: '0.65rem', 
                            fontWeight: 700, 
                            borderRadius: '4px',
                            height: 20
                        }} 
                    />
                </Box>

                <Button variant="contained" size="small" startIcon={<SaveIcon sx={{ fontSize: '1rem !important' }} />} onClick={handleSave} disabled={loading} sx={{ bgcolor: '#1e293b', textTransform: 'none', px: 2, fontWeight: 700 }}>
                    Save
                </Button>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, px: 1 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>AGE GROUP</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>RATE ($)</Typography>
                </Box>
                
                {ageGroups.map(ag => {
                    const agId = ag.age_group_id || ag.id || Math.random().toString();
                    return (
                        <Box key={agId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, px: 1 }}>
                            <Box>
                                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{ag.name}</Typography>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {ag.min_age !== undefined && ag.max_age !== undefined ? `(${ag.min_age}-${ag.max_age} y)` : (ag.description || 'N/A')}
                                </Typography>
                            </Box>
                            <TextField 
                                value={prices[agId] || ''} 
                                onChange={(e) => handleChange(agId, e.target.value)}
                                size="small"
                                placeholder="N/A"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem', color: '#94a3b8' } }}>$</InputAdornment>
                                }}
                                sx={{ 
                                    maxWidth: 100, 
                                    '& .MuiOutlinedInput-root': { 
                                        bgcolor: '#f8fafc',
                                        borderRadius: '8px',
                                        '& fieldset': { borderColor: '#f1f5f9' },
                                        '& input': { textAlign: 'right', fontWeight: 700, py: 1 }
                                    }
                                }}
                            />
                        </Box>
                    );
                })}

                <Alert 
                    icon={<Box component="span" sx={{ fontSize: '1.2rem' }}>ℹ️</Box>}
                    sx={{ 
                        mt: 4, 
                        bgcolor: '#f8fafc', 
                        color: '#64748b', 
                        fontSize: '0.75rem',
                        '& .MuiAlert-message': { fontWeight: 500, lineHeight: 1.5, color: '#64748b' },
                        border: 'none'
                    }}
                >
                    Prices shown are specific to the selected pack. Leave empty to disable availability for that age group.
                </Alert>
            </Box>
        </Paper>
    );
});

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export const Services = () => {
    const { currentLocationId } = useAuth();
    const { ageGroups } = useConfig();
    
    // Services State
    const [services, setServices] = useState<LocalService[]>([]);
    const [selectedService, setSelectedService] = useState<LocalService | null>(null);
    const [isCreatingService, setIsCreatingService] = useState(false);
    
    // Service Form State
    const [serviceName, setServiceName] = useState('');
    const [serviceDesc, setServiceDesc] = useState('');
    const [serviceType, setServiceType] = useState('GROUP');
    const [serviceCategory, setServiceCategory] = useState('TRAINING');
    const [serviceActive, setServiceActive] = useState(true);
    const [serviceImageUrl, setServiceImageUrl] = useState<string>('');

    // Packs State
    const [packs, setPacks] = useState<ServicePack[]>([]);
    const [isPackModalOpen, setIsPackModalOpen] = useState(false);
    const [currentPack, setCurrentPack] = useState<ServicePack | null>(null); // For Modal Upsert
    const [selectedPack, setSelectedPack] = useState<ServicePack | null>(null); // For Pricing Panel

    
    // Pack Form State
    const [packName, setPackName] = useState('');
    const [packDesc, setPackDesc] = useState('');
    const [packClasses, setPackClasses] = useState<number | ''>('');
    const [packDurationDays, setPackDurationDays] = useState<number | ''>('');
    const [packDurationMonths, setPackDurationMonths] = useState<number | ''>('');
    
    // Feedback
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // --- Data Fetching ---

    const fetchServices = useCallback(async (selectId?: string) => {
        if (!currentLocationId) return;
        try {
            const res = await serviceCatalog.getServices(currentLocationId);
            setServices(res);
            if (selectId) {
                const found = res.find((s: any) => (s.service_id || s.id) === selectId);
                if (found) handleSelectService(found);
            } else if (res.length > 0 && !selectedService && !isCreatingService) {
                handleSelectService(res[0]);
            }
        } catch (err) { console.error(err); setError('Failed to fetch services'); }
    }, [currentLocationId, selectedService, isCreatingService]);

    const fetchPacks = async (serviceId: string) => {
        try {
            const res = await serviceCatalog.getServicePacks(serviceId);
            setPacks(res);
        } catch (err) { console.error(err); setError('Failed to fetch packs'); }
    };

    useEffect(() => {
        if (currentLocationId) {
            handleCreateService(); // Reset selection
            fetchServices();
        }
    }, [currentLocationId]);

    // --- Handlers: Service ---

    const handleSelectService = (service: LocalService) => {
        setSelectedService(service);
        setIsCreatingService(false);
        setServiceName(service.name);
        setServiceDesc(service.description || '');
        setServiceType(service.type || 'GROUP');
        setServiceCategory(service.service_type || 'TRAINING');
        setServiceActive(service.is_active !== false);
        setServiceImageUrl(service.image_url || '');
        setSelectedPack(null);
        
        // Fetch child data
        const svcId = service.service_id || service.id;
        if (svcId) fetchPacks(svcId);
    };

    const handleCreateService = () => {
        setSelectedService(null);
        setIsCreatingService(true);
        setServiceName('');
        setServiceDesc('');
        setServiceType('GROUP');
        setServiceCategory('TRAINING');
        setServiceActive(true);
        setServiceImageUrl('');
        setPacks([]);
    };

    const handleSaveService = async () => {
        if (!currentLocationId) return;
        if (!serviceName.trim()) return setError('Service Name is required');

        try {
            const payload: any = {
                location_id: currentLocationId,
                name: serviceName,
                description: serviceDesc || '',
                type: serviceType,
                service_type: serviceCategory,
                is_active: serviceActive,
                // image_url is not part of upsert payload usually, managed via distinct endpoint, but if backend supports it...
                // Assuming backend doesn't take image_url in upsert, or ignores it.
            };
            
            if (selectedService) {
                payload.service_id = selectedService.service_id || selectedService.id;
            }

            const res = await serviceCatalog.upsertService(payload);
            const savedId = res.service_id || res.id;
            
            setSuccess(`Service ${selectedService ? 'updated' : 'created'}`);
            fetchServices(savedId);
        } catch (err: any) { setError(err.message || 'Failed to save service'); }
    };

    const handleImageUpload = async (file: File) => {
        if (!selectedService || !currentLocationId) return;
        
        try {
            const serviceId = selectedService.service_id || selectedService.id;
            if (!serviceId) return; // Should not happen if selected

            const res = await serviceCatalog.uploadServiceImage(serviceId, currentLocationId, file);
            if (res.image_url) {
                setServiceImageUrl(res.image_url);
                setSuccess('Image uploaded successfully');
                // Optionally update the service list item image if it's displayed there
                setServices(prev => prev.map(s => (s.service_id === serviceId || s.id === serviceId) ? { ...s, image_url: res.image_url } : s));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to upload image');
        }
    };

    // --- Handlers: Packs ---

    const handleOpenPackModal = async (pack?: ServicePack) => {
        setCurrentPack(pack || null);
        setPackName(pack?.name || '');
        setPackDesc(pack?.description || '');
        setPackClasses(pack?.classes || '');
        setPackDurationDays(pack?.duration_days || '');
        setPackDurationMonths(pack?.duration_months || '');
        setIsPackModalOpen(true);
    };

    const handleSavePack = async () => {
        const svcId = selectedService?.service_id || selectedService?.id;
        if (!svcId) return setError('No service selected');
        if (!packName.trim()) return setError('Pack Name required');

        try {
            // Upsert Pack Metadata Only
            const packPayload = {
                service_pack_id: currentPack?.service_pack_id,
                service_id: svcId,
                name: packName,
                description: packDesc,
                classes: packClasses || null,
                duration_days: packDurationDays || null,
                duration_months: packDurationMonths || null
            };
            const packRes = await serviceCatalog.upsertServicePack(packPayload);
            
            setSuccess('Pack metadata saved');
            setIsPackModalOpen(false);
            fetchPacks(svcId);
        } catch (err: any) { setError(err.message || 'Failed to save pack'); }
    };

    const handleSavePackPrices = useCallback(async (prices: Record<string, number>) => {
        if (!selectedPack?.service_pack_id) return;
        try {
            const promises = Object.entries(prices).map(([ageGroupId, price]) => 
                serviceCatalog.upsertServicePrice({
                    location_id: currentLocationId,
                    service_pack_id: selectedPack.service_pack_id!, // Non-null asserted because of check above
                    age_group_id: ageGroupId,
                    price: price,
                    subscription_term_id: null // Explicitly null as per new requirement
                })
            );
            await Promise.all(promises);
            setSuccess('Prices updated successfully');
        } catch (err: any) { setError('Failed to update prices'); console.error(err); }
    }, [selectedPack]);


    if (!currentLocationId) return <Alert severity="warning" sx={{ m: 2 }}>Select a location.</Alert>;

    return (
        <Box sx={{ width: '100%', pb: 5 }}>
            <PageHeader 
                title="Service Management" 
                description="Manage service catalog, packs, and pricing."
                breadcrumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Services', active: true }]}
            />

            <Grid container spacing={3}>
                {/* Left Panel: Services List (3 cols) */}
                <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                SERVICES
                            </Typography>
                            <IconButton size="small" onClick={handleCreateService} sx={{ color: '#3b82f6' }}><AddIcon fontSize="small" /></IconButton> 
                        </Box>
                        <Box sx={{ flex: 1, overflowY: 'auto' }}>
                            {services.map(s => <ServiceListItem key={s.service_id || s.id || Math.random()} service={s} isSelected={selectedService === s} onClick={handleSelectService} />)}
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Panel: Details, Packs, Prices (9 cols) */}
                <Grid size={{ xs: 12, md: 9, lg: 9 }}>
                    <Grid container spacing={3}>
                        {/* Service Details on Top */}
                        <Grid size={{ xs: 12 }}>
                            <ServiceBasicInfo 
                                name={serviceName} type={serviceType} serviceType={serviceCategory} isActive={serviceActive} imageUrl={serviceImageUrl} isCreating={isCreatingService}
                                onNameChange={setServiceName} onTypeChange={setServiceType} onServiceTypeChange={setServiceCategory} onActiveChange={setServiceActive}
                                onSave={handleSaveService}
                                onImageUpload={handleImageUpload}
                            />
                        </Grid>

                        {selectedService && !isCreatingService && (
                            <>
                                {/* Service Packs (Left half of bottom) */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', height: '100%' }}>
                                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                                SERVICE PACKS
                                            </Typography>
                                            <Button 
                                                startIcon={<AddIcon />} 
                                                variant="contained" 
                                                size="small" 
                                                onClick={() => handleOpenPackModal()} 
                                                sx={{ bgcolor: '#3b82f6', textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}
                                            >
                                                ADD PACK
                                            </Button>
                                        </Box>
                                        
                                        {packs.length === 0 ? (
                                            <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No packs defined.</Box>
                                        ) : (
                                            <List sx={{ p: 0 }}>
                                                {packs.map(pack => {
                                                    const isSelected = !!selectedPack?.service_pack_id && selectedPack.service_pack_id === pack.service_pack_id;
                                                    return (
                                                        <ListItemButton 
                                                            key={pack.service_pack_id || Math.random()} 
                                                            selected={isSelected}
                                                            onClick={() => setSelectedPack(pack)}
                                                            sx={{ 
                                                                py: 2, 
                                                                px: 2.5, 
                                                                borderBottom: '1px solid #f8fafc',
                                                                '&.Mui-selected': { 
                                                                    borderRight: '3px solid #3b82f6',
                                                                    bgcolor: '#f0f9ff'
                                                                }
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                                <Box sx={{ width: 40, height: 40, bgcolor: isSelected ? '#3b82f6' : '#eff6ff', color: isSelected ? 'white' : 'inherit', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Box component="span" sx={{ fontSize: '1.2rem', opacity: isSelected ? 1 : 0.6 }}>📦</Box>
                                                                </Box>
                                                                <ListItemText 
                                                                    primary={
                                                                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem', mb: 0.5 }}>
                                                                            {pack.name}
                                                                        </Typography>
                                                                    }
                                                                    secondary={
                                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                                            {pack.classes && <Chip label={`${pack.classes} CLASSES`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }} />}
                                                                            {pack.duration_months && <Chip label={`${pack.duration_months} MONTHS`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }} />}
                                                                        </Box>
                                                                    }
                                                                />
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                     <IconButton 
                                                                        size="small" 
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenPackModal(pack); }}
                                                                        sx={{ color: '#94a3b8', '&:hover': { color: '#3b82f6' } }}
                                                                     >
                                                                         <EditIcon fontSize="small" />
                                                                     </IconButton>
                                                                    <Typography variant="h6" sx={{ ml: 1, color: '#3b82f6', opacity: isSelected ? 1 : 0 }}>›</Typography>
                                                                </Box>
                                                            </Box>
                                                        </ListItemButton>
                                                    );
                                                })}
                                            </List>
                                        )}
                                    </Paper>
                                </Grid>

                                {/* Pack Prices (Right half of bottom) */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    {selectedPack ? (
                                        <PricingPanel 
                                            pack={selectedPack} 
                                            ageGroups={ageGroups} 
                                            onSave={handleSavePackPrices} 
                                        />
                                    ) : (
                                        <Paper sx={{ p: 3, textAlign: 'center', color: '#94a3b8', bgcolor: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            Select a Service Pack to manage prices.
                                        </Paper>
                                    )}
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Grid>
            </Grid>

            {/* Pack Modal */}
            <Dialog open={isPackModalOpen} onClose={() => setIsPackModalOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {currentPack ? 'Edit Pack & Pricing' : 'New Service Pack'}
                    <IconButton onClick={() => setIsPackModalOpen(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 700 }}>PACK DETAILS</Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Pack Name" autoFocus value={packName} onChange={(e) => setPackName(e.target.value)} size="small" placeholder="e.g. 10 Class Pack" />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth type="number" label="Classes Included" value={packClasses} onChange={(e) => setPackClasses(parseInt(e.target.value) || '')} size="small" helperText="Leave empty for unlimited" />
                        </Grid>
                        
                        <Grid size={{ xs: 12 }}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Service Pack Duration</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField fullWidth type="number" label="Valid Days" value={packDurationDays} onChange={(e) => setPackDurationDays(parseInt(e.target.value) || '')} size="small" />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField fullWidth type="number" label="Valid Months" value={packDurationMonths} onChange={(e) => setPackDurationMonths(parseInt(e.target.value) || '')} size="small" />
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth multiline rows={4} label="Description" value={packDesc} onChange={(e) => setPackDesc(e.target.value)} size="small" />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsPackModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSavePack}>Save</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
            <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
                <Alert severity="success">{success}</Alert>
            </Snackbar>
        </Box>
    );
};
