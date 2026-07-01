-- Add PROPOSAL_DECLINED notification type (missed in initial intake migration)
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'PROPOSAL_DECLINED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
