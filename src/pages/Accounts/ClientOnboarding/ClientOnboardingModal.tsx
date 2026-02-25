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
  useTheme,
  useMediaQuery
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ProfileStep } from './Steps/ProfileStep';
import { FamilyStep } from './Steps/FamilyStep';
import { ReviewStep } from './Steps/ReviewStep';
import { WaiverSigningStep } from './Steps/WaiverSigningStep';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../../context/ConfigContext';


interface ClientOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'staff' | 'user';
  locationNameProp?: string;
}

const steps = ['Account & Profiles', 'Waiver Signing', 'Review'];



export const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({ open, onClose, onSuccess, mode = 'staff', locationNameProp }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [activeStep, setActiveStep] = useState(0);
  const { currentLocationId, locations } = useAuth();
  const { refreshWaiverPrograms, refreshAgeGroups, refreshWaiverTemplates } = useConfig();
  
  const currentLocation = locations.find(loc => loc.location_id === currentLocationId);
  const locationName = locationNameProp || (currentLocation ? currentLocation.name : 'Zalexy');

  // Refresh config data when modal opens
  React.useEffect(() => {
    if (open) {
      refreshWaiverPrograms();
      refreshAgeGroups();
      refreshWaiverTemplates();
    }
  }, [open, refreshWaiverPrograms, refreshAgeGroups, refreshWaiverTemplates]);

  // Form Data State
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    date_of_birth: null,
    family_count: 1,
    waiver_program_id: '',
    gender: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    heard_about_us: '',
    notify_primary_member: true,
    notify_guardian: true,
    emergency_contact_name: '',
    emergency_contact_phone: '',
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
        if (!validateFamily()) return;
    }
    if (activeStep === 1) {
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
              heard_about_us: (profileData as any).heard_about_us,
              notify_primary_member: (profileData as any).notify_primary_member,
              notify_guardian: (profileData as any).notify_guardian,
              primary_profile: {
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                email: profileData.email,
                date_of_birth: profileData.date_of_birth,
                mobile: profileData.mobile,
                gender: (profileData as any).gender,
                is_primary: true,
                address_line1: (profileData as any).address_line1,
                address_line2: (profileData as any).address_line2,
                city: (profileData as any).city,
                state: (profileData as any).state,
                zip_code: (profileData as any).zip_code,
                country: (profileData as any).country || 'USA',
                guardian_name: (profileData as any).guardian_name || null,
                guardian_mobile: (profileData as any).guardian_mobile || null,
                emergency_contact_name: (profileData as any).emergency_contact_name || null,
                emergency_contact_phone: (profileData as any).emergency_contact_phone || null,
                waiver_program_id: (profileData as any).waiver_program_id || null,
                case_manager_name: (profileData as any).case_manager_name || null,
                case_manager_email: (profileData as any).case_manager_email || null,
                signed_waiver_id: signedWaivers['primary'] || null
              },
              family_members: validFamilyMembers.map((m, idx) => ({
                  first_name: m.first_name,
                  last_name: m.last_name,
                  date_of_birth: m.date_of_birth,
                  email: m.email || undefined,
                  gender: m.gender || undefined,
                  waiver_program_id: m.waiver_program_id || undefined,
                  case_manager_name: m.case_manager_name || undefined,
                  case_manager_email: m.case_manager_email || undefined,
                  guardian_name: m.guardian_name || undefined,
                  guardian_mobile: m.guardian_mobile || undefined,
                  emergency_contact_name: m.emergency_contact_name || undefined,
                  emergency_contact_phone: m.emergency_contact_phone || undefined,
                  address_line1: m.address_line1 || undefined,
                  address_line2: m.address_line2 || undefined,
                  city: m.city || undefined,
                  state: m.state || undefined,
                  zip_code: m.zip_code || undefined,
                  country: m.country || undefined,
                  mobile: m.mobile || undefined,
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
      } catch (error: any) {
          console.error("Registration failed", error);
          showToast(error.message || "Failed to create account. Please try again.", "error");
      } finally {
          setLoading(false);
      }
  };

  // Helper to reset state and close modal
  const handleReset = () => {
    setIsSuccess(false);
    setActiveStep(0);
    setProfileData({
      first_name: '',
      last_name: '',
      email: '',
      mobile: '',
      date_of_birth: null,
      family_count: 1,
      waiver_program_id: '',
      gender: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA',
      heard_about_us: '',
      notify_primary_member: true,
      notify_guardian: true,
      emergency_contact_name: '',
      emergency_contact_phone: '',
    });
    setFamilyMembers([]);
    setSignedWaivers({});
    setCreatedAccount(null);
    onClose();
  };

  const handleViewAccount = () => {
    if (createdAccount?.account_id) {
      navigate(`/admin/accounts/${createdAccount.account_id}`);
    }
    handleReset();
  };



  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ProfileStep data={profileData} updateData={updateProfileData} errors={errors} />
            <FamilyStep 
                data={familyMembers} 
                updateData={setFamilyMembers} 
                primaryData={profileData}
                updatePrimaryData={(key: string, value: any) => updateProfileData(key, value)}
                expectedCount={Math.max(1, profileData.family_count)}
            />
          </Box>
        );
      case 1:
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
      case 2:
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
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: isMobile ? 2 : 3, pb: 0 }}>
        {!isSuccess ? (
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: isMobile ? '1.25rem' : '1.5rem' }}>Join {locationName}</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
                bgcolor: '#f0fdf4', 
                color: '#16a34a', 
                width: isMobile ? 50 : 60, 
                height: isMobile ? 50 : 60, 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 1
            }}>
                <CheckCircleOutlineIcon sx={{ fontSize: isMobile ? 32 : 40 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: isMobile ? '1.25rem' : '1.5rem' }}>Account Created Successfully!</Typography>
            <Typography variant="body2" color="text.secondary">
                {mode === 'staff' 
                    ? "Client details have been saved and the account is now active."
                    : "Your registration is complete."
                }
            </Typography>
          </Box>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2, px: isMobile ? 2 : 4 }}>
        {!isSuccess ? (
          <>
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile} orientation={isMobile ? 'vertical' : 'horizontal'} sx={{ mb: 4, display: isMobile ? 'none' : 'flex' }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            {/* Mobile Stepper Indicator */}
            {isMobile && (
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {steps.map((label, idx) => (
                         <Box 
                            key={label}
                            sx={{ 
                                width: activeStep === idx ? 24 : 8, 
                                height: 8, 
                                borderRadius: 4, 
                                bgcolor: activeStep === idx ? 'primary.main' : 'grey.300',
                                transition: 'all 0.3s ease'
                            }} 
                         />
                    ))}
                    <Typography variant="caption" sx={{ ml: 1, fontWeight: 600, color: 'text.secondary' }}>
                        Step {activeStep + 1}/{steps.length}: {steps[activeStep]}
                    </Typography>
                </Box>
            )}
            
            <Box sx={{ minHeight: '300px', p: isMobile ? 0 : 1 }}>
                {renderStepContent(activeStep)}
            </Box>
          </>
        ) : (
          <Box sx={{ py: 4 }}>
            {mode === 'staff' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="contained"
                        fullWidth={isMobile}
                        onClick={handleViewAccount}
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                            bgcolor: '#0f172a',
                            '&:hover': { bgcolor: '#334155' },
                            px: 6,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '1rem',
                            width: isMobile ? '100%' : 'auto',
                        }}
                    >
                        View Account
                    </Button>
                    <Button
                        variant="text"
                        onClick={handleReset}
                        sx={{
                            color: 'text.secondary',
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Cancel
                    </Button>
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body1" sx={{ color: '#475569', mb: 4, lineHeight: 1.6 }}>
                        An account activation link has been sent to your email. 
                        Kindly use it to reset your password and login to your new account.
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={handleReset}
                        sx={{ 
                            bgcolor: '#2563eb', 
                            '&:hover': { bgcolor: '#1d4ed8' },
                            px: 8,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            width: isMobile ? '100%' : 'auto'
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
            sx={{ bottom: { xs: 90, sm: 24 } }}
        >
            <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
                {toast.message}
            </Alert>
        </Snackbar>

      </DialogContent>

      {!isSuccess && (
        <DialogActions sx={{ p: isMobile ? 2 : 3, justifyContent: 'space-between', flexDirection: isMobile ? 'column-reverse' : 'row', gap: isMobile ? 2 : 0 }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            fullWidth={isMobile}
            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600, mt: isMobile ? 1 : 0 }}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 1.5, width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
              {activeStep === 1 && mode === 'staff' && (
                  <Button 
                      variant="outlined" 
                      onClick={() => setActiveStep(2)}
                      fullWidth={isMobile}
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
                    fullWidth={isMobile}
                    sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none', 
                        fontWeight: 700,
                        bgcolor: '#0f172a',
                        px: 4,
                        py: isMobile ? 1.5 : 0.75,
                        '&:hover': { bgcolor: '#334155' }
                    }}
                  >
                      {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
              ) : (
                  <Button 
                    variant="contained" 
                    onClick={handleNext}
                    fullWidth={isMobile}
                    sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none', 
                        fontWeight: 700,
                        bgcolor: '#0f172a',
                        px: 4,
                        py: isMobile ? 1.5 : 0.75,
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

