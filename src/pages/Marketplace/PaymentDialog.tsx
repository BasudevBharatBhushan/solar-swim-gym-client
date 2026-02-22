import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';

interface PaymentDialogProps {
    open: boolean;
    onClose: () => void;
    total: number;
    itemCount: number;
    items: Array<{ name: string; price: number }>;
    onSuccess: () => void;
}

export const PaymentDialog = ({ open, onClose, total, itemCount, items, onSuccess }: PaymentDialogProps) => {
    const handlePay = () => {
        alert('This is a demo payment integration. In a real application, this would securely process your payment.');
        onSuccess();
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{ 
                m: 0, 
                p: 2, 
                bgcolor: '#f8fafc',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ bgcolor: 'primary.main', p: 0.8, borderRadius: 1, display: 'flex' }}>
                        <CreditCardIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                        Complete Enrollment
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0 }}>
                <Grid container>
                    {/* Summary Section */}
                    <Grid size={{ xs: 12, md: 5 }} sx={{ 
                        p: 3, 
                        borderRight: { md: '1px solid' }, 
                        borderColor: 'divider',
                        bgcolor: '#fafafa'
                    }}>
                        <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Order Summary
                        </Typography>
                        <Stack spacing={2}>
                            <Box sx={{ maxHeight: 250, overflowY: 'auto', pr: 1 }}>
                                {items.length > 0 ? (
                                    items.map((item, idx) => (
                                        <Box key={idx} display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                            <Typography variant="body2" color="text.primary" sx={{ flex: 1, pr: 2 }}>
                                                {item.name}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700}>
                                                ${item.price.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary">
                                            Subscriptions ({itemCount})
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            ${total.toFixed(2)}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                            
                            <Divider />
                            
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1" fontWeight={800}>
                                    Total Amount
                                </Typography>
                                <Typography variant="h6" color="primary.main" fontWeight={800}>
                                    ${total.toFixed(2)}
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f0f9ff', borderRadius: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                                <LockIcon sx={{ fontSize: 16, color: '#0ea5e9' }} />
                                <Typography variant="caption" color="#0369a1" fontWeight={600}>
                                    Secure SSL encrypted
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* Form Section */}
                    <Grid size={{ xs: 12, md: 7 }} sx={{ p: 3 }}>
                        <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Payment Method
                        </Typography>
                        <Stack spacing={2.5}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Cardholder Name"
                                placeholder="John Doe"
                            />
                            <TextField
                                fullWidth
                                size="small"
                                label="Card Number"
                                placeholder="0000 0000 0000 0000"
                                InputProps={{
                                    endAdornment: <CreditCardIcon color="action" />
                                }}
                            />
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 7 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Expiry Date"
                                        placeholder="MM/YY"
                                    />
                                </Grid>
                                <Grid size={{ xs: 5 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="CVV"
                                        placeholder="123"
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ pt: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={handlePay}
                                    sx={{ 
                                        py: 1.5,
                                        borderRadius: 2,
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)',
                                        mb: 1.5
                                    }}
                                >
                                    Pay ${total.toFixed(2)}
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    size="medium"
                                    onClick={onSuccess}
                                    sx={{ 
                                        borderRadius: 2,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        color: 'text.secondary',
                                        borderColor: 'divider',
                                        '&:hover': {
                                            bgcolor: '#f1f5f9',
                                            borderColor: 'text.disabled'
                                        }
                                    }}
                                >
                                    Skip Payment & Continue
                                </Button>
                            </Box>

                            <Typography variant="caption" color="text.disabled" align="center" sx={{ display: 'block', px: 2 }}>
                                This is a showcase demo of the payment integration.
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};
