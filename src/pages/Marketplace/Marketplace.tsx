import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid,
    IconButton,
    Paper,
    Radio,
    RadioGroup,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tooltip,
    TextField,
    Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { InputAdornment, MenuItem, Select, OutlinedInput } from '@mui/material';

import { PageHeader } from '../../components/Common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { getAgeGroupName, calculateAge } from '../../lib/ageUtils';
import { basePriceService, BasePrice } from '../../services/basePriceService';
import { billingService } from '../../services/billingService';
import { crmService } from '../../services/crmService';
import { MembershipProgram } from '../../services/membershipService';
import { membershipService } from '../../services/membershipService';
import { Service, serviceCatalog } from '../../services/serviceCatalog';
import { discountService, Discount } from '../../services/discountService';
import {
    CategoryCandidate,
    buildHouseholdCountsFromBaseCart,
    classifyAgeFromDob,
    getAllCategoriesWithEligibility,
    getBaseCartMissingDobProfileIds,
    getSpecificityScore,
    getSuggestedCategory,
} from './membershipSuggestion';
import { cartService } from '../../services/cartService';
import { PaymentDialog } from './PaymentDialog';
import { ContractsSigningDialog } from './ContractsSigningDialog';
import { ServicePackSelectionDialog } from './ServicePackSelectionDialog';
import { ManagerPasscodeDialog } from '../../components/Common/ManagerPasscodeDialog';
import { ServicePackSelection, CartItem, CoverageProfile, AccountProfile } from '../../types/marketplace';
import { waiverService, WaiverTemplate } from '../../services/waiverService';

// Removed local CoverageProfile interface - using CartItem's structure or just relying on inference
// Removed local AccountProfile interface - using shared types
// Removed local CartItem interface - using shared types

// Local interfaces if not exported elsewhere
interface ServicePriceLike {
    price: number | string;
    subscription_term_id?: string;
    // adding missing fields to satisfy typescript if we cast it later, 
    // or we should update ServicePackWithPrices logic
    service_pack_id?: string;
    age_group_id?: string; 
}

interface ServicePackWithPrices {
    service_pack_id?: string;
    service_id: string;
    name: string;
    classes?: number;
    students_allowed?: number;
    duration_days?: number;
    duration_months?: number;
    waiver_program_id?: string;
    is_shrabable?: boolean;
    max_uses_per_period?: number;
    usage_period_unit?: string;
    usage_period_length?: number;
    enforce_usage_limit?: boolean;
    prices?: any[];
}

interface ServiceWithPacks {
    service_id: string;
    location_id?: string;
    name: string;
    description?: string;
    service_type?: string;
    image_url?: string;
    packs?: ServicePackWithPrices[];
}

interface BasePlanCard {
    key: string;
    name: string;
    role: 'PRIMARY' | 'ADD_ON';
    ageGroupId: string;
    ageGroupName: string;
    terms: BasePrice[];
}

const formatCurrency = (value: number): string => `$${value.toFixed(2)}`;

const parseNumericPrice = (value: number | string): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getTermSortValue = (orderMap: Map<string, number>, termId: string): number => {
    const order = orderMap.get(termId);
    return typeof order === 'number' ? order : Number.MAX_SAFE_INTEGER;
};

export const Marketplace = () => {
    const { accountId: paramAccountId } = useParams<{ accountId: string }>();
    const navigate = useNavigate();
    const { currentLocationId, userParams, role } = useAuth();
    const { ageGroups, subscriptionTerms, waiverPrograms } = useConfig();

    const accountId = paramAccountId || userParams?.account_id || userParams?.account?.account_id;
    const isMember = role === 'MEMBER' || role === 'USER';

    const [loading, setLoading] = useState(true);
    const [marketplaceError, setMarketplaceError] = useState<string | null>(null);
    const [basePrices, setBasePrices] = useState<BasePrice[]>([]);
    const [membershipPrograms, setMembershipPrograms] = useState<MembershipProgram[]>([]);
    const [services, setServices] = useState<ServiceWithPacks[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]); // active subscriptions

    const [tabValue, setTabValue] = useState(0);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [profiles, setProfiles] = useState<AccountProfile[]>([]);
    const [primaryProfileId, setPrimaryProfileId] = useState<string | null>(null);

    const [coverageDialogOpen, setCoverageDialogOpen] = useState(false);
    const [pendingItem, setPendingItem] = useState<CartItem | null>(null);
    const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

    const [termDialogOpen, setTermDialogOpen] = useState(false);
    const [pendingBaseCard, setPendingBaseCard] = useState<BasePlanCard | null>(null);
    const [selectedTermId, setSelectedTermId] = useState<string>('');
    const [selectedBaseStartDate, setSelectedBaseStartDate] = useState<string>('');

    const [membershipInfoOpen, setMembershipInfoOpen] = useState(false);
    const [otherPlansOpen, setOtherPlansOpen] = useState(false);

    const [feeDialogOpen, setFeeDialogOpen] = useState(false);
    const [pendingMembershipCandidate, setPendingMembershipCandidate] = useState<CategoryCandidate | null>(null);
    const [selectedFeeType, setSelectedFeeType] = useState<'JOINING' | 'ANNUAL' | ''>('');
    const [paymentOpen, setPaymentOpen] = useState(false);

    const [serviceSelectionOpen, setServiceSelectionOpen] = useState(false);
    const [pendingServiceSelection, setPendingServiceSelection] = useState<ServicePackSelection | null>(null);

    // Contract Signing State
    const [contractsOpen, setContractsOpen] = useState(false);
    const [activeTemplates, setActiveTemplates] = useState<WaiverTemplate[]>([]);

    // Per-item discount state: keyed by CartItem.id
    interface ItemDiscountState {
        code: string;
        codeStatus: 'idle' | 'validating' | 'valid' | 'invalid';
        codeError?: string;
        appliedDiscount?: Discount;
        manualAmount: string;
        manualPercentage: string;
        membershipDiscountExplanation?: string;
        autoDiscountDisabled?: boolean;
    }
    const [itemDiscounts, setItemDiscounts] = useState<Record<string, ItemDiscountState>>({});

    // Track discounts provided by memberships in the cart: service_pack_id -> { discount, explanation }
    const [membershipDiscounts, setMembershipDiscounts] = useState<Record<string, { value: string; explanation: string }>>({});

    // Only SUPERADMIN / ADMIN / STAFF may enter manual discounts
    const canApplyManualDiscount = ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(role ?? '');

    // Search and Filter State
    const [serviceSearchQuery, setServiceSearchQuery] = useState('');
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [selectedMembershipAgeGroupIds, setSelectedMembershipAgeGroupIds] = useState<string[]>([]);

    // Passcode State
    const [passcodeOpen, setPasscodeOpen] = useState(false);
    const [pendingDiscountAction, setPendingDiscountAction] = useState<{
        type: 'CODE' | 'MANUAL';
        itemId: string;
        serviceId?: string;
        manualType?: 'amount' | 'percentage';
        manualValue?: string;
    } | null>(null);

    const subscriptionTermOrder = useMemo(() => {
        return new Map(subscriptionTerms.map((term, index) => [term.subscription_term_id, index]));
    }, [subscriptionTerms]);

    const subscriptionTermNameMap = useMemo(() => {
        return new Map(subscriptionTerms.map((term) => [term.subscription_term_id, term.name]));
    }, [subscriptionTerms]);

    const subscriptionTermMap = useMemo(() => {
        return new Map(subscriptionTerms.map((term) => [term.subscription_term_id, term]));
    }, [subscriptionTerms]);

    const profilesById = useMemo(() => {
        return new Map(profiles.map((profile) => [profile.profile_id, profile]));
    }, [profiles]);

    const primaryMember = useMemo(
        () => profiles.find((profile) => profile.is_primary) || profiles[0],
        [profiles]
    );

    const familyMembers = useMemo(
        () => profiles.filter((profile) => primaryMember && profile.profile_id !== primaryMember.profile_id),
        [profiles, primaryMember]
    );

    const getProfileDisplayName = (profile: AccountProfile | undefined): string => {
        if (!profile) {
            return 'Unknown';
        }
        return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
    };

    const accountAgeGroupIds = useMemo(() => {
        const ids = new Set<string>();
        profiles.forEach((profile) => {
            if (!profile.date_of_birth) {
                return;
            }
            const ageGroupName = getAgeGroupName(profile.date_of_birth, ageGroups);
            const matchedGroup = ageGroups.find((group) => group.name === ageGroupName);
            if (matchedGroup?.age_group_id) {
                ids.add(matchedGroup.age_group_id);
            }
        });
        return ids;
    }, [profiles, ageGroups]);

    useEffect(() => {
        const loadData = async () => {
            if (!currentLocationId) {
                setMarketplaceError('Please select a location before using Marketplace.');
                setLoading(false);
                return;
            }
            if (!accountId) {
                setMarketplaceError('Unable to resolve your account context. Please log out and log in again.');
                setLoading(false);
                return;
            }

            setMarketplaceError(null);
            setLoading(true);
            try {
                // Fetch cart items first
                if (currentLocationId && accountId) {
                    try {
                        const items = await cartService.getItems(currentLocationId);
                        // Map backend CartItemData back to frontend CartItem
                        const mappedCart: CartItem[] = items.filter(i => i.account_id === accountId).map(i => {
                            const metadata = i.metadata || {};
                            return {
                                id: metadata.id || `CART-${i.cart_id}`,
                                cart_id: i.cart_id,
                                type: metadata.type || (i.subscription_type === 'SERVICE' ? 'SERVICE' : 'MEMBERSHIP'),
                                referenceId: i.reference_id,
                                name: metadata.name || 'Unknown Item',
                                price: i.total_amount,
                                actualPrice: i.actual_total_amount,
                                discountAmount: i.discount_amount,
                                discountPercentage: i.discount_percentage,
                                discountCode: i.discount_code,
                                metadata: metadata,
                                coverage: metadata.coverage || [],
                                feeType: metadata.feeType,
                                membershipCategoryId: metadata.membershipCategoryId,
                                membershipProgramId: metadata.membershipProgramId,
                                subscriptionTermId: i.subscription_term_id,
                                serviceId: metadata.serviceId,
                                ageGroupId: metadata.ageGroupId,
                                membershipRange: metadata.membershipRange,
                                billing_period_start: i.billing_period_start,
                                billing_period_end: i.billing_period_end,
                            };
                        });
                        setCart(mappedCart);

                        // Populate itemDiscounts state from fetched items
                        const initialDiscounts: Record<string, ItemDiscountState> = {};
                        mappedCart.forEach(item => {
                            if (item.discountCode || item.actualPrice !== undefined) {
                                initialDiscounts[item.id] = {
                                    code: item.discountCode || '',
                                    codeStatus: item.discountCode ? 'valid' : 'idle',
                                    manualAmount: item.discountCode ? '' : (item.discountAmount?.toString() || ''),
                                    manualPercentage: item.discountCode ? '' : (item.discountPercentage?.toString() || ''),
                                    membershipDiscountExplanation: (item.metadata as any)?.membershipExplanation,
                                    autoDiscountDisabled: (item.metadata as any)?.autoDiscountDisabled
                                };
                            }
                        });
                        if (Object.keys(initialDiscounts).length > 0) {
                            setItemDiscounts(prev => ({ ...prev, ...initialDiscounts }));
                        }
                    } catch (err) {
                        console.error('Failed to fetch cart:', err);
                    }
                }

                try {
                    const accountResponse = await crmService.getAccountDetails(accountId, currentLocationId || undefined);
                    const accountData = (accountResponse as { data?: { profiles?: AccountProfile[]; profile?: AccountProfile[] } }).data || (accountResponse as { profiles?: AccountProfile[]; profile?: AccountProfile[] });
                    const accountProfiles = [...(accountData.profiles || accountData.profile || [])].sort((a, b) => {
                        if (a.is_primary && !b.is_primary) return -1;
                        if (!a.is_primary && b.is_primary) return 1;
                        return 0;
                    });
                    setProfiles(accountProfiles);
                    const primary = accountProfiles.find((profile) => profile.is_primary);
                    setPrimaryProfileId(primary?.profile_id || accountProfiles[0]?.profile_id || null);
                } catch {
                    if (userParams?.profile_id) {
                        const fallbackProfile: AccountProfile = {
                            profile_id: userParams.profile_id,
                            first_name: userParams.first_name,
                            last_name: userParams.last_name,
                            date_of_birth: userParams.date_of_birth,
                            is_primary: userParams.is_primary ?? true,
                        };
                        setProfiles([fallbackProfile]);
                        setPrimaryProfileId(fallbackProfile.profile_id);
                    }
                }

                const [basePriceResponse, membershipResponse, serviceResponse, subscriptionResponse] = await Promise.all([
                    basePriceService.getAll(currentLocationId),
                    membershipService.getMemberships(currentLocationId),
                    serviceCatalog.getServices(currentLocationId),
                    billingService.getAccountSubscriptions(accountId, currentLocationId),
                ]);

                setBasePrices(basePriceResponse.prices || []);
                setMembershipPrograms(membershipResponse || []);
                
                const activeSubs = (subscriptionResponse.data || subscriptionResponse || []).filter((s: any) => 
                    s.status === 'ACTIVE' || s.status === 'PAID'
                );
                setSubscriptions(activeSubs);

                const rawServices = Array.isArray(serviceResponse)
                    ? (serviceResponse as Service[])
                    : (((serviceResponse as { data?: Service[] })?.data) || []);

                const enrichedServices = await Promise.all(
                    rawServices.map(async (service) => {
                        const serviceId = service.service_id;
                        try {
                            const packsResponse = await serviceCatalog.getServicePacks(serviceId, currentLocationId);
                            const packs = Array.isArray(packsResponse)
                                ? (packsResponse as ServicePackWithPrices[])
                                : (((packsResponse as { data?: ServicePackWithPrices[] })?.data) || []);

                            const packsWithPrices = await Promise.all(
                                packs.map(async (pack) => {
                                    if (!pack.service_pack_id) {
                                        return { ...pack, prices: [] as ServicePriceLike[] };
                                    }
                                    try {
                                        const pricesResponse = await serviceCatalog.getPackPrices(pack.service_pack_id, currentLocationId);
                                        const prices = Array.isArray(pricesResponse)
                                            ? (pricesResponse as ServicePriceLike[])
                                            : (((pricesResponse as { data?: ServicePriceLike[] })?.data) || []);
                                        return { ...pack, prices };
                                    } catch {
                                        return { ...pack, prices: [] as ServicePriceLike[] };
                                    }
                                })
                            );

                            return {
                                ...service,
                                name: service.name || 'Unnamed Service',
                                packs: packsWithPrices,
                            } as ServiceWithPacks;
                        } catch {
                            return {
                                ...service,
                                name: service.name || 'Unnamed Service',
                                packs: [],
                            } as ServiceWithPacks;
                        }
                    })
                );

                setServices(enrichedServices);
            } catch (error) {
                console.error('Failed to load marketplace data', error);
                setMarketplaceError('Failed to load marketplace data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [accountId, currentLocationId, userParams]);

    // Fetch discounts from memberships and base plans in the cart
    useEffect(() => {
        const fetchMembershipDiscounts = async () => {
            const applicableItems = cart.filter(item => 
                (item.type === 'MEMBERSHIP' && item.membershipCategoryId) || 
                (item.type === 'BASE' && item.referenceId)
            );
            
            if (applicableItems.length === 0) {
                setMembershipDiscounts({});
                return;
            }

            const newDiscounts: Record<string, { value: string; explanation: string }> = {};

            await Promise.all(applicableItems.map(async (item) => {
                try {
                    const ownerId = item.type === 'MEMBERSHIP' ? item.membershipCategoryId! : item.referenceId;
                    const services = await membershipService.getServices(ownerId, currentLocationId || undefined);
                    services.forEach(s => {
                        if (s.service_pack_id && s.discount) {
                            newDiscounts[s.service_pack_id] = {
                                value: s.discount,
                                explanation: `${item.type === 'BASE' ? 'Base Plan' : 'Membership'} Discount: ${item.name}`
                            };
                        }
                    });
                } catch (error) {
                    console.error('Failed to fetch membership/base services for discount', error);
                }
            }));

            setMembershipDiscounts(newDiscounts);
        };

        fetchMembershipDiscounts();
    }, [
        JSON.stringify(cart.filter(item => item.type === 'MEMBERSHIP' || item.type === 'BASE').map(i => i.id)), 
        currentLocationId
    ]);

    // Apply membership discounts to service packs in the cart
    useEffect(() => {
        if (Object.keys(membershipDiscounts).length === 0) {
            // If no membership discounts, but some items have membership explanation, maybe remove them?
            // Only if they haven't been manually overriden.
            setCart(prev => prev.map(item => {
                if (item.type === 'SERVICE' && item.discountCode === 'MEMBERSHIP') {
                    return {
                        ...item,
                        price: item.actualPrice ?? item.price,
                        actualPrice: undefined,
                        discountAmount: undefined,
                        discountPercentage: undefined,
                        discountCode: undefined
                    };
                }
                return item;
            }));
            return;
        }

        setCart(prev => prev.map(item => {
            if (item.type !== 'SERVICE') return item;
            
            const disc = membershipDiscounts[item.referenceId];
            const discState = getItemDiscount(item.id);

            if (!disc || discState.autoDiscountDisabled) {
                // Remove membership discount if it was there but no longer valid for this item or disabled
                if (item.discountCode === 'MEMBERSHIP') {
                    return {
                        ...item,
                        price: item.actualPrice ?? item.price,
                        actualPrice: undefined,
                        discountAmount: undefined,
                        discountPercentage: undefined,
                        discountCode: undefined
                    };
                }
                return item;
            }

            // Skip if user already applied a different code or manual discount
            if (item.discountCode && item.discountCode !== 'MEMBERSHIP') return item;
            // Check if it's already applied (to avoid infinite loop if price changes)
            if (item.discountCode === 'MEMBERSHIP' && item.metadata?.membershipExplanation === disc.explanation) return item;

            const originalPrice = item.actualPrice ?? item.price;
            const { amount, percentage } = parseDiscountValue(disc.value, originalPrice);
            const discountedPrice = Math.max(0, parseFloat((originalPrice - amount).toFixed(2)));

            // Update itemDiscounts state for the explanation
            setItemDiscounts(prevDisc => ({
                ...prevDisc,
                [item.id]: {
                    ...getItemDiscount(item.id),
                    membershipDiscountExplanation: disc.explanation
                }
            }));

            return {
                ...item,
                actualPrice: originalPrice,
                price: discountedPrice,
                discountAmount: amount,
                discountPercentage: percentage,
                discountCode: 'MEMBERSHIP',
                metadata: {
                    ...item.metadata,
                    membershipExplanation: disc.explanation
                }
            };
        }));
    }, [membershipDiscounts, cart.length]); // Re-run when discounts change or cart items change

    const basePlanCards = useMemo(() => {
        const grouped = new Map<string, BasePlanCard>();

        basePrices
            .filter((price) => price.is_active !== false)
            .forEach((price) => {
                const key = `${price.name}__${price.role}__${price.age_group_id}`;
                if (!grouped.has(key)) {
                    grouped.set(key, {
                        key,
                        name: price.name,
                        role: price.role,
                        ageGroupId: price.age_group_id,
                        ageGroupName: price.age_group_name || 'Unknown',
                        terms: [],
                    });
                }
                grouped.get(key)?.terms.push(price);
            });

        return Array.from(grouped.values())
            .map((card) => ({
                ...card,
                terms: [...card.terms].sort((left, right) => {
                    const leftSort = getTermSortValue(subscriptionTermOrder, left.subscription_term_id);
                    const rightSort = getTermSortValue(subscriptionTermOrder, right.subscription_term_id);
                    if (leftSort !== rightSort) {
                        return leftSort - rightSort;
                    }
                    return (left.term_name || '').localeCompare(right.term_name || '');
                }),
            }))
            .filter((card) => accountAgeGroupIds.has(card.ageGroupId))
            .sort((left, right) => {
                if (left.role !== right.role) {
                    return left.role === 'PRIMARY' ? -1 : 1;
                }
                const nameCompare = left.name.localeCompare(right.name);
                if (nameCompare !== 0) {
                    return nameCompare;
                }
                return left.ageGroupName.localeCompare(right.ageGroupName);
            });
    }, [accountAgeGroupIds, basePrices, subscriptionTermOrder]);
    
    const filteredBasePlanCards = useMemo(() => {
        if (selectedMembershipAgeGroupIds.length === 0) return basePlanCards;
        return basePlanCards.filter(card => selectedMembershipAgeGroupIds.includes(card.ageGroupId));
    }, [basePlanCards, selectedMembershipAgeGroupIds]);

    const baseCartItems = useMemo(() => cart.filter((item) => item.type === 'BASE'), [cart]);
    const householdCounts = useMemo(() => buildHouseholdCountsFromBaseCart(baseCartItems, ageGroups), [baseCartItems, ageGroups]);
    const missingDobProfileIds = useMemo(() => getBaseCartMissingDobProfileIds(baseCartItems), [baseCartItems]);

    const missingDobNames = useMemo(() => {
        return missingDobProfileIds.map((profileId) => {
            const profile = profilesById.get(profileId);
            return getProfileDisplayName(profile);
        });
    }, [missingDobProfileIds, profilesById]);

    const eligibilityResults = useMemo(
        () => getAllCategoriesWithEligibility(membershipPrograms, householdCounts, ageGroups),
        [householdCounts, membershipPrograms, ageGroups]
    );

    const eligibleCandidates = useMemo(
        () => eligibilityResults.filter((entry) => entry.eligible).map((entry) => entry.candidate),
        [eligibilityResults]
    );

    const suggestedCandidate = useMemo(() => {
        if (baseCartItems.length === 0 || missingDobProfileIds.length > 0) {
            return null;
        }
        return getSuggestedCategory(eligibleCandidates, householdCounts, ageGroups);
    }, [baseCartItems.length, eligibleCandidates, householdCounts, missingDobProfileIds.length, ageGroups]);

    const suggestedSpecificity = useMemo(() => {
        if (!suggestedCandidate) {
            return null;
        }
        return getSpecificityScore(suggestedCandidate.range, ageGroups);
    }, [suggestedCandidate, ageGroups]);
    const isInCart = (idPrefix: string) => cart.some((item) => item.id === idPrefix || item.id.startsWith(`${idPrefix}-`));
    const removeFromCart = async (id: string) => {
        const item = cart.find(i => i.id === id);
        if (item?.cart_id) {
            try {
                await cartService.removeItem(item.cart_id);
            } catch (err) {
                console.error('Failed to remove item from server cart:', err);
            }
        }
        setCart((prev) => prev.filter((item) => item.id !== id));
        setItemDiscounts((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    /**
     * Check if the account has a PRIMARY membership, either in the cart or already active.
     */
    const hasActivePrimary = useMemo(() => {
        // 1. Check Cart for 'BASE' item with 'PRIMARY' role
        const cartHasPrimary = cart.some(item => {
             if (item.type !== 'BASE') return false;
             return item.metadata?.role === 'PRIMARY' || item.name.includes('(PRIMARY)');
        });

        if (cartHasPrimary) return true;

        // 2. Check Active Subscriptions
        const subHasPrimary = subscriptions.some(sub => 
            sub.subscription_type.startsWith('MEMBERSHIP') && sub.status === 'ACTIVE' &&
            (sub.coverage?.some((c: any) => c.role === 'PRIMARY') || sub.subscription_coverage?.some((c: any) => c.role === 'PRIMARY'))
        );

        return subHasPrimary;
    }, [cart, subscriptions]);

    /** Returns the discount state for an item, initialising if absent */
    const getItemDiscount = useCallback((itemId: string): ItemDiscountState => {
        return itemDiscounts[itemId] ?? { code: '', codeStatus: 'idle', manualAmount: '', manualPercentage: '' };
    }, [itemDiscounts]);

    /** Parse a discount value string like "10%" or "15.00" into { amount, percentage } */
    const parseDiscountValue = (discountStr: string, originalPrice: number): { amount: number; percentage: number } => {
        const trimmed = (discountStr ?? '').trim();
        if (trimmed.endsWith('%')) {
            const pct = parseFloat(trimmed);
            if (!isFinite(pct) || pct <= 0) return { amount: 0, percentage: 0 };
            const amount = originalPrice * (pct / 100);
            return { amount: parseFloat(amount.toFixed(2)), percentage: pct };
        }
        const amount = parseFloat(trimmed);
        if (!isFinite(amount) || amount <= 0) return { amount: 0, percentage: 0 };
        const percentage = originalPrice > 0 ? parseFloat(((amount / originalPrice) * 100).toFixed(2)) : 0;
        return { amount: parseFloat(amount.toFixed(2)), percentage };
    };

    /** Apply a validated Discount object to a cart item */
    const applyDiscountToCartItem = useCallback((itemId: string, discount: Discount) => {
        setCart((prev) => prev.map((item) => {
            if (item.id !== itemId) return item;
            const originalPrice = item.actualPrice ?? item.price;
            const { amount, percentage } = parseDiscountValue(discount.discount ?? '', originalPrice);
            const discountedPrice = Math.max(0, parseFloat((originalPrice - amount).toFixed(2)));
            const updatedItem = {
                ...item,
                actualPrice: originalPrice,
                price: discountedPrice,
                discountAmount: amount,
                discountPercentage: percentage,
                discountCode: discount.discount_code,
            };

            // Persist to server if it has a cart_id
            if (updatedItem.cart_id && accountId && currentLocationId) {
                cartService.upsertItem(cartService.transformToCartData(updatedItem, accountId, currentLocationId), currentLocationId).catch(console.error);
            }

            return updatedItem;
        }));
    }, [accountId, currentLocationId]);

    /** Validate a discount code and apply it to the given cart item */
    const handleApplyDiscountCode = useCallback(async (itemId: string, serviceId?: string, skipAuth = false) => {
        if (!currentLocationId) return;

        // If staff, require passcode before applying
        if (canApplyManualDiscount && !passcodeOpen && !skipAuth) {
            setPendingDiscountAction({ type: 'CODE', itemId, serviceId });
            setPasscodeOpen(true);
            return;
        }
        const discountState = getItemDiscount(itemId);
        const code = discountState.code.trim();
        if (!code) return;

        setItemDiscounts((prev) => ({
            ...prev,
            [itemId]: { ...getItemDiscount(itemId), codeStatus: 'validating', codeError: undefined },
        }));

        const discount = await discountService.validateDiscount(code, currentLocationId);

        if (!discount) {
            setItemDiscounts((prev) => ({
                ...prev,
                [itemId]: { ...getItemDiscount(itemId), codeStatus: 'invalid', codeError: 'Discount code not found or invalid.' },
            }));
            return;
        }

        // Check active
        if (!discount.is_active) {
            setItemDiscounts((prev) => ({
                ...prev,
                [itemId]: { ...getItemDiscount(itemId), codeStatus: 'invalid', codeError: 'This discount code is inactive.' },
            }));
            return;
        }

        // Check date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (discount.start_date) {
            const start = new Date(discount.start_date);
            start.setHours(0, 0, 0, 0);
            if (today < start) {
                setItemDiscounts((prev) => ({
                    ...prev,
                    [itemId]: { ...getItemDiscount(itemId), codeStatus: 'invalid', codeError: 'This discount code is not yet active.' },
                }));
                return;
            }
        }
        if (discount.end_date) {
            const end = new Date(discount.end_date);
            end.setHours(23, 59, 59, 999);
            if (today > end) {
                setItemDiscounts((prev) => ({
                    ...prev,
                    [itemId]: { ...getItemDiscount(itemId), codeStatus: 'invalid', codeError: 'This discount code has expired.' },
                }));
                return;
            }
        }

        // Check service applicability (null service_id = applies to all)
        // If discount is for a specific service, the item MUST match that service.
        if (discount.service_id && discount.service_id !== serviceId) {
            setItemDiscounts((prev) => ({
                ...prev,
                [itemId]: { ...getItemDiscount(itemId), codeStatus: 'invalid', codeError: 'This discount code is not applicable to this item.' },
            }));
            return;
        }

        // Valid — apply
        setItemDiscounts((prev) => ({
            ...prev,
            [itemId]: { ...getItemDiscount(itemId), codeStatus: 'valid', codeError: undefined, appliedDiscount: discount, manualAmount: '', manualPercentage: '' },
        }));
        applyDiscountToCartItem(itemId, discount);
    }, [currentLocationId, getItemDiscount, applyDiscountToCartItem, canApplyManualDiscount, passcodeOpen]);

    /** Apply a manual discount (amount or percentage) to a cart item */
    const handleManualDiscountApply = useCallback((itemId: string, type: 'amount' | 'percentage', value: string, skipAuth = false) => {
        // If staff, require passcode before applying
        if (canApplyManualDiscount && !passcodeOpen && !skipAuth) {
            setPendingDiscountAction({ type: 'MANUAL', itemId, manualType: type, manualValue: value });
            setPasscodeOpen(true);
            return;
        }

        setCart((prev) => prev.map((item) => {
            if (item.id !== itemId) return item;
            const originalPrice = item.actualPrice ?? item.price;
            let amount = 0;
            let percentage = 0;
            if (type === 'amount') {
                amount = parseFloat(value);
                if (!isFinite(amount) || amount < 0) amount = 0;
                percentage = originalPrice > 0 ? parseFloat(((amount / originalPrice) * 100).toFixed(2)) : 0;
            } else {
                percentage = parseFloat(value);
                if (!isFinite(percentage) || percentage < 0) percentage = 0;
                amount = parseFloat((originalPrice * (percentage / 100)).toFixed(2));
            }
            const discountedPrice = Math.max(0, parseFloat((originalPrice - amount).toFixed(2)));
            const updatedItem = {
                ...item,
                actualPrice: originalPrice,
                price: discountedPrice,
                discountAmount: amount,
                discountPercentage: percentage,
                discountCode: undefined,
            };

            // Persist to server if it has a cart_id
            if (updatedItem.cart_id && accountId && currentLocationId) {
                cartService.upsertItem(cartService.transformToCartData(updatedItem, accountId, currentLocationId), currentLocationId).catch(console.error);
            }

            return updatedItem;
        }));
    }, [accountId, currentLocationId, passcodeOpen, canApplyManualDiscount]);

    const handlePasscodeSuccess = useCallback(() => {
        if (!pendingDiscountAction) return;

        const action = pendingDiscountAction;
        // Close dialog first
        setPasscodeOpen(false);
        setPendingDiscountAction(null);

        // Call functions with skipAuth=true
        if (action.type === 'CODE') {
            handleApplyDiscountCode(action.itemId, action.serviceId, true);
        } else if (action.type === 'MANUAL' && action.manualType && action.manualValue) {
            handleManualDiscountApply(action.itemId, action.manualType, action.manualValue, true);
        }
    }, [pendingDiscountAction, handleApplyDiscountCode, handleManualDiscountApply]);

    /** Remove any applied discount from a cart item, restoring original price */
    const removeDiscount = useCallback((itemId: string) => {
        const item = cart.find(i => i.id === itemId);
        const isMembership = item?.discountCode === 'MEMBERSHIP';

        setCart((prev) => prev.map((item) => {
            if (item.id !== itemId) return item;
            const updatedItem = {
                ...item,
                price: item.actualPrice ?? item.price,
                actualPrice: undefined,
                discountAmount: undefined,
                discountPercentage: undefined,
                discountCode: undefined,
            };

            // Persist to server if it has a cart_id
            if (updatedItem.cart_id && accountId && currentLocationId) {
                cartService.upsertItem(cartService.transformToCartData(updatedItem, accountId, currentLocationId), currentLocationId).catch(console.error);
            }

            return updatedItem;
        }));
        setItemDiscounts((prev) => ({
            ...prev,
            [itemId]: { 
                code: '', 
                codeStatus: 'idle', 
                codeError: undefined, 
                appliedDiscount: undefined, 
                manualAmount: '', 
                manualPercentage: '',
                autoDiscountDisabled: isMembership ? true : prev[itemId]?.autoDiscountDisabled
            },
        }));
    }, [cart]);

    const openCoverageDialogForItem = (item: CartItem) => {
        const existing = cart.find((cartItem) => cartItem.id === item.id);
        setPendingItem(item);

        const initialSelection = existing?.coverage?.map((profile) => profile.profile_id) || (primaryProfileId ? [primaryProfileId] : []);
        
        // Pre-filter disallowed profiles
        const allowedSelection = initialSelection.filter(id => {
            const profile = profilesById.get(id);
            if (!profile) return false;

            let isAllowed = true;

            if (item.type === 'BASE' && item.ageGroupId) {
                if (profile.date_of_birth) {
                    const ageGroupName = getAgeGroupName(profile.date_of_birth, ageGroups);
                    const matchedGroup = ageGroups.find((group) => group.name === ageGroupName);
                    if (matchedGroup?.age_group_id !== item.ageGroupId) {
                        isAllowed = false;
                    }
                } else {
                    isAllowed = false;
                }
            } else if (item.type === 'MEMBERSHIP' && item.membershipRange) {
                if (profile.date_of_birth) {
                    const ageGroupId = classifyAgeFromDob(profile.date_of_birth, ageGroups);
                    const range = item.membershipRange;
                    const maxAllowed = ageGroupId ? range[ageGroupId]?.max : 0;
                    if (maxAllowed === 0) {
                        isAllowed = false;
                    }
                } else {
                    isAllowed = false;
                }
            }

            // Rule: Disable if profile is already assigned a BASE or MEMBERSHIP plan in cart or active subscriptions
            if (isAllowed && (item.type === 'BASE' || item.type === 'MEMBERSHIP')) {
                const profileInCart = cart.some(cartItem => 
                    (cartItem.type === 'BASE' || cartItem.type === 'MEMBERSHIP') && 
                    cartItem.coverage?.some(c => c.profile_id === id) && 
                    cartItem.id !== item.id
                );
                if (profileInCart) isAllowed = false;

                const profileHasActive = subscriptions.some(sub => 
                    sub.subscription_type.startsWith('MEMBERSHIP') && sub.status === 'ACTIVE' &&
                    (sub.coverage?.some((c: any) => c.profile_id === id) || sub.subscription_coverage?.some((c: any) => c.profile_id === id))
                );
                if (profileHasActive) isAllowed = false;
            }

            return isAllowed;
        });

        setSelectedProfileIds(allowedSelection);
        setCoverageDialogOpen(true);
    };

    const handleConfirmCoverage = () => {
        if (!pendingItem || selectedProfileIds.length === 0) {
            return;
        }

        const coverage: CoverageProfile[] = selectedProfileIds.map((profileId) => {
            const profile = profilesById.get(profileId);
            const ageGroup = profile?.date_of_birth
                ? getAgeGroupName(profile.date_of_birth, ageGroups)
                : 'Unknown';

            return {
                profile_id: profileId,
                name: getProfileDisplayName(profile),
                age_group: ageGroup,
                date_of_birth: profile?.date_of_birth ?? null,
            };
        });

        let itemsToProcess: CartItem[] = [{
            ...pendingItem,
            coverage,
        }];

        if (accountId && currentLocationId) {
            Promise.all(itemsToProcess.map(async (nextItem) => {
                const frontendId = nextItem.id;
                const existingItem = cart.find(i => i.id === frontendId);
                const dbPayload = cartService.transformToCartData(nextItem, accountId, currentLocationId);
                if (existingItem?.cart_id) {
                    dbPayload.cart_id = existingItem.cart_id;
                }
                const savedItem = await cartService.upsertItem(dbPayload, currentLocationId);
                return { ...nextItem, cart_id: savedItem.cart_id };
            })).then((savedItems) => {
                setCart((prev) => {
                    let nextCart = [...prev];
                    savedItems.forEach(savedItem => {
                        const existingIndex = nextCart.findIndex((cartItem) => cartItem.id === savedItem.id);
                        if (existingIndex >= 0) {
                            nextCart[existingIndex] = savedItem;
                        } else {
                            nextCart.push(savedItem);
                        }
                    });
                    return nextCart;
                });
            }).catch((err) => {
                console.error('Failed to save cart items:', err);
                setMarketplaceError('Failed to save cart items to server.');
            });
        } else {
            setCart((prev) => {
                let nextCart = [...prev];
                itemsToProcess.forEach(nextItem => {
                    const existingIndex = nextCart.findIndex((cartItem) => cartItem.id === nextItem.id);
                    if (existingIndex >= 0) {
                        nextCart[existingIndex] = nextItem;
                    } else {
                        nextCart.push(nextItem);
                    }
                });
                return nextCart;
            });
        }

        setCoverageDialogOpen(false);
        setPendingItem(null);
    };

    const handleStartAddBaseCard = (card: BasePlanCard) => {
        if (card.role === 'ADD_ON' && !hasActivePrimary) {
            setMarketplaceError('You cannot add an Add-on membership without a Primary membership. Please add a Primary plan to your cart first, or ensure you have an active Primary subscription.');
            // Auto-dismiss after 5s?
            setTimeout(() => setMarketplaceError(null), 5000);
            return;
        }

        setPendingBaseCard(card);
        setSelectedTermId(card.terms[0]?.subscription_term_id || '');
        setTermDialogOpen(true);
    };

    const handleConfirmBaseTermSelection = () => {
        if (!pendingBaseCard || !selectedTermId) {
            return;
        }

        const selectedTerm = pendingBaseCard.terms.find((term) => term.subscription_term_id === selectedTermId);
        if (!selectedTerm?.base_price_id) {
            return;
        }

        let endDateStr = '';
        if (selectedBaseStartDate && selectedTermId) {
            const termInfo = subscriptionTermMap.get(selectedTermId);
            if (termInfo) {
                const start = new Date(selectedBaseStartDate);
                // Handle different recurrence units
                const unit = (termInfo.recurrence_unit || 'MONTH').toUpperCase();
                const value = termInfo.recurrence_unit_value || termInfo.duration_months || 1;
                
                if (unit === 'DAY') {
                    start.setDate(start.getDate() + value);
                } else if (unit === 'WEEK') {
                    start.setDate(start.getDate() + (value * 7));
                } else if (unit === 'YEAR') {
                    start.setFullYear(start.getFullYear() + value);
                } else {
                    start.setMonth(start.getMonth() + value);
                }
                endDateStr = start.toISOString().split('T')[0];
            }
        }

        const baseItem: CartItem = {
            id: `BASE-${selectedTerm.base_price_id}-${Date.now()}`,
            type: 'BASE',
            referenceId: selectedTerm.base_price_id,
            name: `${pendingBaseCard.name} - ${pendingBaseCard.ageGroupName} (${pendingBaseCard.role})`,
            price: selectedTerm.price,
            subscriptionTermId: selectedTerm.subscription_term_id,
            ageGroupId: pendingBaseCard.ageGroupId,
            billing_period_start: selectedBaseStartDate || undefined,
            billing_period_end: endDateStr || undefined,
            metadata: {
                subscription_term_id: selectedTerm.subscription_term_id,
                role: pendingBaseCard.role,
                billing_period_start: selectedBaseStartDate || undefined,
                billing_period_end: endDateStr || undefined,
            },
        };

        setTermDialogOpen(false);
        setPendingBaseCard(null);
        setSelectedTermId('');
        setSelectedBaseStartDate('');
        openCoverageDialogForItem(baseItem);
    };

    const handleOpenFeeDialog = (candidate: CategoryCandidate) => {
        setPendingMembershipCandidate(candidate);
        setSelectedFeeType('');
        setFeeDialogOpen(true);
    };

    const handleConfirmFeeSelection = () => {
        if (!pendingMembershipCandidate || !selectedFeeType) {
            return;
        }

        const selectedAmount = selectedFeeType === 'JOINING'
            ? pendingMembershipCandidate.joiningFee
            : pendingMembershipCandidate.annualFee;

        if (typeof selectedAmount !== 'number') {
            return;
        }

        const membershipItem: CartItem = {
            id: `MEMBERSHIP-${pendingMembershipCandidate.categoryId}-${selectedFeeType}-${Date.now()}`,
            type: 'MEMBERSHIP',
            referenceId: pendingMembershipCandidate.categoryId,
            membershipCategoryId: pendingMembershipCandidate.categoryId,
            membershipProgramId: pendingMembershipCandidate.programId,
            feeType: selectedFeeType,
            name: `${pendingMembershipCandidate.programName} - ${pendingMembershipCandidate.categoryName} (${selectedFeeType})`,
            price: selectedAmount,
            membershipRange: pendingMembershipCandidate.range,
        };

        setFeeDialogOpen(false);
        setPendingMembershipCandidate(null);
        setSelectedFeeType('');
        openCoverageDialogForItem(membershipItem);
    };

    // === Service Pack Selection Handlers ===

    const handleOpenServiceSelection = (service: ServiceWithPacks, pack: ServicePackWithPrices) => {
        // We need to cast pack to match what ServicePackSelectionDialog expects (ServicePack & { prices: ServicePrice[] })
        // Since ServicePackWithPrices here has 'prices' as any[], and existing code uses loose types, 
        // we'll cast it. The Dialog logic handles mapping carefully.
        setPendingServiceSelection({ 
            service, 
            pack: pack as any 
        });
        setServiceSelectionOpen(true);
    };

    const handleConfirmServiceSelection = (newItems: CartItem[]) => {
        if (!accountId || !currentLocationId) return;

        // Add all items to cart
        setCart((prev) => {
            // Remove duplicates? Or allow multiple? "Allow the same Service Pack to be added multiple times... even if the Service Pack is identical"
            // We'll append. But checking if ID exists to avoid key conflicts if we used deterministic IDs.
            // Our ID generation in Dialog uses Date.now(), so collisions are unlikely in same session.
            return [...prev, ...newItems];
        });

        // Persist each item
        newItems.forEach(item => {
             const dbPayload = cartService.transformToCartData(item, accountId!, currentLocationId!);
             cartService.upsertItem(dbPayload, currentLocationId!).then(saved => {
                 // Update the item in local cart with the real cart_id?
                 setCart(prev => prev.map(p => p.id === item.id ? { ...p, cart_id: saved.cart_id } : p));
             }).catch(console.error);
        });

        setServiceSelectionOpen(false);
        setPendingServiceSelection(null);
    };


    const getCoveragePayload = (item: CartItem) => {
        const coverage = item.coverage || [];
        const hasPrimary = coverage.some((member) => profilesById.get(member.profile_id)?.is_primary);

        return coverage.map((member, index) => {
            const isPrimary = profilesById.get(member.profile_id)?.is_primary;
            const roleLabel: 'PRIMARY' | 'ADD_ON' = isPrimary || (!hasPrimary && index === 0)
                ? 'PRIMARY'
                : 'ADD_ON';

            return {
                profile_id: member.profile_id,
                role: roleLabel,
                exempt: false,
                exempt_reason: '',
            };
        });
    };

    const constructSubscriptionPayload = (item: CartItem) => {
        const coverage = getCoveragePayload(item);
        const topLevelRole = coverage.find(c => c.role === 'PRIMARY') ? 'PRIMARY' : 'ADD_ON';

        // Get session_id from item or metadata
        const sessionId = (item.session_id || (item.metadata as any)?.session_id) || null;

        const payload: Record<string, unknown> = {
            account_id: accountId,
            location_id: currentLocationId,
            subscription_type:
                item.type === 'MEMBERSHIP'
                    ? item.feeType === 'JOINING'
                        ? 'MEMBERSHIP_JOINING'
                        : item.feeType === 'ANNUAL'
                          ? 'MEMBERSHIP_RENEWAL'
                          : 'MEMBERSHIP_FEE'
                    : item.type === 'SERVICE'
                      ? 'SERVICE'
                      : 'MEMBERSHIP_FEE',
            reference_id: item.referenceId,
            subscription_term_id: item.subscriptionTermId || null,
            unit_price_snapshot: item.actualPrice ?? item.price,
            total_amount: item.price,
            actual_total_amount: item.actualPrice ?? item.price,
            discount_amount: item.discountAmount ?? 0,
            discount_percentage: item.discountPercentage ?? 0,
            discount_code: item.discountCode ?? '',
            role: topLevelRole,
            status: 'ACTIVE',
            billing_period_start: item.billing_period_start || null,
            billing_period_end: item.billing_period_end || null,
            session_id: sessionId,
            coverage,
        };

        return payload;
    };

    const handleCheckout = async () => {
        if (!accountId || !currentLocationId || marketplaceError || cart.length === 0) {
            return;
        }

        setSubmitting(true);
        try {
            // Collect unique service IDs and membership category IDs from the cart
            const serviceIds = new Set<string>();
            const membershipIds = new Set<string>();

            cart.forEach(item => {
                if (item.type === 'SERVICE' && item.serviceId) {
                    serviceIds.add(item.serviceId);
                } else if (item.type === 'MEMBERSHIP' && item.membershipCategoryId) {
                    membershipIds.add(item.membershipCategoryId);
                }
            });

            // Fetch all active waiver templates for the location
            const response = await waiverService.getWaiverTemplates(currentLocationId);
            
            // Filter templates that match the cart items
            const requiredTemplates = response.data.filter((t: WaiverTemplate) => 
                (t.is_active !== false) && 
                ((t.service_id && serviceIds.has(t.service_id)) || 
                 (t.membership_category_id && membershipIds.has(t.membership_category_id)))
            );

            if (requiredTemplates.length > 0) {
                setActiveTemplates(requiredTemplates);
                setContractsOpen(true);
            } else {
                setPaymentOpen(true);
            }
        } catch (err) {
            console.error('Failed to prepare checkout:', err);
            setMarketplaceError('Failed to verify required contracts. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title="Marketplace"
                breadcrumbs={
                    isMember
                        ? [
                              { label: 'My Account', href: '/portal' },
                              { label: 'Shop', active: true },
                          ]
                        : [
                              { label: 'Dashboard', href: '/' },
                              { label: 'Accounts', href: '/admin/accounts' },
                              { label: 'Detail', href: `/admin/accounts/${accountId}` },
                              { label: 'Shop', active: true },
                          ]
                }
                action={
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(isMember ? '/portal' : `/admin/accounts/${accountId}`)}
                        variant="outlined"
                    >
                        Back
                    </Button>
                }
            />

            {marketplaceError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {marketplaceError}
                </Alert>
            )}

            <Paper
                variant="outlined"
                sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    bgcolor: '#f8fafc',
                }}
            >
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Primary Member: {primaryMember ? getProfileDisplayName(primaryMember) : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {familyMembers.length > 0
                            ? `Family Members: ${familyMembers.map((profile) => getProfileDisplayName(profile)).join(', ')}`
                            : 'No family members'}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Array.from(accountAgeGroupIds).map((ageGroupId) => {
                        const ageGroupName = ageGroups.find((group) => group.age_group_id === ageGroupId)?.name || 'Unknown';
                        return <Chip key={ageGroupId} size="small" label={ageGroupName} />;
                    })}
                </Stack>
            </Paper>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            width: '100%',
                            mb: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            overflow: 'hidden',
                        }}
                    >
                        <Tabs
                            value={tabValue}
                            onChange={(_event, newValue) => setTabValue(newValue)}
                            sx={{
                                borderBottom: 1,
                                borderColor: 'divider',
                                px: 2,
                                bgcolor: '#f8fafc',
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    minHeight: 64,
                                    px: 3,
                                },
                            }}
                        >
                            <Tab label="Memberships" />
                            <Tab label="Services" />
                        </Tabs>

                        <Box sx={{ p: 0 }}>
                            {tabValue === 0 && (
                                <Box sx={{ p: 3 }}>
                                    {/* Membership Filters */}
                                    <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FilterListIcon sx={{ fontSize: 18 }} /> Filter by Age:
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {ageGroups.filter(ag => accountAgeGroupIds.has(ag.age_group_id)).map(group => {
                                                const isSelected = selectedMembershipAgeGroupIds.includes(group.age_group_id);
                                                return (
                                                    <Chip
                                                        key={group.age_group_id}
                                                        label={group.name}
                                                        onClick={() => {
                                                            setSelectedMembershipAgeGroupIds(prev => 
                                                                prev.includes(group.age_group_id) 
                                                                    ? prev.filter(id => id !== group.age_group_id)
                                                                    : [...prev, group.age_group_id]
                                                            );
                                                        }}
                                                        color={isSelected ? "primary" : "default"}
                                                        variant={isSelected ? "filled" : "outlined"}
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                );
                                            })}
                                            {selectedMembershipAgeGroupIds.length > 0 && (
                                                <Button size="small" onClick={() => setSelectedMembershipAgeGroupIds([])}>Clear</Button>
                                            )}
                                        </Box>
                                    </Box>

                                    <Stack spacing={3}>
                                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>
                                                    Memberships
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    startIcon={<InfoOutlinedIcon fontSize="small" />}
                                                    onClick={() => setMembershipInfoOpen(true)}
                                                >
                                                    Fees Info
                                                </Button>
                                            </Box>

                                            <Grid container spacing={2}>
                                                {filteredBasePlanCards.map((card) => {
                                                    const selectedTerms = card.terms.filter((term) => term.base_price_id && isInCart(`BASE-${term.base_price_id}`));

                                                    return (
                                                        <Grid size={{ xs: 12, md: 6 }} key={card.key}>
                                                            <Card
                                                                variant="outlined"
                                                                sx={{
                                                                    borderRadius: 2,
                                                                    height: '100%',
                                                                    borderColor: '#dbeafe',
                                                                    bgcolor: '#f8fbff',
                                                                    opacity: card.role === 'ADD_ON' && !hasActivePrimary ? 0.7 : 1
                                                                }}
                                                            >
                                                                <CardContent>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                <CardMembershipOutlinedIcon sx={{ fontSize: 18, color: '#1d4ed8' }} />
                                                                            </Box>
                                                                            <Box>
                                                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                                                    {card.name}
                                                                                </Typography>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    {card.ageGroupName}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Box>
                                                                        <Chip
                                                                            label={card.role}
                                                                            size="small"
                                                                            sx={{
                                                                                borderRadius: 1,
                                                                                bgcolor: card.role === 'PRIMARY' ? 'primary.100' : 'grey.100',
                                                                                color: card.role === 'PRIMARY' ? 'primary.main' : 'grey.700',
                                                                                fontWeight: 700,
                                                                            }}
                                                                        />
                                                                    </Box>

                                                                    {card.role === 'ADD_ON' && !hasActivePrimary && (
                                                                        <Alert severity="warning" sx={{ mb: 1, py: 0, px: 1, fontSize: '0.75rem', '& .MuiAlert-icon': { fontSize: '1rem' } }}>
                                                                            Requires Primary Plan
                                                                        </Alert>
                                                                    )}

                                                                    <Stack spacing={1} sx={{ mb: 2 }}>
                                                                        {card.terms.map((term) => {
                                                                            const inCart = term.base_price_id ? isInCart(`BASE-${term.base_price_id}`) : false;
                                                                            const termName = subscriptionTermNameMap.get(term.subscription_term_id) || term.term_name || 'Term';
                                                                            const termInfo = subscriptionTermMap.get(term.subscription_term_id);
                                                                            const billingText =
                                                                                termInfo?.payment_mode === 'RECURRING'
                                                                                    ? `Recurring every ${termInfo.recurrence_unit_value || 1} ${(termInfo.recurrence_unit || 'Month').toLowerCase()}${(termInfo.recurrence_unit_value || 1) > 1 ? 's' : ''}`
                                                                                    : 'Pay in Full';

                                                                            return (
                                                                                <Box
                                                                                    key={`${card.key}-${term.subscription_term_id}`}
                                                                                    sx={{
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'space-between',
                                                                                        p: 1.25,
                                                                                        borderRadius: 1,
                                                                                        border: '1px solid',
                                                                                        borderColor: inCart ? 'primary.main' : 'divider',
                                                                                        bgcolor: inCart ? 'primary.50' : 'background.paper',
                                                                                    }}
                                                                                >
                                                                                    <Box>
                                                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                                            {termName}
                                                                                        </Typography>
                                                                                        <Typography variant="caption" color="text.secondary">
                                                                                            {billingText}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                                                            {formatCurrency(term.price)}
                                                                                        </Typography>
                                                                                        {inCart && <Chip label="Selected" size="small" color="primary" />}
                                                                                    </Box>
                                                                                </Box>
                                                                            );
                                                                        })}
                                                                    </Stack>

                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Joining or renewal fees are selected when adding membership category.
                                                                        </Typography>
                                                                        <Tooltip title="Add this base card, select term in popup, then choose profile coverage.">
                                                                            <IconButton size="small">
                                                                                <InfoOutlinedIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Box>

                                                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {selectedTerms.length} term(s) selected
                                                                        </Typography>
                                                                        <Button
                                                                            variant="contained"
                                                                            size="small"
                                                                            onClick={() => handleStartAddBaseCard(card)}
                                                                        >
                                                                            Add
                                                                        </Button>
                                                                    </Box>
                                                                </CardContent>
                                                            </Card>
                                                        </Grid>
                                                    );
                                                })}

                                                {filteredBasePlanCards.length === 0 && (
                                                    <Grid size={12}>
                                                        <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                                                            No membership cards matched the selected filters.
                                                        </Typography>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </Paper>

                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2.5,
                                                borderRadius: 2,
                                                bgcolor: '#f5f3ff',
                                                borderColor: '#ddd6fe',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#4c1d95' }}>
                                                    Membership Plans Suggestion
                                                </Typography>
                                                <Button variant="contained" color="secondary" onClick={() => setOtherPlansOpen(true)}>
                                                    Add Other Plan
                                                </Button>
                                            </Box>

                                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                                <Chip label={`Children: ${householdCounts.children}`} size="small" />
                                                <Chip label={`Adults: ${householdCounts.adults}`} size="small" />
                                                <Chip label={`Seniors: ${householdCounts.seniors}`} size="small" />
                                            </Stack>
                                            {baseCartItems.length === 0 && (
                                                <Typography color="text.secondary">
                                                    Add at least one base plan selection to generate membership suggestion.
                                                </Typography>
                                            )}

                                            {baseCartItems.length > 0 && missingDobProfileIds.length > 0 && (
                                                <Alert severity="warning">
                                                    Suggestion is blocked because DOB is missing for: {missingDobNames.join(', ')}.
                                                </Alert>
                                            )}

                                            {baseCartItems.length > 0 && missingDobProfileIds.length === 0 && suggestedCandidate && (
                                                <Paper sx={{ p: 2, bgcolor: '#ede9fe', borderRadius: 2 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                                                        Suggested: {suggestedCandidate.programName} - {suggestedCandidate.categoryName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                                        Specificity score: {suggestedSpecificity}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                                        <Chip
                                                            label={
                                                                typeof suggestedCandidate.joiningFee === 'number'
                                                                    ? `Joining ${formatCurrency(suggestedCandidate.joiningFee)}`
                                                                    : 'Joining not configured'
                                                            }
                                                            size="small"
                                                        />
                                                        <Chip
                                                            label={
                                                                typeof suggestedCandidate.annualFee === 'number'
                                                                    ? `Annual ${formatCurrency(suggestedCandidate.annualFee)}`
                                                                    : 'Annual not configured'
                                                            }
                                                            size="small"
                                                        />
                                                    </Stack>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => handleOpenFeeDialog(suggestedCandidate)}
                                                    >
                                                        Add Suggested Plan
                                                    </Button>
                                                </Paper>
                                            )}

                                            {baseCartItems.length > 0 && missingDobProfileIds.length === 0 && !suggestedCandidate && (
                                                <Alert severity="info">
                                                    No eligible membership plan found for this household. You can still add a plan manually.
                                                </Alert>
                                            )}
                                        </Paper>
                                    </Stack>
                                </Box>
                            )}

                            {tabValue === 1 && (
                                <Box sx={{ p: 3 }}>
                                    {/* Service Search and Filters */}
                                    <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                        <TextField
                                            placeholder="Search service packs..."
                                            size="small"
                                            value={serviceSearchQuery}
                                            onChange={(e) => setServiceSearchQuery(e.target.value)}
                                            sx={{ flexGrow: 1, minWidth: '250px' }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon sx={{ color: 'text.secondary' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                        
                                        <FormControl size="small" sx={{ minWidth: 200 }}>
                                            <Select
                                                multiple
                                                displayEmpty
                                                value={selectedServiceIds}
                                                onChange={(e) => setSelectedServiceIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                                input={<OutlinedInput />}
                                                renderValue={(selected) => {
                                                    if (selected.length === 0) {
                                                        return <Typography variant="body2" color="text.secondary">Filter by Service</Typography>;
                                                    }
                                                    return `Services (${selected.length})`;
                                                }}
                                            >
                                                {services.map((service) => (
                                                    <MenuItem key={service.service_id} value={service.service_id}>
                                                        <Checkbox checked={selectedServiceIds.indexOf(service.service_id) > -1} />
                                                        <Typography variant="body2">{service.name}</Typography>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        
                                        {(serviceSearchQuery || selectedServiceIds.length > 0) && (
                                            <Button size="small" onClick={() => { setServiceSearchQuery(''); setSelectedServiceIds([]); }}>
                                                Reset
                                            </Button>
                                        )}
                                    </Box>

                                    <Grid container spacing={3}>
                                        {services
                                            .filter((service) => selectedServiceIds.length === 0 || selectedServiceIds.includes(service.service_id))
                                            .flatMap((service) =>
                                                (service.packs || [])
                                                    .filter((pack) => 
                                                        pack.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
                                                        service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                                                    )
                                                    .map((pack) => ({ service, pack }))
                                            )
                                            .map(({ service, pack }) => {
                                            const minPrice = (pack.prices || []).length > 0
                                                ? Math.min(...(pack.prices || []).map((priceItem) => parseNumericPrice(priceItem.price)))
                                                : 0;

                                            const serviceItemId = pack.service_pack_id ? `SERVICE-${pack.service_pack_id}` : '';
                                            const selected = serviceItemId ? isInCart(serviceItemId) : false;

                                            return (
                                                <Grid size={{ xs: 12, md: 6 }} key={pack.service_pack_id || `${service.service_id}-${pack.name}`}>
                                                    <Card
                                                        variant="outlined"
                                                        sx={{
                                                            height: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            border: '1px solid',
                                                            borderColor: selected ? 'primary.main' : 'divider',
                                                            bgcolor: selected ? 'primary.50' : 'background.paper',
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                boxShadow: '0 12px 20px -8px rgba(0, 0, 0, 0.15)',
                                                                borderColor: 'primary.light',
                                                            },
                                                        }}
                                                    >
                                                        <CardMedia
                                                            component="img"
                                                            height="180"
                                                            image={service.image_url || ''}
                                                            alt={`${service.name} - ${pack.name}`}
                                                            sx={{ bgcolor: '#f1f5f9' }}
                                                        />
                                                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                                <Box>
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                                        {pack.name}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {service.name}
                                                                    </Typography>
                                                                </Box>
                                                                <Chip
                                                                    label={service.service_type || 'Service'}
                                                                    size="small"
                                                                    sx={{
                                                                        borderRadius: 1,
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 700,
                                                                        bgcolor: '#dbeafe',
                                                                        color: '#1d4ed8',
                                                                    }}
                                                                />
                                                            </Box>

                                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                                                {pack.classes && <Chip label={`${pack.classes} CLASSES`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }} />}
                                                                {/* Removed: pack.students_allowed chip */}
                                                                {pack.duration_months ? (
                                                                    <Chip label={`${pack.duration_months} MONTHS`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }} />
                                                                ) : pack.duration_days ? (
                                                                    <Chip label={`${pack.duration_days} DAYS`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }} />
                                                                ) : null}
                                                                {pack.waiver_program_id && (
                                                                    <Chip
                                                                        label={waiverPrograms.find(w => w.waiver_program_id === pack.waiver_program_id)?.name?.toUpperCase() || 'WAIVER ELIGIBLE'}
                                                                        size="small"
                                                                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#fff7ed', color: '#c2410c', borderRadius: '4px' }}
                                                                    />
                                                                )}
                                                            </Box>

                                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                                                                {pack.is_shrabable && <Chip label="SHARABLE" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#f0fdf4', color: '#16a34a', borderRadius: '4px' }} />}
                                                                {pack.max_uses_per_period && (
                                                                    <Chip 
                                                                        label={`${pack.max_uses_per_period} USES / ${pack.usage_period_length || 1} ${pack.usage_period_unit}`} 
                                                                        size="small" 
                                                                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#f0f9ff', color: '#0284c7', borderRadius: '4px' }} 
                                                                    />
                                                                )}
                                                                {pack.enforce_usage_limit && (
                                                                    <Chip label="STRICT" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#fef2f2', color: '#ef4444', borderRadius: '4px' }} />
                                                                )}
                                                            </Box>

                                                            {/* Price Breakdown by Age Group */}
                                                            {(pack.prices || []).length > 0 && (
                                                                <Box sx={{ mb: 2, bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                                                                     {(pack.prices || []).map((priceItem, idx) => {
                                                                         const priceAgeGroupId = (priceItem as any).age_group_id;
                                                                         const ageGroupName = ageGroups.find(ag => ag.age_group_id === priceAgeGroupId)?.name || 'Standard';
                                                                         const students = (priceItem as any).num_students || 1;
                                                                         const instructors = (priceItem as any).num_instructors || 1;
                                                                         
                                                                         return (
                                                                             <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, '&:last-child': { mb: 0 } }}>
                                                                                 <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                                                     <Typography variant="caption" color="text.primary" fontWeight="700" sx={{ fontSize: '0.7rem' }}>
                                                                                         {ageGroupName}
                                                                                     </Typography>
                                                                                     <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 500 }}>
                                                                                         {students} Student{students !== 1 ? 's' : ''} • {instructors} Instr.
                                                                                     </Typography>
                                                                                 </Box>
                                                                                 <Typography variant="caption" fontWeight="800" color="primary.main" sx={{ fontSize: '0.75rem' }}>
                                                                                     {formatCurrency(parseNumericPrice(priceItem.price))}
                                                                                 </Typography>
                                                                             </Box>
                                                                         );
                                                                     })}
                                                                </Box>
                                                            )}

                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                                                                        {minPrice > 0 ? (
                                                                            <>
                                                                                <Typography component="span" variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>from</Typography>
                                                                                {formatCurrency(minPrice)}
                                                                            </>
                                                                        ) : 'See Pricing'}
                                                                    </Typography>
                                                                </Box>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    onClick={() => handleOpenServiceSelection(service, pack)}
                                                                >
                                                                    Select
                                                                </Button>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            );
                                        })}
                                    {services
                                        .filter((service) => selectedServiceIds.length === 0 || selectedServiceIds.includes(service.service_id))
                                        .flatMap((service) =>
                                            (service.packs || []).filter((pack) => 
                                                pack.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
                                                service.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                                            )
                                        ).length === 0 && (
                                        <Grid size={12}>
                                            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                                {serviceSearchQuery || selectedServiceIds.length > 0 
                                                    ? 'No services matched your search or filters.' 
                                                    : 'No services with packs found for this location.'}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Box>
                        )}
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            position: 'sticky',
                            top: 24,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: '#f8fafc',
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                            <Box
                                sx={{
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    p: 1,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <ShoppingCartIcon fontSize="small" />
                            </Box>
                            <Typography variant="h6" fontWeight={700}>
                                Selection Summary
                            </Typography>
                        </Box>

                        {cart.length === 0 ? (
                            <Box
                                sx={{
                                    py: 4,
                                    textAlign: 'center',
                                    bgcolor: 'white',
                                    borderRadius: 2,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography color="text.secondary" variant="body2">
                                    No items selected yet
                                </Typography>
                                <Typography color="text.disabled" variant="caption">
                                    Select plans from the catalog
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                <Stack spacing={2} sx={{ mb: 3 }}>
                                    {cart.map((item) => {
                                        const discState = getItemDiscount(item.id);
                                        const hasDiscount = item.actualPrice !== undefined && item.actualPrice !== item.price;
                                        return (
                                        <Box
                                            key={item.id}
                                            sx={{
                                                p: 2,
                                                bgcolor: 'white',
                                                borderRadius: 2,
                                                border: '1px solid',
                                                borderColor: hasDiscount ? 'success.light' : 'divider',
                                                position: 'relative',
                                            }}
                                        >
                                            <IconButton
                                                size="small"
                                                onClick={() => removeFromCart(item.id)}
                                                sx={{ position: 'absolute', top: 8, right: 8, color: 'text.disabled' }}
                                            >
                                                <Typography variant="caption" sx={{ fontSize: '14px' }}>
                                                    x
                                                </Typography>
                                            </IconButton>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, pr: 3, flexWrap: 'wrap' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                    {item.name}
                                                </Typography>
                                                {(() => {
                                                    const badge = item.type === 'SERVICE' 
                                                        ? { label: 'Service', color: '#1d4ed8', bgcolor: '#dbeafe' }
                                                        : item.type === 'MEMBERSHIP'
                                                        ? { label: 'Membership Plan', color: '#15803d', bgcolor: '#dcfce7' }
                                                        : item.type === 'BASE' 
                                                        ? { label: 'Membership Fee', color: '#c2410c', bgcolor: '#fff7ed' }
                                                        : { label: item.type, color: '#475569', bgcolor: '#f1f5f9' };
                                                    return (
                                                        <Chip
                                                            label={badge.label.toUpperCase()}
                                                            size="small"
                                                            sx={{
                                                                height: 18,
                                                                fontSize: '0.55rem',
                                                                fontWeight: 800,
                                                                bgcolor: badge.bgcolor,
                                                                color: badge.color,
                                                                borderRadius: 0.5,
                                                                letterSpacing: '0.04em'
                                                            }}
                                                        />
                                                    );
                                                })()}
                                            </Box>

                                            {/* Price display */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                {hasDiscount && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
                                                    >
                                                        {formatCurrency(item.actualPrice!)}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2" color={hasDiscount ? 'success.main' : 'primary.main'} fontWeight={700}>
                                                    {formatCurrency(item.price)}
                                                </Typography>
                                                {hasDiscount && item.discountPercentage !== undefined && (
                                                    <Chip
                                                        label={`-${item.discountPercentage.toFixed(1)}%`}
                                                        size="small"
                                                        color="success"
                                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                                    />
                                                )}
                                            </Box>

                                            {item.billing_period_start && item.billing_period_end && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    Period: {new Date(item.billing_period_start).toLocaleDateString()} - {new Date(item.billing_period_end).toLocaleDateString()}
                                                </Typography>
                                            )}

                                            {/* Coverage chips */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
                                                {item.coverage?.map((covered) => (
                                                    <Chip
                                                        key={`${item.id}-${covered.profile_id}`}
                                                        label={covered.name}
                                                        size="small"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: '0.65rem',
                                                            bgcolor: '#f1f5f9',
                                                            color: 'text.primary',
                                                            fontWeight: 600,
                                                            borderRadius: 1,
                                                        }}
                                                    />
                                                ))}
                                            </Box>

                                            {/* Discount section */}
                                            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                                                {/* Applied discount badge */}
                                                {hasDiscount && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        {item.discountCode === 'MEMBERSHIP' ? (
                                                            <StarIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                                        ) : (
                                                            <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                                        )}
                                                        <Typography variant="caption" color="success.main" fontWeight={600}>
                                                            {item.discountCode === 'MEMBERSHIP'
                                                                ? `${discState.membershipDiscountExplanation || 'Membership discount applied'} — saved ${formatCurrency(item.discountAmount ?? 0)}`
                                                                : item.discountCode
                                                                  ? `Code "${item.discountCode}" applied — saved ${formatCurrency(item.discountAmount ?? 0)}`
                                                                  : `Manual discount applied — saved ${formatCurrency(item.discountAmount ?? 0)}`}
                                                        </Typography>
                                                        <Button
                                                            size="small"
                                                            color="inherit"
                                                            sx={{ ml: 'auto', fontSize: '0.65rem', minWidth: 0, p: '2px 6px', color: 'text.disabled' }}
                                                            onClick={() => removeDiscount(item.id)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </Box>
                                                )}

                                                {/* Discount code input */}
                                                {!hasDiscount && (
                                                    <Box>
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                                            <LocalOfferIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 1 }} />
                                                            <TextField
                                                                size="small"
                                                                placeholder="Discount code"
                                                                value={discState.code}
                                                                onChange={(e) => setItemDiscounts((prev) => ({
                                                                    ...prev,
                                                                    [item.id]: { ...getItemDiscount(item.id), code: e.target.value, codeStatus: 'idle', codeError: undefined },
                                                                }))}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleApplyDiscountCode(item.id, item.serviceId);
                                                                }}
                                                                sx={{ flex: 1 }}
                                                                inputProps={{ style: { fontSize: '0.8rem', padding: '6px 10px' } }}
                                                                error={discState.codeStatus === 'invalid'}
                                                                helperText={discState.codeStatus === 'invalid' ? discState.codeError : undefined}
                                                                FormHelperTextProps={{ sx: { fontSize: '0.7rem', mx: 0 } }}
                                                            />
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => handleApplyDiscountCode(item.id, item.serviceId)}
                                                                disabled={!discState.code.trim() || discState.codeStatus === 'validating'}
                                                                sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', py: '5px' }}
                                                            >
                                                                {discState.codeStatus === 'validating' ? 'Checking…' : 'Apply'}
                                                            </Button>
                                                        </Box>

                                                        {/* Manual discount fields — staff only */}
                                                        {canApplyManualDiscount && (
                                                            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                <TextField
                                                                    size="small"
                                                                    label="Discount $"
                                                                    type="number"
                                                                    value={discState.manualAmount}
                                                                    onChange={(e) => setItemDiscounts((prev) => ({
                                                                        ...prev,
                                                                        [item.id]: { ...getItemDiscount(item.id), manualAmount: e.target.value, manualPercentage: '' },
                                                                    }))}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value) handleManualDiscountApply(item.id, 'amount', e.target.value);
                                                                    }}
                                                                    inputProps={{ min: 0, style: { fontSize: '0.8rem', padding: '6px 10px' } }}
                                                                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                                                                    sx={{ flex: 1 }}
                                                                />
                                                                <Typography variant="caption" color="text.secondary">or</Typography>
                                                                <TextField
                                                                    size="small"
                                                                    label="Discount %"
                                                                    type="number"
                                                                    value={discState.manualPercentage}
                                                                    onChange={(e) => setItemDiscounts((prev) => ({
                                                                        ...prev,
                                                                        [item.id]: { ...getItemDiscount(item.id), manualPercentage: e.target.value, manualAmount: '' },
                                                                    }))}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value) handleManualDiscountApply(item.id, 'percentage', e.target.value);
                                                                    }}
                                                                    inputProps={{ min: 0, max: 100, style: { fontSize: '0.8rem', padding: '6px 10px' } }}
                                                                    InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                                                                    sx={{ flex: 1 }}
                                                                />
                                                            </Box>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                        );
                                    })}

                                </Stack>

                                <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, px: 1 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        Total Amount
                                    </Typography>
                                    <Typography variant="h5" color="primary.main" fontWeight={800}>
                                        {formatCurrency(cart.reduce((sum, item) => sum + item.price, 0))}
                                    </Typography>
                                </Box>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={handleCheckout}
                                    disabled={submitting || !!marketplaceError || !accountId}
                                    sx={{
                                        borderRadius: 3,
                                        py: 2,
                                        fontWeight: 800,
                                        boxShadow: '0 10px 15px -3px rgba(25, 118, 210, 0.3)',
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {submitting ? 'Processing...' : 'Confirm Enrollment'}
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                                    Prices include all applicable taxes and fees.
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            <Dialog open={termDialogOpen} onClose={() => setTermDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Select Subscription Term</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select a term and start date for {pendingBaseCard?.name} ({pendingBaseCard?.ageGroupName}).
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Start Date"
                                type="date"
                                value={selectedBaseStartDate}
                                onChange={(e) => setSelectedBaseStartDate(e.target.value)}
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                    <FormControl fullWidth>
                        <RadioGroup value={selectedTermId} onChange={(event) => setSelectedTermId(event.target.value)}>
                            {(pendingBaseCard?.terms || []).map((term) => {
                                const termName = subscriptionTermNameMap.get(term.subscription_term_id) || term.term_name || 'Term';
                                const termInfo = subscriptionTermMap.get(term.subscription_term_id);
                                const billingText =
                                    termInfo?.payment_mode === 'RECURRING'
                                        ? `Recurring every ${termInfo.recurrence_unit_value || 1} ${(termInfo.recurrence_unit || 'Month').toLowerCase()}${(termInfo.recurrence_unit_value || 1) > 1 ? 's' : ''}`
                                        : 'Pay in Full';
                                return (
                                    <Paper key={term.base_price_id || term.subscription_term_id} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                                        <FormControlLabel
                                            value={term.subscription_term_id}
                                            control={<Radio />}
                                            label={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 260 }}>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {termName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {billingText}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700, mt: 0.25 }}>
                                                        {formatCurrency(term.price)}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </Paper>
                                );
                            })}
                        </RadioGroup>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTermDialogOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmBaseTermSelection} variant="contained" disabled={!selectedTermId || !selectedBaseStartDate}>
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={feeDialogOpen} onClose={() => setFeeDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Select Fee Type</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Choose which fee to apply for {pendingMembershipCandidate?.programName} - {pendingMembershipCandidate?.categoryName}.
                    </Typography>
                    <FormControl fullWidth>
                        <RadioGroup
                            value={selectedFeeType}
                            onChange={(event) => setSelectedFeeType(event.target.value as 'JOINING' | 'ANNUAL')}
                        >
                            <FormControlLabel
                                value="JOINING"
                                disabled={typeof pendingMembershipCandidate?.joiningFee !== 'number'}
                                control={<Radio />}
                                label={
                                    <Typography variant="body2">
                                        Joining: {typeof pendingMembershipCandidate?.joiningFee === 'number' ? formatCurrency(pendingMembershipCandidate.joiningFee) : 'Not configured'}
                                    </Typography>
                                }
                            />
                            <FormControlLabel
                                value="ANNUAL"
                                disabled={typeof pendingMembershipCandidate?.annualFee !== 'number'}
                                control={<Radio />}
                                label={
                                    <Typography variant="body2">
                                        Renewal: {typeof pendingMembershipCandidate?.annualFee === 'number' ? formatCurrency(pendingMembershipCandidate.annualFee) : 'Not configured'}
                                    </Typography>
                                }
                            />
                        </RadioGroup>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFeeDialogOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmFeeSelection}
                        variant="contained"
                        disabled={
                            !selectedFeeType ||
                            (selectedFeeType === 'JOINING' && typeof pendingMembershipCandidate?.joiningFee !== 'number') ||
                            (selectedFeeType === 'ANNUAL' && typeof pendingMembershipCandidate?.annualFee !== 'number')
                        }
                    >
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Service Pack Selection Dialog */}
            {pendingServiceSelection && (
                <ServicePackSelectionDialog
                    open={serviceSelectionOpen}
                    onClose={() => {
                        setServiceSelectionOpen(false);
                        setPendingServiceSelection(null);
                    }}
                    service={pendingServiceSelection.service}
                    pack={pendingServiceSelection.pack}
                    profiles={profiles}
                    onConfirm={handleConfirmServiceSelection}
                    // Passing context for limit validation
                    activeSubscriptions={subscriptions}
                    currentCart={cart}
                />
            )}

            <Dialog
                open={coverageDialogOpen}
                onClose={() => setCoverageDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Who is this for?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Select the family members for {pendingItem?.name}.
                    </Typography>
                    <FormGroup>
                        {profiles.map((profile) => {
                            let isAllowed = true;
                            let restrictionReason = '';

                            if (pendingItem?.type === 'BASE' && pendingItem.ageGroupId) {
                                if (profile.date_of_birth) {
                                    const ageGroupName = getAgeGroupName(profile.date_of_birth, ageGroups);
                                    const matchedGroup = ageGroups.find((group) => group.name === ageGroupName);
                                    if (matchedGroup?.age_group_id !== pendingItem.ageGroupId) {
                                        isAllowed = false;
                                        restrictionReason = `Requires ${ageGroups.find(g => g.age_group_id === pendingItem.ageGroupId)?.name || 'different age group'}`;
                                    }
                                } else {
                                    isAllowed = false;
                                    restrictionReason = 'Date of birth missing';
                                }
                            }

                            // Rule: Disable if profile is already assigned a BASE or MEMBERSHIP plan in cart or active subscriptions
                            if (isAllowed && pendingItem?.type === 'BASE') {
                                const profileInCart = cart.some(item => 
                                    (item.type === 'BASE' || item.type === 'MEMBERSHIP') && 
                                    item.coverage?.some(c => c.profile_id === profile.profile_id) && 
                                    item.id !== pendingItem.id
                                );
                                if (profileInCart) {
                                    isAllowed = false;
                                    restrictionReason = 'Already selected for a plan in cart';
                                } else {
                                    const profileHasActive = subscriptions.some(sub => 
                                        sub.subscription_type.startsWith('MEMBERSHIP') && sub.status === 'ACTIVE' &&
                                        (sub.coverage?.some((c: any) => c.profile_id === profile.profile_id) || sub.subscription_coverage?.some((c: any) => c.profile_id === profile.profile_id))
                                    );
                                    if (profileHasActive) {
                                        isAllowed = false;
                                        restrictionReason = 'Already has an active membership';
                                    }
                                }
                            }

                            const profileAge = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;

                            return (
                                <Tooltip key={profile.profile_id} title={restrictionReason} placement="right" disableHoverListener={isAllowed}>
                                    <FormControlLabel
                                        sx={{ 
                                            mb: 1, 
                                            opacity: isAllowed ? 1 : 0.5,
                                            '& .MuiTypography-root': {
                                                color: isAllowed ? 'text.primary' : 'text.disabled'
                                            }
                                        }}
                                        control={
                                            <Checkbox
                                                checked={selectedProfileIds.includes(profile.profile_id)}
                                                disabled={!isAllowed}
                                                onChange={(event) => {
                                                    if (event.target.checked) {
                                                        setSelectedProfileIds((prev) => [...prev, profile.profile_id]);
                                                    } else {
                                                        setSelectedProfileIds((prev) => prev.filter((id) => id !== profile.profile_id));
                                                    }
                                                }}
                                            />
                                        }
                                        label={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="body2">
                                                    {getProfileDisplayName(profile)}
                                                    {profileAge !== null && (
                                                        <Typography component="span" variant="caption" sx={{ ml: 1, fontWeight: 700, color: isAllowed ? 'primary.main' : 'text.disabled' }}>
                                                            ({profileAge} yrs)
                                                        </Typography>
                                                    )}
                                                </Typography>
                                                <Chip
                                                    label={profile.date_of_birth ? getAgeGroupName(profile.date_of_birth, ageGroups) : 'Unknown'}
                                                    size="small"
                                                    sx={{ 
                                                        height: 18, 
                                                        fontSize: '0.6rem',
                                                        opacity: isAllowed ? 1 : 0.6
                                                    }}
                                                />
                                                {profile.is_primary && <StarIcon sx={{ fontSize: 14, color: isAllowed ? '#f59e0b' : 'text.disabled' }} />}
                                            </Box>
                                        }
                                    />
                                </Tooltip>
                            );
                        })}
                    </FormGroup>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setCoverageDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmCoverage}
                        variant="contained"
                        disabled={selectedProfileIds.length === 0}
                        sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={otherPlansOpen} onClose={() => setOtherPlansOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Other Membership Plan</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        All active categories are listed below. Eligible categories are marked based on current household selection.
                    </Typography>
                    <Stack spacing={1.5}>
                        {eligibilityResults.map((entry) => (
                            <Paper key={entry.candidate.categoryId} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: entry.eligible ? '#ecfeff' : '#f8fafc', borderColor: entry.eligible ? '#a5f3fc' : 'divider' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            {entry.candidate.programName} - {entry.candidate.categoryName}
                                        </Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
                                            <Chip
                                                size="small"
                                                color={entry.eligible ? 'success' : 'default'}
                                                label={entry.eligible ? 'Eligible' : 'Out of rule'}
                                            />
                                            <Chip
                                                size="small"
                                                label={
                                                    typeof entry.candidate.joiningFee === 'number'
                                                        ? `Joining ${formatCurrency(entry.candidate.joiningFee)}`
                                                        : 'Joining n/a'
                                                }
                                            />
                                            <Chip
                                                size="small"
                                                label={
                                                    typeof entry.candidate.annualFee === 'number'
                                                        ? `Renewal ${formatCurrency(entry.candidate.annualFee)}`
                                                        : 'Renewal n/a'
                                                }
                                            />
                                        </Stack>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setOtherPlansOpen(false);
                                            handleOpenFeeDialog(entry.candidate);
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Box>
                            </Paper>
                        ))}

                        {eligibilityResults.length === 0 && (
                            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                                No active membership categories found.
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOtherPlansOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={membershipInfoOpen} onClose={() => setMembershipInfoOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Membership Joining and Renewal Fees</DialogTitle>
                <DialogContent>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Joining</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Renewal</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Rule Range (C/A/S)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {eligibilityResults.map((entry) => (
                                    <TableRow key={`info-${entry.candidate.categoryId}`}>
                                        <TableCell>{entry.candidate.programName}</TableCell>
                                        <TableCell>{entry.candidate.categoryName}</TableCell>
                                        <TableCell align="right">
                                            {typeof entry.candidate.joiningFee === 'number' ? formatCurrency(entry.candidate.joiningFee) : 'n/a'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {typeof entry.candidate.annualFee === 'number' ? formatCurrency(entry.candidate.annualFee) : 'n/a'}
                                        </TableCell>
                                        <TableCell>
                                            {ageGroups.map((group, idx) => {
                                                const r = (entry.candidate.range as any)[group.age_group_id];
                                                const min = r?.min ?? 0;
                                                const max = r?.max ?? Number.POSITIVE_INFINITY;
                                                return (
                                                    <span key={group.age_group_id}>
                                                        {`${group.name}: ${min}-${Number.isFinite(max) ? max : 'inf'}`}
                                                        {idx < ageGroups.length - 1 ? ' / ' : ''}
                                                    </span>
                                                );
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {eligibilityResults.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography color="text.secondary">No membership categories configured.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMembershipInfoOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <ContractsSigningDialog 
                open={contractsOpen}
                onClose={() => setContractsOpen(false)}
                cart={cart}
                templates={activeTemplates}
                primaryProfile={primaryMember}
                locationId={currentLocationId!}
                subscriptionTerms={subscriptionTerms}
                companyConfig={{ name: 'Solar Swim Gym', address: '123 Main St' }} // Replace with actual company config if available
                onSuccess={() => {
                    setContractsOpen(false);
                    setPaymentOpen(true);
                }}
            />

            <PaymentDialog
                open={paymentOpen}
                onClose={() => setPaymentOpen(false)}
                total={cart.reduce((sum, item) => sum + item.price, 0)}
                itemCount={cart.length}
                items={cart.map(i => ({ name: i.name, price: i.price }))}
                onSuccess={async () => {
                    setSubmitting(true);
                    try {
                        const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
                        
                        // 1. Copy cart items to subscriptions
                        const subscriptionPromises = cart.map((item) => {
                            const payload = constructSubscriptionPayload(item);
                            return billingService.createSubscription(payload, currentLocationId || undefined);
                        });
                        
                        const subResponses = await Promise.all(subscriptionPromises);
                        
                        // Extract successfully created subscription IDs
                        const createdSubIds = subResponses
                            .map((res: any) => res?.data?.subscription_id || res?.subscription_id)
                            .filter(Boolean);

                        // 2. Create Invoice
                        let newInvoiceId: string | null = null;
                        if (createdSubIds.length > 0 && accountId && currentLocationId) {
                            try {
                                const invoicePayload = {
                                    account_id: accountId,
                                    location_id: currentLocationId,
                                    total_amount: totalAmount,
                                    status: 'PENDING'
                                };
                                const invResponse = await billingService.createInvoice(invoicePayload, currentLocationId);
                                newInvoiceId = invResponse?.data?.invoice_id || invResponse?.invoice_id;
                                
                                // 3. Update Subscriptions with new invoice ID
                                if (newInvoiceId) {
                                    await Promise.all(
                                        createdSubIds.map((subId: string) => 
                                            billingService.updateSubscriptionInvoice(subId, newInvoiceId!, currentLocationId)
                                        )
                                    );
                                }
                            } catch (invErr) {
                                console.error('Failed to create or link invoice:', invErr);
                                // Non-blocking error for checkout
                            }
                        }

                        // 4. Clear server-side cart
                        if (accountId && currentLocationId) {
                            await cartService.clearCart(accountId, currentLocationId);
                        }

                        // 5. Clear local state
                        setCart([]);
                        setItemDiscounts({});

                        setPaymentOpen(false);
                        navigate(isMember ? '/portal' : `/admin/accounts/${accountId}`);
                    } catch (err) {
                        console.error('Checkout conversion failed:', err);
                        setMarketplaceError('Payment successful, but failed to create subscriptions. Please contact staff.');
                        setPaymentOpen(false);
                    } finally {
                        setSubmitting(false);
                    }
                }}
            />

            <ManagerPasscodeDialog 
                open={passcodeOpen}
                onClose={() => {
                    setPasscodeOpen(false);
                    setPendingDiscountAction(null);
                }}
                onSuccess={handlePasscodeSuccess}
            />
        </Box>
    );
};

