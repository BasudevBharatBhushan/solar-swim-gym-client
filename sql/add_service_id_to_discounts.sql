-- Migration: Add service_id to discount_codes
-- Description: Allows discount codes to be restricted to a specific service.
-- Date: 2026-02-09

ALTER TABLE IF EXISTS public.discount_codes 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.service(service_id) ON DELETE SET NULL;

COMMENT ON COLUMN public.discount_codes.service_id IS 'Restricts discount to a specific service. If NULL, applicable to all services.';
