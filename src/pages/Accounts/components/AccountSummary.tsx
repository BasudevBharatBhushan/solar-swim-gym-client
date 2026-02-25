import { Box, Paper, Typography, Chip, Grid, Stack, Button, Tooltip, CircularProgress } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CampaignIcon from '@mui/icons-material/Campaign';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { useState } from 'react';

interface AccountSummaryProps {
  account: any;
  onStoreClick?: () => void;
  selectedProfileId?: string | null;
  onToggleNotification?: (field: 'notify_primary_member' | 'notify_guardian', value: boolean) => Promise<void>;
  cartCount?: number;
}

export const AccountSummary = ({ account, onStoreClick, selectedProfileId, onToggleNotification, cartCount = 0 }: AccountSummaryProps) => {
  const [togglingField, setTogglingField] = useState<string | null>(null);

  const handleNotificationToggle = async (field: 'notify_primary_member' | 'notify_guardian', currentValue: boolean) => {
    if (!onToggleNotification || togglingField) return;
    setTogglingField(field);
    try {
      await onToggleNotification(field, !currentValue);
    } finally {
      setTogglingField(null);
    }
  };

  if (!account) return null;

  const primaryProfile = account.primary_profile || (account.profiles && account.profiles.find((p: any) => p.is_primary));
  const name = primaryProfile ? `${primaryProfile.first_name} ${primaryProfile.last_name}` : 'Unknown';
  const email = primaryProfile?.email || 'N/A';
  const memberCount = account.profiles?.length || 0;

  // The profile currently selected in the left panel
  const selectedProfile = selectedProfileId
    ? account.profiles?.find((p: any) => p.profile_id === selectedProfileId)
    : null;
  const isViewingNonPrimary = selectedProfile && !selectedProfile.is_primary;
  const selectedName = selectedProfile ? `${selectedProfile.first_name} ${selectedProfile.last_name}` : null;

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(to right, #ffffff, #f8fafc)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          bgcolor: account.status === 'ACTIVE' ? '#10b981' : account.status === 'PENDING' ? '#f59e0b' : '#94a3b8'
        }
      }}
    >
      <Grid container spacing={3} alignItems="center">
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h4" fontWeight="800" color="#1e293b" sx={{ letterSpacing: '-0.5px' }}>
              {name}
            </Typography>
            <Chip 
              label={account.status} 
              size="small" 
              color={account.status === 'ACTIVE' ? 'success' : account.status === 'PENDING' ? 'warning' : 'default'}
              sx={{ fontWeight: 700, px: 1 }}
            />
            {/* Show which profile is active — only visible when a non-primary is selected */}
            {isViewingNonPrimary && selectedName && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 0.35,
                  borderRadius: '20px',
                  bgcolor: '#eff6ff',
                  border: '1.5px solid #93c5fd',
                }}
              >
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#3b82f6', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                  {selectedName}
                </Typography>
              </Box>
            )}
          </Stack>
          
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon sx={{ fontSize: '1rem', color: '#64748b' }} />
              <Typography variant="body2" color="#64748b" fontWeight={500}>
                {email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon sx={{ fontSize: '1rem', color: '#64748b' }} />
              <Typography variant="body2" color="#64748b" fontWeight={500}>
                {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonthIcon sx={{ fontSize: '1rem', color: '#64748b' }} />
              <Typography variant="body2" color="#64748b" fontWeight={500}>
                Account Since {new Date(account.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
            {account.heard_about_us && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CampaignIcon sx={{ fontSize: '1rem', color: '#64748b' }} />
                  <Typography variant="body2" color="#64748b" fontWeight={500}>
                    Source: {account.heard_about_us}
                  </Typography>
                </Box>
            )}
            {/* Notify Primary Member Toggle */}
            <Tooltip title={account.notify_primary_member !== false ? 'Click to disable primary member notifications' : 'Click to enable primary member notifications'} arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '20px',
                  bgcolor: account.notify_primary_member !== false ? '#f0fdf4' : '#fef2f2',
                  border: `1.5px solid ${account.notify_primary_member !== false ? '#86efac' : '#fca5a5'}`,
                  cursor: onToggleNotification ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  '&:hover': onToggleNotification ? {
                    opacity: 0.8,
                    transform: 'scale(1.02)',
                  } : {},
                }}
                onClick={() => handleNotificationToggle('notify_primary_member', account.notify_primary_member !== false)}
              >
                {togglingField === 'notify_primary_member' ? (
                  <CircularProgress size={12} sx={{ color: '#64748b' }} />
                ) : account.notify_primary_member !== false ? (
                  <NotificationsActiveIcon sx={{ fontSize: '0.85rem', color: '#16a34a' }} />
                ) : (
                  <NotificationsOffIcon sx={{ fontSize: '0.85rem', color: '#dc2626' }} />
                )}
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: account.notify_primary_member !== false ? '#15803d' : '#b91c1c', whiteSpace: 'nowrap' }}>
                  Primary: {account.notify_primary_member !== false ? 'On' : 'Off'}
                </Typography>
              </Box>
            </Tooltip>

            {/* Notify Guardian Toggle */}
            <Tooltip title={account.notify_guardian !== false ? 'Click to disable guardian notifications' : 'Click to enable guardian notifications'} arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '20px',
                  bgcolor: account.notify_guardian !== false ? '#f0fdf4' : '#fef2f2',
                  border: `1.5px solid ${account.notify_guardian !== false ? '#86efac' : '#fca5a5'}`,
                  cursor: onToggleNotification ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  '&:hover': onToggleNotification ? {
                    opacity: 0.8,
                    transform: 'scale(1.02)',
                  } : {},
                }}
                onClick={() => handleNotificationToggle('notify_guardian', account.notify_guardian !== false)}
              >
                {togglingField === 'notify_guardian' ? (
                  <CircularProgress size={12} sx={{ color: '#64748b' }} />
                ) : account.notify_guardian !== false ? (
                  <NotificationsActiveIcon sx={{ fontSize: '0.85rem', color: '#16a34a' }} />
                ) : (
                  <NotificationsOffIcon sx={{ fontSize: '0.85rem', color: '#dc2626' }} />
                )}
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: account.notify_guardian !== false ? '#15803d' : '#b91c1c', whiteSpace: 'nowrap' }}>
                  Guardian: {account.notify_guardian !== false ? 'On' : 'Off'}
                </Typography>
              </Box>
            </Tooltip>
          </Stack>
        </Grid>
        
        <Grid size={{ xs: 12, md: 5 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: { xs: 'flex-start', md: 'center' },
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              height: '100%',
              gap: 0.5
            }}
          >
            <Tooltip title="Go to marketplace to purchase memberships or services" arrow>
                <Button
                        variant="contained"
                        startIcon={<ShoppingCartIcon />}
                        onClick={onStoreClick}
                        sx={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            textTransform: 'none',
                            px: 4,
                            py: 1.5,
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: 'none',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: 'none',
                            },
                            '&:active': {
                                transform: 'translateY(0)',
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        Store
                    </Button>
            </Tooltip>
            {cartCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 1 }}>
                    {cartCount} item(s) in cart
                </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
