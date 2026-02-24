
import { List, ListItemButton, ListItemText, ListItemAvatar, Avatar, Paper, Typography, Box, Chip, Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';
import { useConfig } from '../../../context/ConfigContext';
import { getAgeGroup, getAgeRangeLabel } from '../../../lib/ageUtils';

import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface ProfileListProps {
  profiles: any[];
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  onAddMember: () => void;
}

export const ProfileList = ({ profiles, selectedProfileId, onSelectProfile, onAddMember }: ProfileListProps) => {
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <Chip label={profiles.length} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem', bgcolor: '#e2e8f0' }} />
           <Button
               startIcon={<PersonAddIcon sx={{ fontSize: '1.2rem !important' }} />}
               onClick={(e) => { e.stopPropagation(); onAddMember(); }}
               size="small"
               sx={{
                   textTransform: 'none',
                   fontWeight: 700,
                   fontSize: '0.75rem',
                   minWidth: 'auto',
                   px: 1,
                   color: '#3b82f6',
                   '&:hover': { bgcolor: '#eff6ff' }
               }}
           >
               Add
           </Button>
        </Box>
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
                     <Typography variant="body1" fontWeight={700} color={isSelected ? '#0369a1' : '#1e293b'} sx={{ fontSize: '0.95rem' }}>
                       {profile.first_name} {profile.last_name}
                     </Typography>
                     {profile.is_primary && <StarIcon sx={{ fontSize: 15, color: '#f59e0b' }} />}
                  </Box>
                }
                secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.25 }}>
                       {(() => {
                     const group = getAgeGroup(profile.date_of_birth, ageGroups, 'Membership');
                     if (!group) return <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>No Age Profile</Typography>;
                     return (
                       <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>
                         {group.name} {getAgeRangeLabel(group)}
                       </Typography>
                     );
                   })()}
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
