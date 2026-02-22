
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityIcon from '@mui/icons-material/Security';

interface ManagerPasscodeDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ManagerPasscodeDialog = ({ open, onClose, onSuccess }: ManagerPasscodeDialogProps) => {
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = () => {
        const correctPasscode = import.meta.env.VITE_MANAGER_PASSCODE;
        if (passcode === correctPasscode) {
            setError(false);
            setPasscode('');
            onSuccess();
        } else {
            setError(true);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    padding: 1,
                    maxWidth: 400,
                    width: '100%'
                }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ bgcolor: 'warning.light', p: 1, borderRadius: 2, display: 'flex' }}>
                        <SecurityIcon sx={{ color: 'warning.dark' }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                        Manager Authorization
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    A manager passcode is required to apply or override discounts for this transaction.
                </Typography>
                <TextField
                    autoFocus
                    fullWidth
                    label="Manager Passcode"
                    type="password"
                    variant="outlined"
                    value={passcode}
                    onChange={(e) => {
                        setPasscode(e.target.value);
                        setError(false);
                    }}
                    onKeyPress={handleKeyPress}
                    error={error}
                    helperText={error ? 'Invalid passcode. Please try again.' : ''}
                    InputProps={{
                        startAdornment: (
                            <LockOutlinedIcon sx={{ color: 'action.active', mr: 1, fontSize: 20 }} />
                        ),
                        sx: { borderRadius: 2 }
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button 
                    onClick={onClose} 
                    sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary"
                    sx={{ 
                        textTransform: 'none', 
                        fontWeight: 700, 
                        borderRadius: 2,
                        px: 3,
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    Authorize
                </Button>
            </DialogActions>
        </Dialog>
    );
};
