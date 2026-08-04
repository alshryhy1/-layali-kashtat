-- P1 Security: revoke PostgREST anon access from customer request tables + request_* views.
-- Closes DEFINER-view data leak for anonymous clients. Does NOT revoke authenticated/service_role/postgres.
-- Does NOT add RLS policies, FORCE RLS, INVOKER conversion, or DROP duplicate views (P2+).

REVOKE ALL ON TABLE public.customer_requests FROM anon;
REVOKE ALL ON TABLE public.customer_request_options FROM anon;
REVOKE ALL ON TABLE public.request_decisions FROM anon;
REVOKE ALL ON TABLE public.request_decision_unavailable_options FROM anon;

REVOKE ALL ON TABLE public.request_options_view FROM anon;
REVOKE ALL ON TABLE public.request_options_grouped_view FROM anon;
REVOKE ALL ON TABLE public.request_details_view FROM anon;
REVOKE ALL ON TABLE public.request_full_view FROM anon;
REVOKE ALL ON TABLE public.request_conditional_decisions_view FROM anon;
REVOKE ALL ON TABLE public.request_decisions_full_view FROM anon;
