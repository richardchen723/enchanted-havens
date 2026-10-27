import { buildVacationRentalEntity, propertySchemaImages } from "@/lib/vacation-rental-schema"
import type { Property, PropertyVariant, Review } from "@/lib/schemas"
import { brandEntityFields } from "@/lib/brand-schema"
import { propertyGalleryImageAlt, propertyGalleryImageTitle } from "@/lib/property-image-seo"
import { directBookingOffer } from "@/lib/seo-offers"
import { absoluteUrl } from "@/lib/utils"
import { confirmedStayPolicies, propertySleepingSummary } from "@/lib/property-facts"

export type PropertySeoLink = {
  label: string
  href: string
  text: string
}

export type PropertySeoContent = {
  keywords: string[]
  localSections: { heading: string; body: string }[]
  faq: { question: string; answer: string }[]
  relatedLinks: PropertySeoLink[]
}

const defaultContent: PropertySeoContent = {
  keywords: ["Pacific Northwest vacation rental", "Washington waterfront vacation rental", "direct book vacation rental"],
  localSections: [
    {
      heading: "The setting",
      body: "This haven is part of Enchanted Havens' curated Pacific Northwest collection, selected for privacy, natural beauty, and a stay experience that feels grounded in the surrounding landscape.",
    },
    {
      heading: "How to plan the stay",
      body: "Select dates for exact pricing, review the gallery and amenities, then use direct booking or inquiry support for questions about pets, group fit, accessibility, or special stay details.",
    },
  ],
  faq: [
    {
      question: "Can I book this haven directly?",
      answer: "Yes. Enchanted Havens supports direct booking. Select your dates and guest count to see the complete stay total before continuing.",
    },
    {
      question: "Are events or extra visitors allowed?",
      answer: confirmedStayPolicies.events,
    },
    {
      question: "How do I confirm whether this is the right fit?",
      answer: "Use the stay team inquiry path with your dates, guest count, pets, and planned activities. The team can help compare layouts, setting, and rules before you commit.",
    },
  ],
  relatedLinks: [
    { label: "Direct book vacation rentals", href: "/stays/direct-book-vacation-rentals-washington", text: "Book directly with exact date-based pricing and stay-team support." },
    { label: "Pacific Northwest vacation rentals", href: "/stays/pacific-northwest-vacation-rentals", text: "Compare the broader Enchanted Havens collection by setting and trip style." },
    { label: "Washington waterfront rentals", href: "/stays/washington-waterfront-vacation-rentals", text: "Browse lakefront, oceanfront, beachfront, and private-estate water stays." },
    { label: "PNW retreat rentals", href: "/groups/pnw-retreat-rental", text: "Explore retreat-friendly stays for teams, families, and creative groups." },
  ],
}

const propertyContent: Record<string, PropertySeoContent> = {
  "blue-haven": {
    keywords: ["Lake Sutherland cabin rental", "Port Angeles vacation rental", "Port Angeles lake house rental", "Olympic National Park vacation rental", "Washington lakefront cabin"],
    localSections: [
      {
        heading: "Lake Sutherland, close to Port Angeles",
        body: "Blue Haven gives guests a direct Lake Sutherland setting with practical access to Port Angeles, Lake Crescent, and the northern side of Olympic National Park.",
      },
      {
        heading: "Best for lake days and park trips",
        body: "The home works especially well for travelers who want a true lake cabin rhythm: morning views, time on the water, and an easy return after Olympic Peninsula exploring.",
      },
    ],
    faq: [
      { question: "What is the sleeping and bathroom layout?", answer: propertySleepingSummary(146889) },
      { question: "When are check-in and checkout?", answer: "The standard check-in window is 3:00 p.m. to 11:00 p.m., and checkout is by 10:00 a.m. Early arrival or late departure depends on the turnover schedule, so request it ahead of time and wait for confirmation before planning around it." },
      { question: "What is included for time on Lake Sutherland?", answer: "The home includes a private beach, two kayaks with paddles, and life jackets stored by the upper deck. A public boat launch is about 0.2 miles away, and guests bringing their own boat may use the house dock." },
      { question: "How well equipped is the kitchen?", answer: "The compact kitchen has a cooktop, oven, refrigerator, microwave, coffee maker, toaster, cookware, and dining essentials. A five-burner gas grill is available on the upper deck." },
      { question: "Can I bring a pet?", answer: confirmedStayPolicies.pets },
    ],
    relatedLinks: [
      { label: "Port Angeles lake house rentals", href: "/destinations/port-angeles-lake-house-rentals", text: "Plan a Lake Sutherland stay with practical Port Angeles and Olympic National Park access." },
      { label: "Port Angeles vacation rentals", href: "/destinations/port-angeles-vacation-rentals", text: "Use Blue Haven as a Port Angeles-area base for Lake Sutherland, Lake Crescent, and park days." },
      { label: "Direct book vacation rentals", href: "/stays/direct-book-vacation-rentals-washington", text: "Book Blue Haven directly with date-based pricing and stay-team support." },
      { label: "Lake Sutherland vacation rentals", href: "/destinations/lake-sutherland-vacation-rentals", text: "Compare Lake Sutherland cabins and lake houses in the Enchanted Havens collection." },
      { label: "Lake Crescent vacation rentals", href: "/destinations/lake-crescent-vacation-rentals", text: "Use Blue Haven as a private Lake Sutherland base for Lake Crescent and Olympic National Park days." },
      { label: "Olympic National Park vacation rentals", href: "/destinations/olympic-national-park-vacation-rentals", text: "Use Blue Haven as a Lake Sutherland base for park days and quiet returns." },
      { label: "Washington lake house rentals", href: "/stays/washington-lake-house-rentals", text: "Compare Blue Haven with Lake Sutherland lake houses, docks, kayaks, and park-friendly bases." },
      { label: "Washington kayak vacation rentals", href: "/amenities/washington-kayak-vacation-rentals", text: "Plan Lake Sutherland days around kayaks, private water access, and quiet shoreline time." },
      { label: "Washington cabin rentals", href: "/stays/washington-cabin-rentals", text: "Compare cabin-style lake, forest, and Olympic Peninsula stays." },
      { label: "Lakefront cabins in Washington", href: "/stays/lakefront-cabins-washington", text: "Browse Washington lakefront stays with water access, docks, and mountain views." },
      { label: "Olympic National Park basecamps", href: "/experiences/olympic-national-park-basecamp", text: "Plan park days with a private home to return to afterward." },
    ],
  },
  "sea-renity-haven": {
    keywords: ["Whidbey Island oceanfront rental", "Whidbey Island beach house rental", "Washington Coast vacation rental", "Oak Harbor vacation rental", "family gathering house Whidbey Island"],
    localSections: [
      {
        heading: "Oceanfront Whidbey Island",
        body: "Sea-Renity Haven sits in Oak Harbor on Whidbey Island, where salt air, horizon views, and island drives shape the stay.",
      },
      {
        heading: "A coastal home for gathering",
        body: "The home is strongest for families and friend groups who want ocean views, shared meals, and room to settle into a slower island pace.",
      },
    ],
    faq: [
      { question: "How does arrival at the bluff work?", answer: "The standard check-in window is 4:00 p.m. to 11:00 p.m., and checkout is by 11:00 a.m. The driveway is winding and narrow, so arrive slowly; three vehicles fit in front of the home, with additional roadside parking and an EV charger available." },
      { question: "How are the bedrooms arranged?", answer: propertySleepingSummary(157299) },
      { question: "Can a group cook and eat together comfortably?", answer: "Yes. The kitchen is fully stocked and includes both a Breville espresso machine and a coffee maker. The dining table seats eight, with another four seats at the breakfast bar." },
      { question: "Is the home set up for children and pets?", answer: `The home includes a crib, Pack ’n Play, high chair, books, toys, and a fenced backyard. ${confirmedStayPolicies.pets}` },
      { question: "Can we invite visitors or host a gathering?", answer: confirmedStayPolicies.events },
    ],
    relatedLinks: [
      { label: "Washington Coast vacation rentals", href: "/destinations/washington-coast-vacation-rentals", text: "Explore saltwater stays with horizon views and coastal atmosphere." },
      { label: "Washington beach house rentals", href: "/stays/washington-beach-house-rentals", text: "Compare Whidbey oceanfront, Hood Canal beachfront, and private shoreline stays." },
      { label: "Whidbey Island vacation rentals", href: "/destinations/whidbey-island-vacation-rentals", text: "Explore Sea-Renity and Whidbey Island stay paths." },
      { label: "Direct book vacation rentals", href: "/stays/direct-book-vacation-rentals-washington", text: "Book Sea-Renity directly with date-based pricing and stay-team support." },
      { label: "Vacation rentals near Seattle", href: "/stays/washington-vacation-rentals-near-seattle", text: "Compare Whidbey and Hood Canal weekend getaways within reach of Seattle." },
      { label: "Washington wedding lodging", href: "/groups/washington-wedding-lodging", text: "Plan permit-aware wedding-weekend lodging with Whidbey Island waterfront atmosphere." },
      { label: "Washington group vacation rentals", href: "/groups/washington-group-vacation-rentals", text: "Compare larger homes and waterfront gathering stays across the collection." },
      { label: "Family reunion houses in Washington", href: "/groups/family-reunion-house-washington", text: "Find gathering-ready homes across the collection." },
    ],
  },
  "emerald-haven": {
    keywords: ["Lake Sutherland lake house rental", "Port Angeles vacation rental", "Port Angeles lake house rental", "Washington lakefront vacation rental", "Lake Sutherland hot tub rental"],
    localSections: [
      {
        heading: "Designer lake house on Lake Sutherland",
        body: "Emerald Haven pairs Lake Sutherland water access with a polished Port Angeles-area home base for Olympic Peninsula stays.",
      },
      {
        heading: "Water, mountain views, and recovery time",
        body: "This is a strong fit for guests who want a larger lake house with outdoor living, hot tub time, and views that keep the day centered at the property.",
      },
    ],
    faq: [
      { question: "Is Emerald Haven suitable for young children?", answer: "The home includes two toddler beds, a crib, a baby bath, a high chair, children’s dinnerware, books, and games. Because it is directly on the lake and has multi-level decks and stairs, children need close adult supervision outdoors." },
      { question: "What water equipment is included?", answer: "Guests have two kayaks, two paddles, one paddleboard, a floating private dock, and life jackets stored in the boathouse. Wear a life jacket on the water and supervise children at the shoreline and dock." },
      { question: "What are the hot tub and fire-pit amenities?", answer: "A hot tub sits beneath a lit pergola near the lakeside gathering area, and Adirondack chairs surround the outdoor fire pit. Use both according to the posted safety guidance and any seasonal fire restrictions." },
      { question: "What should we know about arrival and parking?", answer: "The standard check-in window is 4:00 p.m. to 11:00 p.m., and checkout is by 11:00 a.m. There is room for about eight vehicles across two parking areas, around 20 steps from parking to the entrance, and a 240V EV outlet; EV drivers should bring their own charging cord." },
      { question: "How is the kitchen set up for a larger group?", answer: "The modern kitchen is fully equipped with cooking basics, premium appliances, a dishwasher, coffee and tea equipment, and generous prep space. The adjacent dining table seats ten." },
    ],
    relatedLinks: [
      { label: "Port Angeles lake house rentals", href: "/destinations/port-angeles-lake-house-rentals", text: "Compare the Port Angeles-area lake houses by water access, amenities, and group fit." },
      { label: "Port Angeles vacation rentals", href: "/destinations/port-angeles-vacation-rentals", text: "Use Emerald Haven as a larger Port Angeles-area base for park and lake trips." },
      { label: "Direct book vacation rentals", href: "/stays/direct-book-vacation-rentals-washington", text: "Book Emerald Haven directly with date-based pricing and stay-team support." },
      { label: "Lake Sutherland vacation rentals", href: "/destinations/lake-sutherland-vacation-rentals", text: "Compare the Lake Sutherland homes by layout, amenities, and lake access." },
      { label: "Lake Crescent vacation rentals", href: "/destinations/lake-crescent-vacation-rentals", text: "Use Emerald Haven as a designer lake-house base for Lake Crescent and park itineraries." },
      { label: "Olympic National Park vacation rentals", href: "/destinations/olympic-national-park-vacation-rentals", text: "Plan park days around a larger Lake Sutherland home with hot tub and dock energy." },
      { label: "Washington lake house rentals", href: "/stays/washington-lake-house-rentals", text: "Use Emerald Haven as the designer Lake Sutherland anchor for lake-house searches." },
      { label: "Washington kayak vacation rentals", href: "/amenities/washington-kayak-vacation-rentals", text: "Use Emerald Haven as a Lake Sutherland base for paddling, dock time, and water-led days." },
      { label: "Washington cabin rentals", href: "/stays/washington-cabin-rentals", text: "Explore cabin-style private stays with water, forest, and direct-book clarity." },
      { label: "Washington lakefront cabins", href: "/stays/lakefront-cabins-washington", text: "Explore lakefront cabins and lake houses across Washington." },
      { label: "Wellness stays", href: "/experiences/wellness-hot-tub-sauna", text: "Find hot tub, sauna, and restorative outdoor stays." },
      { label: "Washington group vacation rentals", href: "/groups/washington-group-vacation-rentals", text: "Compare lake, forest, beach, and estate homes for group stays." },
      { label: "Company retreat rentals", href: "/groups/company-retreat-rental-pnw", text: "Compare private homes for small team, founder, and leadership retreats." },
    ],
  },
  "fair-haven": {
    keywords: ["Hood Canal beachfront rental", "Hood Canal beach house rental", "Belfair vacation rental", "Hood Canal sauna rental", "Washington beachfront vacation rental"],
    localSections: [
      {
        heading: "Beachfront on Hood Canal",
        body: "Fair Haven is rooted in the Hood Canal rhythm: shoreline time, oyster country, forested edges, and a Belfair location reachable from the greater Seattle and Tacoma areas.",
      },
      {
        heading: "Sauna, beach, and slow evenings",
        body: "The home is built for restorative coastal stays, from barrel sauna sessions to shared meals after time by the water.",
      },
    ],
    faq: [
      { question: "How are the beds arranged?", answer: propertySleepingSummary(178994) },
      { question: "When can we arrive, and where do we park?", answer: "The standard check-in window is 3:00 p.m. to 11:00 p.m., and checkout is by 10:00 a.m. Two vehicles fit in the private parking area, a third can use the roadside space, and a 240V Level 2 EV charger is provided." },
      { question: "Are pets allowed?", answer: `Fair Haven has an enclosed dog area. ${confirmedStayPolicies.pets}` },
      { question: "What should we bring for the beach and sauna?", answer: "The home includes a panoramic barrel sauna, three kayaks, beach essentials, and life jackets. Bring water shoes for the shell-covered Hood Canal shoreline, and follow the posted guidance for kayaking, harvesting shellfish, fires, and sauna use." },
      { question: "Where can I see the complete stay price?", answer: "Choose your dates and guest count in the booking panel to see the date-specific total. The current listing notes that the displayed price includes a non-refundable 5% payment-processing fee." },
    ],
    relatedLinks: [
      { label: "Hood Canal beachfront rentals", href: "/destinations/hood-canal-beachfront-rentals", text: "Learn why Hood Canal works for beach, sauna, and shoreline stays." },
      { label: "Washington beach house rentals", href: "/stays/washington-beach-house-rentals", text: "Compare Fair Haven with Whidbey oceanfront and private Puget Sound shoreline stays." },
      { label: "Direct book vacation rentals", href: "/stays/direct-book-vacation-rentals-washington", text: "Book Fair Haven directly with date-based pricing and stay-team support." },
      { label: "Vacation rentals near Seattle", href: "/stays/washington-vacation-rentals-near-seattle", text: "Plan a Hood Canal weekend getaway with waterfront time and direct booking." },
      { label: "Washington cabin rentals", href: "/stays/washington-cabin-rentals", text: "Compare premium cabin-style stays near water, forest, and Seattle-region routes." },
      { label: "Washington waterfront rentals", href: "/stays/washington-waterfront-vacation-rentals", text: "Compare lakefront, beachfront, oceanfront, and estate water stays." },
      { label: "Washington sauna vacation rentals", href: "/amenities/washington-sauna-vacation-rentals", text: "Use Fair Haven as the Hood Canal sauna anchor for restorative coastal stays." },
      { label: "Washington group vacation rentals", href: "/groups/washington-group-vacation-rentals", text: "Compare group-ready homes with beach, lake, ocean, and estate settings." },
      { label: "Washington wedding lodging", href: "/groups/washington-wedding-lodging", text: "Use Fair Haven as a permit-aware Hood Canal lodging option for wedding-weekend guests." },
      { label: "PNW retreat rentals", href: "/groups/pnw-retreat-rental", text: "Plan a private retreat with clear fit and rule guidance." },
      { label: "Company retreat rentals", href: "/groups/company-retreat-rental-pnw", text: "Explore focused team retreats with shoreline, sauna, and direct planning support." },
    ],
  },
  "aurora-haven": {
    keywords: ["Olympic Peninsula vacation rental", "Port Angeles vacation rental", "Port Angeles group retreat", "PNW family getaway", "Washington forest retreat rental"],
    localSections: [
      {
        heading: "Olympic Peninsula privacy",
        body: "Aurora Haven gives guests a private Port Angeles-area base with playful amenities and access to the broader Olympic Peninsula.",
      },
      {
        heading: "Best for energetic groups",
        body: "The home is strongest for families and friend groups who want views, privacy, games, and a stay that keeps different ages engaged.",
      },
    ],
    faq: [
      { question: "How do I see the exact price for my stay?", answer: "Select your dates and guest count in the booking panel. The live quote is the best source for the complete stay total because rates and minimum stays change by date." },
      { question: "Is Aurora Haven easy to navigate without stairs?", answer: `Aurora Haven is a single-level home with no steps, including from parking to the entrance. ${propertySleepingSummary(184081)}` },
      { question: "What are the arrival and departure times?", answer: "The standard check-in window is 3:00 p.m. to 11:00 p.m., and checkout is by 10:00 a.m. Requests for earlier arrival or later departure depend on the cleaning and reservation schedule and are only confirmed in advance." },
      { question: "Is there parking and EV charging?", answer: "The ten-acre property has ample on-site parking. A 240V, 50-amp Level 2 EV outlet is available; bring the charging cord or adapter that fits your vehicle." },
      { question: "What can families do at the property?", answer: "Aurora’s on-site highlights include a game room, hot tub, fire pit, and outdoor zipline. Adults should supervise children closely, especially around the zipline, hot tub, fire, and wooded grounds." },
    ],
    relatedLinks: [
      { label: "Port Angeles lake house rentals", href: "/destinations/port-angeles-lake-house-rentals", text: "Find Port Angeles-area lake homes and private bases for Olympic Peninsula stays." },
      { label: "Port Angeles vacation rentals", href: "/destinations/port-angeles-vacation-rentals", text: "Compare Aurora Haven with private Port Angeles-area stays for groups and park trips." },
      { label: "Direct book vacation rentals", href: "/stays/direct-book-vacation-rentals-washington", text: "Book Aurora Haven directly with date-based pricing and stay-team support." },
      { label: "Lake Crescent vacation rentals", href: "/destinations/lake-crescent-vacation-rentals", text: "Use Aurora Haven as a private Port Angeles-area base for Lake Crescent and Olympic National Park trips." },
      { label: "Olympic National Park vacation rentals", href: "/destinations/olympic-national-park-vacation-rentals", text: "Compare Aurora Haven with other Port Angeles-area homes for park trips." },
      { label: "Olympic Peninsula vacation rentals", href: "/destinations/olympic-peninsula-vacation-rentals", text: "Compare private homes around Port Angeles and Olympic National Park." },
      { label: "Washington cabin rentals", href: "/stays/washington-cabin-rentals", text: "See cabin-style private homes for Olympic Peninsula and forest-forward stays." },
      { label: "Forest retreat rentals", href: "/stays/forest-retreats-washington", text: "Find wooded, restorative Washington stays." },
      { label: "Washington group vacation rentals", href: "/groups/washington-group-vacation-rentals", text: "Compare larger homes for family, friend, and retreat-style trips." },
      { label: "Family reunion houses", href: "/groups/family-reunion-house-washington", text: "Compare larger homes for family-scale trips." },
      { label: "Company retreat rentals", href: "/groups/company-retreat-rental-pnw", text: "See whether Aurora fits a small team, founder, or leadership retreat." },
    ],
  },
  "reflection-haven": {
    keywords: ["Lake Dawn vacation rental", "Olympic National Park vacation rental", "Port Angeles vacation rental", "Port Angeles lakeside rental", "Washington forest retreat rental", "Olympic Peninsula hot tub rental"],
    localSections: [
      {
        heading: "Lake Dawn near Olympic National Park",
        body: "Reflection Haven is on Lake Dawn's north shore near Port Angeles and Olympic National Park. Blue Haven and Emerald Haven are the collection's Lake Sutherland homes.",
      },
      {
        heading: "A quiet return after park days",
        body: "The home is especially useful for guests who plan full days outside and want a comfortable, scenic place to return to at night.",
      },
    ],
    faq: [
      { question: "What is the bedroom layout?", answer: propertySleepingSummary(335403) },
      { question: "How can I confirm the total price?", answer: "Enter your dates and guest count in the booking panel to generate the current quote. That total reflects the dates and occupancy you selected and is more accurate than a generic nightly rate." },
      { question: "What does the kitchen include?", answer: "The kitchen is stocked for shared meals with a stove, oven, refrigerator, microwave, dishwasher, cookware, cooking basics, and coffee and tea equipment. Linens, towels, and essential bath supplies are also provided." },
      { question: "Can pets stay at Reflection Haven?", answer: `The home has a fenced yard. ${confirmedStayPolicies.pets}` },
      { question: "What is included for lake time and evenings outside?", answer: "Guests can use two kayaks and a canoe on Lake Dawn, then unwind in the six-person hot tub or around the fire pit. Follow the home’s water, hot-tub, and seasonal fire-safety guidance." },
    ],
    relatedLinks: [
      { label: "Port Angeles lake house rentals", href: "/destinations/port-angeles-lake-house-rentals", text: "Compare Port Angeles-area lake homes for park access and water-focused days." },
      { label: "Port Angeles vacation rentals", href: "/destinations/port-angeles-vacation-rentals", text: "Use Reflection Haven as a quiet Port Angeles-area return after Lake Crescent and park days." },
      { label: "Direct book vacation rentals", href: "/stays/direct-book-vacation-rentals-washington", text: "Book Reflection Haven directly with date-based pricing and stay-team support." },
      { label: "Lake Crescent vacation rentals", href: "/destinations/lake-crescent-vacation-rentals", text: "Use Reflection Haven as a quiet lakeside return after Lake Crescent and park days." },
      { label: "Olympic National Park vacation rentals", href: "/destinations/olympic-national-park-vacation-rentals", text: "Plan park days around a private lakeside base with forest recovery time." },
      { label: "Washington lake house rentals", href: "/stays/washington-lake-house-rentals", text: "Compare Reflection Haven on Lake Dawn with Blue Haven and Emerald Haven on Lake Sutherland." },
      { label: "Washington cabin rentals", href: "/stays/washington-cabin-rentals", text: "Compare Olympic Peninsula cabin-style stays with water, forest, and hot tub rhythm." },
      { label: "Olympic National Park basecamps", href: "/experiences/olympic-national-park-basecamp", text: "Plan a park trip around a restorative private home." },
      { label: "Olympic Peninsula vacation rentals", href: "/destinations/olympic-peninsula-vacation-rentals", text: "Compare the Port Angeles and peninsula collection." },
      { label: "Forest retreats", href: "/stays/forest-retreats-washington", text: "Explore quiet wooded and lakeside stays." },
      { label: "Washington group vacation rentals", href: "/groups/washington-group-vacation-rentals", text: "Compare group-ready Washington homes by setting and planned use." },
      { label: "Company retreat rentals", href: "/groups/company-retreat-rental-pnw", text: "Compare quiet PNW homes for focused team time and retreat-style planning." },
    ],
  },
}

export function getPropertySeoContent(property: Property): PropertySeoContent {
  return propertyContent[property.slug] || defaultContent
}

export function getPropertyKeywords(property: Property, variant?: PropertyVariant) {
  const content = getPropertySeoContent(property)
  return [...content.keywords, property.displayName, property.location, variant?.shortName || property.displayName]
}

function absoluteImageUrl(src: string) {
  return src.startsWith("/") ? absoluteUrl(src) : src
}

function uniqueStrings(items: Array<string | undefined | null>) {
  return items
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .filter((item, index, all) => all.indexOf(item) === index)
}

function propertyAreaNames(property: Property, variant: PropertyVariant) {
  return uniqueStrings([
    property.eyebrow,
    property.location,
    variant.location,
    variant.city,
    variant.region,
  ]).slice(0, 8)
}

export function buildPropertyJsonLd({ property, variant, path, heroImage }: { property: Property; variant: PropertyVariant; reviews: Review[]; path: string; heroImage: string }) {
  const pageUrl = absoluteUrl(path)
  const keywords = getPropertyKeywords(property, variant)
  const areaNames = propertyAreaNames(property, variant)
  const spatialCoverage = areaNames.map((name) => ({
    "@type": "Place",
    name,
    address: {
      "@type": "PostalAddress",
      addressRegion: "WA",
      addressCountry: "US",
    },
  }))
  const reserveAction = { "@type": "ReserveAction", target: `${pageUrl}#reserve` }
  const galleryImages = propertySchemaImages(property, variant, heroImage)
  const imageObjects = galleryImages.map((image, index) => ({
    "@type": "ImageObject",
    "@id": `${pageUrl}#image-${index + 1}`,
    name: propertyGalleryImageTitle({ name: variant.shortName, index }),
    caption: propertyGalleryImageAlt({ name: variant.shortName, location: property.location, index, src: image, tags: [...property.experienceTags, ...variant.amenities] }),
    contentUrl: absoluteImageUrl(image),
    url: absoluteImageUrl(image),
    representativeOfPage: index === 0 ? true : undefined,
  }))
  const imageRefs = imageObjects.map((image) => ({ "@id": image["@id"] }))
  const directOffer = directBookingOffer({
    id: `${pageUrl}#direct-book-offer`,
    name: `Direct booking for ${variant.shortName}`,
    url: pageUrl,
    reserveTarget: `${pageUrl}#reserve`,
    itemOfferedId: `${pageUrl}#lodging`,
    sellerId: `${absoluteUrl()}#organization`,
  })
  const lodgingBusiness = {
    ...buildVacationRentalEntity(property, variant, heroImage),
    photo: imageRefs,
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl()}#organization`,
        ...brandEntityFields({ areaServed: uniqueStrings(["Lake Sutherland", "Olympic Peninsula", "Hood Canal", "Whidbey Island", "Puget Sound", "Washington Coast", ...areaNames]), knowsAbout: keywords }),
      },
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl()}#website`,
        name: "Enchanted Havens",
        url: absoluteUrl(),
        publisher: { "@id": `${absoluteUrl()}#organization` },
        inLanguage: "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/havens")}?checkIn={check_in}&checkOut={check_out}&guests={guests}`,
          "query-input": ["required name=check_in", "required name=check_out", "required name=guests"],
        },
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: property.seoTitle,
        url: pageUrl,
        description: property.seoDescription,
        keywords,
        primaryImageOfPage: { "@type": "ImageObject", url: absoluteImageUrl(heroImage) },
        spatialCoverage,
        isPartOf: { "@id": `${absoluteUrl()}#website` },
        publisher: { "@id": `${absoluteUrl()}#organization` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        hasPart: [{ "@id": `${pageUrl}#gallery` }],
        associatedMedia: imageRefs,
        mainEntity: { "@id": `${pageUrl}#lodging` },
        potentialAction: reserveAction,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() },
          { "@type": "ListItem", position: 2, name: "The Havens", item: absoluteUrl("/havens") },
          { "@type": "ListItem", position: 3, name: property.displayName, item: absoluteUrl(`/havens/${property.slug}`) },
          ...(path === `/havens/${property.slug}/${variant.slug}` ? [{ "@type": "ListItem", position: 4, name: variant.shortName, item: pageUrl }] : []),
        ],
      },
      lodgingBusiness,
      directOffer,
      {
        "@type": "ImageGallery",
        "@id": `${pageUrl}#gallery`,
        name: `${variant.shortName} visual gallery`,
        url: `${pageUrl}#gallery`,
        about: { "@id": `${pageUrl}#lodging` },
        isPartOf: { "@id": `${pageUrl}#webpage` },
        associatedMedia: imageRefs,
      },
      ...imageObjects,
    ],
  }
}
