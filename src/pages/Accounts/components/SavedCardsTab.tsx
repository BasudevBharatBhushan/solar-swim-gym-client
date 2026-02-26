import { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Grid, Chip, Stack, Alert } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import StarIcon from '@mui/icons-material/Star';
import { billingService } from '../../../services/billingService';
import { useAuth } from '../../../context/AuthContext';

interface SavedCard {
  id: string;
  account_id: string;
  vault_token: string;
  card_brand: string;
  last4_digits: string;
  expiry_mm_yy: string;
  is_default: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SavedCardsTabProps {
  accountId: string;
}

export const SavedCardsTab = ({ accountId }: SavedCardsTabProps) => {
  const { currentLocationId } = useAuth();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      if (!accountId || !currentLocationId) return;
      setLoading(true);
      try {
        const response = await billingService.getSavedCards(accountId, currentLocationId);
        setCards(response || []);
      } catch (err: any) {
        console.error("Failed to fetch saved cards", err);
        setError(err.message || "Failed to load saved cards");
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [accountId, currentLocationId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>;
  }

  if (cards.length === 0) {
    return (
      <Box 
        sx={{ 
          textAlign: 'center', 
          py: 12,
          px: 3,
          borderRadius: '16px',
          bgcolor: '#f8fafc',
          border: '2px dashed #e2e8f0'
        }}
      >
        <Box 
          sx={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            bgcolor: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <CreditCardIcon sx={{ fontSize: 40, color: '#cbd5e1' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#475569', mb: 1 }}>
          No Saved Cards Found
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 400, mx: 'auto' }}>
          When this account adds a payment method during checkout or via a payment link, it will appear here for future use.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                Saved Payment Methods
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
                Securely stored cards for quick checkout and automated billing.
            </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, md: 6 }} key={card.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '20px',
                border: '1.5px solid',
                borderColor: card.is_default ? '#3b82f6' : '#e2e8f0',
                background: card.is_default 
                  ? 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)' 
                  : '#ffffff',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)',
                  borderColor: card.is_default ? '#2563eb' : '#cbd5e1',
                }
              }}
            >
              {card.is_default && (
                <Chip
                  icon={<StarIcon sx={{ fontSize: '12px !important', color: '#ffffff !important' }} />}
                  label="PRIMARY"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    bgcolor: '#3b82f6',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    height: 24,
                    px: 0.5,
                    '& .MuiChip-icon': { ml: 0.5 }
                  }}
                />
              )}
              
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Box
                  sx={{
                    width: 60,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CreditCardIcon sx={{ fontSize: 28 }} />
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>
                    {card.card_brand} <span style={{ color: '#94a3b8', margin: '0 4px' }}>•</span> •••• {card.last4_digits}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Expires {card.expiry_mm_yy.slice(0, 2)}/20{card.expiry_mm_yy.slice(2)}
                    </Typography>
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: card.status === 'ACTIVE' ? '#10b981' : '#ef4444', 
                            fontWeight: 700,
                            bgcolor: card.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                            px: 1,
                            py: 0.25,
                            borderRadius: '4px'
                        }}
                    >
                        {card.status}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
              
              {/* Subtle background decoration */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  bottom: -20, 
                  right: -20, 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%', 
                  bgcolor: card.is_default ? '#3b82f608' : '#f1f5f980', 
                  zIndex: 0 
                }} 
              />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
