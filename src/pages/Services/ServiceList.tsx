import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { Service } from '../../types/service';

interface ServiceListProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelectService: (service: Service) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  services,
  selectedServiceId,
  onSelectService,
}) => {
  return (
    <Paper elevation={0} sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
         <Typography variant="h6" fontWeight={600} color="text.primary">
            Services
         </Typography>
      </Box>
      <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Service Name</TableCell>
              <TableCell align="right" width={100}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow
                key={service.service_id}
                hover
                onClick={() => onSelectService(service)}
                selected={service.service_id === selectedServiceId}
                sx={{
                  cursor: 'pointer',
                  '&.Mui-selected': {
                    backgroundColor: '#FFE4B5',
                    '&:hover': {
                      backgroundColor: '#FFE4B5',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 228, 181, 0.5)',
                  },
                }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight={500}>
                    {service.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {service.type} • {service.service_type}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip
                    icon={<CircleIcon sx={{ fontSize: '10px !important' }} />}
                    label={service.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={service.is_active ? 'success' : 'default'} // success usually green, maybe too bright?
                    variant="outlined"
                    sx={{
                       height: 24,
                       borderColor: service.is_active ? 'success.main' : 'text.disabled',
                       color: service.is_active ? 'success.main' : 'text.disabled',
                       '& .MuiChip-icon': {
                         color: 'inherit'
                       }
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
            {services.length === 0 && (
                <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">No services found</Typography>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
