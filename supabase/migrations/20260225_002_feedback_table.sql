/*
  # Feedback / feature request table + admin support

  Stores user-submitted feedback, bug reports, and feature requests.
  Adds is_admin flag to profiles for dashboard access.
*/

-- Add admin flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  message text NOT NULL,
  email text,
  page_url text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'in_progress', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Anyone can submit feedback
CREATE POLICY "Anyone can insert feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- Users can view their own feedback, admins can view all
CREATE POLICY "Users can view own feedback or admin views all"
  ON public.feedback FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- Admin can update feedback status
CREATE POLICY "Admin can update feedback"
  ON public.feedback FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Indexes
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
