import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Switch,
    FormControlLabel,
    CircularProgress,
    Alert
} from '@mui/material';
import { emailService, EmailTemplate } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';

interface TemplateEditorProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    template: EmailTemplate | null;
}

export const TemplateEditor = ({ open, onClose, onSave, template }: TemplateEditorProps) => {
    const { currentLocationId } = useAuth();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        if (template) {
            setSubject(template.subject);
            setBody(template.body_content);
        } else {
            setSubject('');
            setBody('');
        }
        setError(null);
        setPreviewMode(false);
    }, [template, open]);

    const handleSave = async () => {
        if (!currentLocationId) return;
        
        if (!subject.trim() || !body.trim()) {
            setError("Subject and body are required.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (template) {
                await emailService.updateTemplate(template.email_template_id, {
                    email_template_id: template.email_template_id,
                    location_id: currentLocationId,
                    subject,
                    body_content: body
                });
            } else {
                await emailService.createTemplate({
                    location_id: currentLocationId,
                    subject,
                    body_content: body
                });
            }
            onSave();
        } catch (err: any) {
            console.error("Failed to save template", err);
            setError("Failed to save template. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {template ? "Edit Template" : "New Template"}
                <FormControlLabel
                    control={<Switch checked={previewMode} onChange={(e) => setPreviewMode(e.target.checked)} />}
                    label="Preview HTML"
                />
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        label="Subject"
                        fullWidth
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        variant="outlined"
                        required
                    />
                    
                    {previewMode ? (
                        <Box sx={{ 
                            border: '1px solid #ccc', 
                            borderRadius: 1, 
                            p: 2, 
                            minHeight: 300, 
                            bgcolor: '#f9f9f9',
                            overflow: 'auto'
                        }}>
                             <div dangerouslySetInnerHTML={{ __html: body }} />
                        </Box>
                    ) : (
                        <TextField
                            label="Body Content (HTML supported)"
                            fullWidth
                            multiline
                            minRows={10}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            variant="outlined"
                            required
                            helperText="You can use standard HTML tags for formatting."
                            sx={{ fontFamily: 'monospace' }}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Save Template"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
