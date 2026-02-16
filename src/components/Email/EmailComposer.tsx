import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Switch,
    FormControlLabel,
    CircularProgress,
    Alert,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Paper
} from '@mui/material';
import { Send, AttachFile, Delete } from '@mui/icons-material';
import { emailService, EmailTemplate } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';

interface EmailComposerProps {
    onClose?: () => void;
    onSuccess?: () => void;
    initialTo?: string;
    initialSubject?: string;
    initialBody?: string;
}

export const EmailComposer = ({ onClose, onSuccess, initialTo = '', initialSubject = '', initialBody = '' }: EmailComposerProps) => {
    const { currentLocationId } = useAuth();
    
    // Form State
    const [to, setTo] = useState(initialTo);
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [isHtml, setIsHtml] = useState(true);
    const [attachments, setAttachments] = useState<File[]>([]);
    
    // Template State
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    
    // Status State
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (currentLocationId) {
            fetchTemplates();
        }
    }, [currentLocationId]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await emailService.getTemplates(currentLocationId!);
            setTemplates(data || []);
        } catch (err) {
            console.error("Failed to load templates", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find((t: EmailTemplate) => t.email_template_id === templateId);
        if (template) {
            setSubject(template.subject);
            setBody(template.body_content);
            setIsHtml(true);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments((prev: File[]) => [...prev, ...newFiles]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev: File[]) => prev.filter((_: File, i: number) => i !== index));
    };

    const handleSend = async () => {
        if (!to) {
            setError("Recipient (To) is required.");
            return;
        }

        setSending(true);
        setError(null);
        setSuccess(false);

        try {
            await emailService.sendEmail({
                location_id: currentLocationId!,
                to,
                cc,
                bcc,
                subject,
                body,
                isHtml,
                email_template_id: selectedTemplateId || undefined,
                attachments: attachments.length > 0 ? attachments : undefined
            });
            setSuccess(true);
            if (onSuccess) onSuccess();
            if (onClose) setTimeout(onClose, 1500);
        } catch (err: any) {
            console.error("Failed to send email", err);
            setError(err.message || "Failed to send email.");
        } finally {
            setSending(false);
        }
    };

    if (success) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="success" sx={{ mb: 2 }}>Email sent successfully!</Alert>
                <Button onClick={onClose} variant="outlined">Close</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" fontWeight="bold">Compose Email</Typography>
            
            {error && <Alert severity="error">{error}</Alert>}

            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                     <FormControl fullWidth size="small">
                        <InputLabel>Load Template (Optional)</InputLabel>
                        <Select
                            value={selectedTemplateId}
                            label="Load Template (Optional)"
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            disabled={loading || sending}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {templates.map((t: EmailTemplate) => (
                                <MenuItem key={t.email_template_id} value={t.email_template_id}>
                                    {t.subject}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="To"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="recipient@example.com"
                        disabled={sending}
                    />
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="CC"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        placeholder="cc@example.com"
                        disabled={sending}
                    />
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="BCC"
                        value={bcc}
                        onChange={(e) => setBcc(e.target.value)}
                        placeholder="bcc@example.com"
                        disabled={sending}
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={sending}
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">Body</Typography>
                         <FormControlLabel
                            control={<Switch size="small" checked={isHtml} onChange={(e) => setIsHtml(e.target.checked)} />}
                            label={<Typography variant="caption">HTML Mode</Typography>}
                        />
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        minRows={8}
                        maxRows={12}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        disabled={sending}
                        placeholder={isHtml ? "<html>...</html>" : "Plain text message..."}
                        sx={{ 
                            fontFamily: isHtml ? 'monospace' : 'inherit',
                            '& .MuiInputBase-input': {
                                fontFamily: isHtml ? 'monospace' : 'inherit',
                                fontSize: isHtml ? '0.875rem' : '1rem'
                            }
                        }}
                    />
                </Grid>

                {/* Attachments Section */}
                <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            size="small"
                            startIcon={<AttachFile />}
                            disabled={sending}
                        >
                            Add Attachments
                            <input
                                type="file"
                                hidden
                                multiple
                                onChange={handleFileChange}
                            />
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                            {attachments.length} file(s) attached
                        </Typography>
                    </Box>
                    
                    {attachments.length > 0 && (
                        <Paper variant="outlined" sx={{ maxHeight: 120, overflow: 'auto', bgcolor: '#fbfbfb' }}>
                            <List dense>
                                {attachments.map((file: File, index: number) => (
                                    <ListItem key={`${file.name}-${index}`}>
                                        <ListItemText 
                                            primary={file.name} 
                                            secondary={`${(file.size / 1024).toFixed(1)} KB`}
                                            primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" size="small" onClick={() => removeAttachment(index)} disabled={sending}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button onClick={onClose} disabled={sending} color="inherit">
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    onClick={handleSend}
                    disabled={sending}
                    startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                >
                    {sending ? 'Sending...' : 'Send Email'}
                </Button>
            </Box>
        </Box>
    );
};
