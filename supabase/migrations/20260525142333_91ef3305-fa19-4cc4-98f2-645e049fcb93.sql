
-- Restrict sensitive columns from client-side reads via column-level privileges.
-- RLS row policies still apply; admins bypass via service role.

-- 1) offers: hide sponsor financials from regular users
REVOKE SELECT (sponsor_paid_eur, sponsor_name) ON public.offers FROM anon, authenticated;

-- 2) popup_notifications: hide coupon_id from regular users
REVOKE SELECT (coupon_id) ON public.popup_notifications FROM anon, authenticated;

-- 3) scanners: hide token from all client reads (owners fetch via get_scanner_token RPC)
REVOKE SELECT (token) ON public.scanners FROM anon, authenticated;

-- 4) scanner_orders: hide Stripe payment processor identifiers from clients
REVOKE SELECT (stripe_session_id, stripe_payment_intent_id) ON public.scanner_orders FROM anon, authenticated;
