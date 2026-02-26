import { useState, useEffect } from 'react';
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
    Radio,
    RadioGroup,
    FormControlLabel,
    Alert,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../../context/AuthContext';
import { paymentService, SavedCardResponse } from '../../services/paymentService';

interface PaymentDialogProps {
    open: boolean;
    onClose: () => void;
    total: number;
    itemCount: number;
    items: Array<{ name: string; price: number }>;
    accountId?: string | null;
    invoiceId?: string | null;
    onSuccess: () => void;
}

export const PaymentDialog = ({ open, onClose, total, itemCount, items, accountId, invoiceId, onSuccess }: PaymentDialogProps) => {
    const { loginId, userParams } = useAuth();
    const staffName = `${userParams?.first_name || ''} ${userParams?.last_name || ''}`.trim();
    const [savedCards, setSavedCards] = useState<SavedCardResponse[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string>('NEW');
    
    // New Card Form State
    const [cardholderName, setCardholderName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [zip, setZip] = useState('');
    
    const [loadingCards, setLoadingCards] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form field validation helper
    const validateForm = () => {
        if (!cardholderName.trim()) return 'Cardholder Name is required';
        if (!cardNumber.replace(/\s/g, '').match(/^\d{13,19}$/)) return 'Invalid Card Number';
        if (!expiry.replace(/[^0-9]/g, '').match(/^\d{4}$/)) return 'Invalid Expiry (MM/YY)';
        if (!cvv.match(/^\d{3,4}$/)) return 'Invalid CVV';
        if (!zip.trim()) return 'Zip code is required';
        return null;
    };

    useEffect(() => {
        if (open && accountId) {
            const fetchCards = async () => {
                setLoadingCards(true);
                setError(null);
                try {
                    const cards = await paymentService.getSavedCards(accountId);
                    setSavedCards(cards);
                    if (cards.length > 0) {
                        setSelectedCardId(cards[0].id);
                    } else {
                        setSelectedCardId('NEW');
                    }
                } catch (err) {
                    console.error('Failed to load saved cards', err);
                    // Non-fatal, they can still enter a new card
                } finally {
                    setLoadingCards(false);
                }
            };
            fetchCards();
        } else if (!open) {
            // Reset state on close
            setCardholderName('');
            setCardNumber('');
            setExpiry('');
            setCvv('');
            setZip('');
            setError(null);
            setSuccess(false);
        }
    }, [open, accountId]);

    const handlePay = async () => {
        if (!accountId || !invoiceId) {
            setError('Account or Invoice context missing.');
            return;
        }

        setError(null);
        setProcessing(true);

        try {
            let paymentMethodId = selectedCardId;

            // Phase 2: Vaulting a New Card
            if (selectedCardId === 'NEW') {
                const validationError = validateForm();
                if (validationError) {
                    setError(validationError);
                    setProcessing(false);
                    return;
                }

                const vaultResult = await paymentService.saveCard({
                    accountId,
                    cardNumber: cardNumber.replace(/\s/g, ''),
                    expiryMmYy: expiry.replace(/[^0-9]/g, ''),
                    cardholderName,
                    cvv,
                    avsZip: zip,
                });
                paymentMethodId = vaultResult.id;
            }

            // Phase 3: Execution
            const paymentResult = await paymentService.payInvoice({
                accountId,
                invoiceId,
                paymentMethodId,
                staff_id: loginId || null,
                staff_name: staffName || null,
            });

            if (paymentResult.status === 'APPROVED') {
                setSuccess(true);
            } else {
                // If it wasn't approved, but didn't throw a standard error, handle it here
                setError(`Payment declined: ${paymentResult.status}`);
            }
        } catch (err: any) {
            console.error('Payment execution failed', err);
            // Phase 4: Handle Results (DECLINED/FAILED)
            const gatewayMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Payment processing failed';
            setError(`Gateway Error: ${gatewayMsg}`);
        } finally {
            setProcessing(false);
        }
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
                {success ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}>
                        <Box sx={{ 
                            width: 80, 
                            height: 80, 
                            borderRadius: '50%', 
                            bgcolor: '#dcfce7', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: '#16a34a'
                        }}>
                            <LockIcon sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography variant="h5" fontWeight={800} gutterBottom>
                            Payment Successful!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Your enrollment has been completed successfully. The invoice has been marked as paid.
                        </Typography>
                        <Button 
                            variant="contained" 
                            fullWidth 
                            size="large" 
                            onClick={onSuccess}
                            sx={{ py: 1.5, borderRadius: 2, fontWeight: 800 }}
                        >
                            Continue to Invoice
                        </Button>
                    </Box>
                ) : (
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

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {loadingCards ? (
                            <Box display="flex" justifyContent="center" py={4}>
                                <CircularProgress size={30} />
                            </Box>
                        ) : (
                            <Stack spacing={2.5}>
                                {savedCards.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <RadioGroup
                                            value={selectedCardId}
                                            onChange={(e) => setSelectedCardId(e.target.value)}
                                        >
                                            {savedCards.map((card) => (
                                                <FormControlLabel
                                                    key={card.id}
                                                    value={card.id}
                                                    control={<Radio size="small" />}
                                                    label={
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <CreditCardIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {card.card_brand || 'Card'} ending in {card.last4_digits}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                (Exp: {card.expiry_mm_yy})
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    sx={{
                                                        p: 1.5,
                                                        border: '1px solid',
                                                        borderColor: selectedCardId === card.id ? 'primary.main' : 'divider',
                                                        borderRadius: 2,
                                                        mb: 1,
                                                        bgcolor: selectedCardId === card.id ? 'primary.50' : 'transparent',
                                                    }}
                                                />
                                            ))}
                                            <FormControlLabel
                                                value="NEW"
                                                control={<Radio size="small" />}
                                                label={
                                                    <Typography variant="body2" fontWeight={600}>
                                                        Use a new card
                                                    </Typography>
                                                }
                                                sx={{
                                                    p: 1.5,
                                                    border: '1px solid',
                                                    borderColor: selectedCardId === 'NEW' ? 'primary.main' : 'divider',
                                                    borderRadius: 2,
                                                    bgcolor: selectedCardId === 'NEW' ? 'primary.50' : 'transparent',
                                                }}
                                            />
                                        </RadioGroup>
                                    </Box>
                                )}

                                {selectedCardId === 'NEW' && (
                                    <>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Cardholder Name"
                                            placeholder="John Doe"
                                            value={cardholderName}
                                            onChange={(e) => setCardholderName(e.target.value)}
                                            disabled={processing}
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Card Number"
                                            placeholder="0000 0000 0000 0000"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            disabled={processing}
                                            InputProps={{
                                                endAdornment: <CreditCardIcon color="action" />
                                            }}
                                        />
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Expiry Date"
                                                    placeholder="MM/YY"
                                                    value={expiry}
                                                    onChange={(e) => setExpiry(e.target.value)}
                                                    disabled={processing}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="CVV"
                                                    placeholder="123"
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value)}
                                                    disabled={processing}
                                                />
                                            </Grid>
                                        </Grid>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label="Billing Zip/Postal Code"
                                                    placeholder="12345"
                                                    value={zip}
                                                    onChange={(e) => setZip(e.target.value)}
                                                    disabled={processing}
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}


                            <Box sx={{ pt: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={handlePay}
                                    disabled={processing || !accountId || !invoiceId}
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
                                    {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    size="medium"
                                    onClick={onSuccess}
                                    disabled={processing}
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
                                    Pay Later
                                </Button>
                            </Box>
                        </Stack>
                        )}
                    </Grid>
                </Grid>
                )}
            </DialogContent>
        </Dialog>
    );
};
