-- LIORIN Chess Academy: unowned game archive + marketing recaps (no user_id)
create table if not exists academy_games (
  id              serial primary key,
  mode            text not null,
  lesson_id       text,
  engine_profile  text not null,
  liorin_color    text not null,
  opponent_label  text not null default 'Student',
  result          text not null,
  ply             int not null default 0,
  pgn             text not null,
  fen_start       text not null,
  fen_end         text not null,
  opening         text,
  recap           text,
  love_line       text,
  created_at      timestamptz not null default now()
);

create index if not exists academy_games_created_idx
  on academy_games (created_at desc);

create table if not exists academy_letters (
  id          serial primary key,
  kind        text not null default 'weekly',
  title       text not null,
  body        text not null,
  cta         text not null,
  source      text not null default 'local',
  created_at  timestamptz not null default now()
);

create index if not exists academy_letters_created_idx
  on academy_letters (created_at desc);
