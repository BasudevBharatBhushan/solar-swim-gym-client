import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    CircularProgress,
    Divider,
    Alert
} from '@mui/material';
import { Add, Edit, Email } from '@mui/icons-material';
import { emailService, EmailTemplate } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';
import { TemplateEditor } from './TemplateEditor';

export const TemplateList = () => {
    const { currentLocationId } = useAuth();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openEditor, setOpenEditor] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

    const fetchTemplates = async () => {
        if (!currentLocationId) return;
        setLoading(true);
        try {
            const data = await emailService.getTemplates(currentLocationId);
            setTemplates(data || []);
        } catch (err: any) {
            console.error("Failed to fetch templates", err);
            setError("Failed to load email templates.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentLocationId) {
            fetchTemplates();
        }
    }, [currentLocationId]);

    const handleCreate = () => {
        setSelectedTemplate(null);
        setOpenEditor(true);
    };

    const handleEdit = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setOpenEditor(true);
    };

    const handleSave = async () => {
        setOpenEditor(false);
        fetchTemplates();
    };

    return (
        <Paper sx={{ p: 3, flex: 1, borderRadius: 2, border: '1px solid #E0E0E0', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                        bgcolor: '#E3F2FD', 
                        p: 1.25, 
                        borderRadius: 1.5,
                        display: 'flex'
                    }}>
                        <Email sx={{ color: '#1976D2' }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold">Email Templates</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<Add />} 
                    onClick={handleCreate}
                    sx={{ textTransform: 'none', borderRadius: 1.5, boxShadow: 'none' }}
                >
                    New Template
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {templates.length === 0 ? (
                         <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography variant="body1">No templates found. Create your first one!</Typography>
                        </Box>
                    ) : (
                        templates.map((template, index) => (
                            <React.Fragment key={template.email_template_id}>
                                <ListItem alignItems="flex-start">
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {template.subject}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ 
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    mt: 0.5
                                                }}
                                            >
                                                {/* Strip HTML tags for preview */}
                                                {template.body_content.replace(/<[^>]*>?/gm, '')}
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(template)}>
                                            <Edit />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < templates.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))
                    )}
                </List>
            )}

            {openEditor && (
                <TemplateEditor
                    open={openEditor}
                    onClose={() => setOpenEditor(false)}
                    onSave={handleSave}
                    template={selectedTemplate}
                />
            )}
        </Paper>
    );
};
