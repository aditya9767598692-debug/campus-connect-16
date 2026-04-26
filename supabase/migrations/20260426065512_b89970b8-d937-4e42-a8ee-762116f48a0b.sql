
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  venue TEXT NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  assigned_teacher TEXT NOT NULL,
  cr_email TEXT NOT NULL,
  extra_emails TEXT[] NOT NULL DEFAULT '{}',
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create events"
  ON public.events FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_events_created_at ON public.events (created_at DESC);
