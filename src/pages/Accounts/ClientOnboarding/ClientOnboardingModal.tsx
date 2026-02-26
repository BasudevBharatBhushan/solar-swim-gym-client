import React, { useState, useEffect, useRef } from 'react';
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
  useMediaQuery,
  DialogContentText,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ProfileStep } from './Steps/ProfileStep';
import { FamilyStep } from './Steps/FamilyStep';
import { ReviewStep } from './Steps/ReviewStep';
import { WaiverSigningStep, WaiverSigningStepRef } from './Steps/WaiverSigningStep';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../../context/ConfigContext';
import { 
  calculateAge, 
  getJuniorGroup, 
  isFutureDate, 
  isJuniorMembership, 
  isUnderSixMonths 
} from '../../../lib/ageUtils';


interface ClientOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onboardingType?: 'staff_assisted' | 'user' | 'tab_user';
  locationNameProp?: string;
}

const steps = ['Account & Profiles', 'Waiver Signing', 'Review'];



export const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({ open, onClose, onSuccess, onboardingType = 'staff_assisted', locationNameProp }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [activeStep, setActiveStep] = useState(0);
  const { login, setCurrentLocationId, currentLocationId, locations } = useAuth();
  const { ageGroups, refreshWaiverPrograms, refreshAgeGroups, refreshWaiverTemplates } = useConfig();
  
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
    password: '',
    confirm_password: '',
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
    guardian_name: '',
    guardian_mobile: '',
    guardian_email: '',
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
  const [juniorConfirmOpen, setJuniorConfirmOpen] = useState(false);
  const [juniorConfirmAcknowledged, setJuniorConfirmAcknowledged] = useState(false);
  const [juniorConfirmed, setJuniorConfirmed] = useState(false);
  const juniorGroup = getJuniorGroup(ageGroups);
  const primaryAge = profileData.date_of_birth ? calculateAge(profileData.date_of_birth) : null;
  const isPrimaryJunior = isJuniorMembership(profileData.date_of_birth || '', ageGroups);
  const primaryFutureDob = profileData.date_of_birth ? isFutureDate(profileData.date_of_birth) : false;
  const primaryUnderSixMonths = profileData.date_of_birth ? isUnderSixMonths(profileData.date_of_birth) : false;
  const primaryTooYoungForPrimary = primaryAge !== null
    ? (juniorGroup ? primaryAge < (juniorGroup.min_age ?? 13) : primaryAge < 13)
    : false;

  const showToast = (message: string, severity: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToast({ open: true, message, severity });
  };

  const normalizeDigits = (val: string) => (val || '').replace(/\D/g, '');
  const validateMobile = (val: string): string => {
    if (!val) return '';
    const digits = normalizeDigits(val);
    if (digits.length !== 10) return 'Mobile number must be 10 digits';
    return '';
  };
  const validateEmailFormat = (val: string): string => {
    if (!val) return '';
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(val) ? '' : 'Enter a valid email address';
  };

  const handleProfileFieldBlur = (key: string, value: string) => {
    if (key === 'mobile' || key === 'guardian_mobile' || key === 'emergency_contact_phone') {
      const err = validateMobile(value);
      setErrors((prev: any) => ({ ...prev, [key]: err || undefined }));
    }
    if (key === 'email') {
      const err = validateEmailFormat(value);
      setErrors((prev: any) => ({ ...prev, [key]: err || undefined }));
    }
    if (key === 'date_of_birth') {
      let err = '';
      if (!value) err = 'Date of birth is required';
      else if (isFutureDate(value)) err = 'Date of birth cannot be in the future';
      else if (isUnderSixMonths(value)) err = 'Age must be at least 6 months';
      else if (primaryTooYoungForPrimary) err = 'Primary must be Junior or older';
      setErrors((prev: any) => ({ ...prev, date_of_birth: err || undefined }));
    }
  };

  useEffect(() => {
    if (!isPrimaryJunior) {
      setJuniorConfirmed(false);
      setJuniorConfirmAcknowledged(false);
      return;
    }
    // Enforce no family members for junior primary
    if (profileData.family_count !== 1) {
      setProfileData(prev => ({ ...prev, family_count: 1 }));
    }
    if (familyMembers.length > 0) {
      setFamilyMembers([]);
    }
  }, [isPrimaryJunior, profileData.family_count, familyMembers.length]);

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const waiverStepRef = useRef<WaiverSigningStepRef>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 40) {
        setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
      // Reset scroll status on step change
      setHasScrolledToBottom(false);
      
      // Check if content is already short enough to not need scrolling
      const checkScroll = () => {
          if (dialogContentRef.current) {
              const { scrollHeight, clientHeight } = dialogContentRef.current;
              // If scrollHeight is close to clientHeight, it means no scroll is needed
              if (scrollHeight <= clientHeight + 10) {
                  setHasScrolledToBottom(true);
              }
          }
      };

      // Check immediately and also after content might have settled
      checkScroll();
      const timer = setTimeout(checkScroll, 500);
      return () => clearTimeout(timer);
  }, [activeStep, open, profileData.family_count, familyMembers.length]);

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
    if (!profileData.email) {
      newErrors.email = 'Email is required';
    } else {
      const emailErr = validateEmailFormat(profileData.email);
      if (emailErr) newErrors.email = emailErr;
    }
    if (onboardingType !== 'staff_assisted') {
        if (!profileData.password) {
            newErrors.password = 'Password is required';
        } else if (profileData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (!profileData.confirm_password) {
            newErrors.confirm_password = 'Confirm Password is required';
        } else if (profileData.password !== profileData.confirm_password) {
            newErrors.confirm_password = 'Passwords must match';
        }
    }
    if (profileData.mobile) {
      const mobileErr = validateMobile(profileData.mobile);
      if (mobileErr) newErrors.mobile = mobileErr;
    }
    if (!profileData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      if (primaryFutureDob) newErrors.date_of_birth = 'Date of birth cannot be in the future';
      else if (primaryUnderSixMonths) newErrors.date_of_birth = 'Age must be at least 6 months';
      else if (primaryTooYoungForPrimary) newErrors.date_of_birth = 'Primary must be Junior or older';
    }
    if (isPrimaryJunior) {
      if (!profileData.guardian_name) newErrors.guardian_name = 'Guardian name is required for junior primary';
      if (!profileData.guardian_mobile) {
        newErrors.guardian_mobile = 'Guardian mobile is required for junior primary';
      } else {
        const gMobileErr = validateMobile(profileData.guardian_mobile);
        if (gMobileErr) newErrors.guardian_mobile = gMobileErr;
      }
      if (!profileData.emergency_contact_phone) {
        newErrors.emergency_contact_phone = 'Emergency contact phone is required';
      } else {
        const eMobileErr = validateMobile(profileData.emergency_contact_phone);
        if (eMobileErr) newErrors.emergency_contact_phone = eMobileErr;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFamily = () => {
      if (isPrimaryJunior && familyMembers.length > 0) {
        showToast('Family members cannot be added when primary is Junior.', 'warning');
        return false;
      }

      const familyErrors: Record<number, any> = {};
      familyMembers.forEach((member, idx) => {
        const hasAnyValue = member.first_name || member.last_name || member.date_of_birth;
        if (!hasAnyValue) return;

        const memberErrors: any = {};
        if (!member.first_name) memberErrors.first_name = 'First name required';
        if (!member.last_name) memberErrors.last_name = 'Last name required';
        if (!member.date_of_birth) {
          memberErrors.date_of_birth = 'Date of birth required';
        } else {
          if (isFutureDate(member.date_of_birth)) memberErrors.date_of_birth = 'DOB cannot be future';
          else if (isUnderSixMonths(member.date_of_birth)) memberErrors.date_of_birth = 'Age must be at least 6 months';
        }

        const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null;
        const isMinor = age !== null ? age < 18 : false;
        if (member.email) {
          const err = validateEmailFormat(member.email);
          if (err) memberErrors.email = err;
        }
        if (member.mobile) {
          const err = validateMobile(member.mobile);
          if (err) memberErrors.mobile = err;
        }
        if (isMinor) {
          if (!member.guardian_name) memberErrors.guardian_name = 'Guardian name required for minors';
          if (!member.guardian_mobile) {
            memberErrors.guardian_mobile = 'Guardian mobile required';
          } else {
            const err = validateMobile(member.guardian_mobile);
            if (err) memberErrors.guardian_mobile = err;
          }
          if (!member.emergency_contact_phone) {
            memberErrors.emergency_contact_phone = 'Emergency contact phone required';
          } else {
            const err = validateMobile(member.emergency_contact_phone);
            if (err) memberErrors.emergency_contact_phone = err;
          }
        }

        if (Object.keys(memberErrors).length > 0) {
          familyErrors[idx] = memberErrors;
        }
      });

      setErrors((prev: any) => ({ ...prev, family: familyErrors }));
      return Object.keys(familyErrors).length === 0;
  };
  
  const validateWaivers = () => {
      console.log("Validating Waivers. Step reported allSigned:", allSigned, "Signatures:", signedWaivers);
      return allSigned;
  };

  const handleNext = () => {
    if (activeStep === 0) {
        const isProfileValid = validateProfile();
        const isFamilyValid = validateFamily();
        
        if (!isProfileValid || !isFamilyValid) {
            showToast('Please complete all required fields correctly.', 'error');
            return;
        }

        if (isPrimaryJunior && !juniorConfirmed) {
            setJuniorConfirmAcknowledged(false);
            setJuniorConfirmOpen(true);
            return;
        }
    }
    if (activeStep === 1) {
        if (!validateWaivers()) {
            const advanced = waiverStepRef.current?.advanceToNextUnsigned();
            if (advanced) {
                showToast("Please sign the remaining waivers to proceed.", "info");
            } else {
                showToast("Please sign all waivers to proceed.", "warning");
            }
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
                ...(onboardingType !== 'staff_assisted' && profileData.password ? { password: profileData.password } : {}),
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
              guardian_email: (profileData as any).guardian_email || null,
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
                  guardian_email: m.guardian_email || undefined,
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
          
          if (onboardingType === 'user') {
              try {
                  const loginResponse = await authService.loginUser(profileData.email, profileData.password);
                  const userObj = loginResponse.user || loginResponse.staff || loginResponse.profile;
                  if (userObj) {
                      login(loginResponse.token, 'MEMBER', userObj.profile_id, userObj);
                      if (userObj.location_id) {
                          setCurrentLocationId(userObj.location_id);
                      } else if (userObj.account?.location_id) {
                          setCurrentLocationId(userObj.account.location_id);
                      }
                      navigate('/portal');
                      onClose();
                  }
              } catch (loginErr) {
                  // Fallback to login route if auto-login fails
                  console.error('Auto-login failed', loginErr);
                  showToast('Account created, but automatic login failed. Please sign in.', 'warning');
                  setTimeout(() => {
                      onClose();
                  }, 2000);
              }
          } else if (onboardingType === 'tab_user') {
              setTimeout(() => {
                  window.location.reload(); // Quick redirect keeping queries
              }, 3000);
          }
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
      password: '',
      confirm_password: '',
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
      guardian_name: '',
      guardian_mobile: '',
      guardian_email: '',
      emergency_contact_phone: '',
    });
    setFamilyMembers([]);
    setSignedWaivers({});
    setCreatedAccount(null);
    setJuniorConfirmed(false);
    setJuniorConfirmAcknowledged(false);
    setJuniorConfirmOpen(false);
    onClose();
  };

  const handleViewAccount = () => {
    if (createdAccount?.account_id) {
      navigate(`/admin/accounts/${createdAccount.account_id}`);
    }
    handleReset();
  };

  const handleJuniorConfirm = () => {
    setJuniorConfirmed(true);
    setJuniorConfirmOpen(false);
    setJuniorConfirmAcknowledged(false);
    setProfileData(prev => ({ ...prev, family_count: 1 }));
    setFamilyMembers([]);
    setActiveStep((prev) => prev + 1);
  };

  const handleJuniorCancel = () => {
    setJuniorConfirmOpen(false);
    setJuniorConfirmAcknowledged(false);
  };



  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ProfileStep 
              data={profileData} 
              updateData={updateProfileData} 
              errors={errors} 
              isPrimaryJunior={isPrimaryJunior}
              lockFamilyCount={isPrimaryJunior}
              onFieldBlur={handleProfileFieldBlur}
              onboardingType={onboardingType}
            />
            <FamilyStep 
                data={familyMembers} 
                updateData={setFamilyMembers} 
                primaryData={profileData}
                updatePrimaryData={(key: string, value: any) => updateProfileData(key, value)}
                expectedCount={Math.max(1, profileData.family_count)}
                errors={errors.family || {}}
            />
          </Box>
        );
      case 1:
          // Filter valid members to pass to WaiverStep
          const validMembers = familyMembers.filter(m => m.first_name && m.last_name);
          return (
            <WaiverSigningStep 
                ref={waiverStepRef}
                primaryProfile={profileData}
                familyMembers={validMembers}
                signedWaivers={signedWaivers}
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
    <>
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
                {onboardingType === 'staff_assisted' 
                    ? "Client details have been saved and the account is now active."
                    : "Your registration is complete."
                }
            </Typography>
          </Box>
        )}
      </DialogTitle>
      
      <DialogContent 
        ref={dialogContentRef}
        onScroll={handleScroll}
        sx={{ mt: 2, px: isMobile ? 2 : 4 }}
      >
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
            {onboardingType === 'staff_assisted' ? (
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
                        {onboardingType === 'tab_user' ? 
                            "Account created. Redirecting to login on this device..." : 
                            "Registration is complete. You will be redirected shortly."
                        }
                    </Typography>
                    {onboardingType !== 'tab_user' && (
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
                    )}
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
              {activeStep === 1 && onboardingType === 'staff_assisted' && (
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
                    disabled={loading || !hasScrolledToBottom}
                    fullWidth={isMobile}
                    sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none', 
                        fontWeight: 700,
                        bgcolor: '#0f172a',
                        px: 4,
                        py: isMobile ? 1.5 : 0.75,
                        '&:hover': { bgcolor: '#334155' },
                        '&.Mui-disabled': {
                            bgcolor: '#f1f5f9',
                            color: '#94a3b8'
                        }
                    }}
                  >
                      {!hasScrolledToBottom ? 'Scroll to bottom' : (loading ? 'Creating Account...' : 'Create Account')}
                  </Button>
              ) : (
                  <Button 
                    variant="contained" 
                    onClick={handleNext}
                    fullWidth={isMobile}
                    disabled={!hasScrolledToBottom}
                    sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none', 
                        fontWeight: 700,
                        bgcolor: '#0f172a',
                        px: 4,
                        py: isMobile ? 1.5 : 0.75,
                        '&:hover': { bgcolor: '#334155' },
                        '&.Mui-disabled': {
                            bgcolor: '#f1f5f9',
                            color: '#94a3b8'
                        }
                    }}
                  >
                      {!hasScrolledToBottom && !isMobile ? 'Scroll down' : 'Next Step'}
                  </Button>
              )}
          </Box>
        </DialogActions>
      )}
    </Dialog>

    <Dialog open={juniorConfirmOpen} onClose={handleJuniorCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Junior Primary Member</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          The entered date of birth falls under the Junior age group. Junior primaries cannot add family members and must have guardian details on file.
        </DialogContentText>
        <FormControlLabel
          control={
            <Checkbox
              checked={juniorConfirmAcknowledged}
              onChange={(e) => setJuniorConfirmAcknowledged(e.target.checked)}
            />
          }
          label="Add as Junior primary member and proceed"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleJuniorCancel}>Cancel</Button>
        <Button
          onClick={handleJuniorConfirm}
          variant="contained"
          disabled={!juniorConfirmAcknowledged}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};
