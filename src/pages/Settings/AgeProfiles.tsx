import { useEffect, useState } from 'react';
import axios from 'axios';
import { EditableTable, Column } from '../../components/Common/EditableTable';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { Alert, Snackbar } from '@mui/material';

// Config
const API_URL = 'http://localhost:3001/api/v1';

export const AgeProfiles = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const { token } = useAuth();
  const { refreshAgeGroups } = useConfig();

  const columns: Column[] = [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'min_age', label: 'Min Age', type: 'number' },
    { id: 'max_age', label: 'Max Age', type: 'number' },
  ];

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/config/age-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch age groups');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (updatedRow: any) => {
    try {
      // Prompt says "On save: Use the POST /config/age-groups API"
      // Assuming UPSERT or creating new logic. Usually POST creates new.
      // But typically for edits, we might need PUT. 
      // The prompt says: "On save: Use the POST /config/age-groups API... Do NOT deduplicate or auto-merge records".
      // This implies we might be sending just the one record? Or all? 
      // "Render exactly what backend sends".
      
      // If I am strictly following "Use POST /config/age-groups", I will send the specific payload.
      // If editing, ideally I'd use PUT/PATCH with ID, but if the API only exposes POST for everything (upsert style perhaps?), I'll use that.
      
      await axios.post(`${API_URL}/config/age-groups`, updatedRow, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Age group saved successfully');
      await fetchData(); // Refresh local data
      await refreshAgeGroups(); // Refresh global context
    } catch (err) {
      console.error(err);
      setError('Failed to save age group');
    }
  };

  const handleAdd = async (newRow: any) => {
    try {
      await axios.post(`${API_URL}/config/age-groups`, newRow, {
        headers: { Authorization: `Bearer ${token}` }
      });
       setSuccess('New age group added successfully');
      await fetchData();
      await refreshAgeGroups(); // Refresh global context
    } catch (err) {
      console.error(err);
      setError('Failed to add age group');
    }
  };

  return (
    <>
      <EditableTable
        title="Age Profiles"
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
