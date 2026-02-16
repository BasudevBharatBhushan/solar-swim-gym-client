import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
  Stack,
  Divider
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmailIcon from '@mui/icons-material/Email';
import LinkIcon from '@mui/icons-material/Link';
import LaunchIcon from '@mui/icons-material/Launch';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { ProfileStep } from './Steps/ProfileStep';
import { FamilyStep } from './Steps/FamilyStep';
import { ReviewStep } from './Steps/ReviewStep';
import { WaiverSigningStep } from './Steps/WaiverSigningStep';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
import { waiverService } from '../../../services/waiverService';
import { emailService } from '../../../services/emailService';
import { crmService } from '../../../services/crmService';


interface ClientOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'staff' | 'user';
}

const steps = ['Profile', 'Family Details', 'Waiver Signing', 'Review'];

export const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({ open, onClose, onSuccess, mode = 'staff' }) => {
  const [activeStep, setActiveStep] = useState(0);
  const { currentLocationId, locations } = useAuth();
  
  const currentLocation = locations.find(loc => loc.location_id === currentLocationId);
  const locationName = currentLocation ? currentLocation.name : 'Zalexy';

  // Form Data State
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    date_of_birth: null,
    family_count: 1,
    // ... other fields
  });

  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [signedWaivers, setSignedWaivers] = useState<Record<string, string>>({});
  const [allSigned, setAllSigned] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<any>(null);

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showToast = (message: string, severity: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  // Debugging state sync
  React.useEffect(() => {
    console.log("Parent signedWaivers state updated:", signedWaivers);
  }, [signedWaivers]);

  const updateProfileData = (key: string, value: any) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
        setErrors((prev: any) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateProfile = () => {
    const newErrors: any = {};
    if (!profileData.first_name) newErrors.first_name = 'First name is required';
    if (!profileData.last_name) newErrors.last_name = 'Last name is required';
    if (!profileData.email) newErrors.email = 'Email is required';
    if (!profileData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFamily = () => {
      // Basic check: Ensure names are filled if a member entry exists
      return true;
  };
  
  const validateWaivers = () => {
      console.log("Validating Waivers. Step reported allSigned:", allSigned, "Signatures:", signedWaivers);
      return allSigned;
  };

  const handleNext = () => {
    if (activeStep === 0) {
        if (!validateProfile()) return;
    }
    if (activeStep === 1) {
        if (!validateFamily()) return;
        
        // Filter empty family members before proceeding to waiver step?
        // Or keep them but only require waivers for valid ones. 
        // Logic in WaiverStep handles the list passed to it.
    }
    if (activeStep === 2) {
        if (!validateWaivers()) {
            showToast("Please sign all waivers to proceed.", "warning");
            return;
        }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFinish = async () => {
      setLoading(true);
      try {
          // Filter out empty family members if any
          const validFamilyMembers = familyMembers.filter(m => m.first_name && m.last_name);

          const payload = {
              location_id: currentLocationId,
              primary_profile: {
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                email: profileData.email,
                date_of_birth: profileData.date_of_birth,
                mobile: profileData.mobile,
                waiver_program_id: (profileData as any).waiver_program_id,
                case_manager_name: (profileData as any).case_manager_name,
                case_manager_email: (profileData as any).case_manager_email,
                signed_waiver_id: signedWaivers['primary']
              },
              family_members: validFamilyMembers.map((m, idx) => ({
                  first_name: m.first_name,
                  last_name: m.last_name,
                  date_of_birth: m.date_of_birth,
                  email: m.email || undefined,
                  waiver_program_id: m.waiver_program_id || undefined,
                  case_manager_name: m.case_manager_name || undefined,
                  case_manager_email: m.case_manager_email || undefined,
                  guardian_name: m.guardian_name || undefined,
                  guardian_mobile: m.guardian_mobile || undefined,
                  emergency_contact_phone: m.emergency_phone || undefined,
                  signed_waiver_id: signedWaivers[`family_${idx}`]
              }))
          };

          console.log("Submitting Payload:", payload);
          // Actual API Call
          const response = await authService.registerUser(payload);
          console.log('Registration response:', response);
          setCreatedAccount(response.account || response);
          
          onSuccess();
          setIsSuccess(true);
          
          // State will be reset when closed
      } catch (error: any) {
          console.error("Registration failed", error);
          showToast(error.message || "Failed to create account. Please try again.", "error");
      } finally {
          setLoading(false);
      }
  };

  const handleSendWaiverEmail = async () => {
      if (!createdAccount || !currentLocationId) return;

      setLoading(true);
      try {
          // 1. Ensure we have full account details including profiles
          let account = createdAccount;
          if (!account.profiles && account.account_id) {
               const res = await crmService.getAccountDetails(account.account_id, currentLocationId);
               account = res.data || res;
          }
          const profiles = account.profiles || account.profile || [];
          if (profiles.length === 0) {
              showToast("No profiles found for this account.", "warning");
              setLoading(false);
              return;
          }

          // 2. Fetch signed waivers for all profiles
          const attachments: File[] = [];
          for (const profile of profiles) {
              const waivers = await waiverService.getSignedWaivers(profile.profile_id, currentLocationId);
              if (waivers.data && waivers.data.length > 0) {
                  // Get the latest waiver
                  const latestWaiver = waivers.data[0]; 
                  const waiverHtml = `
                    <html>
                        <head><title>Signed Waiver</title></head>
                        <body>
                            <h2>Waiver for ${profile.first_name} ${profile.last_name}</h2>
                            <div style="border: 1px solid #ccc; padding: 20px;">
                                ${latestWaiver.content}
                            </div>
                            ${latestWaiver.signature_url ? `
                                <div style="margin-top: 30px;">
                                    <p>Signed on: ${new Date(latestWaiver.signed_at).toLocaleString()}</p>
                                    <img src="${latestWaiver.signature_url}" alt="Signature" style="max-height: 100px;" />
                                </div>
                            ` : ''}
                        </body>
                    </html>
                  `;
                  
                  // Create a File object
                  const blob = new Blob([waiverHtml], { type: 'text/html' });
                  const fileName = `Waiver_${profile.first_name}_${profile.last_name}.html`;
                  const file = new File([blob], fileName, { type: 'text/html' });
                  attachments.push(file);
              }
          }

          if (attachments.length === 0) {
              showToast("No signed waivers found to send.", "warning");
              setLoading(false);
              return;
          }

          // 3. Prepare Email
          const profileNames = profiles.map((p: any) => `${p.first_name} ${p.last_name}`).join(', ');
          const templateName = 'Waiver to Join Solar Swim Gym Membership';
          
          let subject = templateName;
          let body = `Please find attached the signed waivers for: ${profileNames}.`;
          let templateId = undefined;

          // Try to find the template
          try {
              const templates = await emailService.getTemplates(currentLocationId);
              const template = templates.find(t => t.subject === templateName || t.subject.includes('Waiver'));
              if (template) {
                  subject = template.subject;
                  templateId = template.email_template_id;
              }
          } catch (e) {
              console.warn("Could not fetch templates, using default subject");
          }

          // 4. Send Email
          await emailService.sendEmail({
             to: account.email || profiles[0].email, 
             subject: subject,
             body: `${body} <br/><br/> Profiles included: ${profileNames}`,
             isHtml: true,
             location_id: currentLocationId,
             account_id: account.account_id,
             email_template_id: templateId,
             attachments: attachments
          });

          showToast("Waiver email sent successfully!", "success");

      } catch (error: any) {
          console.error("Failed to send waiver email", error);
          showToast("Failed to send waiver email. " + error.message, "error");
      } finally {
          setLoading(false);
      }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <ProfileStep data={profileData} updateData={updateProfileData} errors={errors} />;
      case 1:
        return (
            <FamilyStep 
                data={familyMembers} 
                updateData={setFamilyMembers} 
                primaryData={profileData}
                updatePrimaryData={(key: string, value: any) => updateProfileData(key, value)}
                expectedCount={Math.max(1, profileData.family_count)}
            />
        );
      case 2:
          // Filter valid members to pass to WaiverStep
          const validMembers = familyMembers.filter(m => m.first_name && m.last_name);
          return (
            <WaiverSigningStep 
                primaryProfile={profileData}
                familyMembers={validMembers}
                onWaiversSigned={setSignedWaivers}
                onAllSigned={setAllSigned}
            />
          );
      case 3:
        return <ReviewStep primaryProfile={profileData} familyMembers={familyMembers} />;
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isSuccess ? undefined : onClose} 
      maxWidth={isSuccess ? "sm" : "lg"} 
      fullWidth
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 0 }}>
        {!isSuccess ? (
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Join {locationName}</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
                bgcolor: '#f0fdf4', 
                color: '#16a34a', 
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 1
            }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>Account Created Successfully!</Typography>
            <Typography variant="body2" color="text.secondary">
                {mode === 'staff' 
                    ? "Client details have been saved and the account is now active."
                    : "Your registration is complete."
                }
            </Typography>
          </Box>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2, px: 4 }}>
        {!isSuccess ? (
          <>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            <Box sx={{ minHeight: '300px', p: 1 }}>
                {renderStepContent(activeStep)}
            </Box>
          </>
        ) : (
          <Box sx={{ py: 4 }}>
            {mode === 'staff' ? (
                <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                        Next Actions
                    </Typography>
                    
                    <Stack spacing={2}>
                        <Button 
                            variant="outlined" 
                            fullWidth 
                            onClick={handleSendWaiverEmail}
                            startIcon={<EmailIcon />}
                            endIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                            sx={{ 
                                justifyContent: 'space-between', 
                                py: 2, 
                                px: 3, 
                                borderRadius: 2, 
                                borderColor: '#e2e8f0', 
                                color: '#1e293b',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                            }}
                        >
                            Send Waiver via Email
                        </Button>

                        <Button 
                            variant="outlined" 
                            fullWidth 
                            startIcon={<LinkIcon />}
                            endIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                            sx={{ 
                                justifyContent: 'space-between', 
                                py: 2, 
                                px: 3, 
                                borderRadius: 2, 
                                borderColor: '#e2e8f0', 
                                color: '#1e293b',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                            }}
                        >
                            Send Account Activation Link
                        </Button>

                        <Button 
                            variant="outlined" 
                            fullWidth 
                            startIcon={<PersonAddIcon />}
                            endIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                            sx={{ 
                                justifyContent: 'space-between', 
                                py: 2, 
                                px: 3, 
                                borderRadius: 2, 
                                borderColor: '#e2e8f0', 
                                color: '#1e293b',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                            }}
                        >
                            View Client Profile
                        </Button>

                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ textAlign: 'center' }}>
                            <Button 
                                variant="contained" 
                                onClick={() => {
                                    setIsSuccess(false);
                                    setActiveStep(0);
                                    setProfileData({
                                        first_name: '',
                                        last_name: '',
                                        email: '',
                                        mobile: '',
                                        date_of_birth: null,
                                        family_count: 1
                                    });
                                    setFamilyMembers([]);
                                    setSignedWaivers({});
                                    setCreatedAccount(null);
                                    onClose();
                                }}
                                sx={{ 
                                    bgcolor: '#0f172a', 
                                    '&:hover': { bgcolor: '#334155' },
                                    px: 8,
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 700
                                }}
                            >
                                Return to Accounts
                            </Button>
                        </Box>
                    </Stack>
                </>
            ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body1" sx={{ color: '#475569', mb: 4, lineHeight: 1.6 }}>
                        An account activation link has been sent to your email. 
                        Kindly use it to reset your password and login to your new account.
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={() => {
                            setIsSuccess(false);
                            setActiveStep(0);
                            setProfileData({
                                first_name: '',
                                last_name: '',
                                email: '',
                                mobile: '',
                                date_of_birth: null,
                                family_count: 1
                            });
                            setFamilyMembers([]);
                            setSignedWaivers({});
                            setCreatedAccount(null);
                            onClose();
                        }}
                        sx={{ 
                            bgcolor: '#2563eb', 
                            '&:hover': { bgcolor: '#1d4ed8' },
                            px: 8,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700
                        }}
                    >
                        Back to Login
                    </Button>
                </Box>
            )}
          </Box>
        )}

        <Snackbar 
            open={toast.open} 
            autoHideDuration={6000} 
            onClose={handleCloseToast}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
                {toast.message}
            </Alert>
        </Snackbar>
      </DialogContent>

      {!isSuccess && (
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
              {activeStep === 2 && mode === 'staff' && (
                  <Button 
                      variant="outlined" 
                      onClick={() => setActiveStep(3)}
                      sx={{ 
                          borderRadius: '8px', 
                          textTransform: 'none', 
                          fontWeight: 600,
                          color: '#64748b',
                          borderColor: '#cbd5e1'
                      }}
                  >
                      Skip Waiver
                  </Button>
              )}
              {activeStep === steps.length - 1 ? (
                  <Button 
                    variant="contained" 
                    onClick={handleFinish} 
                    disabled={loading}
                    sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none', 
                        fontWeight: 700,
                        bgcolor: '#0f172a',
                        px: 4,
                        '&:hover': { bgcolor: '#334155' }
                    }}
                  >
                      {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
              ) : (
                  <Button 
                    variant="contained" 
                    onClick={handleNext}
                    sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none', 
                        fontWeight: 700,
                        bgcolor: '#0f172a',
                        px: 4,
                        '&:hover': { bgcolor: '#334155' }
                    }}
                  >
                      Next Step
                  </Button>
              )}
          </Box>
        </DialogActions>
      )}
    </Dialog>
  );
};
