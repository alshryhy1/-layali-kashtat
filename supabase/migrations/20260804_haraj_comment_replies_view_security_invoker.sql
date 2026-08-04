-- Convert ONLY public.haraj_comment_replies_with_author_flag to SECURITY INVOKER.
-- Safe: underlying tables (haraj_comment_replies, haraj_comments, haraj_items)
-- already have public SELECT RLS (USING true). Behavior for anon/authenticated
-- SELECT via PostgREST remains equivalent; the view no longer bypasses caller RLS.
-- Do NOT alter available_provider_units or request_* views in this migration.

ALTER VIEW public.haraj_comment_replies_with_author_flag
  SET (security_invoker = true);

-- Expected: pg_class.reloptions contains security_invoker=true for this view only
-- (gallery may already be invoker from a prior migration).
