create table if not exists catalog_snapshots (
  id bigserial primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists booking_sessions (
  id uuid primary key,
  status text not null,
  property_slug text not null,
  variant_slug text not null,
  listing_id integer not null,
  check_in date not null,
  check_out date not null,
  guests integer not null,
  guest jsonb not null,
  quote jsonb not null,
  stripe_customer_id text,
  stripe_setup_intent_id text unique,
  stripe_payment_method_id text,
  hostaway_reservation_id bigint,
  consent_at timestamptz,
  terms_version text,
  error text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists booking_sessions_status_idx on booking_sessions(status);

create table if not exists webhook_events (
  id text primary key,
  source text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists outbox_events (
  id uuid primary key,
  topic text not null,
  payload jsonb not null,
  attempts integer not null default 0,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create table if not exists contact_inquiries (
  id uuid primary key,
  submission_key text unique,
  reference text unique,
  name text not null,
  email text not null,
  phone text,
  trip_type text,
  message text not null,
  delivery_status text not null default 'stored',
  acknowledgement_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists website_text_inquiries (
  id uuid primary key,
  idempotency_key uuid unique not null,
  request_fingerprint char(64) not null,
  client_ip_hash char(64) not null,
  guest_name varchar(255) not null,
  guest_phone varchar(30) not null,
  listing_slug varchar(100) not null,
  check_in date not null,
  check_out date not null,
  guests integer not null,
  message text not null default '',
  source_path text not null default '/',
  status varchar(20) not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  hostaway_reservation_id bigint,
  hostaway_conversation_id bigint,
  initial_sms_message_id bigint,
  initial_sms_status varchar(50),
  initial_sms_sent_at timestamptz,
  initial_sms_error text,
  sms_message_id bigint,
  sms_status varchar(50),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists website_text_inquiries_phone_created_idx on website_text_inquiries(guest_phone, created_at desc);
create index if not exists website_text_inquiries_ip_created_idx on website_text_inquiries(client_ip_hash, created_at desc);
create index if not exists website_text_inquiries_reservation_idx on website_text_inquiries(hostaway_reservation_id);

create table if not exists guest_chat_threads (
  id uuid primary key,
  guest_token_hash char(64) not null,
  guest_name varchar(255) not null,
  guest_email varchar(320) not null,
  guest_phone varchar(30) not null,
  status varchar(30) not null default 'waiting_on_team' check (status in ('waiting_on_team', 'waiting_on_guest', 'closed', 'spam')),
  intent varchar(30) not null default 'general' check (intent in ('availability', 'haven_question', 'special_request', 'general')),
  hostaway_reservation_id bigint,
  hostaway_conversation_id bigint,
  source_path text,
  source_type varchar(100),
  listing_slug varchar(100),
  haven_name varchar(255),
  check_in date,
  check_out date,
  guests integer,
  last_guest_read_at timestamptz,
  webchat_opened_at timestamptz,
  webchat_last_seen_at timestamptz,
  webchat_closed_at timestamptz,
  hostaway_link_status varchar(20) not null default 'pending' check (hostaway_link_status in ('pending', 'linking', 'linked', 'failed')),
  hostaway_link_attempted_at timestamptz,
  hostaway_link_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists guest_chat_messages (
  id uuid primary key,
  thread_id uuid not null references guest_chat_threads(id) on delete cascade,
  author_type varchar(20) not null check (author_type in ('guest', 'staff', 'system')),
  body text not null,
  hostaway_message_id bigint,
  hostaway_communication_type varchar(30),
  hostaway_sync_status varchar(30) not null default 'not_applicable' check (hostaway_sync_status in ('not_applicable', 'mirrored', 'failed')),
  hostaway_sync_error text,
  sms_fallback_message_id bigint,
  sms_fallback_status varchar(20),
  sms_fallback_attempt_count integer not null default 0,
  sms_fallback_attempted_at timestamptz,
  sms_fallback_sent_at timestamptz,
  sms_fallback_error text,
  created_at timestamptz not null default now()
);

create unique index if not exists guest_chat_messages_hostaway_idx on guest_chat_messages(thread_id, hostaway_message_id) where hostaway_message_id is not null;
create index if not exists guest_chat_threads_token_idx on guest_chat_threads(id, guest_token_hash);
create index if not exists guest_chat_threads_reservation_idx on guest_chat_threads(hostaway_reservation_id) where hostaway_reservation_id is not null;
create index if not exists guest_chat_threads_presence_idx on guest_chat_threads(webchat_last_seen_at) where status in ('waiting_on_team', 'waiting_on_guest');
create index if not exists guest_chat_messages_fallback_idx on guest_chat_messages(thread_id, sms_fallback_status, created_at) where author_type = 'staff';
