
import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { crmService } from '../../../services/crmService';
import { useAuth } from '../../../context/AuthContext';

export const ReindexButton = () => {
  const [loading, setLoading] = useState(false);
  const { currentLocationId } = useAuth();
  const locationId = currentLocationId;

  const handleReindex = async () => {
    if (!locationId) return;
    setLoading(true);
    try {
      await crmService.reindexAccounts(locationId);
      // Optional: Show toast success
      alert('Reindex started successfully');
    } catch (error) {
      console.error("Reindex failed", error);
      alert('Reindex failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      startIcon={loading ? <CircularProgress size={20} /> : <SyncIcon />}
      onClick={handleReindex}
      disabled={loading}
      sx={{ mr: 2, textTransform: 'none', borderColor: '#cbd5e1', color: '#64748b' }}
    >
      {loading ? 'Reindexing...' : 'Reindex Accounts'}
    </Button>
  );
};
