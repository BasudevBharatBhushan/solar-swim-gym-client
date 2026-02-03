import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Switch,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Grid
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { Service } from '../../types/service';
import { dropdownOptions } from '../../lib/dropdownOptions';
import { useConfig } from '../../context/ConfigContext';

interface ServiceDetailProps {
  service: Service | null;
  onSave: (updatedService: Service) => void;
  isNew?: boolean;
}

export const ServiceDetail: React.FC<ServiceDetailProps> = ({ service, onSave, isNew = false }) => {
  const { ageGroups, subscriptionTerms } = useConfig();
  const [formData, setFormData] = useState<Service | null>(
    service ? JSON.parse(JSON.stringify(service)) : null
  );

  if (!formData) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
        <Typography>Select a service to view details</Typography>
      </Box>
    );
  }

  const handleChange = (field: keyof Service, value: string | boolean) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const handlePriceChange = (ageGroupId: string, ageGroupName: string, termId: string, termName: string, newPrice: string) => {
     setFormData((prev) => {
         if (!prev) return null;
         
         const priceNum = parseFloat(newPrice) || 0;
         const pricingStructure = [...prev.pricing_structure];
         
         // Find or create age group pricing
         let ageGroupIdx = pricingStructure.findIndex(ag => ag.age_group_id === ageGroupId);
         if (ageGroupIdx === -1) {
             pricingStructure.push({
                 age_group_id: ageGroupId,
                 age_group_name: ageGroupName,
                 terms: []
             });
             ageGroupIdx = pricingStructure.length - 1;
         }

         const ageGroup = { ...pricingStructure[ageGroupIdx] };
         const terms = [...ageGroup.terms];
         
         // Find or create term pricing
         const termIdx = terms.findIndex(t => t.subscription_term_id === termId);
         if (termIdx === -1) {
             terms.push({
                 subscription_term_id: termId,
                 term_name: termName,
                 price: priceNum
             });
         } else {
             terms[termIdx] = { ...terms[termIdx], price: priceNum };
         }

         ageGroup.terms = terms;
         pricingStructure[ageGroupIdx] = ageGroup;
         
         return { ...prev, pricing_structure: pricingStructure };
     });
  };

  const handleSave = () => {
      if (formData) {
          onSave(formData);
      }
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto', bgcolor: '#fbfcfd' }}>
      {/* 1. Header Box */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 1, 
            border: '1px solid', 
            borderColor: '#e2e8f0',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: 'background.paper'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {isNew ? 'New Service' : 'Service Detail'}
        </Typography>
        <Button
          variant="contained"
          disableElevation
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ 
              bgcolor: '#1e293b', 
              borderRadius: 1,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#0f172a' } 
          }}
        >
          Save Changes
        </Button>
      </Paper>

      {/* 2. Details Box */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 1, 
            border: '1px solid', 
            borderColor: '#e2e8f0',
            bgcolor: 'background.paper' 
        }}
      >
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    SERVICE NAME
                </Typography>
                <TextField
                  fullWidth
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Swimming Class"
                />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pt: 3 }}>
                <Typography variant="body2" sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Active Status</Typography>
                <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    color="success"
                />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    DESCRIPTION
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Service description..."
                />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    TYPE
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                    {dropdownOptions.serviceType.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    SERVICE TYPE
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={formData.service_type}
                  onChange={(e) => handleChange('service_type', e.target.value)}
                >
                    {dropdownOptions.serviceCategory.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

        </Grid>
      </Paper>

      {/* 3. Pricing Box */}
      <Paper 
        elevation={0} 
        sx={{ 
            borderRadius: 1, 
            border: '1px solid', 
            borderColor: '#e2e8f0', 
            overflow: 'hidden',
            bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
              SERVICE FEE
            </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'transparent', borderBottom: '1px solid', borderColor: '#e2e8f0', py: 1.5 }}>Age Group / Subscription Term</TableCell>
                {subscriptionTerms.map(term => (
                    <TableCell key={term.subscription_term_id || term.id} align="center" sx={{ fontWeight: 600, bgcolor: 'transparent', borderBottom: '1px solid', borderColor: '#e2e8f0' }}>
                        {term.name}
                    </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ageGroups.map((ag) => {
                  const ageGroupId = ag.age_group_id || ag.id || '';
                  const ageGroupName = ag.name;
                  const ageGroupPricing = formData.pricing_structure.find(p => p.age_group_id === ageGroupId);
                  
                  return (
                    <TableRow key={ageGroupId} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 500, py: 2 }}>
                        {ageGroupName}
                      </TableCell>
                      {subscriptionTerms.map(st => {
                        const termId = st.subscription_term_id || st.id || '';
                        const termName = st.name;
                        const pricingTerm = ageGroupPricing?.terms.find(t => t.subscription_term_id === termId);
                        
                        return (
                          <TableCell key={termId} align="center">
                            <TextField
                                type="number"
                                size="small"
                                placeholder="0.00"
                                value={pricingTerm?.price ?? ''}
                                onChange={(e) => handlePriceChange(ageGroupId, ageGroupName, termId, termName, e.target.value)}
                                sx={{ 
                                    width: 120,
                                    backgroundColor: 'white',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1 
                                    }
                                }}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: '0.8rem', color: 'text.secondary' } }}>$</InputAdornment>,
                                }}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
