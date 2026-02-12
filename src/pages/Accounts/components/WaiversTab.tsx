
import { useCallback, useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../../../context/AuthContext';
import { waiverService, SignedWaiver } from '../../../services/waiverService';
import { Profile } from '../../../types';

interface WaiversTabProps {
  profiles: Profile[];
  selectedProfileId: string | null;
}

export const WaiversTab = ({ profiles, selectedProfileId }: WaiversTabProps) => {
  const { currentLocationId } = useAuth();
  const [waivers, setWaivers] = useState<SignedWaiver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWaiver, setSelectedWaiver] = useState<SignedWaiver | null>(null);

  const getErrorMessage = useCallback((err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallback;
  }, []);

  useEffect(() => {
    const fetchWaivers = async () => {
      if (!currentLocationId) return;
      
      setLoading(true);
      setError(null);
      setWaivers([]);

      try {
        let profilesToFetch = [];
        if (selectedProfileId) {
            profilesToFetch = profiles.filter(p => p.profile_id === selectedProfileId);
        } else {
            profilesToFetch = profiles;
        }

        if (profilesToFetch.length === 0) {
            setLoading(false);
            return;
        }

        // Fetch waivers for each relevant profile
        const promises = profilesToFetch.map(p => 
            waiverService.getSignedWaivers(p.profile_id, currentLocationId)
                .then(res => res.data || [])
                .catch(err => {
                    console.error(`Failed to fetch waivers for profile ${p.profile_id}`, err);
                    return [] as SignedWaiver[];
                })
        );

        const results = await Promise.all(promises);
        // Flatten and sort by signed_at descending
        const allWaivers = results.flat().sort((a, b) => 
            new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime()
        );
        
        setWaivers(allWaivers);

      } catch (err: unknown) {
        console.error("Failed to fetch waivers", err);
        setError(getErrorMessage(err, "Failed to load waivers."));
      } finally {
        setLoading(false);
      }
    };

    fetchWaivers();
  }, [selectedProfileId, currentLocationId, profiles, getErrorMessage]);

  const handleViewWaiver = useCallback((waiver: SignedWaiver) => {
    setSelectedWaiver(waiver);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedWaiver(null);
  }, []);

  const handleViewWaiverClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const signedWaiverId = event.currentTarget.dataset.signedWaiverId;
    if (!signedWaiverId) return;
    const waiver = waivers.find(item => item.signed_waiver_id === signedWaiverId);
    if (!waiver) return;
    handleViewWaiver(waiver);
  }, [handleViewWaiver, waivers]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const getProfileName = (profileId: string) => {
     const profile = profiles.find(p => p.profile_id === profileId);
     return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Profile';
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (waivers.length === 0) {
     return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No signed waivers found.</Typography>
        </Box>
     );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Signed Waivers</Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                    <TableCell>Waiver Type</TableCell>
                    <TableCell>Signed By</TableCell>
                    <TableCell>Signed Date</TableCell>
                    <TableCell>Signature</TableCell>
                    <TableCell align="right">Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {waivers.map((waiver) => (
                    <TableRow key={waiver.signed_waiver_id} hover>
                        <TableCell>
                            <Chip 
                                label={waiver.waiver_type || 'General'} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                                sx={{ fontWeight: 600 }}
                            />
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2">{getProfileName(waiver.profile_id)}</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2">
                                {new Date(waiver.signed_at).toLocaleDateString()} {new Date(waiver.signed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </Typography>
                        </TableCell>
                         <TableCell>
                            {waiver.signature_url ? (
                                <img src={waiver.signature_url} alt="Signature" style={{ height: 40, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#fff' }} />
                            ) : (
                                <Typography variant="caption" color="text.secondary">No Image</Typography>
                            )}
                        </TableCell>
                        <TableCell align="right">
                            <Button 
                                startIcon={<VisibilityIcon />} 
                                size="small" 
                                onClick={handleViewWaiverClick}
                                data-signed-waiver-id={waiver.signed_waiver_id}
                            >
                                View
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </TableContainer>

      {/* Waiver Content Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
            Signed Waiver Content
            <Typography variant="subtitle2" color="text.secondary">
                Signed by {selectedWaiver ? getProfileName(selectedWaiver.profile_id) : ''} on {selectedWaiver ? new Date(selectedWaiver.signed_at).toLocaleString() : ''}
            </Typography>
        </DialogTitle>
        <DialogContent dividers>
            {selectedWaiver && (
                <Box dangerouslySetInnerHTML={{ __html: selectedWaiver.content }} />
            )}
             {selectedWaiver?.signature_url && (
                <Box sx={{ mt: 4, borderTop: '1px solid #eee', pt: 2 }}>
                    <Typography variant="caption" display="block" color="text.secondary" gutterBottom>Signature</Typography>
                    <img src={selectedWaiver.signature_url} alt="Signature" style={{ maxHeight: 80 }} />
                </Box>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            <Button onClick={handlePrint} color="primary">Print</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
