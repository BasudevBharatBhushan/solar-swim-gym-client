
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, Chip, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

interface Account {
  account_id: string;
  primary_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  status: string;
  created_at: string;
  // Add other fields as needed
}

interface AccountTableProps {
  accounts: Account[];
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

export const AccountTable = ({ accounts, count, page, rowsPerPage, onPageChange, onRowsPerPageChange, loading }: AccountTableProps) => {
  const navigate = useNavigate();
  const handleViewAccount = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const accountId = event.currentTarget.dataset.accountId;
    if (!accountId) return;
    navigate(`/admin/accounts/${accountId}`);
  }, [navigate]);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569', bgcolor: '#f8fafc' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', bgcolor: '#f8fafc' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', bgcolor: '#f8fafc' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', bgcolor: '#f8fafc' }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', bgcolor: '#f8fafc' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
               <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
            ) : accounts.length === 0 ? (
               <TableRow><TableCell colSpan={5} align="center">No accounts found.</TableCell></TableRow>
            ) : (
                accounts.map((account) => {
                    const name = account.primary_profile ? `${account.primary_profile.first_name} ${account.primary_profile.last_name}` : 'Unknown';
                    const email = account.primary_profile?.email || 'N/A';
                    return (
                        <TableRow hover role="checkbox" tabIndex={-1} key={account.account_id}>
                        <TableCell>{name}</TableCell>
                        <TableCell>{email}</TableCell>
                        <TableCell>
                            <Chip 
                                label={account.status} 
                                size="small" 
                                color={account.status === 'ACTIVE' ? 'success' : account.status === 'PENDING' ? 'warning' : 'default'}
                                variant="outlined"
                            />
                        </TableCell>
                        <TableCell>{new Date(account.created_at).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                            <IconButton onClick={handleViewAccount} data-account-id={account.account_id}>
                                <VisibilityIcon color="action" />
                            </IconButton>
                        </TableCell>
                        </TableRow>
                    );
                })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={count}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Paper>
  );
};
