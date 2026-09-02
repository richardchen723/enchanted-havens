import { randomUUID } from "node:crypto"
import { z } from "zod"
import { db, ensureSchema, isDatabaseConfigured } from "@/lib/db"
import type { Quote } from "@/lib/schemas"

export const couponCodeSchema = z.string()
  .trim()
  .min(3, "Coupon codes must be at least 3 characters.")
  .max(24, "Coupon codes can be at most 24 characters.")
  .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, hyphens, or underscores.")
  .transform((value) => value.toUpperCase())

export type CouponDiscountType = "percentage" | "fixed"

export type PropertyCoupon = {
  id: string
  propertySlug: string
  propertySlugs: string[]
  code: string
  internalName: string | null
  discountType: CouponDiscountType
  discountValue: number
  currency: string
  startsAt: string
  expiresAt: string | null
  minimumNights: number | null
  minimumSubtotal: number | null
  maxRedemptions: number | null
  maxRedemptionsPerGuest: number | null
  isActive: boolean
  redemptionCount: number
  createdAt: string
}

type PropertyCouponRow = {
  id: string
  property_slug: string
  property_slugs: string[] | null
  code: string
  internal_name: string | null
  discount_type: CouponDiscountType
  discount_value: number | string
  currency: string
  starts_at: Date | string
  expires_at: Date | string | null
  minimum_nights: number | null
  minimum_subtotal: number | string | null
  max_redemptions: number | null
  max_redemptions_per_guest: number | null
  is_active: boolean
  redemption_count: number | string
  created_at: Date | string
}

export type AppliedCoupon = {
  id: string
  code: string
  discountAmount: number
  label: string
}

export type CouponApplication = {
  quote: Quote
  coupon: AppliedCoupon
}

export type CouponPagePlacement = {
  pagePath: string
  couponId: string
  couponCode: string
}

export type PublicCouponPromotion = {
  code: string
  offerLabel: string
  termsLabel: string
  propertySlugs: string[]
  ctaHref: string
  ctaLabel: string
}

export class CouponValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CouponValidationError"
  }
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function iso(value: Date | string | null) {
  return value ? new Date(value).toISOString() : null
}

function couponDto(row: PropertyCouponRow): PropertyCoupon {
  return {
    id: row.id,
    propertySlug: row.property_slug,
    propertySlugs: row.property_slugs?.length ? row.property_slugs : [row.property_slug],
    code: row.code,
    internalName: row.internal_name,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    currency: row.currency,
    startsAt: iso(row.starts_at) || new Date(0).toISOString(),
    expiresAt: iso(row.expires_at),
    minimumNights: row.minimum_nights,
    minimumSubtotal: row.minimum_subtotal === null ? null : Number(row.minimum_subtotal),
    maxRedemptions: row.max_redemptions,
    maxRedemptionsPerGuest: row.max_redemptions_per_guest,
    isActive: row.is_active,
    redemptionCount: Number(row.redemption_count),
    createdAt: iso(row.created_at) || new Date(0).toISOString(),
  }
}

export function getCouponOfferLabel(coupon: Pick<PropertyCoupon, "discountType" | "discountValue">) {
  return coupon.discountType === "percentage"
    ? `${coupon.discountValue}% off accommodation`
    : `$${coupon.discountValue.toFixed(2)} off accommodation`
}

export function getCouponTermsLabel(coupon: Pick<PropertyCoupon, "minimumNights" | "minimumSubtotal" | "expiresAt">) {
  const terms: string[] = []
  if (coupon.minimumNights) terms.push(`${coupon.minimumNights}+ nights`)
  if (coupon.minimumSubtotal) terms.push(`$${coupon.minimumSubtotal.toFixed(0)}+ accommodation`)
  if (coupon.expiresAt) {
    terms.push(`Book by ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(coupon.expiresAt))}`)
  }
  return terms.length ? terms.join(" · ") : "Available for a limited time"
}

export function getCouponEligibleSubtotal(quote: Quote) {
  const accommodation = quote.components
    .filter((component) => component.isIncludedInTotalPrice !== 0)
    .filter((component) => {
      const type = component.type.toLowerCase()
      const name = component.name.toLowerCase()
      return type === "accommodation" || type === "price" || name === "baserate"
    })
    .reduce((total, component) => total + Math.max(component.total, 0), 0)

  return money(accommodation > 0 ? accommodation : quote.total)
}

export function applyCouponRuleToQuote(
  coupon: PropertyCoupon,
  quote: Quote,
  options: { now?: Date; guestRedemptionCount?: number } = {},
): CouponApplication {
  const now = options.now || new Date()
  if (!coupon.isActive) throw new CouponValidationError("This coupon is no longer active.")
  if (new Date(coupon.startsAt).getTime() > now.getTime()) throw new CouponValidationError("This coupon is not active yet.")
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now.getTime()) throw new CouponValidationError("This coupon has expired.")
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) throw new CouponValidationError("This coupon has reached its usage limit.")
  if (coupon.minimumNights !== null && quote.nights < coupon.minimumNights) {
    throw new CouponValidationError(`This coupon requires a stay of at least ${coupon.minimumNights} nights.`)
  }

  const eligibleSubtotal = getCouponEligibleSubtotal(quote)
  if (coupon.minimumSubtotal !== null && eligibleSubtotal < coupon.minimumSubtotal) {
    throw new CouponValidationError(`This coupon requires at least $${coupon.minimumSubtotal.toFixed(2)} in accommodation charges.`)
  }
  if (coupon.discountType === "fixed" && coupon.currency !== quote.currency) {
    throw new CouponValidationError("This coupon cannot be used with the quote currency.")
  }
  if (
    coupon.maxRedemptionsPerGuest !== null &&
    options.guestRedemptionCount !== undefined &&
    options.guestRedemptionCount >= coupon.maxRedemptionsPerGuest
  ) {
    throw new CouponValidationError("This coupon has already been used the maximum number of times for this email address.")
  }

  const rawDiscount = coupon.discountType === "percentage"
    ? eligibleSubtotal * coupon.discountValue / 100
    : coupon.discountValue
  const discountAmount = money(Math.min(Math.max(rawDiscount, 0), eligibleSubtotal, quote.total))
  if (discountAmount <= 0) throw new CouponValidationError("This coupon does not apply to the selected stay.")

  const label = coupon.discountType === "percentage"
    ? `${coupon.discountValue}% off accommodation`
    : `$${coupon.discountValue.toFixed(2)} off accommodation`

  return {
    coupon: { id: coupon.id, code: coupon.code, discountAmount, label },
    quote: {
      ...quote,
      total: money(quote.total - discountAmount),
      components: [
        ...quote.components,
        {
          type: "discount",
          name: "enchantedHavensCoupon",
          title: `Coupon ${coupon.code}`,
          value: -discountAmount,
          total: -discountAmount,
          quantity: 1,
          isIncludedInTotalPrice: 1,
          isMandatory: 1,
        },
      ],
    },
  }
}

async function guestRedemptionCount(couponId: string, guestEmail?: string, excludeBookingSessionId?: string) {
  if (!guestEmail) return undefined
  const rows = await db()<Array<{ count: number | string }>>`
    select count(*)::int as count
    from property_coupon_redemptions r
    join booking_sessions b on b.id = r.booking_session_id
    where r.coupon_id = ${couponId}
      and lower(r.guest_email) = ${guestEmail.trim().toLowerCase()}
      and (r.confirmed_at is not null or b.expires_at > now())
      and (${excludeBookingSessionId || null}::uuid is null or r.booking_session_id <> ${excludeBookingSessionId || null}::uuid)
  `
  return Number(rows[0]?.count || 0)
}

async function getCouponForApplication(propertySlug: string, code: string, excludeBookingSessionId?: string) {
  const rows = await db()<PropertyCouponRow[]>`
    select c.*,
      array(select scope.property_slug from property_coupon_properties scope where scope.coupon_id = c.id order by scope.property_slug) as property_slugs,
      (
      select count(*)::int from property_coupon_redemptions r
      join booking_sessions b on b.id = r.booking_session_id
      where r.coupon_id = c.id and (r.confirmed_at is not null or b.expires_at > now())
        and (${excludeBookingSessionId || null}::uuid is null or r.booking_session_id <> ${excludeBookingSessionId || null}::uuid)
    ) as redemption_count
    from property_coupons c
    join property_coupon_properties scope on scope.coupon_id = c.id
    where scope.property_slug = ${propertySlug} and upper(scope.coupon_code) = ${code}
    limit 1
  `
  return rows[0] ? couponDto(rows[0]) : null
}

export async function applyPropertyCoupon(input: {
  propertySlug: string
  code: string
  quote: Quote
  guestEmail?: string
  bookingSessionId?: string
}) {
  if (!isDatabaseConfigured()) throw new CouponValidationError("Coupon validation is temporarily unavailable.")
  await ensureSchema()
  const parsedCode = couponCodeSchema.safeParse(input.code)
  if (!parsedCode.success) throw new CouponValidationError("Enter a valid coupon code.")
  const code = parsedCode.data
  const coupon = await getCouponForApplication(input.propertySlug, code, input.bookingSessionId)
  if (!coupon) throw new CouponValidationError("That coupon code is not valid for this property.")
  const usedByGuest = await guestRedemptionCount(coupon.id, input.guestEmail, input.bookingSessionId)
  return applyCouponRuleToQuote(coupon, input.quote, { guestRedemptionCount: usedByGuest })
}

export async function claimCouponRedemption(input: {
  couponId: string
  propertySlug: string
  bookingSessionId: string
  guestEmail: string
  baseQuote: Quote
}) {
  await ensureSchema()
  return db().begin(async (transaction) => {
    const existing = await transaction<Array<{ discount_amount: number | string }>>`
      select discount_amount from property_coupon_redemptions where booking_session_id = ${input.bookingSessionId} limit 1
    `
    if (existing[0]) return Number(existing[0].discount_amount)

    const lockedRows = await transaction<PropertyCouponRow[]>`
      select c.*,
        array(select scope.property_slug from property_coupon_properties scope where scope.coupon_id = c.id order by scope.property_slug) as property_slugs,
        (
        select count(*)::int from property_coupon_redemptions r
        join booking_sessions b on b.id = r.booking_session_id
        where r.coupon_id = c.id and (r.confirmed_at is not null or b.expires_at > now())
      ) as redemption_count
      from property_coupons c
      where c.id = ${input.couponId}
        and exists (
          select 1 from property_coupon_properties scope
          where scope.coupon_id = c.id and scope.property_slug = ${input.propertySlug}
        )
      for update
    `
    if (!lockedRows[0]) throw new CouponValidationError("That coupon is no longer available for this property.")

    const coupon = couponDto(lockedRows[0])
    const guestRows = await transaction<Array<{ count: number | string }>>`
      select count(*)::int as count
      from property_coupon_redemptions r
      join booking_sessions b on b.id = r.booking_session_id
      where r.coupon_id = ${coupon.id}
        and lower(r.guest_email) = ${input.guestEmail.trim().toLowerCase()}
        and (r.confirmed_at is not null or b.expires_at > now())
    `
    const usedByGuest = Number(guestRows[0]?.count || 0)
    const application = applyCouponRuleToQuote(coupon, input.baseQuote, { guestRedemptionCount: usedByGuest })
    await transaction`
      insert into property_coupon_redemptions (
        id, coupon_id, booking_session_id, guest_email, discount_amount
      ) values (
        ${randomUUID()}, ${coupon.id}, ${input.bookingSessionId}, ${input.guestEmail.trim().toLowerCase()}, ${application.coupon.discountAmount}
      )
    `
    return application.coupon.discountAmount
  })
}

export async function listPropertyCoupons(propertySlug: string) {
  await ensureSchema()
  const rows = await db()<PropertyCouponRow[]>`
    select c.*,
      array(select scope.property_slug from property_coupon_properties scope where scope.coupon_id = c.id order by scope.property_slug) as property_slugs,
      (
      select count(*)::int from property_coupon_redemptions r where r.coupon_id = c.id and r.confirmed_at is not null
    ) as redemption_count
    from property_coupons c
    where exists (
      select 1 from property_coupon_properties scope
      where scope.coupon_id = c.id and scope.property_slug = ${propertySlug}
    )
    order by c.created_at desc
  `
  return rows.map(couponDto)
}

export async function getCouponCountsByProperty() {
  await ensureSchema()
  const rows = await db()<Array<{ property_slug: string; total: number | string; active: number | string }>>`
    select scope.property_slug, count(*)::int as total,
      count(*) filter (where c.is_active and c.starts_at <= now() and (c.expires_at is null or c.expires_at >= now()))::int as active
    from property_coupon_properties scope
    join property_coupons c on c.id = scope.coupon_id
    group by scope.property_slug
  `
  return new Map(rows.map((row) => [row.property_slug, { total: Number(row.total), active: Number(row.active) }]))
}

export async function getCouponOverview() {
  await ensureSchema()
  const [counts, recent] = await Promise.all([
    db()<Array<{ active: number | string; redemptions: number | string }>>`
      select
        (select count(*)::int from property_coupons where is_active and starts_at <= now() and (expires_at is null or expires_at >= now())) as active,
        (select count(*)::int from property_coupon_redemptions where confirmed_at is not null) as redemptions
    `,
    db()<PropertyCouponRow[]>`
      select c.*,
        array(select scope.property_slug from property_coupon_properties scope where scope.coupon_id = c.id order by scope.property_slug) as property_slugs,
        (
        select count(*)::int from property_coupon_redemptions r where r.coupon_id = c.id and r.confirmed_at is not null
      ) as redemption_count
      from property_coupons c
      order by c.created_at desc
      limit 5
    `,
  ])
  return {
    active: Number(counts[0]?.active || 0),
    redemptions: Number(counts[0]?.redemptions || 0),
    recent: recent.map(couponDto),
  }
}

export async function createPropertyCoupon(input: {
  propertySlugs: string[]
  code: string
  internalName?: string
  discountType: CouponDiscountType
  discountValue: number
  startsAt: Date
  expiresAt?: Date | null
  minimumNights?: number | null
  minimumSubtotal?: number | null
  maxRedemptions?: number | null
  maxRedemptionsPerGuest?: number | null
  createdBy: string
}) {
  await ensureSchema()
  const code = couponCodeSchema.parse(input.code)
  const propertySlugs = [...new Set(input.propertySlugs)]
  if (!propertySlugs.length) throw new CouponValidationError("Choose at least one property.")
  return db().begin(async (transaction) => {
    const couponId = randomUUID()
    const rows = await transaction<PropertyCouponRow[]>`
      insert into property_coupons (
        id, property_slug, code, internal_name, discount_type, discount_value, currency,
        starts_at, expires_at, minimum_nights, minimum_subtotal, max_redemptions,
        max_redemptions_per_guest, created_by
      ) values (
        ${couponId}, ${propertySlugs[0]}, ${code}, ${input.internalName?.trim() || null},
        ${input.discountType}, ${input.discountValue}, 'USD', ${input.startsAt}, ${input.expiresAt || null},
        ${input.minimumNights ?? null}, ${input.minimumSubtotal ?? null}, ${input.maxRedemptions ?? null},
        ${input.maxRedemptionsPerGuest ?? null}, ${input.createdBy}
      )
      returning *, null::text[] as property_slugs, 0::int as redemption_count
    `
    for (const propertySlug of propertySlugs) {
      await transaction`
        insert into property_coupon_properties (coupon_id, property_slug, coupon_code)
        values (${couponId}, ${propertySlug}, ${code})
      `
    }
    return couponDto({ ...rows[0], property_slugs: propertySlugs })
  })
}

export async function setPropertyCouponActive(input: { id: string; propertySlug: string; isActive: boolean }) {
  await ensureSchema()
  const rows = await db()<Array<{ id: string }>>`
    update property_coupons
    set is_active = ${input.isActive}, updated_at = now()
    where id = ${input.id}
      and exists (
        select 1 from property_coupon_properties scope
        where scope.coupon_id = property_coupons.id and scope.property_slug = ${input.propertySlug}
      )
    returning id
  `
  return Boolean(rows[0])
}

export async function getCouponAdvertisingSettings(couponId: string) {
  await ensureSchema()
  const [couponRows, placementRows] = await Promise.all([
    db()<PropertyCouponRow[]>`
      select c.*,
        array(select scope.property_slug from property_coupon_properties scope where scope.coupon_id = c.id order by scope.property_slug) as property_slugs,
        (select count(*)::int from property_coupon_redemptions r where r.coupon_id = c.id and r.confirmed_at is not null) as redemption_count
      from property_coupons c
      where c.id = ${couponId}
      limit 1
    `,
    db()<Array<{ page_path: string; coupon_id: string; coupon_code: string }>>`
      select promotion.page_path, promotion.coupon_id, coupon.code as coupon_code
      from coupon_page_promotions promotion
      join property_coupons coupon on coupon.id = promotion.coupon_id
      order by promotion.page_path
    `,
  ])
  const coupon = couponRows[0] ? couponDto(couponRows[0]) : null
  return {
    coupon,
    pagePaths: placementRows.filter((row) => row.coupon_id === couponId).map((row) => row.page_path),
    placements: placementRows.map<CouponPagePlacement>((row) => ({
      pagePath: row.page_path,
      couponId: row.coupon_id,
      couponCode: row.coupon_code,
    })),
  }
}

export async function saveCouponPagePromotions(input: { couponId: string; pagePaths: string[] }) {
  await ensureSchema()
  const pagePaths = [...new Set(input.pagePaths)]
  return db().begin(async (transaction) => {
    const couponRows = await transaction<Array<{ id: string }>>`
      select id from property_coupons where id = ${input.couponId} for update
    `
    if (!couponRows[0]) return false

    await transaction`delete from coupon_page_promotions where coupon_id = ${input.couponId}`
    for (const pagePath of pagePaths) {
      await transaction`
        insert into coupon_page_promotions (page_path, coupon_id)
        values (${pagePath}, ${input.couponId})
        on conflict (page_path) do update
        set coupon_id = excluded.coupon_id, updated_at = now()
      `
    }
    return true
  })
}

export async function getAdvertisedCouponForPage(pagePath: string): Promise<PublicCouponPromotion | null> {
  if (!isDatabaseConfigured()) return null
  await ensureSchema()
  const rows = await db()<PropertyCouponRow[]>`
    select c.*,
      array(select scope.property_slug from property_coupon_properties scope where scope.coupon_id = c.id order by scope.property_slug) as property_slugs,
      (
        select count(*)::int
        from property_coupon_redemptions redemption
        join booking_sessions booking on booking.id = redemption.booking_session_id
        where redemption.coupon_id = c.id
          and (redemption.confirmed_at is not null or booking.expires_at > now())
      ) as redemption_count
    from coupon_page_promotions promotion
    join property_coupons c on c.id = promotion.coupon_id
    where promotion.page_path = ${pagePath}
      and c.is_active
      and c.starts_at <= now()
      and (c.expires_at is null or c.expires_at >= now())
      and (
        c.max_redemptions is null or c.max_redemptions > (
          select count(*)
          from property_coupon_redemptions redemption
          join booking_sessions booking on booking.id = redemption.booking_session_id
          where redemption.coupon_id = c.id
            and (redemption.confirmed_at is not null or booking.expires_at > now())
        )
      )
    limit 1
  `
  if (!rows[0]) return null

  const coupon = couponDto(rows[0])
  const promotionQuery = new URLSearchParams({ coupon: coupon.code })
  if (coupon.propertySlugs.length > 1) {
    promotionQuery.set("matches", coupon.propertySlugs.join(","))
    promotionQuery.set("intent", "private-offer")
  }
  const ctaHref = coupon.propertySlugs.length === 1
    ? `/havens/${coupon.propertySlugs[0]}?${promotionQuery.toString()}`
    : `/havens?${promotionQuery.toString()}#collection`
  return {
    code: coupon.code,
    offerLabel: getCouponOfferLabel(coupon),
    termsLabel: getCouponTermsLabel(coupon),
    propertySlugs: coupon.propertySlugs,
    ctaHref,
    ctaLabel: coupon.propertySlugs.length === 1 ? "Explore this haven" : "View eligible havens",
  }
}
