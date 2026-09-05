-- LIORIN Conquest: unowned campaign state (no user_id, no secrets)
create table if not exists conquest_state (
  id           int primary key default 1,
  rating       int not null default 1500,
  games        int not null default 0,
  wins         int not null default 0,
  draws        int not null default 0,
  losses       int not null default 0,
  launched_at  timestamptz,
  updated_at   timestamptz not null default now(),
  constraint conquest_state_one_row check (id = 1)
);

insert into conquest_state (id)
values (1)
on conflict (id) do nothing;

create table if not exists conquest_handles (
  platform_id  text primary key,
  handle       text not null,
  status       text not null default 'scouted',
  note         text,
  enlisted_at  timestamptz not null default now()
);

create table if not exists conquest_matches (
  id               serial primary key,
  platform_id      text not null,
  opponent         text not null,
  opponent_rating  int,
  result           text not null,
  rating_before    int not null,
  rating_after     int not null,
  reason           text,
  created_at       timestamptz not null default now()
);

create index if not exists conquest_matches_created_idx
  on conquest_matches (created_at desc);

create table if not exists conquest_logs (
  id          serial primary key,
  agent_id    text not null,
  level       text not null default 'info',
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists conquest_logs_created_idx
  on conquest_logs (created_at desc);

create table if not exists conquest_watch (
  id             serial primary key,
  source         text not null,
  event_id       text not null,
  title          text not null,
  url            text not null,
  bots_designed  boolean not null default true,
  note           text,
  created_at     timestamptz not null default now(),
  unique (source, event_id)
);
