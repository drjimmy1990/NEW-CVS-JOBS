-- ============================================
-- GrowthNexus: Messaging Update Unread Triggers
-- Run this in Supabase SQL Editor
-- ============================================

-- Function to update unread counts in conversations
CREATE OR REPLACE FUNCTION public.update_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update unread_count_1 (where participant_1 is NOT the sender and message is not read)
    UPDATE public.conversations c
    SET unread_count_1 = (
        SELECT count(*)
        FROM public.messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id != c.participant_1
          AND m.is_read = false
    )
    WHERE c.id = COALESCE(NEW.conversation_id, OLD.conversation_id);

    -- Update unread_count_2 (where participant_2 is NOT the sender and message is not read)
    UPDATE public.conversations c
    SET unread_count_2 = (
        SELECT count(*)
        FROM public.messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id != c.participant_2
          AND m.is_read = false
    )
    WHERE c.id = COALESCE(NEW.conversation_id, OLD.conversation_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on insert, update, or delete of messages
DROP TRIGGER IF EXISTS update_unread_counts_trigger ON public.messages;
CREATE TRIGGER update_unread_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_unread_counts();
