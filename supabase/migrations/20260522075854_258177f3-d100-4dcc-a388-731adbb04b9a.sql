REVOKE SELECT (sponsor_paid_eur, sponsor_name) ON public.offers FROM authenticated, anon;
REVOKE SELECT (coupon_id) ON public.popup_notifications FROM authenticated, anon;