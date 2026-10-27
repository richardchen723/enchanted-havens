import { confirmedStayPolicies } from "@/lib/property-facts"

export type PlanningNote = { heading: string; body: string; sources?: Array<{ label: string; href: string }> }
const parkTrips = { label: "NPS: Olympic trip planning and drive times", href: "https://www.nps.gov/olym/planyourvisit/tripideas.htm" }
const parkConditions = { label: "NPS: current Olympic conditions", href: "https://www.nps.gov/olym/planyourvisit/conditions.htm" }
const whidbeyRoutes = { label: "NPS: Whidbey Island road and ferry routes", href: "https://www.nps.gov/ebla/planyourvisit/directions.htm" }
const ferrySchedule = { label: "WSDOT: ferry schedules and alerts", href: "https://wsdot.wa.gov/travel/washington-state-ferries/schedules" }
const parkPets = { label: "NPS: pet-friendly Olympic trails", href: "https://www.nps.gov/olym/planyourvisit/pets.htm" }
const note = (heading: string, body: string, ...sources: NonNullable<PlanningNote["sources"]>): PlanningNote => ({ heading, body, ...(sources.length ? { sources } : {}) })
const parkDay = note("Choose a park area for the day", "NPS estimates from Port Angeles are about 30 minutes to Lake Crescent, 45 minutes to Hurricane Ridge, 1 hour 15 minutes to Sol Duc Valley, and 2 hours 15 minutes to the Hoh Rain Forest. These are regional planning estimates; allow additional time for your home's starting point, traffic, entrance queues, and stops.", parkTrips, parkConditions)
const islandArrival = note("Choose the bridge or a ferry", "Whidbey Island can be reached by road over Deception Pass on SR 20, by Mukilteo–Clinton ferry, or by Port Townsend–Coupeville ferry. Choose the route for your starting point and check sailing alerts before departure. Ferry waiting and driving on the island are additional travel time.", whidbeyRoutes, ferrySchedule)
const groupApproval = note("Plan the guest list before booking", `${confirmedStayPolicies.events} Share overnight guests, day visitors, vehicles, vendors, and the proposed schedule so the stay team can confirm the home fits your plans.`)
const pets = note("Plan for your pet", confirmedStayPolicies.pets)
const lakeChoice = note("Choose your lake", "Blue Haven and Emerald Haven are on Lake Sutherland. Reflection Haven is on Lake Dawn. All three have private docks. Lake Crescent is a separate Olympic National Park day-trip destination.")

// Editorial notes are selected by the guest's actual question, not generated
// from keywords. Shared route estimates have an explicit origin and source.
export const guidePlanning: Record<string, PlanningNote[]> = {
  "lake-sutherland-vacation-rentals": [
    note("Two ways to stay on Lake Sutherland", "Blue Haven sleeps six in three queen beds and has two kayaks. Emerald Haven welcomes up to ten with four adult bedrooms, a fifth bedroom with toddler beds, two folding mattresses, two kayaks, a paddleboard, and a hot tub. Both have private docks."),
    note("Pack for the arrival steps", "Blue Haven has approximately 30 steps from parking to the entrance; Emerald Haven has approximately 20. Compare the sleeping layouts and parking above when planning luggage and arrivals."), parkDay,
  ],
  "port-angeles-vacation-rentals": [
    note("Pick a setting around Port Angeles", "Stay on Lake Sutherland at Blue or Emerald, on Lake Dawn at Reflection, or on Aurora's ten-acre hilltop property with ocean views. Aurora is a single-level home with step-free access from parking to the entrance."), parkDay,
  ],
  "port-angeles-lake-house-rentals": [lakeChoice,
    note("Match bedrooms to your party", "Blue's three queen beds suit up to six guests. Emerald's layout includes toddler beds and folding mattresses; Reflection has two king rooms, a queen room, and a room with two bunk beds. Compare room assignments before selecting a ten-guest stay."), parkDay,
  ],
  "lake-crescent-vacation-rentals": [
    note("Sleep at a private home; plan a Lake Crescent day", "The homes in this guide are on Lake Sutherland, Lake Dawn, or in the Port Angeles area. Use each home's location when mapping your chosen Lake Crescent trailhead or shoreline stop."),
    note("Give the lake its own day", "NPS puts Lake Crescent about 30 minutes from Port Angeles as a regional estimate. Pick your trailhead before leaving, and check current park conditions for road and trail changes. Your home's route and stops will change the total.", parkTrips, parkConditions),
  ],
  "olympic-national-park-vacation-rentals": [parkDay,
    note("Use a specific park destination", "Map the destination you intend to visit—Hurricane Ridge, a Lake Crescent trailhead, Sol Duc Valley, or the Hoh Rain Forest. Choose one or two areas per day to leave time for exploring, and check NPS road conditions close to departure.", parkTrips, parkConditions), lakeChoice,
  ],
  "olympic-peninsula-vacation-rentals": [
    note("Start with your peninsula itinerary", "The Port Angeles-area homes make a northern peninsula base. Decide how many days you want at Lake Crescent, Hurricane Ridge, and the western rain forest or coast before choosing dates. A longer coastal excursion deserves its own day."), parkDay,
  ],
  "hood-canal-beachfront-rentals": [
    note("A shell-covered shoreline at Fair Haven", "Fair Haven has steps down to its Hood Canal shoreline; pack water shoes for the shells. Three kayaks and a barrel sauna are provided. Build paddling plans around the day's water and weather conditions."),
    note("Plan the family rooms and cars", "Fair has a king room and queen room downstairs, plus an upstairs family room with a queen and two twins. Two folding mattresses and a crib add flexibility. Parking includes two private spaces and one roadside space."),
  ],
  "whidbey-island-vacation-rentals": [islandArrival,
    note("Sea-Renity's bluff setting", "Sea-Renity offers ocean views from a single-level home, a fenced backyard, and beach access through a public park. Up to twelve guests share eight bed spaces plus four folding mattresses. Its narrow, winding approach leads to three front parking spaces, with additional roadside parking."),
  ],
  "puget-sound-waterfront-rentals": [
    note("Compare two saltwater settings", "Sea-Renity is a Whidbey Island bluff stay with public-park beach access. Fair Haven is on Hood Canal with steps down to a shell-covered shoreline. Choose the water access that suits your daily plans, then compare bedrooms and parking."), islandArrival,
  ],
  "washington-coast-vacation-rentals": [
    note("Whidbey Island and Hood Canal stays", "This collection's saltwater homes are Sea-Renity on Whidbey Island and Fair Haven on Hood Canal. Use these specific locations when planning beaches and coastal drives. For an Olympic coast excursion, compare a Port Angeles-area base and allow a full day."), islandArrival,
  ],
  "pacific-northwest-vacation-rentals": [
    note("Choose the trip's center of gravity", "Choose Lake Sutherland or Lake Dawn for private-dock lake days, Aurora for a hilltop setting near Port Angeles, Sea-Renity for Whidbey Island, or Fair for Hood Canal and a barrel sauna. Start with the setting, then compare the actual sleeping arrangements above."), parkDay, islandArrival,
  ],
  "direct-book-vacation-rentals-washington": [
    note("Get a quote for your exact party", "Choose dates and your full overnight guest count to see live availability and a complete USD stay total. Review the displayed booking terms and ask the stay team about your sleeping arrangements, vehicles, pets, or visitor plans before booking."), pets, groupApproval,
  ],
  "washington-waterfront-vacation-rentals": [lakeChoice,
    note("Compare lake, bluff, and beach access", "For saltwater, Sea-Renity pairs Whidbey Island bluff views with beach access through a public park. Fair Haven has steps to Hood Canal's shell-covered shore. The comparison above describes each home's route to the water."),
  ],
  "washington-beach-house-rentals": [
    note("Choose how you will reach the beach", "Fair Haven offers shoreline access down steps on Hood Canal; water shoes help on the shell-covered beach. Sea-Renity has a bluff setting on Whidbey Island with beach access through a public park. Fair provides three kayaks and a barrel sauna."), islandArrival,
  ],
  "washington-lake-house-rentals": [lakeChoice,
    note("Build the day around your dock", "Blue provides two kayaks; Emerald provides two kayaks and a paddleboard; Reflection provides two kayaks and a canoe. Compare entrance steps, bedroom layouts, and parking to choose a base for your lake days."),
  ],
  "lakefront-cabins-washington": [
    note("A six-guest cabin or a larger lake stay", "Blue Haven's three queen beds accommodate six guests on Lake Sutherland. Emerald also sits on Lake Sutherland; Reflection sits on Lake Dawn. Both larger homes welcome up to ten with distinct room layouts described above."), lakeChoice,
  ],
  "washington-cabin-rentals": [
    note("Compare the cabin-style settings", "Choose Blue for three queen beds and Lake Sutherland dock access, Emerald for a larger Lake Sutherland stay with a hot tub, Reflection for Lake Dawn across three stories, or Aurora for a single-level hilltop retreat. Assign bedrooms before deciding on capacity."), parkDay,
  ],
  "luxury-vacation-rentals-near-seattle": [
    note("Choose the amenity that shapes your weekend", "Fair Haven offers a barrel sauna and Hood Canal shoreline. Emerald and Reflection combine private lake docks with hot tubs. Aurora pairs a hot tub with a ten-acre hilltop setting; Sea-Renity offers Whidbey Island views and space for twelve."), islandArrival,
  ],
  "washington-vacation-rentals-near-seattle": [
    note("Map from your actual departure point", "Compare your Seattle-area starting point with each home's location before choosing a weekend stay. Allow for traffic, grocery stops, and any ferry queue. Check arrival windows on the property page when planning an evening departure."), islandArrival,
  ],
  "forest-retreats-washington": [
    note("Room layouts for a quieter retreat", "Aurora's single-level home has six bed spaces plus four guest spaces on folding mattresses. Reflection has three stories with step-free access on the main level. Emerald has four adult bedrooms and a fifth bedroom with toddler beds. Share your room and access requirements with the stay team."),
    note("Work requirements to confirm", "If you plan calls or working sessions, share your seating, desk, and internet requirements before booking. The stay team can help confirm whether the home suits your schedule."),
  ],
  "family-reunion-house-washington": [
    note("Assign beds before counting guests", "Sea-Renity hosts twelve with eight bed spaces and four folding mattresses. Aurora hosts ten with six bed spaces and four spaces on folding mattresses. Emerald's fifth bedroom has toddler beds; Fair has an upstairs family room. Use the layouts above to plan each family's rooms."), pets, groupApproval,
  ],
  "washington-group-vacation-rentals": [
    note("Keep capacity specific to each home", "Compare each home's overnight limit, beds, folding mattresses, and parking separately. For a party using multiple homes, share the proposed allocation and gathering plans with the stay team before booking."), groupApproval,
  ],
  "pnw-retreat-rental": [
    note("Build a retreat brief", "Share your overnight room assignments, shared-meal plans, access requirements, and daily schedule. For work sessions, ask the stay team to confirm the seating and internet requirements that matter to your group."),
    note("Choose a retreat setting", "Fair offers Hood Canal shoreline and a barrel sauna. Aurora offers a hilltop setting and hot tub. Emerald and Reflection pair lake docks with hot tubs. Compare sleeping layouts and parking alongside the activities you want."), groupApproval,
  ],
  "company-retreat-rental-pnw": [
    note("Confirm the work setup before booking", "Send the stay team your required dining and meeting seats, dedicated desk needs, simultaneous video-call plans, and internet requirements. The team can confirm suitability for your group before you commit."),
    note("Match beds to team members", "Use the sleeping arrangements above to assign each participant a suitable bed or room. Aurora's ten-guest capacity includes four guest spaces on folding mattresses. Emerald's fifth bedroom contains toddler beds; its four other bedrooms have adult beds."), groupApproval,
  ],
  "washington-wedding-lodging": [
    note("Plan lodging around the wedding schedule", "Share the wedding location, arrival times, overnight guest list, and vehicles. Compare bathroom and bedroom layouts for getting ready, and use each property's stated arrival window when planning check-in."),
    note("Get approval for activities at the home", "Include any photography, getting-ready visitors, catered meals, vendors, music, or ceremony plans in your inquiry. The stay team can review the proposed use and parking arrangements before booking."), groupApproval,
  ],
  "intimate-event-stays-washington": [
    note("Start with the proposed gathering", "Send your dates, overnight guests, total visitors, vehicles, vendors, music plans, and schedule. The stay team will review the specific home and proposed use before a booking is made."), groupApproval,
  ],
  "waterfront-stays": [
    note("Plan the day around the water access", "A private dock at Blue, Emerald, or Reflection supports lake days. Fair offers a shell-covered Hood Canal shore reached by steps. Sea-Renity pairs bluff views with beach access through a public park. Compare these access details with your group's plans."), lakeChoice,
  ],
  "lake-days-kayaks-docks": [
    note("Choose the equipment for your lake day", "Blue and Emerald are on Lake Sutherland; Reflection is on Lake Dawn. Blue has two kayaks, Emerald has two kayaks and a paddleboard, and Reflection has two kayaks and a canoe. All three have private docks."),
    note("Leave time at the home", "Plan paddling around the day's water and weather conditions, and review equipment instructions before launching. Use the access and parking details above to plan how your party will arrive with luggage and supplies."),
  ],
  "wellness-hot-tub-sauna": [
    note("Choose hot tub or barrel sauna", "Emerald, Aurora, and Reflection have hot tubs. Fair has a barrel sauna beside its Hood Canal setting. Choose the setting and sleeping arrangement that suit your group, then check dates for that home."),
    note("Plan a slower day", "Combine an outdoor soak or sauna session with time at the home. Fair provides three kayaks; Emerald and Reflection have private lake docks. Review the home's equipment instructions for each amenity during your stay."),
  ],
  "olympic-national-park-basecamp": [
    note("Plan one route at a time", "Set a specific trailhead or park area as your destination. Lake Crescent, Hurricane Ridge, Sol Duc Valley, and the Hoh Rain Forest involve different drives. Leave room in the schedule for the return to your Port Angeles-area home."), parkDay,
  ],
  "washington-hot-tub-vacation-rentals": [
    note("Three confirmed hot-tub settings", "Emerald combines a hot tub with Lake Sutherland and a private dock. Reflection has a six-person hot tub at Lake Dawn. Aurora offers a hot tub at its ten-acre hilltop property with ocean views."),
    note("Compare the route into the home", "Emerald has approximately 20 entrance steps. Reflection is three stories with no steps on the main level. Aurora is a single-level house with step-free access from parking to entry. Share specific access needs with the stay team."),
  ],
  "washington-sauna-vacation-rentals": [
    note("Fair Haven's Hood Canal sauna stay", "Fair Haven pairs a barrel sauna with steps down to a shell-covered shoreline and three kayaks. It welcomes up to ten, with two bedrooms downstairs, an upstairs family room, and two folding mattresses."),
    note("Prepare for the shoreline and arrival", "Bring water shoes for the shell-covered beach and plan for two private parking spaces plus one roadside space. Review sauna and kayak instructions at the home before use."),
  ],
  "washington-vacation-rentals-with-private-dock": [lakeChoice,
    note("Match dock time to your party", "Blue's dock is exclusively for guests, and guests may dock their own boat there. Emerald and Reflection also have private docks. Ask the stay team to confirm any boat-specific requirements before bringing your own equipment."),
  ],
  "washington-kayak-vacation-rentals": [
    note("Compare the included watercraft", "Blue has two kayaks. Emerald has two kayaks and a paddleboard. Reflection has two kayaks and a canoe. Fair has three kayaks on Hood Canal. Choose between lake and saltwater settings, then review the launch access above."),
    note("Plan equipment use for your party", "Share any specific equipment or access needs before booking. At the home, follow the supplied instructions and plan outings around the day's water and weather conditions."),
  ],
  "pet-friendly-vacation-rentals-washington": [pets,
    note("Match outdoor space to your pet", "Sea-Renity has a fenced backyard, Fair has an enclosed dog area, and Reflection has a fenced lawn leading toward the lake. Review each home's water access and house rules when planning time outside."),
    note("Choose pet-friendly park stops", "NPS lists Madison Falls and the Spruce Railroad Trail at Lake Crescent among Olympic's pet-friendly trails. Pets must be leashed, with a maximum leash length of six feet. Check the current NPS guidance when planning your route.", parkPets),
  ],
  "washington-vacation-rentals-with-firepit": [
    note("Choose the evening setting", "Emerald and Reflection offer fire pits with lake settings; Fair offers one on Hood Canal, and Aurora has one at its hilltop property. Compare bedrooms, parking, and outdoor access alongside the evening view."),
    note("Confirm use for your dates", "Ask the stay team about current fire restrictions and the home's fire-pit instructions before planning an outdoor fire. Follow the instructions supplied for your stay and the current local conditions."),
  ],
}
