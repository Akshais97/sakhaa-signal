export const SCORE_ANCHORS = `
# Score anchors (mandatory — do NOT default to the middle)

## focalPointDominance (0.00–1.00)
- 0.00–0.20 : visual democracy, multiple competing regions, no hero
- 0.21–0.40 : weak focus, one region marginally louder than the rest
- 0.41–0.60 : clear focus, one region is unambiguously primary
- 0.61–0.80 : strong focus, single hero with quiet supporting elements
- 0.81–1.00 : dominant single hero, near-billboard clarity
Use extreme values when the image warrants them. Do not cluster at 0.5.

## thumbstopProbability (0–100)
- 0–20   : blends into any feed, no pattern interrupt, forgettable
- 21–40  : one weak pattern interrupt (mild color contrast OR mild typographic)
- 41–60  : one clear pattern interrupt executed competently
- 61–80  : one strong pattern interrupt + supporting composition
- 81–100 : multiple layered pattern interrupts, feed-stopping in a hostile scroll
Anchor: a generic stock-photo product ad on white with a serif headline is a 25, not a 50.

## hierarchyClarityScore (0–100)
- 0–30   : visual democracy, viewer's eye has no obvious path
- 31–55  : eye path is inferable but requires effort
- 56–75  : eye path is intuitive, correct primary, some competition at secondary
- 76–90  : eye path is unambiguous, focal → headline → CTA → brand
- 91–100 : masterclass hierarchy, every element earns its position

## hookStrength (0–100)
- 0–25   : generic slogan, no promise, no specificity ("Great Deals", "Book Today")
- 26–50  : clear category signal but common phrasing ("Buy Diamonds Online")
- 51–70  : specific + relevant to a real buyer motivation ("3 BHK from ₹2.1 Cr in Whitefield")
- 71–85  : specific + relevant + distinctive angle ("Own before your next Diwali — possession Dec 2026")
- 86–100 : specific + relevant + distinctive + earns curiosity or urgency without gimmick

## specificityScore (0–100)
Count concrete elements in the copy: numbers, dates, named locations, named products, named certifications, named comparators. Then:
- 0–20   : zero concrete elements (only adjectives)
- 21–40  : one concrete element
- 41–60  : two concrete elements
- 61–80  : three concrete elements OR one dominant element that fully carries the promise (a price, a percentage saving, a specific date)
- 81–100 : four+ concrete elements integrated cleanly without list-clutter

## brandRecognizabilityWithoutLogo (0–100)
Mentally mask the logo. Then:
- 0–20   : could be any brand in the category
- 21–40  : recognisable category but not brand (looks like "a real estate ad")
- 41–65  : recognisable to existing customers via one distinctive asset (color OR typography OR layout)
- 66–85  : recognisable via multiple distinctive assets working together
- 86–100 : instantly identifiable as {brand} even at thumbnail

## saveWorthinessScore (0–100)  [Social only]
- 0–20   : nothing to save, no reference/inspiration/utility value
- 21–40  : mildly interesting but nothing that earns a save action
- 41–60  : one save trigger present (educational OR aspirational OR identity)
- 61–80  : strong save trigger, would plausibly appear in curated collections
- 81–100 : reference-grade content that gets shared to close friends

## feedCamouflageScore (0–100)  [Social only]
- 0–20   : reads as an ad from 20 feet away (heavy brand chrome, CTA button, sales copy)
- 21–40  : ad-shaped but softened
- 41–60  : could be branded content or organic post
- 61–80  : reads as native content, brand appears as sponsor not seller
- 81–100 : indistinguishable from organic in the target feed

## trustSignalDensity (0–100)  [PPC only]
Count present trust signals: star rating, review count, logo wall, testimonial quote, award badge, media mention, certification, guarantee, years established. Then:
- 0        : no trust signals
- 1–20     : one weak signal (a badge without number)
- 21–40    : one strong signal (rating with count)
- 41–60    : two signals
- 61–80    : three signals
- 81–100   : three+ signals integrated without cluttering hierarchy

## savingsMagnitudeSalience (0–100)  [PPC only, requires priceAnchorPresent = true]
- 0–20    : struck-through price exists but the saving amount is not visually highlighted
- 21–40   : saving is legible but same weight as the sell price
- 41–60   : saving is visually louder than the sell price (larger, colored, boxed)
- 61–80   : saving is the primary numeric focus of the ad
- 81–100  : saving is the hero element with contrast, size, and color all reinforcing

## ctaButtonAffordance (0–100)  [PPC only]
- 0–20    : CTA text present but no button shape
- 21–40   : button shape present but weak contrast or ambiguous edge
- 41–60   : clear button with adequate contrast (WCAG AA on button+background)
- 61–80   : clear button, high contrast, obvious tap affordance, correct verb
- 81–100  : button demands the tap — position, contrast, size, and verb all optimal

## platformPolicyRiskScore (0–100)
- 0–20    : no risk signals detected
- 21–40   : minor soft-flag (one mild superlative, no personal attributes)
- 41–60   : moderate risk (superlative + missing disclaimer, OR one personal attribute cue)
- 61–80   : high risk (before/after imagery in restricted category, OR multiple personal attribute cues)
- 81–100  : near-certain rejection (medical claim, financial guarantee, targeted personal attribute)

# General discipline
- If two of your scores are within 5 points of each other, ask yourself whether they actually feel equivalent. If not, spread them.
- If a score sits at exactly 50, you have almost certainly failed to reason. Push up or down.
- Never emit a score without being able to name the specific element in the image that justifies it.
`;
