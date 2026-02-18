import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Chip,
  Stack
} from '@mui/material';
import { Close, Search, ArrowForward, Verified } from '@mui/icons-material';
import { serviceCatalog, Service, ServicePack } from '../../services/serviceCatalog';
import { useConfig } from '../../context/ConfigContext';

interface ServicePackSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (service: Service, pack: ServicePack) => void;
  locationId: string;
}

export const ServicePackSelector = ({ open, onClose, onSelect, locationId }: ServicePackSelectorProps) => {
  const { dropdownValues, waiverPrograms } = useConfig();
  const [step, setStep] = useState<'SERVICE' | 'PACK'>('SERVICE');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [packs, setPacks] = useState<ServicePack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Services on Open
  useEffect(() => {
    if (open && locationId) {
      setStep('SERVICE');
      setSelectedService(null);
      setSearchTerm('');
      loadServices();
    }
  }, [open, locationId]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await serviceCatalog.getServices(locationId);
      setServices(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPacks = async (service: Service) => {
    setLoading(true);
    try {
      const data = await serviceCatalog.getServicePacks(service.service_id, locationId);
      setPacks(Array.isArray(data) ? data : (data.data || []));
      setStep('PACK');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    loadPacks(service);
  };

  const handleBackToServices = () => {
    setStep('SERVICE');
    setPacks([]);
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>Add Service</Typography>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
        {/* Navigation / Breadcrumbs */}
        <Box sx={{ mb: 2 }}>
            {step === 'PACK' && selectedService ? (
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Breadcrumbs aria-label="breadcrumb">
                        <Link 
                            component="button" 
                            color="inherit" 
                            onClick={handleBackToServices}
                            sx={{ fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}
                        >
                            Services
                        </Link>
                        <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 800 }}>{selectedService.name}</Typography>
                    </Breadcrumbs>
                    <Stack direction="row" spacing={1}>
                        <Chip 
                            label={(dropdownValues?.find(v => 
                                v.module?.toLowerCase() === 'services' && 
                                v.label?.toUpperCase() === 'TYPE' && 
                                v.value?.toLowerCase() === selectedService.type?.toLowerCase()
                            )?.value || selectedService.type || 'Group').toUpperCase()} 
                            size="small" 
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b' }} 
                        />
                        <Chip 
                            label={(dropdownValues?.find(v => 
                                v.module?.toLowerCase() === 'services' && 
                                v.label?.toUpperCase() === 'CATEGORY' && 
                                v.value?.toLowerCase() === selectedService.service_type?.toLowerCase()
                            )?.value || selectedService.service_type || 'Training').toUpperCase()} 
                            size="small" 
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#eff6ff', color: '#3b82f6' }} 
                        />
                    </Stack>
                </Box>
            ) : (
                <Typography variant="subtitle2" color="text.secondary">Select a service to view available packs.</Typography>
            )}
        </Box>

        {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : (
            <>
                {step === 'SERVICE' && (
                    <>
                        <TextField 
                            fullWidth 
                            size="small" 
                            placeholder="Search services..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                            }}
                            sx={{ mb: 2 }}
                        />
                        <List sx={{ flex: 1, overflowY: 'auto' }}>
                            {filteredServices.map(service => {
                                const typeLabel = dropdownValues?.find(v => 
                                    v.module?.toLowerCase() === 'services' && 
                                    v.label?.toUpperCase() === 'TYPE' && 
                                    v.value?.toLowerCase() === service.type?.toLowerCase()
                                )?.value || service.type || 'Group';

                                const catLabel = dropdownValues?.find(v => 
                                    v.module?.toLowerCase() === 'services' && 
                                    v.label?.toUpperCase() === 'CATEGORY' && 
                                    v.value?.toLowerCase() === service.service_type?.toLowerCase()
                                )?.value || service.service_type || 'Training';

                                return (
                                    <ListItemButton 
                                        key={service.service_id} 
                                        onClick={() => handleServiceClick(service)}
                                        sx={{ 
                                            borderRadius: 2, 
                                            mb: 1.5, 
                                            border: '1px solid #e2e8f0',
                                            p: 2,
                                            '&:hover': {
                                                bgcolor: '#f8fafc',
                                                borderColor: '#cbd5e1'
                                            }
                                        }}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                                                {service.name}
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Chip 
                                                    label={typeLabel.toUpperCase()} 
                                                    size="small" 
                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b' }} 
                                                />
                                                <Chip 
                                                    label={catLabel.toUpperCase()} 
                                                    size="small" 
                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#eff6ff', color: '#3b82f6' }} 
                                                />
                                            </Stack>
                                        </Box>
                                        <ArrowForward fontSize="small" sx={{ color: '#94a3b8' }} />
                                    </ListItemButton>
                                );
                            })}
                            {filteredServices.length === 0 && (
                                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                                    No services found.
                                </Typography>
                            )}
                        </List>
                    </>
                )}

                {step === 'PACK' && (
                    <List sx={{ flex: 1, overflowY: 'auto' }}>
                        {packs.length === 0 ? (
                             <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                                 No packs available for this service.
                             </Typography>
                        ) : (
                            packs.map(pack => (
                                <ListItemButton 
                                    key={pack.service_pack_id} 
                                    onClick={() => onSelect(selectedService!, pack)}
                                    sx={{ borderRadius: 1, mb: 1, border: '1px solid #e2e8f0', flexDirection: 'column', alignItems: 'flex-start', p: 2 }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', mb: 0.5 }}>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>{pack.name}</Typography>
                                            {pack.description && (
                                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5, mb: 1 }}>
                                                    {pack.description}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Verified fontSize="small" color="primary" />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip 
                                            label={pack.classes ? `${pack.classes} CLASSES` : 'NO CLASS LIMIT'} 
                                            size="small" 
                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }}
                                        />
                                        <Chip 
                                            label={pack.students_allowed ? `${pack.students_allowed} STUDENTS` : '1 STUDENT'} 
                                            size="small" 
                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }}
                                        />
                                        {pack.waiver_program_id && (
                                            <Chip 
                                                label={(waiverPrograms.find(w => w.waiver_program_id === pack.waiver_program_id)?.name || 'WAIVER').toUpperCase()} 
                                                size="small" 
                                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#fff7ed', color: '#c2410c', borderRadius: '4px' }}
                                            />
                                        )}
                                        {(pack.duration_days || pack.duration_months) && (
                                            <Chip 
                                                label={pack.duration_days ? `${pack.duration_days} DAYS` : `${pack.duration_months} MONTHS`} 
                                                size="small" 
                                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }}
                                            />
                                        )}
                                    </Box>
                                </ListItemButton>
                            ))
                        )}
                    </List>
                )}
            </>
        )}
      </DialogContent>
    </Dialog>
  );
};
