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
    ListItemButton,
    ListItemText,
    Divider,
    Paper
} from '@mui/material';
import { Send, AttachFile, Delete, OpenInNew } from '@mui/icons-material';
import { emailService, EmailTemplate } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';

interface EmailComposerProps {
    onClose?: () => void;
    onSuccess?: () => void;
    initialTo?: string;
    initialCc?: string;
    initialBcc?: string;
    initialSubject?: string;
    initialBody?: string;
    initialTemplateId?: string;
    initialAttachments?: File[];
    initialAccountId?: string;
}

export const EmailComposer = ({
    onClose,
    onSuccess,
    initialTo = '',
    initialCc = '',
    initialBcc = '',
    initialSubject = '',
    initialBody = '',
    initialTemplateId = '',
    initialAttachments = [],
    initialAccountId
}: EmailComposerProps) => {
    const { currentLocationId } = useAuth();
    
    // Form State
    const [to, setTo] = useState(initialTo);
    const [cc, setCc] = useState(initialCc);
    const [bcc, setBcc] = useState(initialBcc);
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [isHtml, setIsHtml] = useState(true);
    const [attachments, setAttachments] = useState<File[]>(initialAttachments);
    const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(
        initialAttachments.length > 0 ? 0 : -1
    );
    const [selectedAttachmentUrl, setSelectedAttachmentUrl] = useState<string | null>(null);
    
    // Template State
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);
    
    // Status State
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setTo(initialTo);
        setCc(initialCc);
        setBcc(initialBcc);
        setSubject(initialSubject);
        setBody(initialBody);
        setSelectedTemplateId(initialTemplateId);
        setAttachments(initialAttachments);
        setSelectedAttachmentIndex(initialAttachments.length > 0 ? 0 : -1);
    }, [initialTo, initialCc, initialBcc, initialSubject, initialBody, initialTemplateId, initialAttachments]);

    useEffect(() => {
        if (currentLocationId) {
            fetchTemplates();
        }
    }, [currentLocationId]);

    useEffect(() => {
        if (!initialTemplateId || templates.length === 0) return;
        const template = templates.find((t: EmailTemplate) => t.email_template_id === initialTemplateId);
        if (!template) return;

        setSelectedTemplateId(initialTemplateId);
        if (!initialSubject.trim()) {
            setSubject(template.subject);
        }
        if (!initialBody.trim()) {
            setBody(template.body_content);
            setIsHtml(true);
        }
    }, [initialTemplateId, initialSubject, initialBody, templates]);

    useEffect(() => {
        if (selectedAttachmentIndex < 0 || selectedAttachmentIndex >= attachments.length) {
            setSelectedAttachmentUrl(null);
            return;
        }

        const selected = attachments[selectedAttachmentIndex];
        const nextUrl = URL.createObjectURL(selected);
        setSelectedAttachmentUrl(nextUrl);

        return () => URL.revokeObjectURL(nextUrl);
    }, [attachments, selectedAttachmentIndex]);

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
            setSelectedAttachmentIndex((prevIndex) => {
                if (prevIndex >= 0) return prevIndex;
                return newFiles.length > 0 ? 0 : -1;
            });
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev: File[]) => {
            const next = prev.filter((_: File, i: number) => i !== index);
            setSelectedAttachmentIndex((prevIndex) => {
                if (next.length === 0) return -1;
                if (prevIndex === index) return Math.min(index, next.length - 1);
                if (prevIndex > index) return prevIndex - 1;
                return prevIndex;
            });
            return next;
        });
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
                account_id: initialAccountId,
                to,
                cc: cc || undefined,
                bcc: bcc || undefined,
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

    const selectedAttachment =
        selectedAttachmentIndex >= 0 && selectedAttachmentIndex < attachments.length
            ? attachments[selectedAttachmentIndex]
            : null;
    const selectedAttachmentName = selectedAttachment?.name.toLowerCase() || '';
    const canPreviewPdf = !!selectedAttachment && (
        selectedAttachment.type === 'application/pdf' || selectedAttachmentName.endsWith('.pdf')
    );
    const canPreviewImage = !!selectedAttachment && selectedAttachment.type.startsWith('image/');

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
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <Paper variant="outlined" sx={{ maxHeight: 220, overflow: 'auto', bgcolor: '#fbfbfb' }}>
                                    <List dense disablePadding>
                                        {attachments.map((file: File, index: number) => (
                                            <ListItem
                                                key={`${file.name}-${index}`}
                                                disablePadding
                                                secondaryAction={
                                                    <IconButton edge="end" size="small" onClick={() => removeAttachment(index)} disabled={sending}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemButton
                                                    selected={index === selectedAttachmentIndex}
                                                    onClick={() => setSelectedAttachmentIndex(index)}
                                                >
                                                    <ListItemText
                                                        primary={file.name}
                                                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                                                        primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                                    />
                                                </ListItemButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Paper variant="outlined" sx={{ minHeight: 220, p: 1.5, bgcolor: '#fff' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Attachment Preview
                                        </Typography>
                                        <Button
                                            size="small"
                                            variant="text"
                                            startIcon={<OpenInNew fontSize="small" />}
                                            disabled={!selectedAttachmentUrl}
                                            onClick={() => {
                                                if (!selectedAttachmentUrl) return;
                                                window.open(selectedAttachmentUrl, '_blank', 'noopener,noreferrer');
                                            }}
                                        >
                                            Open
                                        </Button>
                                    </Box>
                                    <Divider sx={{ mb: 1 }} />
                                    {!selectedAttachment ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Select an attachment to preview.
                                        </Typography>
                                    ) : canPreviewPdf && selectedAttachmentUrl ? (
                                        <Box
                                            component="iframe"
                                            src={selectedAttachmentUrl}
                                            title={selectedAttachment.name}
                                            sx={{ width: '100%', height: 300, border: '1px solid #e2e8f0', borderRadius: 1 }}
                                        />
                                    ) : canPreviewImage && selectedAttachmentUrl ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                                            <img
                                                src={selectedAttachmentUrl}
                                                alt={selectedAttachment.name}
                                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                            />
                                        </Box>
                                    ) : (
                                        <Box sx={{ p: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>{selectedAttachment.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Preview not available for this file type.
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
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
