import { useState } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { ClientOnboardingModal } from './ClientOnboarding/ClientOnboardingModal';
import { PageHeader } from '../../components/Common/PageHeader';

export const Accounts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleSuccess = () => {
      console.log("Onboarding Success - Refresh list");
      // TODO: Refresh list
  };

  return (
    <Box>
      <PageHeader
        title="Accounts"
        description="Manage client accounts and memberships"
        breadcrumbs={[
            { label: 'Dashboard', href: '/admin/settings' },
            { label: 'Accounts', active: true }
        ]}
        action={
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenModal}
              sx={{
                bgcolor: '#0f172a',
                '&:hover': { bgcolor: '#334155' },
                textTransform: 'none',
                borderRadius: '8px',
                px: 3
              }}
            >
              Add Client
            </Button>
        }
      />

      {/* Placeholder for Accounts Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
             <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                    No accounts found. Click "Add Client" to create one.
                </TableCell>
             </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <ClientOnboardingModal 
        open={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={handleSuccess}
      />
    </Box>
  );
};
