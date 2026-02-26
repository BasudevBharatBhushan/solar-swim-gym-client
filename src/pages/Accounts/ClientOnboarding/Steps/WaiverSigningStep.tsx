import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box, Typography, Button, Alert, Grid, List, ListItem, ListItemButton, Checkbox, FormControlLabel, useTheme, useMediaQuery, Stack, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // For signed status
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../../../context/AuthContext';
import { useConfig } from '../../../../context/ConfigContext';
import { WaiverPreview } from '../../../../components/Waiver/WaiverPreview';
import { SignaturePad, SignaturePadRef, getSignatureBlob } from '../../../../components/Waiver/SignaturePad';
import { waiverService, WaiverTemplate } from '../../../../services/waiverService';
import { getAgeGroup } from '../../../../lib/ageUtils';

export interface WaiverSigningStepRef {
    advanceToNextUnsigned: () => boolean;
}

interface WaiverSigningStepProps {
  primaryProfile: any;
  familyMembers: any[];
  signedWaivers: Record<string, string>;
  onWaiversSigned: (signedWaiversMap: Record<string, string>) => void;
  onAllSigned: (isSigned: boolean) => void;
}

interface MemberState {
    id: string; 
    name: string;
    ageProfileId: string; 
    ageGroupName?: string;
    waiverTemplate: WaiverTemplate | null;
    isSigned: boolean;
    signedWaiverId: string | null;
    signatureUrl: string | null; // Store the signature image URL
    agreed: boolean;
    loading: boolean;
    error: string | null;
    guardianName?: string;
}

export const WaiverSigningStep = forwardRef<WaiverSigningStepRef, WaiverSigningStepProps>(({ primaryProfile, familyMembers, signedWaivers, onWaiversSigned, onAllSigned }, ref) => {
    const { currentLocationId } = useAuth();
    const { waiverTemplates, ageGroups } = useConfig();
    const [activeTab, setActiveTab] = useState(0);
    const [memberStates, setMemberStates] = useState<MemberState[]>([]);
    const signaturePadRef = useRef<SignaturePadRef>(null);
    const waiverContentRef = useRef<HTMLDivElement>(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useImperativeHandle(ref, () => ({
        advanceToNextUnsigned: () => {
            const nextIdx = memberStates.findIndex((m, idx) => !m.isSigned && idx > activeTab);
            // Only allow advancing if current is signed
            if (nextIdx !== -1 && memberStates[activeTab].isSigned) {
                setActiveTab(nextIdx);
                return true;
            }
            return false;
        }
    }));

    // Scroll to top when active tab changes
    useEffect(() => {
        if (waiverContentRef.current) {
            waiverContentRef.current.scrollTo(0, 0);
        }
    }, [activeTab]);

    // Initial Setup
    useEffect(() => {
        const init = () => {
             const templates = waiverTemplates || [];
            
            const findGroup = (dob: string | null) => {
                return getAgeGroup(dob || '', ageGroups, 'Membership');
            };

            const membersData = [
                { 
                    id: 'primary', 
                    name: `${primaryProfile.first_name} ${primaryProfile.last_name}`, 
                    dob: primaryProfile.date_of_birth,
                    guardianName: primaryProfile.guardian_name || ''
                },
                ...familyMembers.map((m, idx) => ({ 
                    id: `family_${idx}`, 
                    name: `${m.first_name} ${m.last_name}`, 
                    dob: m.date_of_birth,
                    guardianName: m.guardian_name || ''
                }))
            ];

            setMemberStates(prev => {
                // Preserve signed status for existing members if their data hasn't changed meaningfully
                return membersData.map((m) => {
                    const group = findGroup(m.dob);
                    const existing = prev.find(p => p.id === m.id);
                    
                    // Determine template
                    let matchedTemplate = templates.find((t: any) => 
                        t.is_active && t.ageprofile_id === group?.age_group_id
                    );

                    if (!matchedTemplate) {
                        matchedTemplate = templates.find((t: any) => t.is_active && !t.ageprofile_id);
                    }

                    // If member already exists and has the same name/dob, preserve their signed status
                    if (existing && existing.name === m.name && existing.ageProfileId === (group?.age_group_id || '')) {
                        return {
                            ...existing,
                            waiverTemplate: matchedTemplate || null,
                            error: matchedTemplate ? null : `No waiver template found for ${group?.name || 'this age group'}.`
                        };
                    }

                    return {
                        id: m.id,
                        name: m.name,
                        ageProfileId: group?.age_group_id || '',
                        ageGroupName: group?.name || 'Unknown',
                        waiverTemplate: matchedTemplate || null,
                        isSigned: !!signedWaivers[m.id],
                        signedWaiverId: signedWaivers[m.id] || null,
                        signatureUrl: null,
                        agreed: !!signedWaivers[m.id],
                        loading: false,
                        error: matchedTemplate ? null : `No waiver template found for ${group?.name || 'this age group'}.`,
                        guardianName: m.guardianName
                    };
                });
            });
        };

        init();
    }, [currentLocationId, waiverTemplates, ageGroups, primaryProfile.first_name, primaryProfile.last_name, primaryProfile.date_of_birth, familyMembers.length]);

    const handleAgreeChange = (checked: boolean) => {
        updateMemberState(activeTab, { agreed: checked });
    };

    const updateMemberState = (index: number, updates: Partial<MemberState>) => {
        setMemberStates(prev => {
            const newStates = [...prev];
            newStates[index] = { ...newStates[index], ...updates };
            return newStates;
        });
    };

    const handleSign = async () => {
        const member = memberStates[activeTab];
        if (!member.waiverTemplate) return;
        if (!signaturePadRef.current) return;

        if (signaturePadRef.current.isEmpty()) {
            updateMemberState(activeTab, { error: "Please sign to continue." });
            return;
        }

        const canvas = signaturePadRef.current.getCanvas();
        if (!canvas) return;

        updateMemberState(activeTab, { loading: true, error: null });

        try {
            const blob = await getSignatureBlob(canvas);
            if (!blob) throw new Error("Failed to capture signature");

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                
                const sigResponse = await waiverService.uploadSignature(base64);
                
                let content = member.waiverTemplate!.content;
                content = content.replace(/\[FullName\]/g, member.name);
                content = content.replace(/\[GuardianName\]/g, member.guardianName || 'N/A');
                content = content.replace(/\[CurrentDate\]/g, new Date().toLocaleDateString());
                
                const response = await waiverService.upsertSignedWaiver({
                    profile_id: null,
                    waiver_template_id: member.waiverTemplate!.waiver_template_id,
                    waiver_type: 'REGISTRATION',
                    content,
                    signature_url: sigResponse.signature_url
                }, currentLocationId!);

                console.log("Upsert Waiver Response:", response);
                const signedId = response.signed_waiver_id || (response as any).data?.signed_waiver_id;

                if (!signedId) {
                    throw new Error("Waiver saved but no ID returned from server.");
                }

                updateMemberState(activeTab, {
                    loading: false,
                    isSigned: true,
                    signedWaiverId: signedId,
                    signatureUrl: sigResponse.signature_url
                });

                // Auto-advance removed as per user request (they want manual click or controlled flow)
            };

        } catch (err: any) {
            console.error("Signing failed", err);
            updateMemberState(activeTab, { loading: false, error: err.message || "Signing failed" });
        }
    };

    // Notify parent whenever signedWaiverId changes in ANY member
    useEffect(() => {
        if (memberStates.length === 0) {
            onAllSigned(false);
            return;
        }
        
        const map: Record<string, string> = {};
        let allReady = true;
        
        memberStates.forEach((m) => {
            if (m.isSigned && m.signedWaiverId) {
                map[m.id] = m.signedWaiverId;
            } else {
                allReady = false;
            }
        });
        
        // Pass a fresh object to ensure parent state detects the update
        onWaiversSigned({...map});
        onAllSigned(allReady);
    }, [memberStates, onWaiversSigned, onAllSigned]);

    if (memberStates.length === 0) return null;
    
    const currentMember = memberStates[activeTab];
    if (!currentMember) return null;

    const isMemberAccessible = (index: number) => {
        if (index === 0) return true;
        // Member is accessible if they are signed OR if the immediately previous member is signed
        return memberStates[index].isSigned || (index > 0 && memberStates[index - 1].isSigned);
    };

    const handleTabClick = (index: number) => {
        if (isMemberAccessible(index)) {
            setActiveTab(index);
        }
    };

    const hasNextMember = activeTab < memberStates.length - 1;

    return (
        <Grid container sx={{ 
            height: isMobile ? 'calc(100vh - 180px)' : '600px', 
            minHeight: isMobile ? '400px' : '600px',
            border: '1px solid #e2e8f0', 
            borderRadius: 2, 
            overflow: 'hidden', 
            bgcolor: '#fff',
            flexDirection: isMobile ? 'column' : 'row'
        }}>
            {/* Left Sidebar / Top Tab Bar */}
            <Grid size={{ xs: 12, md: 3 }} sx={{ 
                borderRight: isMobile ? 'none' : '1px solid #e2e8f0', 
                borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
                overflowY: isMobile ? 'hidden' : 'auto', 
                overflowX: isMobile ? 'auto' : 'hidden',
                maxHeight: isMobile ? 'none' : '100%', 
                bgcolor: '#f8fafc',
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                position: isMobile ? 'sticky' : 'relative',
                top: isMobile ? 0 : 'auto',
                zIndex: isMobile ? 100 : 1,
                boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                flexShrink: 0
            }}>
                {!isMobile && (
                    <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                            Family Members
                        </Typography>
                    </Box>
                )}
                
                {/* Mobile Horizontal List */}
                {isMobile ? (
                   <Stack direction="row" spacing={1} sx={{ p: 1.5, width: '100%', overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                       {memberStates.map((m, idx) => {
                           const accessible = isMemberAccessible(idx);
                           return (
                               <Chip 
                                    key={idx}
                                    label={m.name.split(' ')[0]} 
                                    onClick={() => handleTabClick(idx)}
                                    disabled={!accessible}
                                    color={activeTab === idx ? "primary" : "default"}
                                    variant={activeTab === idx ? "filled" : "outlined"}
                                    icon={m.isSigned ? <CheckCircleIcon sx={{ fontSize: '14px !important' }} /> : undefined}
                                    sx={{ 
                                        fontWeight: 700,
                                        bgcolor: activeTab === idx ? 'primary.main' : (accessible ? '#fff' : '#f1f5f9'),
                                        color: activeTab === idx ? '#fff' : (accessible ? 'text.primary' : 'text.disabled'),
                                        borderColor: activeTab === idx ? 'primary.main' : '#e2e8f0',
                                        opacity: accessible ? 1 : 0.6,
                                        '&.Mui-disabled': {
                                            bgcolor: '#f1f5f9',
                                            color: 'text.disabled',
                                            borderColor: '#e2e8f0'
                                        }
                                    }}
                               />
                           );
                       })}
                   </Stack>
                ) : (
                    <List disablePadding>
                        {memberStates.map((m, idx) => (
                            <ListItem key={idx} disablePadding>
                                <ListItemButton 
                                    selected={activeTab === idx} 
                                    onClick={() => setActiveTab(idx)}
                                    sx={{ 
                                        flexDirection: 'column', 
                                        alignItems: 'flex-start',
                                        borderLeft: activeTab === idx ? '4px solid' : '4px solid transparent',
                                        borderColor: 'primary.main',
                                        py: 2,
                                        px: 2,
                                        transition: 'all 0.2s',
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.50',
                                            '&:hover': {
                                                bgcolor: 'primary.100',
                                            }
                                        },
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.02)'
                                        }
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Typography variant="body2" fontWeight={activeTab === idx ? 700 : 600} color={activeTab === idx ? 'primary.main' : 'text.primary'}>
                                            {m.name}
                                        </Typography>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                display: 'inline-block',
                                                mt: 0.5,
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1,
                                                bgcolor: activeTab === idx ? 'primary.100' : '#e2e8f0',
                                                color: activeTab === idx ? 'primary.700' : 'text.secondary',
                                                fontWeight: 700,
                                                fontSize: '0.65rem'
                                            }}
                                        >
                                            {m.ageGroupName || 'Unknown'}
                                        </Typography>
                                    </Box>
                                    {m.isSigned && (
                                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CheckCircleIcon color="success" sx={{ fontSize: 14 }} />
                                            <Typography variant="caption" color="success.main" fontWeight={700}>Signed</Typography>
                                        </Box>
                                    )}
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Grid>

            {/* Right Content: Waiver - Contracts */}
            <Grid size={{ xs: 12, md: 9 }} sx={{ 
                height: isMobile ? 'calc(100% - 60px)' : '100%', 
                flex: isMobile ? 1 : 'none',
                display: 'flex', 
                flexDirection: 'column', 
                bgcolor: '#fff', 
                overflow: 'hidden' 
            }}>
                <Box sx={{ p: isMobile ? 2 : 3, borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {currentMember.isSigned ? "Waiver Signed" : (isMobile ? `Review: ${currentMember.name}` : "Review & Sign Waiver")}
                        </Typography>
                        {currentMember.isSigned && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main', bgcolor: 'success.50', px: 1.5, py: 0.5, borderRadius: 1 }}>
                                <CheckCircleIcon sx={{ fontSize: 18 }} />
                                <Typography variant="caption" fontWeight={700}>{isMobile ? 'DONE' : 'COMPLETED'}</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                <Box 
                    ref={waiverContentRef}
                    sx={{ flex: 1, overflowY: 'auto', p: isMobile ? 2 : 3 }}
                >
                    {currentMember.error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{currentMember.error}</Alert>
                    )}

                    {currentMember.isSigned && (
                        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
                            <Typography variant="body2" fontWeight={600} color="success.800">
                                {currentMember.name} has successfully signed this waiver.
                            </Typography>
                        </Alert>
                    )}
                    
                    <Box sx={{ minHeight: 0 }}>
                        {currentMember.waiverTemplate ? (
                            <WaiverPreview 
                                content={currentMember.waiverTemplate.content}
                                data={{ 
                                    first_name: currentMember.name.split(' ')[0], 
                                    last_name: currentMember.name.split(' ').slice(1).join(' '),
                                    guardian_name: currentMember.guardianName
                                }}
                                agreed={currentMember.agreed}
                                onAgreeChange={handleAgreeChange}
                                hideCheckbox={true}
                                fullHeight={true}
                                signatureComponent={
                                    !currentMember.isSigned ? (
                                        <SignaturePad 
                                            key={activeTab} 
                                            ref={signaturePadRef}
                                            onEnd={() => updateMemberState(activeTab, { error: null })} 
                                            width={isMobile ? 340 : 500}
                                            height={150}
                                        />
                                    ) : currentMember.signatureUrl ? (
                                        <Box sx={{ 
                                            p: 2, 
                                            border: '1px solid #e2e8f0', 
                                            borderRadius: 2, 
                                            bgcolor: '#f8fafc',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 1
                                        }}>
                                            <Typography variant="caption" color="success.main" fontWeight={700} sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Digital Signature Captured
                                            </Typography>
                                            <Box sx={{ bgcolor: '#fff', p: 1, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                                <img 
                                                    src={currentMember.signatureUrl} 
                                                    alt="Signature" 
                                                    style={{ 
                                                        maxWidth: '100%', 
                                                        height: 'auto',
                                                        maxHeight: '120px',
                                                        display: 'block'
                                                    }} 
                                                />
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Box sx={{ p: 3, bgcolor: 'success.50', borderRadius: 2, textAlign: 'center', border: '1px dashed', borderColor: 'success.300' }}>
                                            <Typography variant="body2" color="success.main" fontWeight={700}>
                                                ✓ Signature confirmed
                                            </Typography>
                                        </Box>
                                    )
                                }
                            />
                        ) : (
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                No waiver template available for this profile (Age Group: {currentMember.ageGroupName}).
                            </Alert>
                        )}
                    </Box>
                </Box>

                {(!currentMember.isSigned || (hasNextMember && currentMember.isSigned)) && currentMember.waiverTemplate && (
                    <Box sx={{ 
                        p: isMobile ? 2 : 3, 
                        borderTop: '1px solid #e2e8f0', 
                        bgcolor: '#f8fafc',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'stretch' : 'center',
                        gap: 2,
                        zIndex: 10
                    }}>
                        {!currentMember.isSigned ? (
                            <>
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            checked={currentMember.agreed} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAgreeChange(e.target.checked)} 
                                            color="primary"
                                            sx={{ '& .MuiSvgIcon-root': { fontSize: 32 } }}
                                        />
                                    }
                                    label={
                                        <Typography 
                                            variant="body1" 
                                            sx={{ fontWeight: 700, color: currentMember.agreed ? 'primary.main' : 'text.primary', fontSize: isMobile ? '0.9rem' : '1rem' }}
                                        >
                                            I have read and agree to all terms
                                        </Typography>
                                    }
                                />
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleSign}
                                    disabled={!currentMember.agreed || currentMember.loading}
                                    sx={{ 
                                        px: 6, 
                                        py: 2, 
                                        borderRadius: 3,
                                        fontWeight: 800,
                                        fontSize: '1.1rem',
                                        textTransform: 'none',
                                        boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                                        '&:hover': {
                                            boxShadow: '0 6px 20px rgba(0,118,255,0.23)',
                                            transform: 'translateY(-1px)'
                                        },
                                        '&:active': {
                                            transform: 'translateY(0)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {currentMember.loading ? 'Signing...' : 'Sign Waiver'}
                                </Button>
                            </>
                        ) : hasNextMember && (
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => setActiveTab(activeTab + 1)}
                                endIcon={<ArrowForwardIcon />}
                                sx={{ 
                                    ml: 'auto',
                                    px: 6, 
                                    py: 2, 
                                    borderRadius: 3,
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                                    '&:hover': {
                                        boxShadow: '0 6px 20px rgba(0,118,255,0.23)',
                                        transform: 'translateY(-1px)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Next Profile
                            </Button>
                        )}
                    </Box>
                )}
            </Grid>
        </Grid>
    );
});
