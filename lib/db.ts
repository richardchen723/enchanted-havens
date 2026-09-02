import postgres from "postgres"

let client: ReturnType<typeof postgres> | null = null
let schemaReady: Promise<void> | null = null

export function isDatabaseConfigured() {
  return Boolean(process.env.POSTGRES_URL)
}

export function db() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not configured")
  }
  if (!client) {
    client = postgres(process.env.POSTGRES_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
    })
  }
  return client
}

export async function ensureSchema() {
  if (!isDatabaseConfigured()) return
  if (schemaReady) return schemaReady
  schemaReady = (async () => {
    const sql = db()
    await sql`
      create table if not exists catalog_snapshots (
        id bigserial primary key,
        payload jsonb not null,
        created_at timestamptz not null default now()
      )
    `
    await sql`
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
      )
    `
    await sql`create index if not exists booking_sessions_status_idx on booking_sessions(status)`
    await sql`
      create table if not exists webhook_events (
        id text primary key,
        source text not null,
        event_type text not null,
        payload jsonb not null,
        processed_at timestamptz,
        created_at timestamptz not null default now()
      )
    `
    await sql`
      create table if not exists outbox_events (
        id uuid primary key,
        topic text not null,
        payload jsonb not null,
        attempts integer not null default 0,
        processed_at timestamptz,
        last_error text,
        created_at timestamptz not null default now()
      )
    `
    await sql`
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
      )
    `
    await sql`alter table contact_inquiries add column if not exists reference text`
    await sql`alter table contact_inquiries add column if not exists submission_key text`
    await sql`alter table contact_inquiries add column if not exists delivery_status text not null default 'stored'`
    await sql`alter table contact_inquiries add column if not exists acknowledgement_sent_at timestamptz`
    await sql`alter table contact_inquiries add column if not exists updated_at timestamptz not null default now()`
    await sql`create unique index if not exists contact_inquiries_reference_idx on contact_inquiries(reference) where reference is not null`
    await sql`create unique index if not exists contact_inquiries_submission_key_idx on contact_inquiries(submission_key) where submission_key is not null`
    await sql`
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
      )
    `
    await sql`create index if not exists website_text_inquiries_phone_created_idx on website_text_inquiries(guest_phone, created_at desc)`
    await sql`create index if not exists website_text_inquiries_ip_created_idx on website_text_inquiries(client_ip_hash, created_at desc)`
    await sql`create index if not exists website_text_inquiries_reservation_idx on website_text_inquiries(hostaway_reservation_id)`
    await sql`
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
      )
    `
    await sql`alter table guest_chat_threads add column if not exists initial_sms_message_id bigint`
    await sql`alter table guest_chat_threads add column if not exists initial_sms_status varchar(50)`
    await sql`alter table guest_chat_threads add column if not exists initial_sms_sent_at timestamptz`
    await sql`alter table guest_chat_threads add column if not exists initial_sms_error text`
    await sql`
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
      )
    `
    await sql`create unique index if not exists guest_chat_messages_hostaway_idx on guest_chat_messages(thread_id, hostaway_message_id) where hostaway_message_id is not null`
    await sql`create index if not exists guest_chat_threads_token_idx on guest_chat_threads(id, guest_token_hash)`
    await sql`create index if not exists guest_chat_threads_reservation_idx on guest_chat_threads(hostaway_reservation_id) where hostaway_reservation_id is not null`
    await sql`create index if not exists guest_chat_threads_presence_idx on guest_chat_threads(webchat_last_seen_at) where status in ('waiting_on_team', 'waiting_on_guest')`
    await sql`create index if not exists guest_chat_messages_fallback_idx on guest_chat_messages(thread_id, sms_fallback_status, created_at) where author_type = 'staff'`
    await sql`
      create table if not exists admin_users (
        id uuid primary key,
        email varchar(320) not null,
        full_name varchar(160) not null,
        role varchar(20) not null check (role in ('owner', 'admin')),
        status varchar(20) not null default 'invited' check (status in ('invited', 'active', 'removed')),
        invited_by uuid references admin_users(id) on delete set null,
        invited_at timestamptz,
        accepted_at timestamptz,
        last_signed_in_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `
    await sql`create unique index if not exists admin_users_email_idx on admin_users(lower(email))`
    await sql`
      create table if not exists admin_access_tokens (
        id uuid primary key,
        user_id uuid not null references admin_users(id) on delete cascade,
        purpose varchar(20) not null check (purpose in ('sign_in', 'invite')),
        token_hash char(64) not null unique,
        expires_at timestamptz not null,
        used_at timestamptz,
        created_at timestamptz not null default now()
      )
    `
    await sql`create index if not exists admin_access_tokens_user_created_idx on admin_access_tokens(user_id, created_at desc)`
    await sql`
      create table if not exists admin_sessions (
        token_hash char(64) primary key,
        user_id uuid not null references admin_users(id) on delete cascade,
        expires_at timestamptz not null,
        created_at timestamptz not null default now(),
        last_seen_at timestamptz not null default now()
      )
    `
    await sql`create index if not exists admin_sessions_user_idx on admin_sessions(user_id)`
    await sql`
      create table if not exists property_coupons (
        id uuid primary key,
        property_slug varchar(120) not null,
        code varchar(24) not null,
        internal_name varchar(160),
        discount_type varchar(20) not null check (discount_type in ('percentage', 'fixed')),
        discount_value numeric(12, 2) not null check (discount_value > 0),
        currency char(3) not null default 'USD',
        starts_at timestamptz not null default now(),
        expires_at timestamptz,
        minimum_nights integer check (minimum_nights is null or minimum_nights > 0),
        minimum_subtotal numeric(12, 2) check (minimum_subtotal is null or minimum_subtotal > 0),
        max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
        max_redemptions_per_guest integer check (max_redemptions_per_guest is null or max_redemptions_per_guest > 0),
        is_active boolean not null default true,
        created_by uuid not null references admin_users(id),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        check (discount_type <> 'percentage' or discount_value <= 100),
        check (expires_at is null or expires_at >= starts_at)
      )
    `
    await sql`create unique index if not exists property_coupons_property_code_idx on property_coupons(property_slug, upper(code))`
    await sql`create index if not exists property_coupons_property_status_idx on property_coupons(property_slug, is_active, expires_at)`
    await sql`
      create table if not exists property_coupon_properties (
        coupon_id uuid not null references property_coupons(id) on delete cascade,
        property_slug varchar(120) not null,
        coupon_code varchar(24) not null,
        created_at timestamptz not null default now(),
        primary key (coupon_id, property_slug)
      )
    `
    await sql`
      insert into property_coupon_properties (coupon_id, property_slug, coupon_code)
      select id, property_slug, code from property_coupons
      on conflict (coupon_id, property_slug) do nothing
    `
    await sql`create unique index if not exists property_coupon_properties_slug_code_idx on property_coupon_properties(property_slug, upper(coupon_code))`
    await sql`create index if not exists property_coupon_properties_coupon_idx on property_coupon_properties(coupon_id)`
    await sql`
      create table if not exists coupon_page_promotions (
        page_path varchar(300) primary key,
        coupon_id uuid not null references property_coupons(id) on delete cascade,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `
    await sql`create index if not exists coupon_page_promotions_coupon_idx on coupon_page_promotions(coupon_id)`
    await sql`alter table booking_sessions add column if not exists base_quote jsonb`
    await sql`alter table booking_sessions add column if not exists coupon_id uuid references property_coupons(id) on delete set null`
    await sql`alter table booking_sessions add column if not exists coupon_code varchar(24)`
    await sql`alter table booking_sessions add column if not exists coupon_discount_amount numeric(12, 2)`
    await sql`
      create table if not exists property_coupon_redemptions (
        id uuid primary key,
        coupon_id uuid not null references property_coupons(id),
        booking_session_id uuid not null unique references booking_sessions(id),
        guest_email varchar(320) not null,
        discount_amount numeric(12, 2) not null check (discount_amount > 0),
        redeemed_at timestamptz not null default now(),
        confirmed_at timestamptz
      )
    `
    await sql`alter table property_coupon_redemptions add column if not exists confirmed_at timestamptz`
    await sql`create index if not exists property_coupon_redemptions_coupon_idx on property_coupon_redemptions(coupon_id, redeemed_at desc)`
    await sql`create index if not exists property_coupon_redemptions_guest_idx on property_coupon_redemptions(coupon_id, lower(guest_email))`
  })()
  return schemaReady
}

export async function saveCatalogSnapshot(payload: unknown) {
  if (!isDatabaseConfigured()) return
  await ensureSchema()
  await db()`insert into catalog_snapshots (payload) values (${db().json(payload as never)})`
}

export async function getLatestCatalogSnapshot<T>(): Promise<T | null> {
  if (!isDatabaseConfigured()) return null
  await ensureSchema()
  const rows = await db()<[{ payload: T }]>`
    select payload from catalog_snapshots order by created_at desc limit 1
  `
  return rows[0]?.payload ?? null
}
