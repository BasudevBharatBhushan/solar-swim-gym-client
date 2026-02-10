
import { List, ListItemButton, ListItemText, ListItemAvatar, Avatar, Paper, Typography, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
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
    <Paper sx={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
        <Typography variant="subtitle1" fontWeight="600" color="#334155">
          Family Members
        </Typography>
      </Box>
      <List sx={{ p: 0 }}>
        <ListItemButton
          selected={selectedProfileId === null}
          onClick={() => onSelectProfile(null as any)}
          sx={{
            borderBottom: '1px solid #f1f5f9',
            '&.Mui-selected': {
              bgcolor: '#eff6ff',
              '&:hover': { bgcolor: '#dbeafe' },
              borderLeft: '4px solid #3b82f6'
            }
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: '#64748b' }}>
              <StarIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={<Typography variant="body1" fontWeight={600}>All Members</Typography>}
            secondary="View all subscriptions"
          />
        </ListItemButton>

        {sortedProfiles.map((profile) => (
          <ListItemButton
            key={profile.profile_id}
            selected={selectedProfileId === profile.profile_id}
            onClick={() => onSelectProfile(profile.profile_id)}
            sx={{
              borderBottom: '1px solid #f1f5f9',
              '&.Mui-selected': {
                bgcolor: '#eff6ff',
                '&:hover': { bgcolor: '#dbeafe' },
                borderLeft: '4px solid #3b82f6'
              }
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: profile.is_primary ? '#3b82f6' : '#94a3b8' }}>
                <PersonIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                   <Typography variant="body1" fontWeight={500}>
                     {profile.first_name} {profile.last_name}
                   </Typography>
                   {profile.is_primary && <StarIcon sx={{ fontSize: 16, color: '#f59e0b' }} />}
                </Box>
              }
              secondary={
                  <>
                    <Typography variant="caption" display="block">
                        DOB: {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {getAgeGroupName(profile.date_of_birth, ageGroups)}
                    </Typography>
                  </>
             }
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
};
