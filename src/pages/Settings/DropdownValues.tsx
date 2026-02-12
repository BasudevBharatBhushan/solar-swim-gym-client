import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Autocomplete,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import { dropdownService, DropdownValue } from '../../services/dropdownService';
import { PageHeader } from '../../components/Common/PageHeader';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';

interface DropdownFormData {
  dropdown_id?: string;
  module: string;
  label: string;
  value: string;
}

const initialFormData: DropdownFormData = {
  module: '',
  label: '',
  value: ''
};

export const DropdownValues = () => {
  const { dropdownValues, refreshDropdownValues } = useConfig();
  const { currentLocationId } = useAuth();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DropdownFormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentLocationId) {
      refreshDropdownValues();
    }
  }, [currentLocationId, refreshDropdownValues]);
  
  // Group values by Module -> Label
  const groupedValues = useMemo(() => {
    const groups: Record<string, Record<string, DropdownValue[]>> = {};
    
    dropdownValues.forEach(item => {
      if (!groups[item.module]) {
        groups[item.module] = {};
      }
      if (!groups[item.module][item.label]) {
        groups[item.module][item.label] = [];
      }
      groups[item.module][item.label].push(item);
    });
    
    return groups;
  }, [dropdownValues]);

  // Get unique modules for autocomplete
  const modules = useMemo(() => {
    return Array.from(new Set(dropdownValues.map(v => v.module)));
  }, [dropdownValues]);

  // Get unique labels for current module in autocomplete
  const getLabelsForModule = useCallback((module: string) => {
    return Array.from(new Set(dropdownValues.filter(v => v.module === module).map(v => v.label)));
  }, [dropdownValues]);

  const handleOpenDialog = useCallback((item?: DropdownValue, prefill?: { module: string, label: string }) => {
    if (item) {
      setFormData({
        dropdown_id: item.dropdown_id,
        module: item.module,
        label: item.label,
        value: item.value
      });
    } else if (prefill) {
      setFormData({
        ...initialFormData,
        module: prefill.module,
        label: prefill.label
      });
    } else {
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setFormData(initialFormData);
  }, []);

  const handleOpenEmptyDialog = useCallback(() => {
    handleOpenDialog();
  }, [handleOpenDialog]);

  const handleOpenPrefilledDialog = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const module = event.currentTarget.dataset.module;
    const label = event.currentTarget.dataset.label;
    if (!module || !label) return;
    handleOpenDialog(undefined, { module, label });
  }, [handleOpenDialog]);

  const handleEditClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const dropdownId = event.currentTarget.dataset.dropdownId;
    if (!dropdownId) return;
    const item = dropdownValues.find(v => v.dropdown_id === dropdownId);
    if (!item) return;
    handleOpenDialog(item);
  }, [dropdownValues, handleOpenDialog]);

  const handleSubmit = useCallback(async () => {
    if (!currentLocationId) return;
    
    try {
      setLoading(true);
      await dropdownService.upsert(formData, currentLocationId);
      await refreshDropdownValues();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save dropdown value:', error);
      // Could add toast notification here
    } finally {
      setLoading(false);
    }
  }, [currentLocationId, formData, refreshDropdownValues, handleCloseDialog]);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleDeleteButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const dropdownId = event.currentTarget.dataset.dropdownId;
    if (!dropdownId) return;
    handleDeleteClick(dropdownId);
  }, [handleDeleteClick]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteId(null);
  }, []);

  const handleModuleChange = useCallback((_: React.SyntheticEvent, newValue: string | null) => {
    setFormData(prev => ({ ...prev, module: newValue || '' }));
  }, []);

  const handleModuleInputChange = useCallback((_: React.SyntheticEvent, newInputValue: string) => {
    setFormData(prev => ({ ...prev, module: newInputValue }));
  }, []);

  const handleLabelChange = useCallback((_: React.SyntheticEvent, newValue: string | null) => {
    setFormData(prev => ({ ...prev, label: newValue || '' }));
  }, []);

  const handleLabelInputChange = useCallback((_: React.SyntheticEvent, newInputValue: string) => {
    setFormData(prev => ({ ...prev, label: newInputValue }));
  }, []);

  const handleValueChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, value: event.target.value }));
  }, []);

  const renderModuleInput = useCallback((params: AutocompleteRenderInputParams) => (
    <TextField 
      {...params} 
      label="Module" 
      fullWidth 
      required 
      placeholder="e.g. Services"
      helperText="Select existing or type new module name"
    />
  ), []);

  const renderLabelInput = useCallback((params: AutocompleteRenderInputParams) => (
    <TextField 
      {...params} 
      label="Label" 
      fullWidth 
      required 
      placeholder="e.g. Category"
      helperText="Select existing or type new label name"
    />
  ), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!currentLocationId || !deleteId) return;

    try {
      setLoading(true);
      await dropdownService.delete(deleteId, currentLocationId);
      await refreshDropdownValues();
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete dropdown value:', error);
    } finally {
      setLoading(false);
    }
  }, [currentLocationId, deleteId, refreshDropdownValues]);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title="Dropdown Management" 
        description="Manage configurable dropdown values for the application"
        breadcrumbs={[
            { label: 'Settings', href: '/admin/settings' },
            { label: 'Dropdown Values', active: true }
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenEmptyDialog}
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
              textTransform: 'none',
              px: 3
            }}
          >
            Add New Value
          </Button>
        }
      />

      {Object.entries(groupedValues).map(([moduleName, moduleLabels]) => (
        <Accordion key={moduleName} defaultExpanded sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 2, '&:before': { display: 'none' }, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#334155' }}>
                {moduleName}
              </Typography>
              <Chip 
                size="small" 
                label={`${Object.values(moduleLabels).reduce((acc: number, curr: DropdownValue[]) => acc + curr.length, 0)} items`} 
                sx={{ bgcolor: '#f1f5f9', color: '#64748b' }} 
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            {Object.entries(moduleLabels).map(([labelName, values], index) => (
              <Box key={labelName}>
                {index > 0 && <Box sx={{ my: 4, height: '1px', background: 'linear-gradient(to right, transparent, #e2e8f0 10%, #e2e8f0 90%, transparent)' }} />}
                
                <Box sx={{ 
                  borderRadius: 2,
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    bgcolor: '#f8fafc',
                    px: 2.5,
                    py: 1.5,
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      color: '#475569', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.12em',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}>
                      {labelName}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon sx={{ fontSize: '1rem !important' }} />}
                      onClick={handleOpenPrefilledDialog}
                      data-module={moduleName}
                      data-label={labelName}
                      sx={{ 
                        textTransform: 'none', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        color: '#3b82f6',
                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.08)' }
                      }}
                    >
                      Add Value
                    </Button>
                  </Box>
                  <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                    <Table size="small">
                      <TableBody>
                        {values.map((item) => (
                          <TableRow key={item.dropdown_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ pl: 3, py: 1.5, fontWeight: 500, color: '#334155' }}>{item.value}</TableCell>
                            <TableCell align="right" sx={{ width: 100, pr: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={handleEditClick} data-dropdown-id={item.dropdown_id} sx={{ color: '#94a3b8', '&:hover': { color: '#3b82f6' } }}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton size="small" onClick={handleDeleteButtonClick} data-dropdown-id={item.dropdown_id} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {Object.keys(groupedValues).length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8, 
          bgcolor: '#f8fafc', 
          borderRadius: 2, 
          border: '2px dashed #e2e8f0' 
        }}>
          <Typography color="text.secondary">No dropdown values found. Click "Add New Value" to create one.</Typography>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
          {formData.dropdown_id ? 'Edit Value' : 'Add New Value'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Autocomplete
              freeSolo
              options={modules}
              value={formData.module}
              onChange={handleModuleChange}
              onInputChange={handleModuleInputChange}
              renderInput={renderModuleInput}
            />
            
            <Autocomplete
              freeSolo
              options={formData.module ? getLabelsForModule(formData.module) : []}
              value={formData.label}
              onChange={handleLabelChange}
              onInputChange={handleLabelInputChange}
              renderInput={renderLabelInput}
            />

            <TextField
              label="Value"
              fullWidth
              required
              value={formData.value}
              onChange={handleValueChange}
              placeholder="e.g. Training"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e2e8f0', p: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!formData.module || !formData.label || !formData.value || loading}
            sx={{ bgcolor: '#3b82f6' }}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this value? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
