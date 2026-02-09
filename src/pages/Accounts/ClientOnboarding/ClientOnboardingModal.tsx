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
  Typography
} from '@mui/material';
import { ProfileStep } from './Steps/ProfileStep';
import { FamilyStep } from './Steps/FamilyStep';
import { ReviewStep } from './Steps/ReviewStep';
import { authService } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';

interface ClientOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = ['Profile', 'Family Details', 'Review'];

export const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const { currentLocationId } = useAuth();
  
  // Form Data State
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    date_of_birth: null,
    family_count: 1
  });

  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

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
      // We can iterate and check, but for now we'll allow empty to mean "ignore" or enforce "first name required"
      // Logic could be added here if we want strict validation on family members
      return true;
  };

  const handleNext = () => {
    if (activeStep === 0) {
        if (!validateProfile()) return;
    }
    if (activeStep === 1) {
        if (!validateFamily()) return;
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
                // These are placeholders as they might be required by backend validation but not in UI yet
                // emergency_contact_name: "",
                // emergency_contact_phone: ""
              },
              family_members: validFamilyMembers.map(m => ({
                  first_name: m.first_name,
                  last_name: m.last_name,
                  date_of_birth: m.date_of_birth,
                  email: m.email || undefined,
                  waiver_program_id: m.waiver_program_id || undefined,
                  case_manager_name: m.case_manager_name || undefined,
                  case_manager_email: m.case_manager_email || undefined,
                  guardian_name: m.guardian_name || undefined,
                  guardian_mobile: m.guardian_mobile || undefined,
                  emergency_contact_phone: m.emergency_phone || undefined
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
      } catch (error) {
          console.error("Registration failed", error);
          alert("Failed to create account. Please check the console or try again.");
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
        return <ReviewStep primaryProfile={profileData} familyMembers={familyMembers} />;
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Join Solar Swim & Gym</Typography>
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
