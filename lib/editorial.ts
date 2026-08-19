import { BRAND_BOOKING_ENGINE_URL } from "@/lib/brand"
import { propertySchema, reviewSchema, type Property, type Review } from "@/lib/schemas"
import { getHighResolutionImageSet, getHighResolutionImageUrl } from "@/lib/images"

export const LOGO_URL = "/images/enchanted-havens-logo-small.webp"

export const BRAND_HERO_URL = "/images/home-hero/pnw-sea-renity-ocean-bluff.webp"
const COVE_CLUB_HERO_IMAGE = "/images/cove-club/cove-club-exterior-15.png"

export const FULL_ESTATE_COVER_IMAGE = getHighResolutionImageUrl(
  "https://bookingenginecdn.hostaway.com/listing/57690-558677-DhrTKC7z0PQmbFqnSaumXDswkVWooo-1GsK1CAC8tG4-6a3e39579eb04",
)

export const FULL_ESTATE_HERO_IMAGE = getHighResolutionImageUrl(
  "https://bookingenginecdn.hostaway.com/listing/57690-558677-qi-uUdPJyqzEVkkXWdrTJ--c7P025-GExJArU7ykMzYw-6a3e395b8b12b",
)

type HomeHeroSlide = {
  name: string
  image: string
  position: string
}

export const homeHeroSlides: HomeHeroSlide[] = [
  {
    name: "Hero candidate 2",
    image: "/images/home-hero/heros-zip/hero-02.webp",
    position: "50% 50%",
  },
  {
    name: "Hero candidate 5",
    image: "/images/home-hero/heros-zip/hero-05.webp",
    position: "50% 50%",
  },
  {
    name: "Hero candidate 9",
    image: "/images/home-hero/heros-zip/hero-09.webp",
    position: "50% 50%",
  },
  {
    name: "Hero candidate 13",
    image: "/images/home-hero/heros-zip/hero-13.webp",
    position: "50% 50%",
  },
  {
    name: "Hero candidate 14",
    image: "/images/home-hero/heros-zip/hero-14.webp",
    position: "50% 50%",
  },
]

const images = {
  blue: getHighResolutionImageSet([
    "/images/home-hero/heros-zip/hero-04.webp",
    "https://bookingenginecdn.hostaway.com/listing/57690-146889-L9G0jlQrgyy7aCNcFNpmcnY1CdteWJZht7384DWX--TE-69a861268007f?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-146889-sJXetxBexwuritFjNaGtftSDlC0Ylr9wuXB12PA-7--U-69a861251666c?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-146889-uFJf--05mtx7w2C4hvgAcjEAc-eyP--5T9atMqX72jVRM-69a869218b772?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-146889-P13wSs--5h9G-QejAv2Ae4hUFIKa6w8tOvi--16SlZqss-69a86920188b0?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-146889-XQ6L9vYSDtfKyCnfS43J715b7SIK--PppFVqw88iQw-Y-69a86122ee664?width=1920&quality=82&format=webp&v=2",
  ]),
  sea: getHighResolutionImageSet([
    "/images/home-hero/heros-zip/hero-08.webp",
    "/images/sea-renity/sea-renity-firepit-exterior.webp",
    "/images/sea-renity/sea-renity-living-view.webp",
    "/images/sea-renity/sea-renity-deck-fire.webp",
    "/images/sea-renity/sea-renity-sunset-deck.webp",
    "/images/sea-renity/sea-renity-primary-bedroom.webp",
    "/images/sea-renity/sea-renity-water-view.webp",
    "/images/sea-renity/sea-renity-yoga-deck.webp",
  ]),
  emerald: getHighResolutionImageSet([
    "https://bookingenginecdn.hostaway.com/listing/57690-178403-diAc8D--hTY1rYLwMFRNvZgn6PBfl4v3TJJJ7k3UtqoU-6804873044a62?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-178403-gYzD5WqLs0-OvGowfk62wvkgJHs4k72GMw9NSU6SMeQ-68047faf829b4?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-178403-uZhLZy-u3CEyimwRy3UFF0uhTh2SEujAcSUzh81cmfk-68047fae19106?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-178403-Pvpjnc-VqhcQYlxBPhYt6va2epguOPOA1TSvKljWmYg-68047facd4b15?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-178403--pBWUw2rp1--GycbsMkh--45qkiFeIKLch3j63OK7ZMno-68047fab785a4?width=1920&quality=82&format=webp&v=2",
  ]),
  fair: getHighResolutionImageSet([
    "https://bookingenginecdn.hostaway.com/listing/57690-178994-zsgq5sFoetJ5AFw0wgS00kJmxf-7ztCrhGK4AzZFCCI-670790f155d6e?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-178994-JjXNQIHE55zCGTT-ZNCGnC5dik9459JW9YfXXlVD3Uk-67079fc39beb9?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-178994-jdh7udySWfCca6tL2RIOv9k3DJTVFXXcovl0jABLVPs-670790eec5c9e?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-178994-ag1m1eAeX0KII7c-E3mzHXEvI--boQ0FP3FLxFcaMInU-67079fc1bf681?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-178994-7QpUa2TxITHQPb2BadhLXr--Iveu5XFiTmSs76aQSBWg-67079fc02cf1c?width=1920&quality=82&format=webp&v=2",
  ]),
  aurora: getHighResolutionImageSet([
    "/images/aurora-haven/aurora-night-exterior.jpg",
    "https://bookingenginecdn.hostaway.com/listing/57690-184081-ttlvjZXdv9dEF--vVAr0YuQLPY4yUOUOquUbqpjz07--M-66388fe4ab131?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-184081-Q4rIInOSdy--cWwOolyrnXc7tLbr7xe388VGWPs7u3sI-663921a36bbeb?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-184081-5JEV1ni02aokOZcZojNvOPthb0QvidGtqecuJe--cWmo-6639439fa09e0?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-184081-DMZHXv9ldyqvf-pzsIFVtiqrr7novv1Ovn9kgyH5ZWw-663921a20a925?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-184081-22VQw0ri--lpkMiMpxC0NNo8Yt1dIOHWPDxHCSeyZSOk-663921a11afa9?width=1920&quality=82&format=webp&v=2",
  ]),
  reflection: getHighResolutionImageSet([
    "https://bookingenginecdn.hostaway.com/listing/57690-335403-EOWdiLpik1jupaA--x3b4fYIXT9qG6pebU-dAPMbQhVM-6757238d5aac4?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-335403-7JbHivt-xdhoryhcrvsuau-cVXOR--u820btMu9a--ZvI-6757038056ab4?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-335403-Bsbr9A8vYQxPAqCjV4CYorYLK--9F00Luh6OialyT5xs-6757037b28e0f?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-335403-kjmeDpEcGDW1LN0-lOYhdl-y65tUpYNVKheDHsG9wmg-67570375bbc94?width=1920&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-335403-wTrBAkSNzl6mnTZBo3kAjMEiapeo-D0fKSJ5kaQjEcM-67570370abcce?width=1920&quality=82&format=webp&v=2",
  ]),
  reflectionPoint: getHighResolutionImageSet([
    "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/57690-576478-ccvpFy4EgK5MdhJq-rjcGBrawmFStiCDtuWOXCObJ5A-6a7937c8e988d",
    "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/57690-576478-JHPabdPQ5vOYyRBBgclhYNrwE6VrvBxf5IhPl--R--cLo-6a7937c84c118",
    "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/57690-576478-Zj5dAPZenZDuf7KmT6HB12KsLFAFXETjZmF-F8cwjyU-6a7937c788afb",
    "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/57690-576478-OVYf9ugimw8nexWXTzwl1OMKzcoX9YLC9VJXFzr--XvE-6a7937c6e5a6c",
    "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/57690-576478-6XhgAiMTpLPVy7saOSeGyav--msA9QbCzR37AusjuyRo-6a7937c61c526",
  ]),
  lighthouse: getHighResolutionImageSet([
    "https://bookingenginecdn.hostaway.com/listing/57690-558675-aXkSzxNwNG4EVJaMrk--YBI4azQHwnkhcUyptclGqDGo-6a2a40e6b30d2?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558675-O-V9--uDfVpg3ZiYXt4OlUOvErIcNa6e5PdEurNPMHi8-6a2a40f1a4c82?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558675-cegIjLR8W1QPw3czvE-qwNAjCvi-iedWoEzDjo--8WP0-6a2a486863c46?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558675-pP-2ytNTZDC9yjSoeByv0U4auLm10-dWqJQ68IpSqVI-6a2a40e7c2a66?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558675-eHDd-fkV-vfPtkaLwNl6PwOr92Dy6-rXEdMgePdYyPI-6a2a486aa6c42?width=2400&quality=82&format=webp&v=2",
  ]),
  lodge: getHighResolutionImageSet([
    "https://bookingenginecdn.hostaway.com/listing/57690-558676-blZpHqLPWHDrr----9R7rhVaSSNgyWsROxz5IVwTHpFY-6a2a4866c84b9?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558676-QPeZmr21XMRTi4fsFbWmBu9MJ3V1FwTWTYHaNjDcaWY-6a2a4865d4e59?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558676-mmXMFvaj7yGBTzwlmzI6qXjVkmPkfdB3fKwVfBt79iE-6a2a4865061f1?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558676-Hh1-JuzGB2ZCGPV0wBoskqSWbMDqFryzXD8EAlr1Pow-6a2a4863e9241?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558676-fwkJhHUK6cPLEzq6fXVfuz0rEvRI1gRpOf--ja2ZIgtE-6a2a4f351be8b?width=2400&quality=82&format=webp&v=2",
  ]),
  estate: getHighResolutionImageSet([
    "https://bookingenginecdn.hostaway.com/listing/57690-558677-lq2Z5BwVDHuGlCn93k9a1d-6scR7CVBQQBL--zt8R8Pc-6a2a485cad3cb?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558677-Dkb1BY6xPFScg5B89nychpWehppeKPPYjSCFIeEjUu0-6a2a4f3353da3?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558677-ThLwQ0owwNL7RhyF7ZzEoEpgjBkQibGrGP8Egvi--v5o-6a2a4859522d3?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558677-yaNb8fKD5hsHxFxG0afuIEoGbIsJYD6lFhmd5UjWasM-6a2a4f325f6ff?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558677---c4CG6RnC9C0BA6oU6zT6z2j3E6SxEyn7Xz5ntkKWpM-6a2a4855b2f49?width=2400&quality=82&format=webp&v=2",
  ]),
  mainHouse: getHighResolutionImageSet([
    "https://bookingenginecdn.hostaway.com/listing/57690-558678-16h7xQ--2--ptEkuQxm40tgWt5akuXzBOSX16RTddvmt8-6a378515002b7?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558678-3GG8UQ4--CFmBtJmvRPeRIqbCr0spQXU7wdsle--bcrqo-6a3785145409a?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558678-isat9lzf72iA2ODBYxyn43ofCkP8NYWbE9iLPsrA16c-6a378513a514a?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558678-T7Y58nKO5dknxMjBlSMBYzqIIlsq--uSwLfq9Tl6mv0A-6a378512e3858?width=2400&quality=82&format=webp&v=2",
    "https://bookingenginecdn.hostaway.com/listing/57690-558678-S3w6E6O3WVEoHm0Rh4U6X309CXyI0OfWiNBqpVje3B4-6a2a4f1ced802?width=2400&quality=82&format=webp&v=2",
  ]),
  guestHouse: getHighResolutionImageSet([
    "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/57690-571917-5Wi6nd6fLyMEkcuguzQl3ZVUNHTkEThp4H3njoJHN8o-6a5d9670537c6",
    "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/57690-571917-Yqw8TtDIF34-v1RlLmRyagWOzsYNU-XpUaelw9p7HtQ-6a5d887e7046b",
    "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/57690-571917-POK-dKkrf25-TKZiwaxtmxh2x7fWYWcOfbCDX-GpuCo-6a5d8fbd74771",
    "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/57690-571917-HqjSqf9XEjfwfH5Umu2dWjRmCukN5--kJ4PcMJPJjj3c-6a5d81b274fa5",
    "https://hostaway-platform.s3.us-west-2.amazonaws.com/listing/57690-571917-1H-x9V--OwpWGeYSPyzaBHB--bIL-oYZZJWB5K-7ohrQU-6a5d887d38a1e",
  ]),
}

const fullEstateImages = [FULL_ESTATE_COVER_IMAGE, FULL_ESTATE_HERO_IMAGE, ...images.estate]

function variant(
  id: number,
  slug: string,
  name: string,
  shortName: string,
  description: string,
  location: string,
  city: string,
  guests: number,
  bedrooms: number,
  bathrooms: number,
  variantImages: string[],
  amenities: string[],
  rating: number | null,
  reviewsCount: number,
) {
  return {
    id,
    slug,
    name,
    shortName,
    description,
    location,
    city,
    region: "Washington",
    guests,
    bedrooms,
    bathrooms,
    images: variantImages,
    amenities,
    rating,
    reviewsCount,
    startingPrice: null,
    currency: "USD",
    bookingEngineUrl: new URL(`/listings/${id}`, BRAND_BOOKING_ENGINE_URL).toString(),
  }
}

export const fallbackProperties: Property[] = propertySchema.array().parse([
  {
    slug: "blue-haven",
    displayName: "Blue Haven",
    eyebrow: "Lake Sutherland",
    location: "Port Angeles, Washington",
    narrative: "An iconic lakefront cabin shaped around long decks, clear water, and the quiet drama of the Olympic Peninsula.",
    longNarrative: "Blue Haven is a four-season invitation to live at the water's edge. Mornings begin with mountain light moving across Lake Sutherland; afternoons stretch into swimming, paddling, and unhurried meals on the deck. Reimagined with warmth and restraint, the cabin keeps the landscape at the center of every room.",
    heroImage: images.blue[0],
    gallery: images.blue,
    experienceTags: ["Lakefront", "Private beach", "Kayaks", "Mountain views", "Pet-friendly"],
    featuredOrder: 1,
    featured: true,
    seoTitle: "Blue Haven | Luxury Lake Sutherland Cabin",
    seoDescription: "A design-forward Lake Sutherland retreat with private waterfront, kayaks, mountain views, and room for six.",
    variants: [variant(146889, "blue-haven", '"Blue Haven" Iconic Lakefront 4 Season Retreat', "Blue Haven", "A photogenic lakefront cabin with private beach access and panoramic Olympic Peninsula views.", "Lake Sutherland", "Port Angeles", 6, 3, 1, images.blue, ["Lake view", "Mountain view", "Private beach access", "Kayaks", "Kitchen", "Wifi", "Pet-friendly"], 4.95, 193)],
  },
  {
    slug: "sea-renity-haven",
    displayName: "Sea-Renity Haven",
    eyebrow: "Whidbey Island",
    location: "Oak Harbor",
    narrative: "A generous oceanfront retreat where horizon views, salt air, and shared meals set the pace.",
    longNarrative: "Sea-Renity Haven was made for gathering by the ocean. Broad windows and outdoor spaces frame the changing Pacific, while relaxed interiors give families and friends room to settle in. It is an expansive, elemental stay: waves, weather, conversation, and nowhere else to be.",
    heroImage: images.sea[0],
    gallery: images.sea,
    experienceTags: ["Oceanfront", "Family gatherings", "Views", "Pet-friendly"],
    featuredOrder: 2,
    featured: true,
    seoTitle: "Sea-Renity Haven | Luxury Oceanfront Retreat",
    seoDescription: "An oceanfront Enchanted Havens retreat near Oak Harbor on Whidbey Island.",
    variants: [variant(157299, "sea-renity-haven", "Sea-Renity Haven: Oceanfront family retreat", "Sea-Renity Haven", "An oceanfront family retreat with expansive views and room to gather.", "Oak Harbor", "Oak Harbor", 12, 4, 2, images.sea, ["Ocean view", "Oceanfront", "Kitchen", "Washing machine", "Wifi", "Pet-friendly"], 4.85, 0)],
  },
  {
    slug: "emerald-haven",
    displayName: "Emerald Haven",
    eyebrow: "Lake Sutherland",
    location: "Port Angeles, Washington",
    narrative: "A designer lake house with a private dock, hot tub, firepit, and front-row views of Mt. Storm King.",
    longNarrative: "Set on the sunny north shore of Lake Sutherland, Emerald Haven pairs panoramic water and mountain views with polished, deeply comfortable interiors. Days move between the private dock, kayaks, the multi-level deck, and the hot tub beneath its softly lit pergola. Olympic National Park waits just beyond the lake.",
    heroImage: images.emerald[0],
    gallery: images.emerald,
    experienceTags: ["Lakefront", "Hot tub", "Private dock", "Firepit", "Kayaks", "Designer interiors"],
    featuredOrder: 3,
    featured: true,
    seoTitle: "Emerald Haven | Designer Lake Sutherland Retreat",
    seoDescription: "A luxury Lake Sutherland home with hot tub, firepit, private dock, kayaks, and mountain views.",
    variants: [variant(178403, "emerald-haven", "Emerald Haven: Lakeside, Hot Tub, Firepit, Kayaks", "Emerald Haven", "A designer lakefront oasis with Mt. Storm King views, a hot tub, private dock, and water toys.", "Lake Sutherland", "Port Angeles", 10, 5, 2, images.emerald, ["Lake view", "Mountain view", "Hot tub", "Firepit", "Private dock", "Kayaks", "Paddle board", "Air conditioning", "Pet-friendly"], 4.97, 116)],
  },
  {
    slug: "fair-haven",
    displayName: "Fair Haven",
    eyebrow: "Hood Canal",
    location: "Belfair",
    narrative: "A beachfront escape for oyster evenings, cedar-scented sauna sessions, and slow days beside the water.",
    longNarrative: "Fair Haven brings the rituals of the Pacific Northwest into one private shoreline retreat. Step from the house toward the beach, gather around local oysters, and finish the evening in the barrel sauna. The setting feels both restorative and playful, equally suited to a family weekend or a quiet coastal reset.",
    heroImage: images.fair[0],
    gallery: images.fair,
    experienceTags: ["Beachfront", "Barrel sauna", "Oysters", "Outdoor living", "Pet-friendly"],
    featuredOrder: 4,
    featured: true,
    seoTitle: "Fair Haven | Beachfront Home and Barrel Sauna",
    seoDescription: "A private Hood Canal beachfront retreat near Belfair with a barrel sauna and space for ten guests.",
    variants: [variant(178994, "fair-haven", "Fair Haven: Beachfront Home, Oyster, Barrel Sauna", "Fair Haven", "A beachfront home centered on coastal living, oyster gatherings, and a barrel sauna.", "Belfair", "Belfair", 10, 3, 2, images.fair, ["Beachfront", "Ocean view", "Barrel sauna", "Kitchen", "Air conditioning", "Pet-friendly"], 4.85, 0)],
  },
  {
    slug: "aurora-haven",
    displayName: "Aurora Haven",
    eyebrow: "Olympic Peninsula",
    location: "Port Angeles, Washington",
    narrative: "A private, high-energy hideaway with sea views, a zipline, and a game room for memorable group escapes.",
    longNarrative: "Aurora Haven balances the calm of a private PNW setting with spaces made for play. Sea views pull everyone outdoors, while the zipline and game room create easy momentum for families and friends. It is a stay that feels secluded without ever feeling still.",
    heroImage: images.aurora[0],
    gallery: images.aurora,
    experienceTags: ["Sea views", "Zipline", "Game room", "Private", "Pet-friendly"],
    featuredOrder: 5,
    featured: true,
    seoTitle: "Aurora Haven | Private PNW Group Retreat",
    seoDescription: "A private Olympic Peninsula retreat with sea views, a zipline, game room, and space for ten.",
    variants: [variant(184081, "aurora-haven", "Aurora Haven: zipline, seaVIEW, game room, private", "Aurora Haven", "A private sea-view retreat with a zipline and game room.", "Olympic Peninsula", "Port Angeles", 10, 3, 3, images.aurora, ["Sea view", "Zipline", "Game room", "Kitchen", "Air conditioning", "Pet-friendly"], 4.95, 0)],
  },
  {
    slug: "reflection-haven",
    displayName: "Reflection Haven",
    eyebrow: "Olympic Peninsula",
    location: "Port Angeles, Washington",
    narrative: "A lakeside basecamp beside Olympic National Park, with a hot tub waiting after each day outside.",
    longNarrative: "Reflection Haven makes the Olympic Peninsula feel wonderfully accessible. Begin with coffee beside the lake, spend the day among forest trails and mountain overlooks, then return to the hot tub as evening settles. The house is relaxed, generous, and made for reconnecting after full days in the park.",
    heroImage: images.reflection[0],
    gallery: images.reflection,
    experienceTags: ["Lakeside", "Hot tub", "Near Olympic National Park", "Family gatherings", "Pet-friendly"],
    featuredOrder: 6,
    featured: true,
    seoTitle: "Reflection Haven | Lakeside Olympic National Park Stay",
    seoDescription: "A lakeside Port Angeles retreat with a hot tub near the entrance to Olympic National Park.",
    variants: [variant(335403, "reflection-haven", "Reflection Haven: Lakeside, Hot Tub, By Park Entry", "Reflection Haven", "A relaxed lakeside stay with a hot tub near Olympic National Park.", "Olympic Peninsula", "Port Angeles", 10, 4, 2, images.reflection, ["Lake access", "Hot tub", "Kitchen", "Air conditioning", "Near national park", "Pet-friendly"], 4.95, 0)],
  },
  {
    slug: "reflection-point",
    displayName: "Reflection Point",
    eyebrow: "Lake Sutherland",
    location: "Port Angeles, Washington",
    narrative: "A renewed Lake Sutherland retreat with three king bedrooms, a private dock, and mountain views from first light through firelit evenings.",
    longNarrative: "Reflection Point brings everyone close to the water without giving up room to settle in. Three king bedrooms make the home unusually comfortable for couples, while the private dock, kayaks, paddleboards, and waterfront fire pit keep each day connected to Lake Sutherland. Olympic National Park adventures begin nearby, with a calm, view-filled return waiting at the lake.",
    heroImage: images.reflectionPoint[0],
    gallery: images.reflectionPoint,
    experienceTags: ["Private dock", "Three king bedrooms", "Kayaks & paddleboards", "Fire pit", "Lake & mountain views", "Pet-friendly"],
    featuredOrder: 7,
    featured: true,
    seoTitle: "Reflection Point | Lake Sutherland House with Private Dock",
    seoDescription: "A three-bedroom Lake Sutherland vacation rental near Olympic National Park with a private dock, kayaks, paddleboards, and waterfront fire pit.",
    variants: [variant(576478, "reflection-point", "Reflection Point: Lake House & Private Dock", "Reflection Point", "A private Lake Sutherland home with three king bedrooms, a dock, kayaks, paddleboards, and a waterfront fire pit.", "Lake Sutherland", "Port Angeles", 6, 3, 2, images.reflectionPoint, ["Private dock", "Waterfront", "Lake access", "Kayaks", "Paddleboards", "Fire pit", "Fireplace", "Pet-friendly"], 5, 0)],
  },
  {
    slug: "whidbey-estate",
    displayName: "The Cove Club",
    eyebrow: "Whidbey Island",
    location: "Freeland",
    narrative: "Twenty-three gated waterfront acres, composed as a private estate for intimate stays, milestone gatherings, and full-property escapes.",
    longNarrative: "The Cove Club is Enchanted Havens at its most expansive: a private waterfront world with multiple residences and the freedom to shape the stay around your group. Reserve the Lighthouse for an intimate retreat, the Guest House for a quiet family stay, the Main House for a gathering by the water, the Lodge for a grand occasion, or the entire estate for complete privacy.",
    heroImage: COVE_CLUB_HERO_IMAGE,
    gallery: [COVE_CLUB_HERO_IMAGE, ...fullEstateImages, ...images.mainHouse, ...images.lodge, ...images.guestHouse, ...images.lighthouse],
    experienceTags: ["Waterfront estate", "23 private acres", "Multiple residences", "Events", "Large groups", "Gated"],
    featuredOrder: 8,
    featured: true,
    seoTitle: "The Cove Club | Private Waterfront Estate",
    seoDescription: "A gated 23-acre waterfront estate in Freeland on Whidbey Island with multiple residences and options for intimate or full-property stays.",
    estate: true,
    variants: [
      variant(558675, "lighthouse", "The Lighthouse at The Cove Club", "The Lighthouse", "An intimate one-bedroom stay within the private waterfront estate.", "Whidbey Island", "Whidbey Island", 3, 1, 1, images.lighthouse, ["Waterfront estate", "Kitchen", "Air conditioning", "Pet-friendly"], null, 0),
      variant(571917, "guest-house", "The Guest House at The Cove Club", "The Guest House", "A light-filled three-bedroom retreat with a private deck and access to the estate's beach, dock, tennis court, and gardens.", "Whidbey Island", "Freeland", 5, 3, 2, images.guestHouse, ["Private estate", "Private beach access", "Deep-water dock", "Tennis court", "Putting green", "Kitchen", "Washing machine", "Pet-friendly"], null, 0),
      variant(558676, "lodge", "The Lodge at The Cove Club", "The Lodge", "The estate's grand gathering residence, designed for large groups.", "Whidbey Island", "Whidbey Island", 16, 11, 12, images.lodge, ["Waterfront estate", "Large groups", "Kitchen", "Air conditioning", "Pet-friendly"], null, 0),
      variant(558677, "full-estate", "23 Acres Gated Waterfront Estate on Whidbey Island", "The Full Estate", "Exclusive use of the gated waterfront estate and its residences.", "Whidbey Island", "Whidbey Island", 42, 19, 19, fullEstateImages, ["23 private acres", "Gated", "Waterfront", "Multiple residences", "Large groups", "Pet-friendly"], null, 0),
      variant(558678, "main-house", "Waterfront Main House on 23-Acre Estate", "The Main House", "A spacious waterfront home at the heart of the estate.", "Whidbey Island", "Whidbey Island", 12, 4, 5, images.mainHouse, ["Waterfront", "Private estate", "Kitchen", "Air conditioning", "Pet-friendly"], null, 0),
    ],
  },
])

export function getEditorialVariantDescription(listingId: number) {
  return fallbackProperties
    .flatMap((property) => property.variants)
    .find((variant) => variant.id === listingId)?.description
}

const editorialHeroIndexes: Record<number, number> = {
  146889: 0,
  157299: 0,
  178403: 1,
  178994: 0,
  184081: 0,
  335403: 0,
  576478: 0,
  558675: 0,
  558676: 2,
  558678: 0,
  571917: 0,
}

const editorialHeroOverrides: Record<number, string> = {
  558676: "https://bookingenginecdn.hostaway.com/listing/57690-558676-3MeQ0x357poeQsFcEcOSlWypqdnRdS82TYU2g--LoV8Q-6a38d6a602ab6?width=3840&quality=92&format=webp&v=2",
  558677: FULL_ESTATE_HERO_IMAGE,
}

export function getEditorialVariantHero(listingId: number) {
  if (editorialHeroOverrides[listingId]) return editorialHeroOverrides[listingId]

  const variantItem = fallbackProperties
    .flatMap((property) => property.variants)
    .find((variant) => variant.id === listingId)

  return variantItem?.images[editorialHeroIndexes[listingId] || 0] || variantItem?.images[0]
}

export const featuredReviews: Review[] = reviewSchema.array().parse([
  {
    id: "emerald-1",
    guestName: "Recent Emerald Haven guest",
    rating: 5,
    text: "The lake is even more beautiful than the photos. We swam from the dock, watched eagles overhead, and ended every evening by the water.",
    date: "2025",
    propertyName: "Emerald Haven",
  },
  {
    id: "blue-1",
    guestName: "Recent Blue Haven guest",
    rating: 5,
    text: "A peaceful, unforgettable setting. The views, deck, and direct access to the lake made the entire stay feel effortless.",
    date: "2025",
    propertyName: "Blue Haven",
  },
  {
    id: "emerald-2",
    guestName: "Olympic Peninsula guest",
    rating: 5,
    text: "Beautifully designed, comfortable, and perfectly located for exploring the park. We already want to return for a longer stay.",
    date: "2025",
    propertyName: "Emerald Haven",
  },
])

export const experienceTiles = [
  { title: "At the water's edge", text: "Private docks, beaches, kayaks, and long afternoons on clear PNW water.", image: images.blue[0], href: "/experiences/waterfront-stays" },
  { title: "Rituals of restoration", text: "Hot tubs, barrel saunas, firelight, and quiet spaces designed for a deeper exhale.", image: images.fair[0], href: "/experiences/wellness-hot-tub-sauna" },
  { title: "Gather beautifully", text: "Generous homes and a private estate for reunions, celebrations, and time together.", image: COVE_CLUB_HERO_IMAGE, href: "/groups/family-reunion-house-washington" },
]

export function getFallbackProperty(slug: string) {
  return fallbackProperties.find((property) => property.slug === slug)
}

export function getVariant(property: Property, variantSlug?: string) {
  if (!variantSlug) return property.variants[0]
  return property.variants.find((variantItem) => variantItem.slug === variantSlug)
}

export function getPropertyByListingId(listingId: number) {
  return fallbackProperties.find((property) => property.variants.some((variantItem) => variantItem.id === listingId))
}

export const allowedListingIds = fallbackProperties.flatMap((property) => property.variants.map((variantItem) => variantItem.id))
