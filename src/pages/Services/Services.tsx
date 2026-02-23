import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { 
  Box, Button, Typography, Paper, TextField, MenuItem, Alert, Snackbar, Grid, InputAdornment, Chip, Switch, Dialog, DialogTitle, 
  DialogContent, DialogActions, IconButton, List, ListItemText,
  ListItemButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { serviceCatalog, ServicePack, ServicePrice } from '../../services/serviceCatalog';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { PageHeader } from '../../components/Common/PageHeader';
import { dropdownService } from '../../services/dropdownService';


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
  LessonRegistrationFee?: number;
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

const ServiceListItem = memo(({ 
  service, 
  isSelected, 
  onClick,
  categories = [],
  types = []
}: { 
  service: LocalService, 
  isSelected: boolean, 
  onClick: (s: LocalService) => void,
  categories?: { value: string, label: string }[],
  types?: { value: string, label: string }[]
}) => {
    const categoryLabel = categories.find(opt => opt.value.trim().toLowerCase() === service.service_type?.trim().toLowerCase())?.label || service.service_type;
    const typeLabel = types.find(opt => opt.value.trim().toLowerCase() === service.type?.trim().toLowerCase())?.label || service.type;

    return (
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
            
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                <Chip 
                    label={categoryLabel?.toUpperCase() || (service.service_type || 'TRAINING').toUpperCase()} 
                    size="small" 
                    sx={{ 
                        height: 16, 
                        fontSize: '0.6rem', 
                        fontWeight: 700,
                        bgcolor: '#f1f5f9',
                        color: '#64748b',
                        borderRadius: '4px',
                        '& .MuiChip-label': { px: 1 }
                    }} 
                />
                <Chip 
                    label={typeLabel?.toUpperCase() || (service.type || 'GROUP').toUpperCase()} 
                    size="small" 
                    sx={{ 
                        height: 16, 
                        fontSize: '0.6rem', 
                        fontWeight: 700,
                        bgcolor: '#f1f5f9',
                        color: '#64748b',
                        borderRadius: '4px',
                        '& .MuiChip-label': { px: 1 }
                    }} 
                />
            </Box>

            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {service.description || 'No description'}
            </Typography>
        </Box>
    );
});



interface ServiceBasicInfoProps {
    name: string;
    description: string;
    type: string;
    serviceType: string;
    isActive: boolean;
    imageUrl?: string;
    lessonRegistrationFee: number;
    isCreating: boolean;
    onNameChange: (val: string) => void;
    onDescriptionChange: (val: string) => void;
    onTypeChange: (val: string) => void;
    onServiceTypeChange: (val: string) => void;
    onActiveChange: (val: boolean) => void;
    onLessonRegistrationFeeChange: (val: number) => void;
    onSave: () => void;
    onImageUpload: (file: File) => void;
    onDelete: () => void;
    categories?: { value: string, label: string }[];
    types?: { value: string, label: string }[];
    onAddCategory: () => void;
    onAddType: () => void;
}

const ServiceBasicInfo = memo(({
    name, description, type, serviceType, isActive, imageUrl, lessonRegistrationFee, isCreating,
    onNameChange, onDescriptionChange, onTypeChange, onServiceTypeChange, onActiveChange, onLessonRegistrationFeeChange, onSave, onImageUpload, onDelete,
    categories = [],
    types = [],
    onAddCategory,
    onAddType
}: ServiceBasicInfoProps) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onImageUpload(event.target.files[0]);
        }
    };

    return (
        <Paper elevation={0} sx={{ borderRadius: 1, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                    {isCreating ? 'New Service' : 'Service Details'}
                </Typography>
                <Box>
                    {!isCreating && (
                        <Button 
                            variant="outlined" 
                            size="small" 
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={onDelete}
                            sx={{ mr: 1, textTransform: 'none', fontWeight: 600, px: 2 }}
                        >
                            Delete
                        </Button>
                    )}
                    <Button variant="outlined" size="small" sx={{ mr: 1, color: '#64748b', borderColor: '#e2e8f0', textTransform: 'none', fontWeight: 600, px: 2 }}>
                        Discard
                    </Button>
                    <Button variant="contained" startIcon={<SaveIcon sx={{ fontSize: '1rem !important' }} />} onClick={onSave} size="small" sx={{ bgcolor: '#1e293b', textTransform: 'none', fontWeight: 700, px: 2 }}>
                        Save
                    </Button>
                </Box>
            </Box>
            <Grid container spacing={3} sx={{ p: 3 }}>
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

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, mb: 1, display: 'block', letterSpacing: '0.02em' }}>
                                Description
                            </Typography>
                            <TextField 
                                fullWidth 
                                multiline
                                rows={2}
                                value={description} 
                                onChange={(e) => onDescriptionChange(e.target.value)} 
                                size="small" 
                                placeholder="Details about this service..." 
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        bgcolor: '#f8fafc', 
                                        borderRadius: '8px',
                                        '& fieldset': { borderColor: '#f1f5f9' },
                                        '& textarea': { fontWeight: 500 }
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
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end" sx={{ mr: 2 }}>
                                            <IconButton size="small" onClick={onAddCategory} edge="end">
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        bgcolor: '#ffffff', 
                                        borderRadius: '8px',
                                        '& fieldset': { borderColor: '#e2e8f0' }
                                    } 
                                }}
                            >
                                {categories.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
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
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end" sx={{ mr: 2 }}>
                                            <IconButton size="small" onClick={onAddType} edge="end">
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        bgcolor: '#ffffff', 
                                        borderRadius: '8px',
                                        '& fieldset': { borderColor: '#e2e8f0' }
                                    } 
                                }}
                            >
                                {types.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, mb: 1, display: 'block', letterSpacing: '0.02em' }}>
                                Lesson Registration Fee
                            </Typography>
                            <TextField 
                                fullWidth 
                                type="number"
                                value={lessonRegistrationFee} 
                                onChange={(e) => onLessonRegistrationFeeChange(parseFloat(e.target.value) || 0)} 
                                size="small"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
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
                                Published Status
                            </Typography>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                bgcolor: '#f8fafc', 
                                p: 1.5, 
                                px: 2, 
                                borderRadius: '8px', 
                                border: '1px solid #f1f5f9', 
                                height: '40px',
                                boxSizing: 'border-box'
                            }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: isActive ? '#10b981' : '#94a3b8', letterSpacing: '0.05em' }}>
                                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                                </Typography>
                                <Switch 
                                    checked={isActive} 
                                    onChange={(e) => onActiveChange(e.target.checked)} 
                                    size="small"
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' }
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
});

const PricingPanel = memo(({ pack, ageGroups }: { pack: ServicePack, ageGroups: any[] }) => {
    const [priceData, setPriceData] = useState<Record<string, { price: string, students: string, instructors: string }>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPrices = async () => {
            if (!pack.service_pack_id) return;
            setLoading(true);
            try {
                const res = await serviceCatalog.getPackPrices(pack.service_pack_id);
                const map: Record<string, { price: string, students: string, instructors: string }> = {};
                res.forEach((p: ServicePrice) => {
                    map[p.age_group_id] = {
                        price: p.price.toString(),
                        students: (p.num_students ?? 1).toString(),
                        instructors: (p.num_instructors ?? 1).toString()
                    };
                });
                setPriceData(map);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchPrices();
    }, [pack]);

    const activeAgeGroups = ageGroups.filter(ag => {
        const agId = ag.age_group_id || ag.id;
        return priceData[agId] && priceData[agId].price !== '';
    });

    if (loading) {
        return (
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', p: 3, borderRadius: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#94a3b8' }}>Loading prices...</Typography>
            </Paper>
        );
    }

    return (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                        PACK PRICES (VIEW ONLY)
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
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                {activeAgeGroups.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No prices defined for this pack.</Box>
                ) : (
                    <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px', gap: 2, mb: 2, px: 1 }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>AGE GROUP</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', textAlign: 'center' }}>STUDENTS</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', textAlign: 'center' }}>INSTRUCTOR</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>RATE ($)</Typography>
                        </Box>
                        
                        {activeAgeGroups.map(ag => {
                            const agId = ag.age_group_id || ag.id || Math.random().toString();
                            const data = priceData[agId];
                            if (!data) return null;
                            return (
                                <Box key={agId} sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px', gap: 2, alignItems: 'center', mb: 2.5, px: 1, borderBottom: '1px solid #f8fafc', pb: 1.5 }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{ag.name}</Typography>
                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                            {ag.min_age !== undefined && ag.max_age !== undefined ? `(${ag.min_age}-${ag.max_age} y)` : (ag.description || 'N/A')}
                                        </Typography>
                                    </Box>
                                    
                                    <Typography sx={{ textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>
                                        {data.students}
                                    </Typography>

                                    <Typography sx={{ textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>
                                        {data.instructors}
                                    </Typography>

                                    <Typography sx={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                                        ${data.price}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </>
                )}
            </Box>
        </Paper>
    );
});

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------


export const Services = () => {
    const { currentLocationId } = useAuth();
    const { ageGroups, dropdownValues, refreshDropdownValues, waiverPrograms, refreshWaiverPrograms } = useConfig();

    const serviceCategories = useMemo(() => {
        return (dropdownValues || [])
            .filter(v => 
                v.module?.trim().toLowerCase() === 'services' && 
                v.label?.trim().toUpperCase() === 'CATEGORY'
            )
            .map(v => ({ value: v.value, label: v.value }));
    }, [dropdownValues]);

    const serviceTypes = useMemo(() => {
        return (dropdownValues || [])
            .filter(v => 
                v.module?.trim().toLowerCase() === 'services' && 
                v.label?.trim().toUpperCase() === 'TYPE'
            )
            .map(v => ({ value: v.value, label: v.value }));
    }, [dropdownValues]);

    const activeWaiverPrograms = useMemo(() => {
        return (waiverPrograms || []).filter(w => w.is_active !== false);
    }, [waiverPrograms]);
    
    // Services State
    const [services, setServices] = useState<LocalService[]>([]);
    const [selectedService, setSelectedService] = useState<LocalService | null>(null);
    const [isCreatingService, setIsCreatingService] = useState(false);
    
    // Service Form State
    const [serviceName, setServiceName] = useState('');
    const [serviceDesc, setServiceDesc] = useState('');
    const [serviceType, setServiceType] = useState('Group');
    const [serviceCategory, setServiceCategory] = useState('Training');
    const [serviceActive, setServiceActive] = useState(true);
    const [serviceImageUrl, setServiceImageUrl] = useState<string>('');
    const [serviceLessonRegistrationFee, setServiceLessonRegistrationFee] = useState<number>(0);

    // Packs State
    const [packs, setPacks] = useState<ServicePack[]>([]);
    const [isPackModalOpen, setIsPackModalOpen] = useState(false);
    const [currentPack, setCurrentPack] = useState<ServicePack | null>(null); // For Modal Upsert
    const [selectedPack, setSelectedPack] = useState<ServicePack | null>(null); // For Pricing Panel

    
    // Pack Form State
    const [packName, setPackName] = useState('');
    const [packDesc, setPackDesc] = useState('');
    const [packClasses, setPackClasses] = useState<number | ''>('');
    const [packStudentsAllowed, setPackStudentsAllowed] = useState<number | ''>('');
    const [packDurationDays, setPackDurationDays] = useState<number | ''>('');
    const [packDurationMonths, setPackDurationMonths] = useState<number | ''>('');
    const [packDurationUnit, setPackDurationUnit] = useState<'days' | 'months'>('months');
    const [packWaiverProgramId, setPackWaiverProgramId] = useState<string>('');
    const [packIsShrabable, setPackIsShrabable] = useState(false);
    const [packMaxUsesPerPeriod, setPackMaxUsesPerPeriod] = useState<number | ''>('');
    const [packUsagePeriodUnit, setPackUsagePeriodUnit] = useState<string>('MONTH');
    const [packUsagePeriodLength, setPackUsagePeriodLength] = useState<number | ''>('');
    const [packEnforceUsageLimit, setPackEnforceUsageLimit] = useState(false);
    
    // Pricing State for Pack Modal
    const [packPriceData, setPackPriceData] = useState<Record<string, { price: string, students: string, instructors: string }>>({});
    const [isPackPricesLoading, setIsPackPricesLoading] = useState(false);
    
    // Deletion State
    const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
    const [isDeleteServiceModalOpen, setIsDeleteServiceModalOpen] = useState(false);
    
    const [deletePackId, setDeletePackId] = useState<string | null>(null);
    const [isDeletePackModalOpen, setIsDeletePackModalOpen] = useState(false);

    // Feedback
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Dropdown Logic
    const [isDropdownDialogOpen, setIsDropdownDialogOpen] = useState(false);
    const [newDropdownLabel, setNewDropdownLabel] = useState(''); // 'Category' or 'Type'
    const [newDropdownValue, setNewDropdownValue] = useState('');

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
            refreshWaiverPrograms();
        }
    }, [currentLocationId, refreshWaiverPrograms]);

    // --- Handlers: Service ---

    const handleSelectService = (service: LocalService) => {
        setSelectedService(service);
        setIsCreatingService(false);
        setServiceName(service.name);
        setServiceDesc(service.description || '');
        // Match case-insensitively with dynamic options if possible
        const matchedType = serviceTypes.find(opt => opt.value.toLowerCase() === service.type?.toLowerCase())?.value;
        const matchedCategory = serviceCategories.find(opt => opt.value.toLowerCase() === service.service_type?.toLowerCase())?.value;

        setServiceType(matchedType || service.type || 'Group');
        setServiceCategory(matchedCategory || service.service_type || 'Training');
        setServiceActive(service.is_active !== false);
        setServiceImageUrl(service.image_url || '');
        setServiceLessonRegistrationFee(service.LessonRegistrationFee || 0);
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
        setServiceType(serviceTypes[0]?.value || 'Group');
        setServiceCategory(serviceCategories[0]?.value || 'Training');
        setServiceActive(true);
        setServiceImageUrl('');
        setServiceLessonRegistrationFee(0);
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
                LessonRegistrationFee: serviceLessonRegistrationFee,
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
        setPackStudentsAllowed(pack?.students_allowed || '');
        
        if (pack?.duration_days) {
            setPackDurationDays(pack.duration_days);
            setPackDurationMonths('');
            setPackDurationUnit('days');
        } else {
            setPackDurationMonths(pack?.duration_months || '');
            setPackDurationDays('');
            setPackDurationUnit('months');
        }
        
        setPackWaiverProgramId(pack?.waiver_program_id || '');
        setPackIsShrabable(pack?.is_shrabable || false);
        setPackMaxUsesPerPeriod(pack?.max_uses_per_period || '');
        setPackUsagePeriodUnit(pack?.usage_period_unit || 'MONTH');
        setPackUsagePeriodLength(pack?.usage_period_length || '');
        setPackEnforceUsageLimit(pack?.enforce_usage_limit || false);
        refreshWaiverPrograms(); // Force refresh waiver programs whenever modal opens
        
        // Fetch Pricing
        if (pack?.service_pack_id) {
            setIsPackPricesLoading(true);
            try {
                const res = await serviceCatalog.getPackPrices(pack.service_pack_id);
                const map: Record<string, { price: string, students: string, instructors: string }> = {};
                res.forEach((p: ServicePrice) => {
                    map[p.age_group_id] = {
                        price: p.price.toString(),
                        students: (p.num_students ?? 1).toString(),
                        instructors: (p.num_instructors ?? 1).toString()
                    };
                });
                setPackPriceData(map);
            } catch (err) { console.error(err); } finally { setIsPackPricesLoading(false); }
        } else {
            setPackPriceData({});
        }

        setIsPackModalOpen(true);
    };

    const handleSavePack = async () => {
        const svcId = selectedService?.service_id || selectedService?.id;
        if (!svcId) return setError('No service selected');
        if (!packName.trim()) return setError('Pack Name required');

        try {
            const packPayload = {
                service_pack_id: currentPack?.service_pack_id,
                service_id: svcId,
                name: packName,
                description: packDesc,
                classes: packClasses || null,
                students_allowed: packStudentsAllowed || null,
                duration_days: packDurationUnit === 'days' ? (packDurationDays || null) : null,
                duration_months: packDurationUnit === 'months' ? (packDurationMonths || null) : null,
                waiver_program_id: packWaiverProgramId || null,
                is_shrabable: packIsShrabable,
                max_uses_per_period: packMaxUsesPerPeriod || null,
                usage_period_unit: packUsagePeriodUnit || null,
                usage_period_length: packUsagePeriodLength || null,
                enforce_usage_limit: packEnforceUsageLimit
            };
            const packRes = await serviceCatalog.upsertServicePack(packPayload);
            const savedPackId = packRes?.data?.service_pack_id || packRes?.service_pack_id || packRes?.id || currentPack?.service_pack_id;
            
            if (savedPackId && currentLocationId) {
                const toSave: Record<string, { price: number, num_students: number, num_instructors: number }> = {};
                Object.entries(packPriceData).forEach(([id, data]) => {
                    const priceNum = parseFloat(data.price);
                    if (!isNaN(priceNum)) {
                        toSave[id] = {
                            price: priceNum,
                            num_students: parseInt(data.students) || 1,
                            num_instructors: parseInt(data.instructors) || 1
                        };
                    }
                });

                const promises = Object.entries(toSave).map(([ageGroupId, data]) => 
                    serviceCatalog.upsertServicePrice({
                        location_id: currentLocationId,
                        service_pack_id: savedPackId,
                        age_group_id: ageGroupId,
                        price: data.price,
                        num_students: data.num_students,
                        num_instructors: data.num_instructors,
                        subscription_term_id: null
                    })
                );
                await Promise.all(promises);
            }

            setSuccess('Pack and pricing saved');
            setIsPackModalOpen(false);
            fetchPacks(svcId);
            
            if (selectedPack && (selectedPack.service_pack_id === savedPackId || selectedPack.id === savedPackId)) {
                setSelectedPack({ ...selectedPack }); 
            }
        } catch (err: any) { setError(err.message || 'Failed to save pack'); }
    };

    // --- Handlers: Deletion ---

    const handleDeleteServiceClick = () => {
        if (!selectedService) return;
        setDeleteServiceId(selectedService.service_id || selectedService.id || null);
        setIsDeleteServiceModalOpen(true);
    };

    const handleConfirmDeleteService = async () => {
        if (!deleteServiceId || !currentLocationId) return;

        const prevServices = [...services];
        const prevSelected = selectedService;
        
        setIsDeleteServiceModalOpen(false);
        setServices(prev => prev.filter(s => (s.service_id || s.id) !== deleteServiceId));
        
        if (selectedService && (selectedService.service_id === deleteServiceId || selectedService.id === deleteServiceId)) {
             handleCreateService(); 
        }

        try {
            await serviceCatalog.deleteService(deleteServiceId, currentLocationId);
            setSuccess('Service deleted successfully');
            setDeleteServiceId(null);
            fetchServices(); 
        } catch (err: any) {
            setServices(prevServices);
            if (prevSelected) handleSelectService(prevSelected);
            setError(err.message || 'Failed to delete service');
        }
    };

    const handleDeletePackClick = (packId: string) => {
        setDeletePackId(packId);
        setIsDeletePackModalOpen(true);
    };

    const handleConfirmDeletePack = async () => {
        if (!deletePackId || !currentLocationId) return;

        const prevPacks = [...packs];
        const prevSelectedPack = selectedPack;

        setIsDeletePackModalOpen(false);
        setPacks(prev => prev.filter(p => p.service_pack_id !== deletePackId));
        
        if (selectedPack?.service_pack_id === deletePackId) {
            setSelectedPack(null);
        }

        try {
            await serviceCatalog.deleteServicePack(deletePackId);
            setSuccess('Pack deleted successfully');
            setDeletePackId(null);
            if (selectedService) {
                fetchPacks(selectedService.service_id || selectedService.id || '');
            }
        } catch (err: any) {
            setPacks(prevPacks);
            if (prevSelectedPack) setSelectedPack(prevSelectedPack);
            setError(err.message || 'Failed to delete pack');
        }
    };

    // --- Handlers: Dropdowns ---

    const handleAddDropdown = (label: string) => {
        setNewDropdownLabel(label);
        setNewDropdownValue('');
        setIsDropdownDialogOpen(true);
    };

    const handleSaveDropdown = async () => {
        if (!currentLocationId) return;
        if (!newDropdownValue.trim()) return setError('Value is required');

        try {
            await dropdownService.upsert({
                module: 'Services',
                label: newDropdownLabel,
                value: newDropdownValue
            }, currentLocationId);
            
            await refreshDropdownValues();
            setSuccess(`${newDropdownLabel} added successfully`);
            setIsDropdownDialogOpen(false);
            
            if (newDropdownLabel === 'Category') {
                setServiceCategory(newDropdownValue);
            } else if (newDropdownLabel === 'Type') {
                setServiceType(newDropdownValue);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to add value');
        }
    };


    if (!currentLocationId) return <Alert severity="warning" sx={{ m: 2 }}>Select a location.</Alert>;

    return (
        <Box sx={{ width: '100%', pb: 5 }}>
            <PageHeader 
                title="Service Management" 
                description="Manage service catalog, packs, and pricing."
                breadcrumbs={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Services', active: true }]}
            />

            <Grid container spacing={3}>
                {/* Left Panel: Services List */}
                <Grid size={{ xs: 12, md: 3, lg: 3 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Box sx={{ p: 2, bgcolor: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                SERVICES
                            </Typography>
                            <IconButton size="small" onClick={handleCreateService} sx={{ color: '#3b82f6' }}><AddIcon fontSize="small" /></IconButton> 
                        </Box>
                        <Box sx={{ flex: 1, overflowY: 'auto' }}>
                            {services.map(s => (
                                <ServiceListItem 
                                    key={s.service_id || s.id || Math.random()} 
                                    service={s} 
                                    isSelected={selectedService === s} 
                                    onClick={handleSelectService}
                                    categories={serviceCategories}
                                    types={serviceTypes}
                                />
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Panel */}
                <Grid size={{ xs: 12, md: 9, lg: 9 }} container spacing={3} sx={{ alignContent: 'flex-start' }}>
                    {/* Service Basic Info */}
                    <Grid size={{ xs: 12 }}>
                        {isCreatingService || selectedService ? (
                            <Box sx={{ animation: 'fadeIn 0.3s ease-in-out', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                                <ServiceBasicInfo 
                                    name={serviceName}
                                    description={serviceDesc}
                                    type={serviceType}
                                    serviceType={serviceCategory}
                                    isActive={serviceActive}
                                    imageUrl={serviceImageUrl}
                                    lessonRegistrationFee={serviceLessonRegistrationFee}
                                    isCreating={isCreatingService}
                                    onNameChange={setServiceName}
                                    onDescriptionChange={setServiceDesc}
                                    onTypeChange={setServiceType}
                                    onServiceTypeChange={setServiceCategory}
                                    onActiveChange={setServiceActive}
                                    onLessonRegistrationFeeChange={setServiceLessonRegistrationFee}
                                    onSave={handleSaveService}
                                    onImageUpload={handleImageUpload}
                                    onDelete={handleDeleteServiceClick}
                                    categories={serviceCategories}
                                    types={serviceTypes}
                                    onAddCategory={() => handleAddDropdown('Category')}
                                    onAddType={() => handleAddDropdown('Type')}
                                />
                            </Box>
                        ) : (
                            <Paper elevation={0} sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: 2, border: '1px dashed #e2e8f0', borderRadius: 2, height: '400px' }}>
                                <Box sx={{ fontSize: '4rem', opacity: 0.2 }}>👈</Box>
                                <Typography variant="body1" fontWeight={500}>Select a service to view details</Typography>
                            </Paper>
                        )}
                    </Grid>

                    {/* Packs & Prices (Only if Service Selected and Not Creating) */}
                    {selectedService && !isCreatingService && (
                        <>
                            {/* Service Packs */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', height: '100%', width: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
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
                                    
                                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                                        {packs.length === 0 ? (
                                            <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No packs defined.</Box>
                                        ) : (
                                            <List sx={{ p: 0 }}>
                                                {packs.map(pack => {
                                                    const isSelected = !!selectedPack?.service_pack_id && selectedPack.service_pack_id === pack.service_pack_id;
                                                    const waiverName = activeWaiverPrograms?.find(w => w.waiver_program_id === pack.waiver_program_id)?.name;

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
                                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                            {pack.classes && <Chip label={`${pack.classes} CLASSES`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }} />}
                                                                            {pack.duration_months ? (
                                                                                <Chip label={`${pack.duration_months} MONTHS`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }} />
                                                                            ) : pack.duration_days ? (
                                                                                <Chip label={`${pack.duration_days} DAYS`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }} />
                                                                            ) : null}
                                                                            {waiverName && <Chip label={waiverName} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#fff7ed', color: '#c2410c', borderRadius: '4px' }} />}
                                                                            {pack.is_shrabable && <Chip label="SHARABLE" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#f0fdf4', color: '#16a34a', borderRadius: '4px' }} />}
                                                                            {pack.max_uses_per_period && (
                                                                                <Chip 
                                                                                    label={`${pack.max_uses_per_period} USES / ${pack.usage_period_length || 1} ${pack.usage_period_unit}`} 
                                                                                    size="small" 
                                                                                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#f0f9ff', color: '#0284c7', borderRadius: '4px' }} 
                                                                                />
                                                                            )}
                                                                            {pack.enforce_usage_limit && (
                                                                                <Chip label="STRICT" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#fef2f2', color: '#ef4444', borderRadius: '4px' }} />
                                                                            )}
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
                                                                     <IconButton 
                                                                        size="small" 
                                                                        onClick={(e) => { e.stopPropagation(); handleDeletePackClick(pack.service_pack_id || ''); }}
                                                                        sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}
                                                                     >
                                                                         <DeleteIcon fontSize="small" />
                                                                     </IconButton>
                                                                    <Typography variant="h6" sx={{ ml: 1, color: '#3b82f6', opacity: isSelected ? 1 : 0 }}>›</Typography>
                                                                </Box>
                                                            </Box>
                                                        </ListItemButton>
                                                    );
                                                })}
                                            </List>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Pricing Panel */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                {selectedPack ? (
                                    <PricingPanel 
                                        pack={selectedPack} 
                                        ageGroups={ageGroups} 
                                    />
                                ) : (
                                     <Paper sx={{ p: 3, textAlign: 'center', color: '#94a3b8', bgcolor: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 2, height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        Select a Service Pack to view prices.
                                    </Paper>
                                )}
                            </Grid>
                        </>
                    )}
                </Grid>
            </Grid>

            {/* Pack Modal */}
            <Dialog open={isPackModalOpen} onClose={() => setIsPackModalOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {currentPack ? 'Edit Pack & Pricing' : 'New Service Pack'}
                    <IconButton onClick={() => setIsPackModalOpen(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>PACK DETAILS</Typography>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12 }}>
                            <TextField 
                                fullWidth 
                                label="Pack Name" 
                                autoFocus 
                                value={packName} 
                                onChange={(e) => setPackName(e.target.value)} 
                                size="small" 
                                placeholder="e.g. 10 Class Pack" 
                                sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}
                            />
                        </Grid>
                         <Grid size={{ xs: 6 }}>
                             <TextField 
                                fullWidth 
                                type="number" 
                                label="Classes Included" 
                                value={packClasses} 
                                onChange={(e) => setPackClasses(parseInt(e.target.value) || '')} 
                                size="small" 
                                helperText="Leave empty for unlimited" 
                                sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}
                            />
                        </Grid>
                         {/* Removed: packStudentsAllowed TextField as requested */}
                        
                        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                            <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 2, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Pack Duration</Typography>
                                <Grid container spacing={3} alignItems="center">
                                    <Grid size={{ xs: 4 }}>
                                        <TextField 
                                            fullWidth 
                                            select 
                                            label="Unit" 
                                            value={packDurationUnit} 
                                            onChange={(e) => setPackDurationUnit(e.target.value as 'days' | 'months')} 
                                            size="small"
                                            sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}
                                        >
                                            <MenuItem value="days">Days</MenuItem>
                                            <MenuItem value="months">Months</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 8 }}>
                                        {packDurationUnit === 'days' ? (
                                            <TextField 
                                                fullWidth 
                                                type="number" 
                                                label="Valid Days" 
                                                value={packDurationDays} 
                                                onChange={(e) => setPackDurationDays(parseInt(e.target.value) || '')} 
                                                size="small" 
                                                sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}
                                            />
                                        ) : (
                                            <TextField 
                                                fullWidth 
                                                type="number" 
                                                label="Valid Months" 
                                                value={packDurationMonths} 
                                                onChange={(e) => setPackDurationMonths(parseInt(e.target.value) || '')} 
                                                size="small" 
                                                sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}
                                            />
                                        )}
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                            <TextField 
                                fullWidth 
                                multiline 
                                rows={3} 
                                label="Description" 
                                value={packDesc} 
                                onChange={(e) => setPackDesc(e.target.value)} 
                                size="small" 
                                sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                            <TextField
                                select
                                fullWidth
                                label="Waiver Program"
                                value={packWaiverProgramId}
                                onChange={(e) => setPackWaiverProgramId(e.target.value)}
                                size="small"
                                helperText="Select a waiver program (Regional Center) for this pack if applicable"
                                sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {activeWaiverPrograms.map(w => (
                                    <MenuItem key={w.waiver_program_id} value={w.waiver_program_id}>
                                        {w.name} {w.code ? `(${w.code})` : ''}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        
                        {/* Remove Waiver Exempt Switch Block */}
                        <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
                            <Paper variant="outlined" sx={{ p: 3, bgcolor: '#fdfcfe', borderRadius: 2, border: '1px solid #e9d5ff' }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 2, fontWeight: 800, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sharing & Frequency Configuration</Typography>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#ffffff', p: 1.5, px: 2, borderRadius: '8px', border: '1px solid #e2e8f0', height: '40px', boxSizing: 'border-box' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: packIsShrabable ? '#9333ea' : '#64748b' }}>
                                                Sharable (Family)
                                            </Typography>
                                            <Switch 
                                                checked={packIsShrabable} 
                                                onChange={(e) => setPackIsShrabable(e.target.checked)} 
                                                size="small"
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#9333ea' },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#9333ea' }
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#ffffff', p: 1.5, px: 2, borderRadius: '8px', border: '1px solid #e2e8f0', height: '40px', boxSizing: 'border-box' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: packEnforceUsageLimit ? '#ef4444' : '#64748b' }}>
                                                Enforce Usage Limit
                                            </Typography>
                                            <Switch 
                                                checked={packEnforceUsageLimit} 
                                                onChange={(e) => setPackEnforceUsageLimit(e.target.checked)} 
                                                size="small"
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#ef4444' },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#ef4444' }
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <TextField 
                                            fullWidth 
                                            type="number" 
                                            label="Max Uses" 
                                            value={packMaxUsesPerPeriod} 
                                            onChange={(e) => setPackMaxUsesPerPeriod(parseInt(e.target.value) || '')} 
                                            size="small"
                                            disabled={!packEnforceUsageLimit}
                                            sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <TextField 
                                            fullWidth 
                                            type="number" 
                                            label="Per Every (Length)" 
                                            value={packUsagePeriodLength} 
                                            onChange={(e) => setPackUsagePeriodLength(parseInt(e.target.value) || '')} 
                                            size="small"
                                            disabled={!packEnforceUsageLimit}
                                            sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                        <TextField 
                                            fullWidth 
                                            select 
                                            label="Unit" 
                                            value={packUsagePeriodUnit} 
                                            onChange={(e) => setPackUsagePeriodUnit(e.target.value)} 
                                            size="small"
                                            disabled={!packEnforceUsageLimit}
                                            sx={{ '& .MuiInputLabel-root': { fontWeight: 600 } }}
                                        >
                                            <MenuItem value="DAY">Day(s)</MenuItem>
                                            <MenuItem value="WEEK">Week(s)</MenuItem>
                                            <MenuItem value="MONTH">Month(s)</MenuItem>
                                            <MenuItem value="YEAR">Year(s)</MenuItem>
                                        </TextField>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>PRICING CONFIGURATION</Typography>
                        {isPackPricesLoading ? (
                            <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>Loading prices...</Box>
                        ) : (
                            <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px', gap: 2, mb: 1, px: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>AGE GROUP</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', textAlign: 'center' }}>STUDENTS</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', textAlign: 'center' }}>INSTRUCTOR</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>RATE ($)</Typography>
                                </Box>
                                
                                {ageGroups.map(ag => {
                                    const agId = ag.age_group_id || ag.id || Math.random().toString();
                                    const data = packPriceData[agId] || { price: '', students: '1', instructors: '1' };
                                    return (
                                        <Box key={agId} sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px', gap: 2, alignItems: 'center', mb: 2, px: 1 }}>
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{ag.name}</Typography>
                                                <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                                    {ag.min_age !== undefined && ag.max_age !== undefined ? `(${ag.min_age}-${ag.max_age} y)` : (ag.description || 'N/A')}
                                                </Typography>
                                            </Box>
                                            
                                            <TextField 
                                                value={data.students} 
                                                onChange={(e) => setPackPriceData(prev => ({ ...prev, [agId]: { ...(prev[agId] || { price: '', students: '1', instructors: '1' }), students: e.target.value } }))}
                                                size="small"
                                                type="number"
                                                sx={{ 
                                                    '& .MuiOutlinedInput-root': { 
                                                        bgcolor: '#ffffff',
                                                        borderRadius: '8px',
                                                        '& input': { textAlign: 'center', fontWeight: 600, py: 1 }
                                                    }
                                                }}
                                            />

                                            <TextField 
                                                value={data.instructors} 
                                                onChange={(e) => setPackPriceData(prev => ({ ...prev, [agId]: { ...(prev[agId] || { price: '', students: '1', instructors: '1' }), instructors: e.target.value } }))}
                                                size="small"
                                                type="number"
                                                sx={{ 
                                                    '& .MuiOutlinedInput-root': { 
                                                        bgcolor: '#ffffff',
                                                        borderRadius: '8px',
                                                        '& input': { textAlign: 'center', fontWeight: 600, py: 1 }
                                                    }
                                                }}
                                            />

                                            <TextField 
                                                value={data.price} 
                                                onChange={(e) => setPackPriceData(prev => ({ ...prev, [agId]: { ...(prev[agId] || { price: '', students: '1', instructors: '1' }), price: e.target.value } }))}
                                                size="small"
                                                placeholder="N/A"
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: '0.875rem', color: '#94a3b8' } }}>$</InputAdornment>
                                                }}
                                                sx={{ 
                                                    '& .MuiOutlinedInput-root': { 
                                                        bgcolor: '#ffffff',
                                                        borderRadius: '8px',
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
                                        mt: 2, 
                                        bgcolor: 'transparent', 
                                        color: '#64748b', 
                                        fontSize: '0.75rem',
                                        '& .MuiAlert-message': { fontWeight: 500, lineHeight: 1.5, color: '#64748b' },
                                        border: 'none',
                                        p: 0
                                    }}
                                >
                                    Leave rate blank for any age group that should not have access to this pack.
                                </Alert>
                            </Paper>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>

                    <Button onClick={() => setIsPackModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSavePack}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Service Confirmation Dialog */}
            <Dialog open={isDeleteServiceModalOpen} onClose={() => setIsDeleteServiceModalOpen(false)}>
                <DialogTitle sx={{ color: '#ef4444', fontWeight: 700 }}>
                    Delete Service?
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this Service? This will permanently delete the service, all its packs, and all pricing configurations. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteServiceModalOpen(false)} sx={{ color: '#64748b' }}>Cancel</Button>
                    <Button onClick={handleConfirmDeleteService} color="error" variant="contained" autoFocus>
                        Delete Forever
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Pack Confirmation Dialog */}
            <Dialog open={isDeletePackModalOpen} onClose={() => setIsDeletePackModalOpen(false)}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Delete Service Pack?
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this Service Pack? This will remove the pack and its associated prices.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeletePackModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDeletePack} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* New Dropdown Value Dialog */}
            <Dialog open={isDropdownDialogOpen} onClose={() => setIsDropdownDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
                    Add New {newDropdownLabel}
                </DialogTitle>
                <DialogContent sx={{ p: 3, pt: '24px !important' }}>
                    <TextField
                        autoFocus
                        label="Name"
                        fullWidth
                        value={newDropdownValue}
                        onChange={(e) => setNewDropdownValue(e.target.value)}
                        placeholder={`e.g. New ${newDropdownLabel}`}
                    />
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #e2e8f0', p: 2 }}>
                    <Button onClick={() => setIsDropdownDialogOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleSaveDropdown} variant="contained" disabled={!newDropdownValue.trim()}>
                        Add
                    </Button>
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
