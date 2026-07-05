-- Migration: database views
-- Dependency: all tables

CREATE OR REPLACE VIEW v_cases_with_professional AS
SELECT
  c.id,
  c.municipality_id,
  c.status,
  c.citizen_initials,
  c.citizen_age_range,
  c.complexity_level,
  c.weekly_hours,
  ca.professional_id,
  ca.id AS assignment_id,
  ca.started_at AS assignment_started_at,
  cg.granted_hours AS active_grant_hours,
  rh.approved_hours_used
FROM cases c
LEFT JOIN case_assignments ca ON c.id = ca.case_id AND ca.ended_at IS NULL
LEFT JOIN LATERAL (
  SELECT granted_hours
  FROM case_grants
  WHERE case_id = c.id AND status = 'ACTIVE'
  LIMIT 1
) cg ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(hours), 0) AS approved_hours_used
  FROM registered_hours
  WHERE case_id = c.id AND status = 'APPROVED'
) rh ON true;

CREATE OR REPLACE VIEW v_professionals_available AS
SELECT
  p.id,
  p.profession,
  p.experience_years,
  p.max_complexity_level,
  p.target_age_groups,
  p.qualifications,
  p.capacity_hours_week,
  p.max_concurrent_cases,
  p.availability_status,
  p.availability_days,
  COUNT(ca.id) AS current_assignments,
  COALESCE(SUM(c.weekly_hours), 0) AS current_hours_assigned
FROM professionals p
LEFT JOIN case_assignments ca ON p.id = ca.professional_id AND ca.ended_at IS NULL
LEFT JOIN cases c ON ca.case_id = c.id AND c.status = 'ACTIVE'
WHERE p.status = 'ACTIVE'
  AND p.availability_status != 'UNAVAILABLE'
GROUP BY p.id
HAVING
  COUNT(ca.id) < p.max_concurrent_cases
  AND COALESCE(SUM(c.weekly_hours), 0) < p.capacity_hours_week;

CREATE OR REPLACE VIEW v_grant_usage AS
SELECT
  cg.id,
  cg.case_id,
  cg.granted_hours,
  COALESCE(SUM(rh.hours), 0) AS approved_hours,
  (cg.granted_hours - COALESCE(SUM(rh.hours), 0)) AS remaining_hours,
  (cg.granted_hours - COALESCE(SUM(rh.hours), 0)) < 0 AS over_grant
FROM case_grants cg
LEFT JOIN registered_hours rh ON cg.id = rh.grant_period_id AND rh.status = 'APPROVED'
GROUP BY cg.id;
