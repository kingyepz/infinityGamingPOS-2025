-- This function is designed to be run to grant birthday rewards.
-- It is safe to run multiple times, as it will only award a customer once per year.
-- It correctly awards 100 loyalty points and a "Free Game Session" offer valued at KES 40.

CREATE OR REPLACE FUNCTION grant_birthday_rewards()
RETURNS void AS $$
DECLARE
    birthday_customer RECORD;
    last_reward_date date;
BEGIN
    -- Loop through all customers whose birthday is today
    FOR birthday_customer IN
        SELECT id, dob FROM public.customers
        WHERE dob IS NOT NULL AND to_char(dob, 'MM-DD') = to_char(NOW(), 'MM-DD')
    LOOP
        -- Check if a birthday reward was already given in the last 360 days to prevent abuse
        SELECT MAX(created_at::date) INTO last_reward_date
        FROM public.customer_offers
        WHERE customer_id = birthday_customer.id AND type = 'birthday_reward';

        -- If no reward was ever given, or the last one was more than ~1 year ago, grant a new one.
        IF last_reward_date IS NULL OR last_reward_date < (NOW() - INTERVAL '360 days') THEN
            -- 1. Grant 100 loyalty points as a bonus
            INSERT INTO public.loyalty_transactions (customer_id, transaction_type, points, description)
            VALUES (birthday_customer.id, 'bonus', 100, 'Birthday bonus reward');

            -- 2. Grant 1 Free Game Session offer, expiring in 7 days
            INSERT INTO public.customer_offers (customer_id, type, value, description, expires_at)
            VALUES (birthday_customer.id, 'birthday_reward', 40, 'Free Game Session (KES 40 Value)', NOW() + INTERVAL '7 days');
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.grant_birthday_rewards() IS 'Scans for customers with birthdays and grants them 100 points and a KES 40 offer if not rewarded in the last year.';
