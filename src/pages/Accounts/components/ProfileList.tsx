
import { List, ListItemButton, ListItemText, ListItemAvatar, Avatar, Paper, Typography, Box, Chip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';
import { useConfig } from '../../../context/ConfigContext';
import { getAgeGroupName } from '../../../lib/ageUtils';

interface ProfileListProps {
  profiles: any[];
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
}

export const ProfileList = ({ profiles, selectedProfileId, onSelectProfile }: ProfileListProps) => {
  const { ageGroups } = useConfig();

  // Sort: primary first
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  });

  return (
    <Paper 
      elevation={0}
      sx={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        border: '1px solid #e2e8f0',
        bgcolor: '#ffffff'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight="800" color="#1e293b" sx={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Members
        </Typography>
        <Chip label={profiles.length} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem', bgcolor: '#e2e8f0' }} />
      </Box>
      <List sx={{ p: 0 }}>
        <ListItemButton
          selected={selectedProfileId === null}
          onClick={() => onSelectProfile(null as any)}
          sx={{
            py: 2,
            px: 2,
            borderBottom: '1px solid #f8fafc',
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              bgcolor: '#f0f9ff',
              '&:hover': { bgcolor: '#e0f2fe' },
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                bgcolor: '#0ea5e9'
              }
            }
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: selectedProfileId === null ? '#0ea5e9' : '#94a3b8', width: 40, height: 40 }}>
              <PeopleIcon sx={{ fontSize: '1.2rem' }} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={<Typography variant="body2" fontWeight={700} color={selectedProfileId === null ? '#0369a1' : '#1e293b'}>All Members</Typography>}
            secondary={<Typography variant="caption" sx={{ color: '#64748b' }}>Consolidated overview</Typography>}
          />
        </ListItemButton>

        {sortedProfiles.map((profile) => {
          const isSelected = selectedProfileId === profile.profile_id;
          return (
            <ListItemButton
              key={profile.profile_id}
              selected={isSelected}
              onClick={() => onSelectProfile(profile.profile_id)}
              sx={{
                py: 2,
                px: 2,
                borderBottom: '1px solid #f8fafc',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: '#f0f9ff',
                  '&:hover': { bgcolor: '#e0f2fe' },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    bgcolor: profile.is_primary ? '#0ea5e9' : '#6366f1'
                  }
                }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: isSelected ? (profile.is_primary ? '#0ea5e9' : '#6366f1') : '#f1f5f9', color: isSelected ? '#fff' : '#64748b', width: 40, height: 40 }}>
                  <PersonIcon sx={{ fontSize: '1.2rem' }} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                     <Typography variant="body2" fontWeight={700} color={isSelected ? '#0369a1' : '#1e293b'}>
                       {profile.first_name} {profile.last_name}
                     </Typography>
                     {profile.is_primary && <StarIcon sx={{ fontSize: 14, color: '#f59e0b' }} />}
                  </Box>
                }
                secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.25 }}>
                       <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                          {getAgeGroupName(profile.date_of_birth, ageGroups)}
                      </Typography>
                    </Box>
               }
              />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
};
