import { Box, Paper, Typography, Chip, Grid, Stack, Button, Tooltip } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CampaignIcon from '@mui/icons-material/Campaign';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

interface AccountSummaryProps {
  account: any;
  onStoreClick?: () => void;
  selectedProfileId?: string | null;
}

export const AccountSummary = ({ account, onStoreClick, selectedProfileId }: AccountSummaryProps) => {
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {account.notify_primary_member !== false ? <NotificationsIcon sx={{ fontSize: '1rem', color: '#64748b' }} /> : <NotificationsOffIcon sx={{ fontSize: '1rem', color: '#64748b' }} />}
              <Typography variant="body2" color="#64748b" fontWeight={500}>
                Primary Notifications: {account.notify_primary_member !== false ? 'Enabled' : 'Disabled'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {account.notify_guardian !== false ? <NotificationsIcon sx={{ fontSize: '1rem', color: '#64748b' }} /> : <NotificationsOffIcon sx={{ fontSize: '1rem', color: '#64748b' }} />}
              <Typography variant="body2" color="#64748b" fontWeight={500}>
                Guardian Notifications: {account.notify_guardian !== false ? 'Enabled' : 'Disabled'}
              </Typography>
            </Box>
          </Stack>
        </Grid>
        
        <Grid size={{ xs: 12, md: 5 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center',
              height: '100%'
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
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
