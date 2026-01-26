-- Consultation Bookings Module
-- Purpose: Store consultation form submissions from free consultation booking page

-- 1. Drop existing table if it exists (to fix type mismatch)
DROP TABLE IF EXISTS public.consultation_bookings CASCADE;

-- 2. Create consultation_bookings table with UUID
CREATE TABLE public.consultation_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT '+91',
    age_group TEXT NOT NULL,
    course_selection TEXT NOT NULL,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    experience_level TEXT,
    goals TEXT,
    hear_about TEXT,
    consultation_type TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for common queries
CREATE INDEX idx_consultation_bookings_email ON public.consultation_bookings(email);
CREATE INDEX idx_consultation_bookings_created_at ON public.consultation_bookings(created_at DESC);
CREATE INDEX idx_consultation_bookings_course ON public.consultation_bookings(course_selection);

-- 4. Enable RLS
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy - Allow anonymous and authenticated users to insert
CREATE POLICY "allow_anonymous_insert_consultation_booking"
ON public.consultation_bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5b. RLS Policy - Allow anonymous and authenticated users to select (needed for .select() after insert)
CREATE POLICY "allow_anonymous_select_consultation_booking"
ON public.consultation_bookings
FOR SELECT
TO anon, authenticated
USING (true);

-- 6. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 7. Trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.consultation_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Mock data for testing
INSERT INTO public.consultation_bookings (
    student_name,
    email,
    phone,
    country_code,
    age_group,
    course_selection,
    timezone,
    experience_level,
    goals,
    hear_about,
    consultation_type
) VALUES
    (
        'Priya Sharma',
        'priya.sharma@example.com',
        '9876543210',
        '+91',
        '22-30',
        'hindustani-classical',
        'Asia/Kolkata',
        'beginner',
        'Learn classical music fundamentals and develop vocal skills',
        'social-media',
        'beginner'
    ),
    (
        'Rahul Verma',
        'rahul.verma@example.com',
        '9123456789',
        '+91',
        '13-21',
        'popular-film-music',
        'Asia/Kolkata',
        'intermediate',
        'Improve singing technique for Bollywood songs',
        'friend-referral',
        'beginner'
    )
ON CONFLICT (id) DO NOTHING;