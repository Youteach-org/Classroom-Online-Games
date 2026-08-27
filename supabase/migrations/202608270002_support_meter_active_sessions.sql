-- Temporary teacher recovery API. Replace assignment-id access with teacher auth.
create or replace function public.list_support_meter_active_assignments()
returns table(assignment_id uuid,set_number integer,created_at timestamptz,student_count bigint)
language sql security definer set search_path = pg_catalog, public stable as $$
select a.id,a.set_number,a.created_at,count(s.id) from public.support_meter_assignments a left join public.support_meter_sessions s on s.assignment_id=a.id where a.status='open' group by a.id,a.set_number,a.created_at order by a.created_at desc $$;
create or replace function public.get_support_meter_monitor_by_assignment(p_assignment_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, public stable as $$
select coalesce(jsonb_agg(to_jsonb(s) order by s.started_at),'[]'::jsonb) from public.support_meter_sessions s join public.support_meter_assignments a on a.id=s.assignment_id where a.id=p_assignment_id and a.status='open' $$;
create or replace function public.get_support_meter_results_by_assignment(p_assignment_id uuid)
returns table(student_name text,set_number integer,story_id integer,story_title text,selected_feeling text,selected_expression text,feeling_correct boolean,expression_correct boolean,resolved boolean,attempt integer,score integer,support_meter integer,created_at timestamptz)
language sql security definer set search_path = pg_catalog, public stable as $$
select s.student_name,s.set_number,r.story_id,r.story_title,r.selected_feeling,r.selected_expression,r.feeling_correct,r.expression_correct,r.resolved,r.attempt,r.score,r.support_meter,r.created_at from public.support_meter_assignments a join public.support_meter_sessions s on s.assignment_id=a.id join public.support_meter_responses r on r.session_id=s.id where a.id=p_assignment_id and a.status='open' order by s.student_name,r.created_at $$;
create or replace function public.delete_support_meter_assignment_by_id(p_assignment_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$ begin delete from public.support_meter_assignments where id=p_assignment_id and status='open'; return found; end $$;
revoke all on function public.list_support_meter_active_assignments() from public;
revoke all on function public.get_support_meter_monitor_by_assignment(uuid) from public;
revoke all on function public.get_support_meter_results_by_assignment(uuid) from public;
revoke all on function public.delete_support_meter_assignment_by_id(uuid) from public;
grant execute on function public.list_support_meter_active_assignments(),public.get_support_meter_monitor_by_assignment(uuid),public.get_support_meter_results_by_assignment(uuid),public.delete_support_meter_assignment_by_id(uuid) to anon;
