import React, { useCallback, useState } from 'react';
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
  Alert
} from '@mui/material';
import { ProfileStep } from './Steps/ProfileStep';
import { FamilyStep } from './Steps/FamilyStep';
import { ReviewStep } from './Steps/ReviewStep';
import { WaiverSigningStep } from './Steps/WaiverSigningStep';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
import type { OnboardingErrors, OnboardingFamilyMember, OnboardingProfileData } from './types';


interface ClientOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = ['Profile', 'Family Details', 'Waiver Signing', 'Review'];

export const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const { currentLocationId, locations } = useAuth();
  
  const currentLocation = locations.find(loc => loc.location_id === currentLocationId);
  const locationName = currentLocation ? currentLocation.name : 'Zalexy';

  // Form Data State
  const [profileData, setProfileData] = useState<OnboardingProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    date_of_birth: null,
    family_count: 1,
    // ... other fields
  });

  const [familyMembers, setFamilyMembers] = useState<OnboardingFamilyMember[]>([]);
  const [signedWaivers, setSignedWaivers] = useState<Record<string, string>>({});
  const [allSigned, setAllSigned] = useState(false);

  const [errors, setErrors] = useState<OnboardingErrors>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showToast = useCallback((message: string, severity: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToast({ open: true, message, severity });
  }, []);

  const handleCloseToast = useCallback(() => {
    setToast(prev => ({ ...prev, open: false }));
  }, []);

  // Debugging state sync
  React.useEffect(() => {
    console.log("Parent signedWaivers state updated:", signedWaivers);
  }, [signedWaivers]);

  const updateProfileData = useCallback((key: keyof OnboardingProfileData, value: string | number | null) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }, []);

  const handlePrimaryDataUpdate = useCallback((key: keyof OnboardingProfileData, value: string | number | null) => {
    updateProfileData(key, value);
  }, [updateProfileData]);

  const validateProfile = useCallback(() => {
    const newErrors: OnboardingErrors = {};
    if (!profileData.first_name) newErrors.first_name = 'First name is required';
    if (!profileData.last_name) newErrors.last_name = 'Last name is required';
    if (!profileData.email) newErrors.email = 'Email is required';
    if (!profileData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profileData.date_of_birth, profileData.email, profileData.first_name, profileData.last_name]);

  const validateFamily = useCallback(() => {
      // Basic check: Ensure names are filled if a member entry exists
      return true;
  }, []);
  
  const validateWaivers = useCallback(() => {
      console.log("Validating Waivers. Step reported allSigned:", allSigned, "Signatures:", signedWaivers);
      return allSigned;
  }, [allSigned, signedWaivers]);

  const handleNext = useCallback(() => {
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
  }, [activeStep, showToast, validateFamily, validateProfile, validateWaivers]);

  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  const handleFinish = useCallback(async () => {
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
                waiver_program_id: profileData.waiver_program_id,
                case_manager_name: profileData.case_manager_name,
                case_manager_email: profileData.case_manager_email,
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
          await authService.registerUser(payload);
          
          onSuccess();
          onClose();
          
          // Reset State
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
      } catch (error: unknown) {
          console.error("Registration failed", error);
          const message = error instanceof Error ? error.message : "Failed to create account. Please try again.";
          showToast(message, "error");
      } finally {
          setLoading(false);
      }
  }, [currentLocationId, familyMembers, onClose, onSuccess, profileData, showToast, signedWaivers]);

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
                updatePrimaryData={handlePrimaryDataUpdate}
                expectedCount={Math.max(1, profileData.family_count)}
            />
        );
      case 2: {
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
      }
      case 3:
        return <ReviewStep primaryProfile={profileData} familyMembers={familyMembers} />;
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Join {locationName}</Typography>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
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

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          sx={{ color: 'text.secondary' }}
        >
          Back
        </Button>
        <Box>
            {activeStep === steps.length - 1 ? (
                <Button variant="contained" onClick={handleFinish} disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
            ) : (
                <Button variant="contained" onClick={handleNext}>
                    Next Step
                </Button>
            )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};
