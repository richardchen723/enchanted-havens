import type { Sql } from "postgres"

export const affiliateSchemaStatements = [
  `create table if not exists affiliates (
    id uuid primary key,
    name varchar(160) not null,
    email varchar(320) not null,
    social_handle varchar(160) not null default '',
    code varchar(50) not null unique check (code = lower(code)),
    status text not null check (status in ('active', 'inactive')),
    discount_type text not null check (discount_type in ('percentage', 'fixed')),
    discount_value numeric(12,2) not null check (discount_value >= 0),
    commission_type text not null check (commission_type in ('percentage', 'fixed')),
    commission_value numeric(12,2) not null check (commission_value >= 0),
    starts_on date,
    ends_on date,
    notes text not null default '',
    visits integer not null default 0,
    created_by uuid not null references admin_users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (discount_type <> 'percentage' or discount_value <= 100),
    check (commission_type <> 'percentage' or commission_value <= 100),
    check (ends_on is null or starts_on is null or ends_on >= starts_on)
  )`,
  `alter table booking_sessions add column if not exists affiliate_snapshot jsonb`,
  `create table if not exists affiliate_commissions (
    id uuid primary key,
    affiliate_id uuid not null references affiliates(id),
    booking_session_id uuid not null unique references booking_sessions(id),
    snapshot jsonb not null,
    amount numeric(12,2) not null check (amount >= 0),
    currency char(3) not null default 'USD' check (currency = 'USD'),
    status text not null default 'owed' check (status in ('owed', 'paid', 'cancelled')),
    payout_notes text not null default '',
    paid_at timestamptz,
    updated_by uuid references admin_users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create index if not exists affiliate_commissions_affiliate_idx on affiliate_commissions(affiliate_id, created_at desc)`,
  `create table if not exists affiliate_audit_log (
    id uuid primary key,
    affiliate_id uuid not null references affiliates(id),
    commission_id uuid references affiliate_commissions(id),
    actor_id uuid not null references admin_users(id),
    action text not null,
    changes jsonb not null,
    created_at timestamptz not null default now()
  )`,
]

export async function ensureAffiliateTables(sql: Sql) {
  for (const statement of affiliateSchemaStatements) await sql.unsafe(statement)
}
