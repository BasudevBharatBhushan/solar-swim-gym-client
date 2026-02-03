import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  InputAdornment
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { Service, AgeGroupPricing } from '../../types/service';
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
    <Box sx={{ p: 3, height: '100%', overflow: 'auto', bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" color="text.primary" fontWeight={600}>
          {isNew ? 'New Service' : 'Edit Service'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disableElevation
        >
          Save Changes
        </Button>
      </Box>

      {/* Main Details Form */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 3, mb: 4 }}>
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
          <TextField
            fullWidth
            label="Service Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' }, display: 'flex', alignItems: 'center' }}>
           <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                color="primary"
              />
            }
            label="Active Status"
          />
        </Box>
        <Box sx={{ gridColumn: 'span 12' }}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <TextField
            select
            fullWidth
            label="Type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            {dropdownOptions.serviceType.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <TextField
            select
            fullWidth
            label="Service Type"
            value={formData.service_type}
            onChange={(e) => handleChange('service_type', e.target.value)}
          >
            {dropdownOptions.serviceCategory.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' }, display: 'flex', alignItems: 'center' }}>
           <FormControlLabel
            control={
              <Switch
                checked={formData.is_addon_only || false}
                onChange={(e) => handleChange('is_addon_only', e.target.checked)}
                color="secondary"
              />
            }
            label="Is Add-On Only?"
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Pricing Structure - PIVOT TABLE GRID */}
      <Box sx={{ bgcolor: '#FFB6C1', p: 2, borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#333' }}>
          SERVICE FEE (if Opted as Add ON)
        </Typography>
        
        {ageGroups.length === 0 || subscriptionTerms.length === 0 ? (
             <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    No age groups or subscription terms configured. Please configure them in Settings.
                </Typography>
             </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '2px solid #FF8C00' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#FFD700' }}>
                  <TableCell sx={{ fontWeight: 900, borderRight: '1px solid #FF8C00', color: '#000' }}>
                    Age Group / Subscription Term
                  </TableCell>
                  {subscriptionTerms.map(term => (
                    <TableCell 
                        key={term.subscription_term_id || term.id} 
                        align="center" 
                        sx={{ fontWeight: 900, color: '#000' }}
                    >
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
                    <TableRow key={ageGroupId}>
                      <TableCell sx={{ bgcolor: '#FFE4B5', fontWeight: 700, borderRight: '1px solid #FF8C00' }}>
                        {ageGroupName}
                      </TableCell>
                      {subscriptionTerms.map(st => {
                        const termId = st.subscription_term_id || st.id || '';
                        const termName = st.name;
                        const pricingTerm = ageGroupPricing?.terms.find(t => t.subscription_term_id === termId);
                        
                        return (
                          <TableCell key={termId} align="center" sx={{ bgcolor: '#FFE4B5' }}>
                            <TextField
                              type="number"
                              size="small"
                              value={pricingTerm?.price ?? ''}
                              placeholder="0.00"
                              onChange={(e) => handlePriceChange(ageGroupId, ageGroupName, termId, termName, e.target.value)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                              sx={{ 
                                  width: '110px',
                                  '& .MuiInputBase-root': { bgcolor: 'white' }
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
        )}
      </Box>
    </Box>
  );
};
