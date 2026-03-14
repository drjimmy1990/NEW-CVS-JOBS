-- ============================================
-- GrowthNexus: Messaging System Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    unread_count_1 INTEGER DEFAULT 0,  -- unread count for participant_1
    unread_count_2 INTEGER DEFAULT 0,  -- unread count for participant_2
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(participant_1, participant_2)
);

-- 2. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);

-- 4. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() IN (participant_1, participant_2));

CREATE POLICY "Users can insert conversations they participate in"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() IN (participant_1, participant_2));

CREATE POLICY "Users can update their own conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() IN (participant_1, participant_2));

-- 6. RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE auth.uid() IN (participant_1, participant_2)
        )
    );

CREATE POLICY "Users can send messages in their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND conversation_id IN (
            SELECT id FROM public.conversations
            WHERE auth.uid() IN (participant_1, participant_2)
        )
    );

CREATE POLICY "Users can mark messages as read"
    ON public.messages FOR UPDATE
    USING (
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE auth.uid() IN (participant_1, participant_2)
        )
    );

-- 7. CV Unlocks table (for paywall)
CREATE TABLE IF NOT EXISTS public.cv_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES public.profiles(id),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id),
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employer_id, candidate_id)
);

ALTER TABLE public.cv_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view their unlocks"
    ON public.cv_unlocks FOR SELECT
    USING (auth.uid() = employer_id);

CREATE POLICY "Employers can insert unlocks"
    ON public.cv_unlocks FOR INSERT
    WITH CHECK (auth.uid() = employer_id);
