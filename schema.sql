-- ============================================================
-- ExamSet Pro — Supabase PostgreSQL Database Schema
-- Paste this script into your Supabase SQL Editor to initialize tables
-- ============================================================

-- 1. EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    exam_date DATE NOT NULL,
    session_time TEXT NOT NULL,
    grace_period_minutes INT DEFAULT 15,
    sets_json JSONB DEFAULT '["Set A", "Set B", "Set C", "Set D"]'::jsonb,
    google_sheet_url TEXT DEFAULT '',
    google_sheet_webhook_url TEXT DEFAULT '',
    status TEXT DEFAULT 'ACTIVE',
    gate_closed BOOLEAN DEFAULT FALSE,
    gate_closed_at TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    faculty_id INT DEFAULT NULL,
    faculty_name TEXT DEFAULT NULL,
    room_pin TEXT NOT NULL,
    current_set_index INT DEFAULT 0,
    room_finalized BOOLEAN DEFAULT FALSE,
    finalized_at TEXT DEFAULT NULL,
    draft_counter INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    department TEXT DEFAULT '',
    batch_name TEXT DEFAULT '',
    assessment_time TEXT DEFAULT '',
    exam_date DATE DEFAULT NULL,
    status TEXT DEFAULT 'ABSENT',
    assigned_set TEXT DEFAULT NULL,
    checkin_time TEXT DEFAULT NULL,
    is_late BOOLEAN DEFAULT FALSE,
    late_minutes TEXT DEFAULT '0',
    draft_order INT DEFAULT 0,
    marked_by_user_id INT DEFAULT NULL,
    synced_to_sheet INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_exam_roll UNIQUE (exam_id, roll_number)
);

-- 4. ATTENDANCE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    room_number TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    student_name TEXT DEFAULT '',
    action TEXT NOT NULL,
    assigned_set TEXT DEFAULT NULL,
    timestamp TEXT NOT NULL,
    marked_by_user_id INT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Public Access (or replace with auth roles)
CREATE POLICY "Allow public select on exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on exams" ON public.exams FOR ALL USING (true);

CREATE POLICY "Allow public select on rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on rooms" ON public.rooms FOR ALL USING (true);

CREATE POLICY "Allow public select on students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on students" ON public.students FOR ALL USING (true);

CREATE POLICY "Allow public select on logs" ON public.attendance_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on logs" ON public.attendance_logs FOR ALL USING (true);

-- Enable Realtime WebSockets
ALTER PUBLICATION supabase_realtime ADD TABLE public.exams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
