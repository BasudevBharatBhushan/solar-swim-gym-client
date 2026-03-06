
import { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Chip,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LinkIcon from '@mui/icons-material/Link';
import PrintIcon from '@mui/icons-material/Print';
import EmailIcon from '@mui/icons-material/Email';
import DrawIcon from '@mui/icons-material/Draw';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../../context/AuthContext';
import { waiverService, SignedWaiver, WaiverTemplate } from '../../../services/waiverService';
import { billingService } from '../../../services/billingService';
import { emailService } from '../../../services/emailService';

import { configService } from '../../../services/configService';
import { Profile } from '../../../types';
import { createWaiverPdfAttachment } from '../../../utils/waiverPdf';
import { EmailComposer } from '../../../components/Email/EmailComposer';
import { WaiverPreview } from '../../../components/Waiver/WaiverPreview';
import { SignaturePad, SignaturePadRef, getSignatureBlob } from '../../../components/Waiver/SignaturePad';
import { getAgeGroup, getAgeRangeLabel } from '../../../lib/ageUtils';
import { resolveWaiverTemplates, getSubscriptionWaiverContext } from '../../../utils/waiverUtils';
import { basePriceService, BasePrice } from '../../../services/basePriceService';
import { membershipService, MembershipProgram } from '../../../services/membershipService';
import { useConfig } from '../../../context/ConfigContext';
import { GenerateWaiverDialog } from './GenerateWaiverDialog';




interface WaiversTabProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  accountId?: string;
  /** Full account object – used to read notification prefs after signing */
  account?: {
    account_id?: string;
    email?: string;
    notify_primary_member?: boolean;
    notify_guardian?: boolean;
    profiles?: any[];
  };
}

interface WaiverEmailDraft {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  attachments: File[];
  accountId?: string;
}

interface PendingWaiver {
  profile: Profile;
  waiverTemplate: WaiverTemplate;
  ageGroupName: string;
  waiverType: string;
  replacedContent: string;
  variables: Record<string, string>;
  subscription_id?: string;
}



export const WaiversTab = ({ profiles, selectedProfileId, accountId, account }: WaiversTabProps) => {
  const { currentLocationId, role } = useAuth();
  const { subscriptionTerms } = useConfig();
  const [signedWaivers, setSignedWaivers] = useState<SignedWaiver[]>([]);
  const [pendingWaivers, setPendingWaivers] = useState<PendingWaiver[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingWaiverId, setSendingWaiverId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCompose, setOpenCompose] = useState(false);
  const [composeDraft, setComposeDraft] = useState<WaiverEmailDraft | null>(null);
  const [generateWaiverProfile, setGenerateWaiverProfile] = useState<PendingWaiver | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Sub-tab state: 0 = Pending, 1 = Signed
  const [subTab, setSubTab] = useState(0);
  
  // Dialog state for viewing signed waivers
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWaiver, setSelectedWaiver] = useState<SignedWaiver | null>(null);

  // Signing dialog state
  const [signingProfile, setSigningProfile] = useState<PendingWaiver | null>(null);
  const [openSignDialog, setOpenSignDialog] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const showToast = (message: string, severity: 'error' | 'success' | 'warning' | 'info' = 'info') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  
  useEffect(() => {
    const fetchWaiverData = async () => {
      if (!currentLocationId) return;
      
      setLoading(true);
      setError(null);
      setSignedWaivers([]);
      setPendingWaivers([]);

      try {
        let profilesToFetch: Profile[] = [];
        if (selectedProfileId) {
          profilesToFetch = profiles.filter(p => p.profile_id === selectedProfileId);
        } else {
          profilesToFetch = profiles;
        }

        if (profilesToFetch.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch waiver templates, age groups, and signed waivers in parallel
        const [waiverTemplatesRes, ageGroupsRes, ...signedResults] = await Promise.all([
          waiverService.getWaiverTemplates(currentLocationId || undefined),
          configService.getAgeGroups(currentLocationId),
          ...profilesToFetch.map(p => 
            waiverService.getSignedWaivers(p.profile_id, currentLocationId)
              .then(res => ({ profileId: p.profile_id, waivers: res.data || [] }))
              .catch(err => {
                console.error(`Failed to fetch waivers for profile ${p.profile_id}`, err);
                return { profileId: p.profile_id, waivers: [] as SignedWaiver[] };
              })
          )
        ]);

        const templates: WaiverTemplate[] = (waiverTemplatesRes as any).data || [];
        const ageGroups: any[] = (ageGroupsRes as any) || [];

        // Build map of signed waivers by profile
        const signedByProfile: Record<string, SignedWaiver[]> = {};
        const allSigned: SignedWaiver[] = [];

        for (const result of signedResults) {
          const r = result as { profileId: string; waivers: SignedWaiver[] };
          signedByProfile[r.profileId] = r.waivers;
          allSigned.push(...r.waivers);
        }

        // Sort signed waivers by signed_at descending
        allSigned.sort((a, b) => 
          new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime()
        );
        setSignedWaivers(allSigned);

        // Determine pending registration waivers
        const pending: PendingWaiver[] = [];

        for (const profile of profilesToFetch) {
          const group = profile.date_of_birth ? getAgeGroup(profile.date_of_birth, ageGroups, 'Membership') : null;

          // Find the template for this membership age profile
          let matchedTemplate = templates.find(t =>
            t.is_active && t.ageprofile_id === group?.age_group_id
          );
          if (!matchedTemplate) {
            matchedTemplate = templates.find(t => t.is_active && !t.ageprofile_id);
          }

          if (!matchedTemplate) continue;

          // Check if this profile already has a signed REGISTRATION waiver
          const profileSigned = signedByProfile[profile.profile_id] || [];
          const hasRegistrationWaiver = profileSigned.some(w => w.waiver_type === 'REGISTRATION');

          // Determine pre-rendered content for standard registration waiver
          const fmtCurr = (val: number) => `$${(val || 0).toFixed(2)}`;
          const specificName = `${profile.first_name} ${profile.last_name}`;
          const rawGuardian = profile.guardian_email || profile.guardian_name || account?.profiles?.find((p: any) => p.is_primary)?.guardian_name || 'N/A';
          const specificDob = profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'N/A';
          const currentDate = new Date().toLocaleDateString();

          let replacedContent = matchedTemplate.content;
          replacedContent = replacedContent.replace(/\[FullName\]/ig, specificName);
          replacedContent = replacedContent.replace(/\[GuardianName\]/ig, rawGuardian);
          replacedContent = replacedContent.replace(/\[DOB\]/ig, specificDob);
          replacedContent = replacedContent.replace(/\[CurrentDate\]/ig, currentDate);
          replacedContent = replacedContent.replace(/\[AcceptSignature\]/ig, '[AcceptSignature]'); // For signature injection
          replacedContent = replacedContent.replace(/\[CardLast4\]/ig, 'N/A');
          replacedContent = replacedContent.replace(/\[JoningFee\]/ig, fmtCurr(0));
          replacedContent = replacedContent.replace(/\[AnnualFee\]/ig, fmtCurr(0));
          replacedContent = replacedContent.replace(/\[MonthlyDues\]/ig, 'N/A');
          replacedContent = replacedContent.replace(/\[MembershipFee\]/ig, fmtCurr(0));
          replacedContent = replacedContent.replace(/\[LengthOfContract\]/ig, 'N/A');
          replacedContent = replacedContent.replace(/\[AutomaticRenewalTerm\]/ig, 'N/A');
          replacedContent = replacedContent.replace(/\[SubscriptionTerm\]/ig, 'N/A');
          replacedContent = replacedContent.replace(/\[EffectiveDate\]/ig, currentDate);
          replacedContent = replacedContent.replace(/\[MembershipPlanName\]/ig, 'N/A');
          replacedContent = replacedContent.replace(/\[MembershipPlanType\]/ig, 'N/A');

          const variables: Record<string, string> = {
            FullName: specificName,
            GuardianName: rawGuardian,
            DOB: specificDob,
            CurrentDate: currentDate,
            CardLast4: 'N/A',
            JoningFee: fmtCurr(0),
            AnnualFee: fmtCurr(0),
            MonthlyDues: 'N/A',
            MembershipFee: fmtCurr(0),
            LengthOfContract: 'N/A',
            AutomaticRenewalTerm: 'N/A',
            SubscriptionTerm: 'N/A',
            EffectiveDate: currentDate,
            MembershipPlanName: 'N/A',
            MembershipPlanType: 'N/A'
          };

          if (!hasRegistrationWaiver) {
            const ageGroupLabel = group ? `${group.name} ${getAgeRangeLabel(group)}` : 'Unknown';
            pending.push({
              profile,
              waiverTemplate: matchedTemplate,
              ageGroupName: ageGroupLabel,
              waiverType: 'REGISTRATION',
              replacedContent,
              variables
            });
          }
        }

        // --- NEW: Fetch pending waivers from account-level status API ---
        let basePrices: BasePrice[] = [];
        let membershipPrograms: MembershipProgram[] = [];
        let accountSubscriptions: any[] = [];

        if (accountId) {
          try {
            const [statusRes, subsRes, bpRes, mpRes] = await Promise.all([
              waiverService.getWaiverStatus({ account_id: accountId, status: 'pending' }),
              billingService.getAccountSubscriptions(accountId, currentLocationId || undefined),
              basePriceService.getAll((currentLocationId as string) || '').catch(() => ({ prices: [] })),
              membershipService.getMemberships((currentLocationId as string) || '').catch(() => [])
            ]);

            const apiPending = (statusRes?.data as any)?.pending || statusRes?.pending || [];
            accountSubscriptions = (subsRes as any)?.data || (Array.isArray(subsRes) ? subsRes : []);
            basePrices = bpRes?.prices || [];
            membershipPrograms = mpRes || [];

            
            for (const item of apiPending) {
              // Find the full subscription object to get coverage/context
              let fullSub = accountSubscriptions.find((s: any) => s.subscription_id === item.subscription_id);
              
              // If not found in current list, we still have info in 'item' (reference_id, type)
              // We'll use item structure as a mock sub if fullSub is missing
              const subToResolve = fullSub || {
                subscription_id: item.subscription_id,
                subscription_type: item.type,
                reference_id: item.reference_id,
                // Add any other required fields for context resolution
              };

              // Determine which profiles are covered
              const coverage = fullSub?.subscription_coverage || fullSub?.coverage || [];
              const profilesToConsider = coverage.length > 0 
                ? coverage.map((c: any) => c.profile).filter(Boolean)
                : (fullSub?.profile_id 
                    ? profiles.filter(p => p.profile_id === fullSub.profile_id)
                    : profiles // If we can't tell, check all profiles for the account
                  );

              if (profilesToConsider.length === 0) continue;

              for (const profile of profilesToConsider) {
                // Determine the template
                let template = templates.find(t => t.waiver_template_id === item.waiver_template_id);
                
                // Fallback to smart resolution
                if (!template) {
                  const context = getSubscriptionWaiverContext(subToResolve);
                  const matched = resolveWaiverTemplates(templates, context);
                  if (matched.length > 0) {
                    template = matched[0];
                  }
                }

                if (!template) continue;

                // Avoid duplicates
                const isAlreadyPending = pending.some(p => 
                  p.profile.profile_id === profile.profile_id && 
                  p.waiverTemplate.waiver_template_id === (template as any).waiver_template_id
                );

                if (isAlreadyPending) continue;

                const group = profile.date_of_birth ? getAgeGroup(profile.date_of_birth, ageGroups, 'Membership') : null;

                const waiverType = (template as any).template_category?.toUpperCase() || item.type || 'MEMBERSHIP';

                const fmtCurr = (val: number) => `$${(val || 0).toFixed(2)}`;
                const specificName = `${profile.first_name} ${profile.last_name}`;
                const rawGuardian = profile.guardian_email || profile.guardian_name || profiles.find((p: any) => p.is_primary)?.guardian_name || 'N/A';
                const specificDob = profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'N/A';
                const currentDate = new Date().toLocaleDateString();

                // Find pricing info
                const matchedSub = fullSub || {};
                
                // Enhanced lookup logic to find BOTH base plan and category info
                let basePriceId = matchedSub.reference_id || item.reference_id;
                let matchBasePrice = basePrices.find(bp => bp.base_price_id === basePriceId);
                
                let membershipCatId = matchedSub.reference_id || item.reference_id;
                let matchCat = membershipPrograms.flatMap(p => p.categories).find(c => c?.category_id === membershipCatId);
                
                // cross-resolution if needed
                if (!matchBasePrice && accountSubscriptions.length > 0) {
                    const feeSub = accountSubscriptions.find((s: any) => s.subscription_type === 'MEMBERSHIP_FEE');
                    if (feeSub) {
                        matchBasePrice = basePrices.find(bp => bp.base_price_id === feeSub.reference_id);
                    }
                }
                if (!matchCat && accountSubscriptions.length > 0) {
                    const joinSub = accountSubscriptions.find((s: any) => s.subscription_type === 'MEMBERSHIP_JOINING' || s.subscription_type === 'MEMBERSHIP_RENEWAL');
                    if (joinSub) {
                        matchCat = membershipPrograms.flatMap(p => p.categories).find(c => c?.category_id === joinSub.reference_id);
                    }
                }

                const lengthOfContract = matchBasePrice?.duration_months ?? 0;
                const autoRenewalTerm = matchBasePrice?.recurrence_unit_value ?? lengthOfContract;
                const displayTerm = lengthOfContract > 0 ? `${lengthOfContract} Month${lengthOfContract > 1 ? 's' : ''}` : 'N/A';
                const displayAutoRenewal = autoRenewalTerm > 0 ? `${autoRenewalTerm} Month${autoRenewalTerm > 1 ? 's' : ''}` : 'N/A';
                
                const joiningFeeAmt = (matchCat?.fees || []).find((f: any) => f.fee_type === 'JOINING' && f.is_active !== false)?.amount ?? 0;
                const annualFeeAmt = (matchCat?.fees || []).find((f: any) => f.fee_type === 'ANNUAL' && f.is_active !== false)?.amount ?? 0;

                const subTermDisplay = matchBasePrice?.term_name || subscriptionTerms?.find(t => t.subscription_term_id === matchedSub.subscription_term_id)?.name || 'Membership';
                const effectiveDate = matchedSub.billing_period_start ? new Date(matchedSub.billing_period_start).toLocaleDateString() : currentDate;
                const planName = matchBasePrice?.name || matchedSub.plan_name || 'N/A';
                const planRole = String(matchBasePrice?.role || 'N/A').replace(/_/g, ' ');

                const variables: Record<string, string> = {
                  FullName: specificName,
                  GuardianName: rawGuardian,
                  DOB: specificDob,
                  CurrentDate: currentDate,
                  AcceptSignature: '[AcceptSignature]',
                  CardLast4: 'N/A',
                  MembershipPlanName: planName,
                  MembershipName: planName,
                  MembershipPlanType: planRole,
                  MembershpPlanType: planRole,
                  MembershipFee: fmtCurr(matchBasePrice?.price || matchedSub.price || 0),
                  JoningFee: fmtCurr(joiningFeeAmt),
                  JoiningFee: fmtCurr(joiningFeeAmt),
                  AnnualFee: fmtCurr(annualFeeAmt),
                  MonthlyDues: autoRenewalTerm === 1 ? fmtCurr(matchBasePrice?.price || matchedSub.price || 0) : 'N/A',
                  SubscriptionTerm: subTermDisplay,
                  LengthOfContract: displayTerm,
                  AutomaticRenewalTerm: displayAutoRenewal,
                  EffectiveDate: effectiveDate,
                  Relationship: 'Guardian',
                  price: fmtCurr(matchedSub.price || 0)
                };

                let replacedContent = template.content;
                Object.entries(variables).forEach(([key, val]) => {
                   const regex = new RegExp(`\\[${key}\\]`, 'g');
                   replacedContent = replacedContent.replace(regex, val);
                });

                pending.push({
                   profile,
                   waiverTemplate: template,
                   ageGroupName: group ? `${group.name} ${getAgeRangeLabel(group)}` : 'Unknown',
                   waiverType: waiverType,
                   replacedContent,
                   variables,
                   subscription_id: item.subscription_id
                });
              }
            }
          } catch (err) {
            console.error("Failed to fetch pending status from API", err);
          }
        }

        setPendingWaivers(pending);



        // Auto-switch to pending tab if there are pending waivers
        if (pending.length > 0) {
          setSubTab(0);
        } else if (allSigned.length > 0) {
          setSubTab(1);
        }

      } catch (err: any) {
        console.error("Failed to fetch waiver data", err);
        setError("Failed to load waivers.");
      } finally {
        setLoading(false);
      }
    };

    fetchWaiverData();
  }, [selectedProfileId, currentLocationId, profiles]);

  const handleViewWaiver = (waiver: SignedWaiver) => {
    setSelectedWaiver(waiver);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedWaiver(null);
  };

  const getProfileName = (profileId: string) => {
     const profile = profiles.find(p => p.profile_id === profileId);
     return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Profile';
  };

  const getProfileById = (profileId: string) => {
    return profiles.find(p => p.profile_id === profileId);
  };

  const handleCloseCompose = () => {
    setOpenCompose(false);
    setComposeDraft(null);
  };

  const handleComposerSuccess = () => {
    showToast('Waiver email sent successfully.', 'success');
  };

  // --- Signing Dialog Logic ---
  const handleOpenSignDialog = (pendingWaiver: PendingWaiver) => {
    setSigningProfile(pendingWaiver);
    setAgreed(false);
    setSigning(false);
    setOpenSignDialog(true);
  };

  const handleCloseSignDialog = () => {
    setOpenSignDialog(false);
    setSigningProfile(null);
    setAgreed(false);
  };

  /**
   * Automatically sends the signed waiver PDF to the correct recipients
   * based on account-level notification preferences.
   */
  const sendSignedWaiverAutomatically = async (
    profile: Profile,
    signedWaiver: any
  ) => {
    if (!currentLocationId) return;

    try {
      // Resolve recipient emails based on notification preferences
      const recipients: string[] = [];

      const notifyPrimary = account?.notify_primary_member !== false; // default true if unset
      const notifyGuardian = account?.notify_guardian === true;

      if (notifyPrimary) {
        // Primary member email: the profile itself, or the primary profile of the account
        const primaryEmail =
          profile.email ||
          account?.profiles?.find((p: any) => p.is_primary)?.email ||
          account?.email ||
          null;
        if (primaryEmail) recipients.push(primaryEmail);
      }

      if (notifyGuardian) {
        // Guardian email: look for guardian_email on the profile or account email as fallback
        const guardianEmail =
          profile.guardian_email ||
          account?.profiles?.find((p: Profile) => p.is_primary)?.guardian_email ||
          null;
        if (guardianEmail && !recipients.includes(guardianEmail)) {
          recipients.push(guardianEmail);
        }
      }

      if (recipients.length === 0) {
        console.warn('No notification recipients resolved; skipping auto-email after signing.');
        return;
      }

      // Generate PDF attachment
      const pdfFile = await createWaiverPdfAttachment(
        { first_name: profile.first_name, last_name: profile.last_name },
        signedWaiver
      );

      // Fetch waiver email template
      const templateName = 'Welcome to Glass Court Swim & Fitness – Waiver Confirmation';
      let subject = `Signed Waiver Confirmation – ${profile.first_name} ${profile.last_name}`;
      let body = `Please find attached the signed registration waiver for ${profile.first_name} ${profile.last_name}.`;
      let templateId: string | undefined;

      try {
        const templates = await emailService.getTemplates(currentLocationId);
        const template = templates.find(
          (t) => t.subject === templateName || t.subject.includes('Waiver Confirmation')
        );
        if (template) {
          subject = template.subject;
          const fullName = `${profile.first_name} ${profile.last_name}`;
          body = (template.body_content || '').replace(/\[fullname\]/gi, fullName);
          templateId = template.email_template_id;
        }
      } catch {
        console.warn('Could not fetch waiver email template; using defaults.');
      }

      // Send to all resolved recipients
      await emailService.sendEmail({
        to: recipients.join(', '),
        subject,
        body,
        isHtml: true,
        location_id: currentLocationId,
        account_id: accountId,
        email_template_id: templateId,
        attachments: [pdfFile],
      });

      showToast(
        `Signed waiver copy sent to ${recipients.join(', ')}.`,
        'success'
      );
    } catch (err: any) {
      console.error('Failed to auto-send signed waiver email', err);
      // Non-fatal: show a warning but don't block the UI
      showToast(
        `Waiver signed, but failed to send email copy: ${err.message || 'unknown error'}`,
        'warning'
      );
    }
  };

  const handleSignWaiver = async () => {
    if (!signingProfile || !signaturePadRef.current || !currentLocationId) return;

    if (signaturePadRef.current.isEmpty()) {
      showToast('Please sign to continue.', 'warning');
      return;
    }

    const canvas = signaturePadRef.current.getCanvas();
    if (!canvas) return;

    setSigning(true);
    try {
      const blob = await getSignatureBlob(canvas);
      if (!blob) throw new Error('Failed to capture signature');

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const sigResponse = await waiverService.uploadSignature(base64);
          
          let content = signingProfile.replacedContent;
          const fullName = `${signingProfile.profile.first_name} ${signingProfile.profile.last_name}`;
          // Fallback just in case
          content = content.replace(/\[FullName\]/ig, fullName);
          content = content.replace(/\[CurrentDate\]/ig, new Date().toLocaleDateString());

          
          const upsertRes = await waiverService.upsertSignedWaiver({
            profile_id: signingProfile.profile.profile_id,
            waiver_template_id: signingProfile.waiverTemplate.waiver_template_id,
            waiver_type: signingProfile.waiverType,
            content,
            signature_url: sigResponse.signature_url,
            subscription_id: signingProfile.subscription_id
          }, currentLocationId);

          const { signed_waiver_id } = upsertRes;

          // If linked to a subscription, make sure to update the subscription record
          if (signingProfile.subscription_id && signed_waiver_id) {
            try {
              await waiverService.linkWaiverToSubscription(signingProfile.subscription_id, { signedwaiver_id: signed_waiver_id });
            } catch (linkErr) {
              console.error('Failed to link waiver to subscription', linkErr);
              // Non-fatal, the waiver is already signed
            }
          }

          showToast(`Waiver signed successfully for ${fullName}!`, 'success');
          handleCloseSignDialog();

          // Remove from pending list
          setPendingWaivers(prev => prev.filter(pw => pw.profile.profile_id !== signingProfile.profile.profile_id));
          
          // Fetch the newly signed waiver record and update state
          const newSigned = await waiverService.getSignedWaivers(signingProfile.profile.profile_id, currentLocationId);
          const latestWaiver = newSigned.data?.[0] ?? null;
          if (newSigned.data) {
            setSignedWaivers(prev => [...newSigned.data, ...prev]);
          }

          // === AUTO-SEND SIGNED WAIVER COPY BASED ON NOTIFICATION PREFS ===
          if (latestWaiver) {
            await sendSignedWaiverAutomatically(signingProfile.profile, latestWaiver);
          }
        } catch (err: any) {
          console.error('Signing failed', err);
          showToast(err.message || 'Signing failed', 'error');
          setSigning(false);
        }
      };
    } catch (err: any) {
      console.error('Signing failed', err);
      showToast(err.message || 'Signing failed', 'error');
      setSigning(false);
    }
  };

  // --- Email Draft Logic ---
  const handleGenerateWaiverLink = (pw: PendingWaiver) => {
    setGenerateWaiverProfile(pw);
  };

  const handleEmailDraftReady = async (draft: { subject: string; body: string; to?: string; templateId?: string; publicUrl: string }) => {
    // We already have the draft from GenerateWaiverDialog, just need to prepare the composer
    if (!generateWaiverProfile) return;

    let finalSubject = draft.subject;
    let finalBody = draft.body;
    let finalTemplateId = draft.templateId;

    try {
      const templates = await emailService.getTemplates(currentLocationId || '');
      const template = templates.find(t => 
         t.subject?.includes('Complete Your Registration') || 
         t.subject?.includes('Waiver Signing')
      );
      if (template) {
        finalSubject = template.subject.replace(/\{\{company\}?\}?/g, 'Glass Court Swim and Fitness');
        finalBody = template.body_content
          .replace(/\{\{contract_link\}\}/g, draft.publicUrl)
          .replace(/\{\{company\}\}/g, 'Glass Court Swim and Fitness')
          .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());
        finalTemplateId = template.email_template_id;
      }
    } catch (templateError) {
      console.warn('Could not fetch templates', templateError);
    }

    if (!finalBody.includes(draft.publicUrl)) {
      finalBody = `${finalBody}\n\nSign your waiver here: ${draft.publicUrl}`;
    }

    setComposeDraft({
       to: draft.to || generateWaiverProfile.profile.email || '',
       subject: finalSubject,
       body: finalBody,
       templateId: finalTemplateId,
       attachments: [],
       accountId: accountId
    });
    setGenerateWaiverProfile(null);
    setOpenCompose(true);
  };

  const prepareWaiverEmailDraft = async (waiver: SignedWaiver) => {
    if (!currentLocationId) return;

    const profile = getProfileById(waiver.profile_id);
    if (!profile) {
      showToast('Profile not found for this waiver.', 'warning');
      return;
    }
    if (!profile.email) {
      showToast(`No email found for ${profile.first_name} ${profile.last_name}.`, 'warning');
      return;
    }

    setSendingWaiverId(waiver.signed_waiver_id);
    try {
      const pdfFile = await createWaiverPdfAttachment(profile, waiver);

      const templateName = 'Welcome to Glass Court Swim & Fitness – Waiver Confirmation';
      let subject = `Signed Waiver Confirmation – ${profile.first_name} ${profile.last_name}`;
      let body = `Please find attached the signed waiver for ${profile.first_name} ${profile.last_name}.`;
      let templateId: string | undefined;

      try {
        const templates = await emailService.getTemplates(currentLocationId);
        const template = templates.find(t => t.subject === templateName || t.subject.includes('Waiver Confirmation'));
        if (template) {
          subject = template.subject;
          const fullName = `${profile.first_name} ${profile.last_name}`;
          body = (template.body_content || '').replace(/\[fullname\]/gi, fullName);
          templateId = template.email_template_id;
        }
      } catch (templateError) {
        console.warn('Could not fetch waiver email template, using default subject.', templateError);
      }

      setComposeDraft({
        to: profile.email,
        subject,
        body,
        templateId,
        attachments: [pdfFile]
      });
      setOpenCompose(true);
    } catch (sendError: any) {
      console.error('Failed to send waiver email', sendError);
      showToast(`Failed to prepare waiver email. ${sendError?.message || ''}`.trim(), 'error');
    } finally {
      setSendingWaiverId(null);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const hasPending = pendingWaivers.length > 0;
  const hasSigned = signedWaivers.length > 0;

  if (!hasPending && !hasSigned) {
     return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No waivers found.</Typography>
        </Box>
     );
  }

  return (
    <Box>
      {/* Sub-tabs: Pending / Signed */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={subTab} 
          onChange={(_, v) => setSubTab(v)} 
          aria-label="waiver status tabs"
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PendingActionsIcon sx={{ fontSize: 18 }} />
                Pending
                {hasPending && (
                  <Chip label={pendingWaivers.length} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 18 }} />
                Signed
                {hasSigned && (
                  <Chip label={signedWaivers.length} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                )}
              </Box>
            } 
          />
        </Tabs>
      </Box>

      {/* Pending Waivers Tab */}
      {subTab === 0 && (
        <Box>
          {pendingWaivers.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
              <Typography color="text.secondary" fontWeight={600}>All registration waivers are signed!</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#fffbeb', borderBottom: '1px solid #fef3c7' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.75rem', textTransform: 'uppercase' }}>Profile</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.75rem', textTransform: 'uppercase' }}>Age Group</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.75rem', textTransform: 'uppercase' }}>Waiver Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingWaivers.map((pw) => (
                    <TableRow key={pw.profile.profile_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {pw.profile.first_name} {pw.profile.last_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={pw.ageGroupName} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={pw.waiverType} 
                          size="small" 
                          color={pw.waiverType === 'REGISTRATION' ? 'info' : 'primary'} 
                          variant="outlined" 
                          sx={{ fontWeight: 600 }} 
                        />
                      </TableCell>

                      <TableCell>
                        <Chip 
                          label="Pending" 
                          size="small" 
                          color="warning" 
                          sx={{ fontWeight: 700 }} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        {role !== 'MEMBER' && (
                          <Button
                            startIcon={<LinkIcon />}
                            size="small"
                            variant="outlined"
                            onClick={() => handleGenerateWaiverLink(pw)}
                            disabled={sendingWaiverId === pw.profile.profile_id}
                            sx={{ 
                              textTransform: 'none', 
                              fontWeight: 600,
                              mr: 1
                            }}
                          >
                            Email Link
                          </Button>
                        )}
                        <Button
                          startIcon={<DrawIcon />}
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenSignDialog(pw)}
                          sx={{ 
                            textTransform: 'none', 
                            fontWeight: 600,
                            bgcolor: '#2563eb',
                            '&:hover': { bgcolor: '#1d4ed8' }
                          }}
                        >
                          Sign Waiver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Signed Waivers Tab */}
      {subTab === 1 && (
        <Box>
          {signedWaivers.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No signed waivers found.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Waiver Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Signed By</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Signed Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Signature</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {signedWaivers.map((waiver) => (
                    <TableRow key={waiver.signed_waiver_id} hover>
                      <TableCell>
                        <Chip 
                          label={waiver.waiver_type || 'General'} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{getProfileName(waiver.profile_id)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(waiver.signed_at).toLocaleDateString()} {new Date(waiver.signed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {waiver.signature_url ? (
                          <img src={waiver.signature_url} alt="Signature" style={{ height: 40, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#fff' }} />
                        ) : (
                          <Typography variant="caption" color="text.secondary">No Image</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {role !== 'MEMBER' && (
                          <Button
                            startIcon={<EmailIcon />}
                            size="small"
                            onClick={() => prepareWaiverEmailDraft(waiver)}
                            disabled={sendingWaiverId === waiver.signed_waiver_id}
                            sx={{ mr: 1 }}
                          >
                            {sendingWaiverId === waiver.signed_waiver_id ? 'Sending...' : 'Email'}
                          </Button>
                        )}
                        <Button 
                          startIcon={<VisibilityIcon />} 
                          size="small" 
                          onClick={() => handleViewWaiver(waiver)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* View Waiver Content Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
            Signed Waiver Content
            <Typography variant="subtitle2" color="text.secondary">
                Signed by {selectedWaiver ? getProfileName(selectedWaiver.profile_id) : ''} on {selectedWaiver ? new Date(selectedWaiver.signed_at).toLocaleString() : ''}
            </Typography>
        </DialogTitle>
        <DialogContent dividers>
            {selectedWaiver && (
                <WaiverPreview
                    content={selectedWaiver.content}
                    data={{
                        first_name: '', // already replaced in content
                        last_name: '' 
                    }}
                    agreed={true}
                    onAgreeChange={() => {}}
                    hideCheckbox={true}
                    fullHeight={true}
                    signatureComponent={
                        selectedWaiver.signature_url ? (
                            <Box sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                                <img src={selectedWaiver.signature_url} alt="Signature" style={{ maxHeight: 100 }} />
                            </Box>
                        ) : null
                    }
                />
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            {role !== 'MEMBER' && (
                <Button
                    onClick={() => selectedWaiver && prepareWaiverEmailDraft(selectedWaiver)}
                    color="primary"
                    startIcon={<EmailIcon />}
                    disabled={!selectedWaiver || sendingWaiverId === selectedWaiver.signed_waiver_id}
                >
                    {selectedWaiver && sendingWaiverId === selectedWaiver.signed_waiver_id ? 'Preparing...' : 'Compose Email'}
                </Button>
            )}
            <Button 
                onClick={() => window.print()} 
                color="primary" 
                startIcon={<PrintIcon />}
                sx={{ textTransform: 'none', fontWeight: 700 }}
            >
                Print
            </Button>
        </DialogActions>
      </Dialog>

      {/* Sign Waiver Dialog */}
      <Dialog
        open={openSignDialog}
        onClose={handleCloseSignDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6" fontWeight={700}>Sign {signingProfile?.waiverType || 'Waiver'} Waiver</Typography>
            {signingProfile && (


              <Typography variant="subtitle2" color="text.secondary">
                For {signingProfile.profile.first_name} {signingProfile.profile.last_name} ({signingProfile.ageGroupName})
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {signingProfile && (
            <Box>
              <WaiverPreview
                content={signingProfile.replacedContent}
                data={{
                  first_name: signingProfile.profile.first_name,
                  last_name: signingProfile.profile.last_name,
                }}

                agreed={agreed}
                onAgreeChange={setAgreed}
                hideCheckbox={true}
                fullHeight={false}
                signatureComponent={
                  <SignaturePad
                    ref={signaturePadRef}
                    width={500}
                    height={150}
                  />
                }
              />
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)} 
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600}>
                    I have read and agree to all terms above
                  </Typography>
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseSignDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSignWaiver}
            disabled={!agreed || signing}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 700,
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              px: 4
            }}
          >
            {signing ? 'Signing...' : 'Complete & Sign Waiver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Compose Dialog */}
      <Dialog open={openCompose} onClose={handleCloseCompose} maxWidth="md" fullWidth>
        <DialogContent>
          {composeDraft && (
            <EmailComposer
              onClose={handleCloseCompose}
              onSuccess={handleComposerSuccess}
              initialTo={composeDraft.to}
              initialSubject={composeDraft.subject}
              initialBody={composeDraft.body}
              initialTemplateId={composeDraft.templateId}
              initialAttachments={composeDraft.attachments}
              initialAccountId={accountId}
            />
          )}
        </DialogContent>
      </Dialog>

      {generateWaiverProfile && (
        <GenerateWaiverDialog
          open={!!generateWaiverProfile}
          onClose={() => setGenerateWaiverProfile(null)}
          accountId={accountId || ''}
          profileId={generateWaiverProfile.profile.profile_id}
          profileName={`${generateWaiverProfile.profile.first_name} ${generateWaiverProfile.profile.last_name}`}
          preSelectedTemplateId={generateWaiverProfile.waiverTemplate.waiver_template_id}
          preSelectedWaiverType={generateWaiverProfile.waiverType}
          initialVariables={generateWaiverProfile.variables}
          // Provide context variables directly as fallback if needed, though the dialog pulls them from profileName
          onLinkGenerated={(/* url */) => showToast('Signing link copied to clipboard!', 'success')}
          onEmailDraftReady={handleEmailDraftReady}
        />
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
