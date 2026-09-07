create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.support_meter_assignments (
  id uuid primary key default gen_random_uuid(),
  join_token_hash text not null unique,
  manage_token_hash text not null unique,
  class_code text not null default 'SUPPORT',
  set_number integer not null check (set_number between 1 and 3),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(),
  downloaded_at timestamptz
);
alter table public.support_meter_assignments enable row level security;

alter table public.support_meter_sessions
  add column if not exists assignment_id uuid,
  add column if not exists mode text not null default 'free',
  add column if not exists set_number integer,
  add column if not exists story_order integer[],
  add column if not exists completed_at timestamptz,
  add column if not exists run_token_hash text,
  add column if not exists story_title text,
  add column if not exists story_summary text,
  add column if not exists latest_result text not null default 'waiting',
  add column if not exists story_progress integer not null default 1;

alter table public.support_meter_sessions drop constraint if exists support_meter_sessions_mode_check;
alter table public.support_meter_sessions add constraint support_meter_sessions_mode_check check (mode in ('free','assigned'));
alter table public.support_meter_sessions drop constraint if exists support_meter_sessions_set_number_check;
alter table public.support_meter_sessions add constraint support_meter_sessions_set_number_check check (set_number is null or set_number between 1 and 3);
alter table public.support_meter_sessions drop constraint if exists support_meter_sessions_assignment_id_fkey;
alter table public.support_meter_sessions add constraint support_meter_sessions_assignment_id_fkey foreign key (assignment_id) references public.support_meter_assignments(id) on delete cascade;

alter table public.support_meter_responses
  add column if not exists score integer not null default 0,
  add column if not exists support_meter integer not null default 0;
alter table public.support_meter_responses drop constraint if exists support_meter_responses_session_id_fkey;
alter table public.support_meter_responses add constraint support_meter_responses_session_id_fkey foreign key (session_id) references public.support_meter_sessions(id) on delete cascade;

revoke all on public.support_meter_assignments, public.support_meter_sessions, public.support_meter_responses from anon, authenticated;
drop policy if exists "support responses anon insert" on public.support_meter_responses;
drop policy if exists "support responses anon select" on public.support_meter_responses;
drop policy if exists "support sessions anon insert" on public.support_meter_sessions;
drop policy if exists "support sessions anon select" on public.support_meter_sessions;
drop policy if exists "support sessions anon update" on public.support_meter_sessions;

create or replace function public.create_support_meter_assignment(p_set_number integer)
returns table(assignment_id uuid, join_token text, manage_token text, set_number integer)
language plpgsql security definer set search_path = pg_catalog, public, extensions as $$
declare v_join text := encode(gen_random_bytes(24),'hex'); v_manage text := encode(gen_random_bytes(32),'hex'); v_id uuid;
begin
  if p_set_number not between 1 and 3 then raise exception 'invalid set number'; end if;
  insert into public.support_meter_assignments(join_token_hash,manage_token_hash,set_number)
  values(encode(digest(v_join,'sha256'),'hex'),encode(digest(v_manage,'sha256'),'hex'),p_set_number) returning id into v_id;
  return query select v_id,v_join,v_manage,p_set_number;
end $$;

create or replace function public.resolve_support_meter_assignment(p_join_token text)
returns table(assignment_id uuid, set_number integer)
language sql security definer set search_path = pg_catalog, public, extensions stable as $$
  select id,set_number from public.support_meter_assignments
  where status='open' and join_token_hash=encode(digest(p_join_token,'sha256'),'hex') limit 1
$$;

create or replace function public.create_support_meter_run(p_student_name text,p_class_code text,p_set_number integer,p_story_order integer[],p_join_token text default null)
returns table(session_id uuid,run_token text,resolved_set_number integer,assigned boolean)
language plpgsql security definer set search_path = pg_catalog, public, extensions as $$
declare v_run text:=encode(gen_random_bytes(24),'hex'); v_assignment uuid; v_set integer; v_id uuid; v_assigned boolean:=false;
begin
  if length(trim(p_student_name)) not between 1 and 60 then raise exception 'invalid student name'; end if;
  if length(trim(p_class_code)) not between 1 and 40 then raise exception 'invalid class code'; end if;
  if p_join_token is not null then
    select id,set_number into v_assignment,v_set from public.support_meter_assignments where status='open' and join_token_hash=encode(digest(p_join_token,'sha256'),'hex');
    if v_assignment is null then raise exception 'assignment link is invalid or closed'; end if;
    v_assigned:=true;
  else
    v_set:=p_set_number;
  end if;
  if v_set not between 1 and 3 or cardinality(p_story_order)<>8 then raise exception 'invalid run'; end if;
  insert into public.support_meter_sessions(assignment_id,mode,set_number,story_order,student_name,class_code,current_story,current_frame,phase,last_action,support_meter,score,streak,status,attempt_in_progress,run_token_hash,story_progress)
  values(v_assignment,case when v_assigned then 'assigned' else 'free' end,v_set,p_story_order,trim(p_student_name),upper(trim(p_class_code)),v_set*10+p_story_order[1],3,'story','Started Support Meter',0,0,0,'online',1,encode(digest(v_run,'sha256'),'hex'),1)
  returning id into v_id;
  return query select v_id,v_run,v_set,v_assigned;
end $$;

create or replace function public.update_support_meter_run(p_session_id uuid,p_run_token text,p_patch jsonb)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, extensions as $$
begin
  update public.support_meter_sessions set
    current_story=coalesce((p_patch->>'current_story')::integer,current_story), phase=coalesce(p_patch->>'phase',phase),
    last_action=coalesce(p_patch->>'last_action',last_action), live_expression=case when p_patch ? 'live_expression' then p_patch->>'live_expression' else live_expression end,
    live_feeling=case when p_patch ? 'live_feeling' then p_patch->>'live_feeling' else live_feeling end,
    attempt_in_progress=coalesce((p_patch->>'attempt')::integer,attempt_in_progress), support_meter=coalesce((p_patch->>'support_meter')::integer,support_meter),
    score=coalesce((p_patch->>'score')::integer,score), streak=coalesce((p_patch->>'streak')::integer,streak), status=coalesce(p_patch->>'status',status),
    story_title=coalesce(p_patch->>'story_title',story_title), story_summary=coalesce(p_patch->>'story_summary',story_summary),
    latest_result=coalesce(p_patch->>'latest_result',latest_result), story_progress=coalesce((p_patch->>'story_progress')::integer,story_progress),
    completed_at=case when p_patch ? 'completed_at' then (p_patch->>'completed_at')::timestamptz else completed_at end,
    last_seen=now(),updated_at=now()
  where id=p_session_id and run_token_hash=encode(digest(p_run_token,'sha256'),'hex');
  return found;
end $$;

create or replace function public.log_support_meter_response(p_session_id uuid,p_run_token text,p_story_id integer,p_story_title text,p_attempt integer,p_selected_expression text,p_selected_feeling text,p_expression_correct boolean,p_feeling_correct boolean,p_resolved boolean,p_correct_expression text,p_correct_feeling text,p_score integer,p_support_meter integer)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, extensions as $$
begin
  if not exists(select 1 from public.support_meter_sessions where id=p_session_id and run_token_hash=encode(digest(p_run_token,'sha256'),'hex')) then return false; end if;
  insert into public.support_meter_responses(session_id,class_code,story_id,story_title,attempt,selected_expression,selected_feeling,expression_correct,feeling_correct,resolved,correct_expression,correct_feeling,score,support_meter)
  select p_session_id,class_code,p_story_id,left(p_story_title,160),p_attempt,left(p_selected_expression,160),left(p_selected_feeling,80),p_expression_correct,p_feeling_correct,p_resolved,left(p_correct_expression,160),left(p_correct_feeling,80),p_score,p_support_meter from public.support_meter_sessions where id=p_session_id;
  return true;
end $$;

create or replace function public.delete_support_meter_run(p_session_id uuid,p_run_token text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, extensions as $$
begin delete from public.support_meter_sessions where id=p_session_id and run_token_hash=encode(digest(p_run_token,'sha256'),'hex'); return found; end $$;

create or replace function public.get_support_meter_monitor(p_manage_token text)
returns jsonb language sql security definer set search_path = pg_catalog, public, extensions stable as $$
  select coalesce(jsonb_agg(to_jsonb(s) order by s.started_at),'[]'::jsonb)
  from public.support_meter_sessions s join public.support_meter_assignments a on a.id=s.assignment_id
  where a.manage_token_hash=encode(digest(p_manage_token,'sha256'),'hex') and a.status='open'
$$;

create or replace function public.get_support_meter_results(p_manage_token text)
returns table(student_name text,set_number integer,story_id integer,story_title text,selected_feeling text,selected_expression text,feeling_correct boolean,expression_correct boolean,resolved boolean,attempt integer,score integer,support_meter integer,created_at timestamptz)
language sql security definer set search_path = pg_catalog, public, extensions stable as $$
  select s.student_name,s.set_number,r.story_id,r.story_title,r.selected_feeling,r.selected_expression,r.feeling_correct,r.expression_correct,r.resolved,r.attempt,r.score,r.support_meter,r.created_at
  from public.support_meter_assignments a join public.support_meter_sessions s on s.assignment_id=a.id join public.support_meter_responses r on r.session_id=s.id
  where a.manage_token_hash=encode(digest(p_manage_token,'sha256'),'hex') order by s.student_name,r.created_at
$$;

create or replace function public.delete_support_meter_assignment(p_manage_token text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, extensions as $$
begin delete from public.support_meter_assignments where manage_token_hash=encode(digest(p_manage_token,'sha256'),'hex'); return found; end $$;

create or replace function public.cleanup_support_meter_free_runs()
returns integer language plpgsql security definer set search_path = pg_catalog, public as $$
declare n integer; begin
  delete from public.support_meter_sessions where mode='free' and ((completed_at is not null and completed_at<=now()-interval '5 minutes') or (completed_at is null and last_seen<=now()-interval '24 hours'));
  get diagnostics n=row_count; return n;
end $$;

do $$ begin
  perform cron.unschedule(jobid) from cron.job where jobname='cleanup-support-meter-free-runs';
exception when undefined_table then null; end $$;
select cron.schedule('cleanup-support-meter-free-runs','* * * * *','select public.cleanup_support_meter_free_runs()');

revoke all on function public.create_support_meter_assignment(integer) from public;
revoke all on function public.resolve_support_meter_assignment(text) from public;
revoke all on function public.create_support_meter_run(text,text,integer,integer[],text) from public;
revoke all on function public.update_support_meter_run(uuid,text,jsonb) from public;
revoke all on function public.log_support_meter_response(uuid,text,integer,text,integer,text,text,boolean,boolean,boolean,text,text,integer,integer) from public;
revoke all on function public.delete_support_meter_run(uuid,text) from public;
revoke all on function public.get_support_meter_monitor(text) from public;
revoke all on function public.get_support_meter_results(text) from public;
revoke all on function public.delete_support_meter_assignment(text) from public;
grant execute on function public.create_support_meter_assignment(integer),public.resolve_support_meter_assignment(text),public.create_support_meter_run(text,text,integer,integer[],text),public.update_support_meter_run(uuid,text,jsonb),public.log_support_meter_response(uuid,text,integer,text,integer,text,text,boolean,boolean,boolean,text,text,integer,integer),public.delete_support_meter_run(uuid,text),public.get_support_meter_monitor(text),public.get_support_meter_results(text),public.delete_support_meter_assignment(text) to anon;
