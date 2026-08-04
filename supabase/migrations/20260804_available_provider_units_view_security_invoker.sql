-- Convert ONLY public.available_provider_units to SECURITY INVOKER.
-- Underlying provider_service_units public SELECT RLS requires:
--   is_active AND parent provider_services.is_active AND moderation_status = 'approved'.
-- That is narrower than the previous DEFINER view filter
--   (is_active AND booking_locked = false), so invoker is MORE restrictive/secure.
-- Do NOT alter request_* views in this migration.

ALTER VIEW public.available_provider_units
  SET (security_invoker = true);

-- Expected: reloptions includes security_invoker=true for this view;
-- gallery + haraj already invoker; all request_* remain reloptions null.
