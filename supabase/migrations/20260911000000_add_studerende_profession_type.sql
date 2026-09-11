-- Add 'Studerende' to profession_types lookup table
INSERT INTO public.profession_types (name, sort_order)
VALUES ('Studerende', 140)
ON CONFLICT DO NOTHING;
