-- Convert ONLY public.gallery_comment_replies_with_author_flag to SECURITY INVOKER.
-- Safe: underlying tables (gallery_comment_replies, gallery_comments, gallery_posts)
-- already have public SELECT RLS (USING true). Behavior for anon/authenticated
-- SELECT via PostgREST remains equivalent; the view no longer bypasses caller RLS.
-- Do NOT alter haraj_*, available_provider_units, or request_* views in this migration.

ALTER VIEW public.gallery_comment_replies_with_author_flag
  SET (security_invoker = true);

-- Expected: pg_class.reloptions contains security_invoker=true for this view only.
