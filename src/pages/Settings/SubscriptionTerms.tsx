import { useEffect, useState } from 'react';
import axios from 'axios';
import { EditableTable, Column } from '../../components/Common/EditableTable';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { Alert, Snackbar, Typography, Box, Paper } from '@mui/material';

import { dropdownOptions } from '../../lib/dropdownOptions';

const API_URL = 'http://localhost:3001/api/v1';

export const SubscriptionTerms = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const { token, currentLocationId, locations } = useAuth();
  const { refreshSubscriptionTerms } = useConfig();
  const currentLocation = locations.find(l => l.location_id === currentLocationId);
  
  const columns: Column[] = [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'duration_months', label: 'Duration (Months)', type: 'number' },
    { id: 'payment_mode', label: 'Payment Mode', type: 'select', options: dropdownOptions.subscriptionTerms },
  ];

  const fetchData = async () => {
    if (!currentLocationId) return;

    try {
      const res = await axios.get(`${API_URL}/config/subscription-terms`, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'x-location-id': currentLocationId 
        }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch subscription terms');
    }
  };

  useEffect(() => {
    if (currentLocationId) {
        fetchData();
    } else {
        setData([]); // Clear data if no location selected
    }
  }, [currentLocationId]);

  const handleSave = async (updatedRow: any) => {
    if (!currentLocationId) {
        setError("Please select a location first.");
        return;
    }
    try {
      await axios.post(`${API_URL}/config/subscription-terms`, { ...updatedRow, location_id: currentLocationId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Subscription term saved');
      await fetchData();
      await refreshSubscriptionTerms(); // Refresh global context
    } catch (err) {
      console.error(err);
      setError('Failed to save subscription term');
    }
  };

  const handleAdd = async (newRow: any) => {
    if (!currentLocationId) {
        setError("Please select a location first.");
        return;
    }
    try {
      await axios.post(`${API_URL}/config/subscription-terms`, { ...newRow, location_id: currentLocationId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Term added');
      await fetchData();
      await refreshSubscriptionTerms(); // Refresh global context
    } catch (err) {
      console.error(err);
      setError('Failed to add term');
    }
  };

  if (!currentLocationId) {
      return (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <Paper sx={{ p: 3, bgcolor: '#fffbed', border: '1px solid #fcd34d' }}>
                  <Typography variant="body1" color="warning.main">
                      Please select a location from the top bar to view subscription terms.
                  </Typography>
              </Paper>
          </Box>
      );
  }

  return (
     <>
      <EditableTable
        title={`Subscription Terms - ${currentLocation?.name || 'Loading...'}`}
        columns={columns}
        data={data}
        onSave={handleSave}
        onAdd={handleAdd}
      />
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
       <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
    </>
  );
};
