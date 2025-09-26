-- ================================================================
-- TOURNAMENT REWARDS AUTOMATION FUNCTIONS
-- ================================================================
-- Additional functions to complete the tournament rewards system
-- Execute this after the main tournament_schema.sql
-- ================================================================

-- Function to automatically generate and award tournament completion rewards
CREATE OR REPLACE FUNCTION award_tournament_completion_rewards(tournament_uuid UUID)
RETURNS VOID AS $$
DECLARE
    tournament_rec RECORD;
    participant_rec RECORD;
    position_counter INTEGER := 1;
    winner_id UUID;
    runner_up_id UUID;
    third_place_id UUID;
    participation_points INTEGER := 25;
    winner_points INTEGER := 200;
    runner_up_points INTEGER := 100;
    third_place_points INTEGER := 50;
BEGIN
    -- Get tournament info
    SELECT * INTO tournament_rec FROM public.tournaments WHERE id = tournament_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;
    
    -- Only proceed if tournament is completed
    IF tournament_rec.status != 'completed' THEN
        RAISE EXCEPTION 'Tournament must be completed to award rewards';
    END IF;
    
    -- For knockout tournaments, determine winners from the final matches
    IF tournament_rec.format = 'knockout' THEN
        -- Get the winner from the final match
        SELECT winner_id INTO winner_id 
        FROM public.tournament_matches 
        WHERE tournament_id = tournament_uuid 
        AND round = tournament_rec.total_rounds 
        AND stage = 'final'
        AND status = 'completed'
        LIMIT 1;
        
        -- Get runner-up (loser of final)
        SELECT 
            CASE 
                WHEN participant1_id = winner_id THEN participant2_id 
                ELSE participant1_id 
            END INTO runner_up_id
        FROM public.tournament_matches 
        WHERE tournament_id = tournament_uuid 
        AND round = tournament_rec.total_rounds 
        AND stage = 'final'
        AND status = 'completed'
        LIMIT 1;
        
        -- Get third place (if there's a third place match or semi-final losers)
        SELECT winner_id INTO third_place_id
        FROM public.tournament_matches 
        WHERE tournament_id = tournament_uuid 
        AND round = tournament_rec.total_rounds - 1
        AND stage IN ('knockout', 'final')
        AND status = 'completed'
        AND winner_id NOT IN (winner_id, runner_up_id)
        LIMIT 1;
        
        -- Award winner
        IF winner_id IS NOT NULL THEN
            INSERT INTO public.tournament_rewards (
                tournament_id, participant_id, position, position_name, 
                reward_type, reward_value, reward_description, is_awarded, awarded_at
            ) VALUES (
                tournament_uuid, winner_id, 1, 'Winner',
                CASE 
                    WHEN tournament_rec.prize_type = 'loyalty_points' THEN 'loyalty_points'
                    ELSE tournament_rec.prize_type
                END,
                CASE 
                    WHEN tournament_rec.prize_type = 'loyalty_points' THEN tournament_rec.prize_value + winner_points
                    ELSE tournament_rec.prize_value
                END,
                CASE 
                    WHEN tournament_rec.prize_type = 'loyalty_points' THEN 'Tournament winner bonus + participation points'
                    ELSE tournament_rec.prize_description
                END,
                tournament_rec.prize_type = 'loyalty_points',
                CASE WHEN tournament_rec.prize_type = 'loyalty_points' THEN NOW() ELSE NULL END
            );
        END IF;
        
        -- Award runner-up
        IF runner_up_id IS NOT NULL THEN
            INSERT INTO public.tournament_rewards (
                tournament_id, participant_id, position, position_name, 
                reward_type, reward_value, reward_description, is_awarded, awarded_at
            ) VALUES (
                tournament_uuid, runner_up_id, 2, 'Runner-up',
                'loyalty_points', runner_up_points, 'Tournament runner-up points',
                true, NOW()
            );
        END IF;
        
        -- Award third place
        IF third_place_id IS NOT NULL THEN
            INSERT INTO public.tournament_rewards (
                tournament_id, participant_id, position, position_name, 
                reward_type, reward_value, reward_description, is_awarded, awarded_at
            ) VALUES (
                tournament_uuid, third_place_id, 3, 'Third Place',
                'loyalty_points', third_place_points, 'Tournament third place points',
                true, NOW()
            );
        END IF;
    
    -- For round robin tournaments, use standings
    ELSIF tournament_rec.format IN ('round_robin', 'group_knockout') THEN
        FOR participant_rec IN
            SELECT 
                ts.participant_id,
                tp.customer_id,
                c.full_name as customer_name
            FROM public.tournament_standings ts
            JOIN public.tournament_participants tp ON ts.participant_id = tp.id
            JOIN public.customers c ON tp.customer_id = c.id
            WHERE ts.tournament_id = tournament_uuid
            ORDER BY ts.points DESC, ts.goal_difference DESC, ts.goals_for DESC
            LIMIT 3
        LOOP
            -- Determine reward value based on position
            DECLARE
                reward_points INTEGER;
                position_name TEXT;
            BEGIN
                CASE position_counter
                    WHEN 1 THEN 
                        reward_points := winner_points;
                        position_name := 'Winner';
                    WHEN 2 THEN 
                        reward_points := runner_up_points;
                        position_name := 'Runner-up';
                    WHEN 3 THEN 
                        reward_points := third_place_points;
                        position_name := 'Third Place';
                    ELSE
                        reward_points := participation_points;
                        position_name := 'Participant';
                END CASE;
                
                INSERT INTO public.tournament_rewards (
                    tournament_id, participant_id, position, position_name, 
                    reward_type, reward_value, reward_description, is_awarded, awarded_at
                ) VALUES (
                    tournament_uuid, participant_rec.participant_id, position_counter, position_name,
                    'loyalty_points', reward_points, 
                    position_name || ' in ' || tournament_rec.title,
                    true, NOW()
                );
                
                position_counter := position_counter + 1;
            END;
        END LOOP;
    END IF;
    
    -- Award participation points to all other participants who don't have rewards yet
    FOR participant_rec IN
        SELECT tp.id as participant_id, tp.customer_id
        FROM public.tournament_participants tp
        WHERE tp.tournament_id = tournament_uuid
        AND tp.status = 'active'
        AND tp.id NOT IN (
            SELECT participant_id FROM public.tournament_rewards 
            WHERE tournament_id = tournament_uuid
        )
    LOOP
        INSERT INTO public.tournament_rewards (
            tournament_id, participant_id, position, position_name, 
            reward_type, reward_value, reward_description, is_awarded, awarded_at
        ) VALUES (
            tournament_uuid, participant_rec.participant_id, 99, 'Participant',
            'loyalty_points', participation_points, 
            'Tournament participation points',
            true, NOW()
        );
    END LOOP;
    
    -- Log completion
    RAISE NOTICE 'Tournament rewards generated and awarded for tournament %', tournament_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually award a specific reward
CREATE OR REPLACE FUNCTION award_specific_reward(reward_uuid UUID)
RETURNS VOID AS $$
DECLARE
    aux_rec RECORD;
    reward_rec RECORD;
    customer_id_to_update UUID;
BEGIN
    -- Get reward info using auxiliary record first
    SELECT tr.*, tp.customer_id INTO aux_rec
    FROM public.tournament_rewards tr
    JOIN public.tournament_participants tp ON tr.participant_id = tp.id
    WHERE tr.id = reward_uuid;
    
    -- Extract individual fields from auxiliary record
    reward_rec := aux_rec;
    customer_id_to_update := aux_rec.customer_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reward not found';
    END IF;
    
    -- Only award if not already awarded
    IF reward_rec.is_awarded THEN
        RAISE EXCEPTION 'Reward has already been awarded';
    END IF;
    
    -- Award the reward
    UPDATE public.tournament_rewards 
    SET is_awarded = true, awarded_at = NOW()
    WHERE id = reward_uuid;
    
    -- If it's loyalty points, the trigger will handle the rest
    -- For other reward types, manual intervention may be required
    
    RAISE NOTICE 'Reward % awarded to customer %', reward_uuid, customer_id_to_update;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if tournament can be completed (all matches finished)
CREATE OR REPLACE FUNCTION can_complete_tournament(tournament_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    pending_matches INTEGER;
BEGIN
    SELECT COUNT(*) INTO pending_matches
    FROM public.tournament_matches
    WHERE tournament_id = tournament_uuid
    AND status NOT IN ('completed', 'cancelled');
    
    RETURN pending_matches = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to complete tournament and award rewards
CREATE OR REPLACE FUNCTION complete_tournament(tournament_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if tournament can be completed
    IF NOT can_complete_tournament(tournament_uuid) THEN
        RAISE EXCEPTION 'Cannot complete tournament - there are unfinished matches';
    END IF;
    
    -- Update tournament status
    UPDATE public.tournaments 
    SET status = 'completed', end_date = NOW()
    WHERE id = tournament_uuid;
    
    -- Award completion rewards
    PERFORM award_tournament_completion_rewards(tournament_uuid);
    
    RAISE NOTICE 'Tournament % completed and rewards awarded', tournament_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (adjust as needed for your RLS setup)
GRANT EXECUTE ON FUNCTION award_tournament_completion_rewards(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_specific_reward(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_complete_tournament(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_tournament(UUID) TO authenticated;