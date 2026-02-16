-- 1. Base Plan Deletion Function
-- This function handles the "Profile" deletion logic: deleting all price variations and linked services for a specific AgeGroup+Role.

CREATE OR REPLACE FUNCTION delete_base_plan_profile(
    p_location_id UUID,
    p_role text,
    p_age_group_id UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Delete all Base Prices for this profile (Cascades to nothing? Need to valid FKs)
    -- Check if base_price is referenced by things we want to keep?
    -- waiver_template references base_price_id. We should probably set it to NULL or CASCADE.
    -- Let's assume we want to delete the prices.
    
    DELETE FROM public.base_price
    WHERE location_id = p_location_id 
    AND role = p_role::pricing_role 
    AND age_group_id = p_age_group_id;

    -- 2. Delete Bundled Services linked to this profile
    DELETE FROM public.membership_service
    WHERE location_id = p_location_id
    AND baseprice_role = p_role
    AND baseprice_age_group_id = p_age_group_id;
    
END;
$$;

-- 2. Add Cascading Deletes for Membership Hierarchy
-- We need to drop existing constraints and re-add them with ON DELETE CASCADE

-- A. Membership Program -> Categories
ALTER TABLE public.membership_program_category
DROP CONSTRAINT IF EXISTS membership_program_category_membership_program_id_fkey;

ALTER TABLE public.membership_program_category
ADD CONSTRAINT membership_program_category_membership_program_id_fkey
FOREIGN KEY (membership_program_id)
REFERENCES public.membership_program(membership_program_id)
ON DELETE CASCADE;

-- B. Category -> Fees
ALTER TABLE public.membership_fee
DROP CONSTRAINT IF EXISTS membership_fee_category_id_fkey;

ALTER TABLE public.membership_fee
ADD CONSTRAINT membership_fee_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES public.membership_program_category(category_id)
ON DELETE CASCADE;

-- C. Category -> Rules
ALTER TABLE public.membership_eligibility_rule
DROP CONSTRAINT IF EXISTS membership_eligibility_rule_category_id_fkey;

ALTER TABLE public.membership_eligibility_rule
ADD CONSTRAINT membership_eligibility_rule_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES public.membership_program_category(category_id)
ON DELETE CASCADE;

-- D. Category -> Services (Note: membership_program_id column actually stores category_id)
ALTER TABLE public.membership_service
DROP CONSTRAINT IF EXISTS membership_service_membership_program_id_fkey;

ALTER TABLE public.membership_service
ADD CONSTRAINT membership_service_membership_program_id_fkey
FOREIGN KEY (membership_program_id)
REFERENCES public.membership_program_category(category_id)
ON DELETE CASCADE;

-- E. Waiver Template -> Membership Category (If category deleted, set null or cascade? User said "Nuclear Delete" for program cleans up all... but Waiver Template might differ. Let's Set Null to be safe, or Cascade if it's strictly linked)
-- User: "Removing a program... clean up: All Categories... All Fees... All Rules... All Service Links".
-- Didn't mention Waivers. I'll set NULL to be safe.
ALTER TABLE public.waiver_template
DROP CONSTRAINT IF EXISTS waiver_template_membership_category_id_fkey;

ALTER TABLE public.waiver_template
ADD CONSTRAINT waiver_template_membership_category_id_fkey
FOREIGN KEY (membership_category_id)
REFERENCES public.membership_program_category(category_id)
ON DELETE SET NULL;

-- F. Waiver Template -> Base Price (Set Null)
ALTER TABLE public.waiver_template
DROP CONSTRAINT IF EXISTS waiver_template_base_price_id_fkey;

ALTER TABLE public.waiver_template
ADD CONSTRAINT waiver_template_base_price_id_fkey
FOREIGN KEY (base_price_id)
REFERENCES public.base_price(base_price_id)
ON DELETE SET NULL;
