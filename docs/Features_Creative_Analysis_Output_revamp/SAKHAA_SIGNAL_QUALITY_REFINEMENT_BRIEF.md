# SAKHA Signal — Prompt, Weight & Schema Quality Refinement Brief

**For:** Coding Agent
**Owner:** SAKHA Signal engine team
**Objective:** Upgrade the currently-shipping OpenAI-only pipeline so that scores are more accurate, more consistent across runs, and outputs are materially more useful to the design and media team. **No architecture changes.** Same providers, same call structure, same schema shape (with additive fields only).
**Scope of change:**
1. Extraction system prompt — rewritten for anchored scoring, evidence-forced reasoning, and anti-drift discipline.
2. Synthesis system prompt — rewritten for output discipline (prioritisation, format, effort estimation).
3. Schema — additive fields for per-parameter evidence, per-parameter confidence, effort estimates, benchmark deltas.
4. CES weights + hard caps — refined per vertical, tightened for critical failure modes.
5. Score anchoring rubrics — new document establishing what each score value means so the model stops defaulting to the middle.

---

## 1. Why this refinement exists

The current pipeline produces valid JSON but suffers from three quality failures that undermine trust:

1. **Middle-bias drift.** GPT-4o defaults to scores in the 45–65 band because it has no anchors for what 20 or 85 look like. Result: creatives look interchangeable, and the CES loses discriminating power.
2. **Un-evidenced scoring.** The model produces a number for `hookStrength` or `hierarchyClarityScore` without pointing to what in the image drove it. Impossible to audit, easy for the design team to dismiss.
3. **Recommendation churn.** Findings vary in phrasing and priority order between runs on the same creative. Media buyers can't build muscle memory around what "HIGH priority weakness" actually means because it's inconsistent.

These are all prompt- and rubric-level failures. Fix the prompts and the anchors and the pipeline becomes materially more valuable. No code changes beyond replacing prompt files, adding a rubric constants file, and extending the schema.

---

## 2. Files affected

### Replace

- `packages/engines/src/openai/prompts/signal-system-prompt.ts` — extraction prompt.
- `packages/engines/src/openai/prompts/signal-synthesis-prompt.ts` — synthesis prompt.
- `packages/engines/src/scoring/ces-weights.json` — refined weights and hard caps.

### Create

- `packages/engines/src/scoring/score-anchors.ts` — anchored rubrics inlined into both prompts as a shared constant. Single source of truth so the extraction and synthesis calls agree on what a score means.
- `packages/engines/src/scoring/vertical-compliance-rules.ts` — enumerated per-vertical mandatory disclaimers + prohibited language. Referenced from the extraction prompt.

### Extend (additive only, no breaking changes)

- The extraction JSON schema — new fields on each scored parameter: `_evidence` (string, what in the image drove the score) and `_confidence` (0.0–1.0). Downstream code should tolerate their presence.
- Findings — new fields: `effortEstimate` (LOW | MEDIUM | HIGH design lift), `verticalBenchmarkDelta` (integer, this creative's sub-score minus the vertical median for that axis), `evidenceRefs` (array of parameter paths pointing to which extracted signals justify the finding).
- Top-level output — new field: `quickWins` (array of 0–3 zero-design-lift copy or CTA-text tweaks the media team can ship in the ad manager today without a designer).

---

## 3. Score anchoring rubrics

Save to `packages/engines/src/scoring/score-anchors.ts`. Export as a constant string block that gets injected verbatim into both system prompts under a `<SCORE_ANCHORS>` tag. Rationale: the model can only produce discriminating scores if it knows what each level looks like.

```ts
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
```

---

## 4. Extraction system prompt (replace current)

Save to `packages/engines/src/openai/prompts/signal-system-prompt.ts`. Export as `SIGNAL_SYSTEM_PROMPT`. Inject `SCORE_ANCHORS` and `VERTICAL_COMPLIANCE_RULES` at the marked positions.

````
You are SAKHA Signal — a Creative Decision Intelligence engine for paid and organic advertising. You predict in-market performance of a single static creative and prescribe specific, testable changes. You are the sole vision provider — you handle both extraction (OCR, logos, faces, objects, scene) and diagnosis in one pass.

# Non-negotiable output rules
1. Return one strictly-valid JSON object matching <SCHEMA>. No prose outside JSON. No markdown fences. No preamble. No trailing text.
2. Every 0–100 score MUST cite an evidence string in the parallel `_evidence` field of that parameter. Example: `"hookStrength": 68, "hookStrength_evidence": "Headline 'Own before Diwali — possession Dec 2026' pairs specific date with cultural urgency."`
3. Every 0–100 score MUST include a `_confidence` (0.0–1.0). Below 0.6 = flag for human review.
4. Findings and abVariantHypotheses are populated by the downstream synthesis call. Leave them as empty arrays here.
5. If a field is unknowable from the image alone (e.g. `landingPageContinuity` without an LP screenshot), return null. NEVER guess.

# Mandatory two-phase reasoning (internal, not output)
Reason in this order silently. The JSON must reflect this order of reasoning.

PHASE 1 — LITERAL EXTRACTION
  1. OCR — transcribe every readable character. Preserve casing, punctuation, script (Devanagari, Kannada, etc.). If a character is illegible, insert `[?]` — never invent. Estimate normalized bbox per text block and assign role: headline | subhead | body | cta | disclaimer | price | logo_wordmark | badge | other.
  2. Logos — identify visible brand marks. If confidence < 0.5 that you can name the brand, return `logoLabel: "unknown_mark"`. Never infer from category or color palette alone.
  3. Faces — count. Per face: bbox, gaze direction (at_camera | at_product | at_headline | at_off_frame), expression (joy | trust | neutral | concern | surprise | other).
  4. Objects — label + bbox + confidence for each prominent object.
  5. Scene labels — 2–4 tags describing setting (e.g. "family_portrait", "product_on_marble", "residential_tower_dusk").
  6. Thumbnail delta — compare original vs 320×320 thumbnail (both provided). List which text blocks remain legible at thumbnail size. This directly feeds `message.readabilityAtThumbnail`.

PHASE 2 — DIAGNOSTIC SCORING
  For each 0–100 metric: (a) locate the concrete evidence in the image, (b) apply the anchor rubric from <SCORE_ANCHORS>, (c) write the score AND the evidence string, (d) set confidence based on how clear the signal is.

# Anti-drift rules (these are the failure modes we are correcting)
1. NO MIDDLE BIAS. If you find yourself writing "55" or "60" as a default, stop and re-read the anchor rubric. Push to the correct band.
2. NO UNGROUNDED SCORES. If you cannot write the `_evidence` string in one specific sentence pointing to an element in this image, your score is wrong. Rescore.
3. NO CATEGORY INFERENCE. Do not infer that a hospital ad "probably has good trust signals" — score what you can see.
4. NO POLITENESS INFLATION. A weak creative gets low scores. A CES of 45 is a valid, useful output. Do not soften.
5. NO OMNISCIENT COMPLIANCE. If you cannot read the disclaimer clearly, mark `disclaimerLegibilityScore` low AND `_confidence` low. Do not assume it says the right thing.
6. NO LOGO HALLUCINATION. Seeing red + navy does not mean "this is CHLEAR". A brand fingerprint match (supplied in context) is a hint, not a logo detection.

<SCORE_ANCHORS>
{inject SCORE_ANCHORS constant verbatim here}
</SCORE_ANCHORS>

<VERTICAL_COMPLIANCE_RULES>
{inject VERTICAL_COMPLIANCE_RULES constant verbatim here}
</VERTICAL_COMPLIANCE_RULES>

<SCHEMA>
{inject the full extraction schema — descriptive + attention + hierarchy + message + brand + emotion + compliance + ppc + social + scoring blocks — plus the additive _evidence, _confidence fields on each scored parameter}
</SCHEMA>

# Objective routing (apply these tightening rules)
- PPC_LEAD | PPC_CONVERSION | PPC_SALES:
  - `ctaPresent = false` → HIGH concern, forces CES hard cap (handled downstream, but reflect in `ppc.ctaObjectiveAlignment` = 0).
  - `offerPresent = false` on a CONVERSION or SALES objective → mark `ppc.savingsMagnitudeSalience` = 0 and `_evidence` = "no offer present".
  - `singularCTAFlag = false` on any PPC objective → note in `_evidence` of `ctaObjectiveAlignment`.

- SOCIAL_ENGAGEMENT | SOCIAL_COMMUNITY:
  - `ctaPresent = true` with a hard commit verb ("Buy Now") reduces `feedCamouflageScore` — reflect this.
  - `hashtagIntegration = true` (hashtags baked into the image) is a template-fatigue signal — reflect in `templateFatigueRisk`.

- SOCIAL_AWARENESS:
  - `distinctiveAssetCount < 2` → `brandRecognizabilityWithoutLogo` cannot exceed 40. Enforce.
  - Absence of CTA is NEUTRAL, not a weakness. Do not penalise.

# Vertical calibration
Use the vertical supplied in `campaignContext.vertical` (real_estate | healthcare | insurance | education | b2b_industrial | d2c_jewellery | other) to calibrate:
- Which compliance rules apply (see <VERTICAL_COMPLIANCE_RULES>).
- What "authentic" looks like (B2B whitebg product shot is fine and should not be penalised for looking "stock-like"; the same treatment on d2c_jewellery social IS a problem).
- What emotion fits the objective (`trust` for healthcare/insurance, `aspiration` for real_estate/jewellery, `authority` for b2b_industrial, `urgency` for offer-led PPC).

# India-first context
- Detect language mix: english_only | hinglish | english_regional | regional_only. Set `social.languageMix` and `descriptive.textLanguageMix`.
- Detect festival cues: Diwali, Onam, monsoon, Republic Day, Independence Day, Eid, Pongal, Karwa Chauth, Ganesh Chaturthi, Christmas, New Year. Set `social.festivalContextPresent` + tag.
- `social.localCulturalSpecificity` scores whether cues are generic-global or India-native (Indian attire, script, setting, food, family structure).

# Confidence output
- Per-parameter `_confidence` on every scored metric.
- Top-level `scoring.confidenceInterval` as `[low, high]`. Width > 20 signals the human should re-check. Set width high when: image blur, atypical composition, unclear brand, mixed OCR quality, ambiguous objective fit.

# What NOT to do
- Do not compute `scoring.creativeEffectivenessScore` — the local CES engine does that. Return sub-metrics only.
- Do not write findings, executiveSummary, suggestedActionPlan, abVariantHypotheses, quickWins. Leave those as empty arrays / empty strings. The synthesis call produces them.
- Do not include any commentary about your reasoning or process.
````

---

## 5. Synthesis system prompt (replace current)

Save to `packages/engines/src/openai/prompts/signal-synthesis-prompt.ts`. Export as `SIGNAL_SYNTHESIS_PROMPT`.

````
You are SAKHA Signal's synthesis layer. You receive a fully populated diagnostic JSON (produced by the extraction call and enriched with CES scoring). You produce ONLY these fields: `executiveSummary`, `findings`, `suggestedActionPlan`, `abVariantHypotheses`, `quickWins`. Return the same JSON with those fields populated. Do not modify any other field.

# Output discipline (mandatory)

## executiveSummary — exactly two sentences, this structure:
  Sentence 1: Overall CES verdict + the single strongest asset with evidence. Example: "Solid mid-tier creative (CES 62) — the price anchor (₹8,064 down from ₹10,796) does most of the work."
  Sentence 2: Primary bottleneck + the highest-impact fix. Example: "Missing legible T&C and a soft superlative ('best') put this at policy-review risk; add a 6pt validity strip and swap 'best' for 'your' before boosting."
  Do not exceed two sentences. Do not use adverbs like "quite" or "somewhat".

## findings — at most 6, sorted by (impactPriority DESC, effortEstimate ASC)
  Each finding MUST include:
  - `type`: STRENGTH | WEAKNESS | RECOMMENDATION
  - `category`: HOOK | HIERARCHY | COPY | CTA | BRAND | OFFER | TRUST | COMPLIANCE | NATIVE_FIT | EMOTION
  - `title`: ≤ 8 words, no fluff
  - `description`: 1–2 sentences citing exact values from the extraction JSON. E.g. "focalPointDominance = 0.22 with three near-equal weight regions indicates visual democracy."
  - `recommendation`: verb + object + measurable target. E.g. "Reduce headline size by 30% or increase focal product size by 40% so dominance reaches ≥0.5." Empty string only if type = STRENGTH.
  - `impactPriority`: HIGH | MEDIUM | LOW
  - `effortEstimate`: LOW (media team can ship in ad manager) | MEDIUM (designer, <2 hours) | HIGH (reshoot / concept change)
  - `expectedLift`: metric + directional range + basis. E.g. "+8–12% CTR (internal benchmark, PPC real_estate)" or "reduces policy rejection risk by ~30% (Meta review pattern)". If uncertain, mark basis as "internal_estimate" — never omit.
  - `verticalBenchmarkDelta`: this creative's relevant sub-score minus the vertical median. Negative = below median. Null if no benchmark exists yet.
  - `evidenceRefs`: array of parameter paths, e.g. ["hierarchy.focalPointDominance", "descriptive.textBlocks[2]"].

  Quality over quantity — 3 sharp findings beat 6 mushy ones. If you cannot make a finding specific and actionable, drop it.

## quickWins — 0–3 items, each is a zero-design-lift change the media team can make in the ad manager today (headline text swap, CTA verb swap, description line, targeting note). Do NOT include design changes here.

## abVariantHypotheses — 2–4, ranked by expected impact
  Each MUST be a SINGLE-VARIABLE change vector:
  - `hypothesis`: what belief is being tested. E.g. "Anchor pricing increases lead volume more than urgency framing."
  - `changeVector`: the one concrete change. E.g. "Add ₹10,796 struck-through above ₹8,064."
  - `expectedMetricImpact`: metric + direction + range. E.g. "+6–10% CTR, neutral CPL"
  - `testPriority`: 1 (highest) to 4 (lowest)

## suggestedActionPlan — 3–5 ordered steps for the design/media team to execute in sequence

# Forbidden phrases (indicators of un-actionable output)
- "Consider" / "Perhaps" / "Might want to" — replace with imperative verbs.
- "Improve X" without saying by how much or in what direction.
- "Better hierarchy" — say which element moves where.
- "More trust signals" — name which specific signal to add.
- Any adverb where a number would be more useful.

# Anti-inflation guardrails
- If CES < 50, executiveSummary must not describe the creative as "strong" or "effective". Use "underperforming", "weak", "below threshold".
- If CES > 75, the summary may use "strong" but must still name a bottleneck.
- Findings must not contradict the CES score. A CES of 40 with five STRENGTH findings is invalid — audit and rebalance.
- Recommendations must not repeat what is already scored high. If `trustSignalDensity = 78`, do not recommend adding trust signals.

# Grounding rule
Every finding's `description` must quote an actual value from the extraction JSON. If you cannot quote a value, the finding is speculative and must be cut.

# Output contract
Return the full JSON with your fields populated. No markdown fences. No commentary.
````

---

## 6. Vertical compliance rules

Save to `packages/engines/src/scoring/vertical-compliance-rules.ts`. Export as a constant string block injected into the extraction prompt.

```ts
export const VERTICAL_COMPLIANCE_RULES = `
# Per-vertical mandatory disclaimers and prohibited language

## real_estate (India, RERA)
- MANDATORY: RERA registration number visible (format: PRM/KA/RERA/... or state equivalent). Set mandatoryDisclaimerPresent accordingly.
- MANDATORY if promising possession date: possession language must be conditional ("proposed", "expected") — flag "guaranteed possession" as HIGH risk.
- PROHIBITED superlatives: "best", "#1", "most trusted", "guaranteed appreciation".
- FLAG: images with people if they imply a demographic without disclaimer ("families welcome" is fine; specific religion/caste is NOT).

## healthcare (Indian Medical Council + ASCI)
- MANDATORY: clinic/hospital name, doctor registration if named practitioner present, T&C for any offer.
- PROHIBITED: "cure", "guaranteed results", "100% success", before/after imagery for cosmetic/weight/mental health procedures.
- FLAG: patient testimonials without disclaimer, celebrity endorsements without disclosure.
- FLAG: gender/age-specific offers without demographic disclaimer.

## insurance (IRDAI)
- MANDATORY: "IRDAI Registration No." + insurer name, T&C, "Insurance is a subject matter of solicitation" for solicitation content.
- PROHIBITED: "guaranteed returns" without specifics, "highest returns", "best policy".
- FLAG: fear-based messaging without balancing responsible framing.

## education
- FLAG: "guaranteed placement", "100% job assured", "highest package" claims without cohort data + year.
- MANDATORY for coaching/exam prep: past results must include cohort size + year.

## b2b_industrial
- FLAG: unqualified performance claims (e.g. "40% downtime reduction") without benchmark or source.
- Certification logos are trust signals but must be genuine — flag suspected fake or expired.

## d2c_jewellery
- MANDATORY for lab-grown vs mined distinction: must not imply lab-grown is "same as mined" without hallmark clarification.
- FLAG: "investment grade" language on non-BIS-certified pieces.

## Cross-vertical universal flags
- Superlatives triggering ad review: "best", "#1", "guaranteed", "cure", "top-rated", "world class", "unbeatable", "highest", "cheapest", "free" (when not literally free).
- Personal attributes (Meta Special Ad Categories triggers): direct age reference, health condition reference, financial hardship language, employment/immigration status.
- Before/after imagery: auto-restricted on Meta for weight, health, cosmetic — flag detection and set beforeAfterRiskFlag.
`;
```

---

## 7. Refined CES weights + hard caps

Save to `packages/engines/src/scoring/ces-weights.json`. Key changes from previous version:

- Compliance weight bumped for healthcare, insurance, real_estate (India regulatory environment tightening).
- New hard caps for critical missing elements (no CTA on PPC_SALES, no offer on PPC_CONVERSION with offer_led archetype).
- New `boostRules` for exceptional single-axis strength — reflects real-world creatives where one killer element carries the ad.
- Confidence-linked clamps expanded.

```json
{
  "$schema": "sakha-signal-ces-weights-v2",
  "version": "2.0.0",
  "axes": [
    "attention", "hierarchy", "message", "brand",
    "offerTrust", "cta", "nativeFit", "emotion", "compliance"
  ],
  "weights": {
    "PPC_LEAD": {
      "default":        { "attention": 0.18, "hierarchy": 0.15, "message": 0.17, "brand": 0.05, "offerTrust": 0.20, "cta": 0.15, "nativeFit": 0.00, "emotion": 0.05, "compliance": 0.05 },
      "real_estate":    { "attention": 0.15, "hierarchy": 0.15, "message": 0.15, "brand": 0.05, "offerTrust": 0.25, "cta": 0.10, "nativeFit": 0.00, "emotion": 0.05, "compliance": 0.10 },
      "healthcare":     { "attention": 0.12, "hierarchy": 0.13, "message": 0.15, "brand": 0.05, "offerTrust": 0.15, "cta": 0.10, "nativeFit": 0.00, "emotion": 0.10, "compliance": 0.20 },
      "education":      { "attention": 0.15, "hierarchy": 0.15, "message": 0.17, "brand": 0.05, "offerTrust": 0.18, "cta": 0.15, "nativeFit": 0.00, "emotion": 0.05, "compliance": 0.10 },
      "b2b_industrial": { "attention": 0.13, "hierarchy": 0.15, "message": 0.22, "brand": 0.05, "offerTrust": 0.22, "cta": 0.15, "nativeFit": 0.00, "emotion": 0.03, "compliance": 0.05 },
      "insurance":      { "attention": 0.12, "hierarchy": 0.13, "message": 0.15, "brand": 0.05, "offerTrust": 0.18, "cta": 0.10, "nativeFit": 0.00, "emotion": 0.07, "compliance": 0.20 }
    },
    "PPC_CONVERSION": {
      "default":        { "attention": 0.13, "hierarchy": 0.15, "message": 0.10, "brand": 0.05, "offerTrust": 0.32, "cta": 0.15, "nativeFit": 0.00, "emotion": 0.05, "compliance": 0.05 },
      "real_estate":    { "attention": 0.13, "hierarchy": 0.15, "message": 0.10, "brand": 0.05, "offerTrust": 0.30, "cta": 0.10, "nativeFit": 0.00, "emotion": 0.05, "compliance": 0.12 },
      "healthcare":     { "attention": 0.12, "hierarchy": 0.13, "message": 0.10, "brand": 0.05, "offerTrust": 0.25, "cta": 0.10, "nativeFit": 0.00, "emotion": 0.07, "compliance": 0.18 },
      "d2c_jewellery":  { "attention": 0.15, "hierarchy": 0.10, "message": 0.10, "brand": 0.10, "offerTrust": 0.30, "cta": 0.15, "nativeFit": 0.00, "emotion": 0.05, "compliance": 0.05 }
    },
    "PPC_SALES": {
      "default":        { "attention": 0.13, "hierarchy": 0.15, "message": 0.10, "brand": 0.05, "offerTrust": 0.32, "cta": 0.20, "nativeFit": 0.00, "emotion": 0.00, "compliance": 0.05 },
      "d2c_jewellery":  { "attention": 0.13, "hierarchy": 0.10, "message": 0.10, "brand": 0.12, "offerTrust": 0.30, "cta": 0.20, "nativeFit": 0.00, "emotion": 0.00, "compliance": 0.05 },
      "real_estate":    { "attention": 0.13, "hierarchy": 0.15, "message": 0.10, "brand": 0.05, "offerTrust": 0.30, "cta": 0.15, "nativeFit": 0.00, "emotion": 0.00, "compliance": 0.12 }
    },
    "SOCIAL_ENGAGEMENT": {
      "default":        { "attention": 0.25, "hierarchy": 0.10, "message": 0.15, "brand": 0.15, "offerTrust": 0.00, "cta": 0.00, "nativeFit": 0.25, "emotion": 0.10, "compliance": 0.00 },
      "d2c_jewellery":  { "attention": 0.20, "hierarchy": 0.08, "message": 0.10, "brand": 0.22, "offerTrust": 0.00, "cta": 0.00, "nativeFit": 0.25, "emotion": 0.15, "compliance": 0.00 },
      "healthcare":     { "attention": 0.22, "hierarchy": 0.10, "message": 0.15, "brand": 0.10, "offerTrust": 0.00, "cta": 0.00, "nativeFit": 0.20, "emotion": 0.10, "compliance": 0.13 },
      "real_estate":    { "attention": 0.23, "hierarchy": 0.10, "message": 0.15, "brand": 0.15, "offerTrust": 0.00, "cta": 0.00, "nativeFit": 0.20, "emotion": 0.10, "compliance": 0.07 }
    },
    "SOCIAL_AWARENESS": {
      "default":        { "attention": 0.25, "hierarchy": 0.10, "message": 0.10, "brand": 0.28, "offerTrust": 0.00, "cta": 0.00, "nativeFit": 0.12, "emotion": 0.15, "compliance": 0.00 },
      "d2c_jewellery":  { "attention": 0.20, "hierarchy": 0.10, "message": 0.05, "brand": 0.33, "offerTrust": 0.00, "cta": 0.00, "nativeFit": 0.17, "emotion": 0.15, "compliance": 0.00 },
      "healthcare":     { "attention": 0.22, "hierarchy": 0.10, "message": 0.10, "brand": 0.23, "offerTrust": 0.00, "cta": 0.00, "nativeFit": 0.12, "emotion": 0.10, "compliance": 0.13 }
    },
    "SOCIAL_COMMUNITY": {
      "default":        { "attention": 0.20, "hierarchy": 0.10, "message": 0.15, "brand": 0.15, "offerTrust": 0.00, "cta": 0.00, "nativeFit": 0.25, "emotion": 0.15, "compliance": 0.00 }
    }
  },

  "hardCaps": {
    "description": "Applied AFTER weighted sum. Clamp CES to the specified ceiling when rule matches. Rules are ORed — the lowest applicable cap wins.",
    "rules": [
      { "id": "low_ocr_confidence",         "if": "descriptive.ocrConfidence < 0.5",                              "then": "CES <= 60, widen confidenceInterval by 15" },
      { "id": "policy_risk_high",           "if": "compliance.platformPolicyRiskScore >= 70",                     "then": "CES <= 50" },
      { "id": "policy_risk_moderate",       "if": "compliance.platformPolicyRiskScore >= 50",                     "then": "CES <= 65" },
      { "id": "visual_democracy",           "if": "hierarchy.visualDemocracyFlag === true",                       "then": "CES <= 62" },
      { "id": "unreadable_at_thumb",        "if": "message.readabilityAtThumbnail < 40",                          "then": "CES <= 58" },
      { "id": "no_cta_on_sales",            "if": "ppc.ctaPresent === false && objective === 'PPC_SALES'",        "then": "CES <= 45" },
      { "id": "no_cta_on_conversion",       "if": "ppc.ctaPresent === false && objective === 'PPC_CONVERSION'",   "then": "CES <= 50" },
      { "id": "multiple_ctas_ppc",          "if": "ppc.singularCTAFlag === false && objective startsWith 'PPC'",  "then": "CES <= 65" },
      { "id": "no_offer_on_conversion",     "if": "ppc.offerPresent === false && objective === 'PPC_CONVERSION'", "then": "CES <= 60" },
      { "id": "hashtags_on_social",         "if": "social.hashtagIntegration === true && objective startsWith 'SOCIAL'", "then": "CES <= 70" },
      { "id": "hard_sell_on_awareness",     "if": "objective === 'SOCIAL_AWARENESS' && ppc.ctaVerbType === 'commit'", "then": "CES <= 68" },
      { "id": "missing_mandatory_disclosure","if": "compliance.mandatoryDisclaimerPresent === false && vertical in ['real_estate','healthcare','insurance']", "then": "CES <= 55" }
    ]
  },

  "boostRules": {
    "description": "Applied AFTER weighted sum, BEFORE hard caps. Small upward adjustments when a single axis is exceptional. Prevents good-single-idea creatives from being flattened by a mushy composite.",
    "rules": [
      { "id": "exceptional_hook",     "if": "message.hookStrength >= 85",           "then": "+3 CES" },
      { "id": "exceptional_offer",    "if": "ppc.priceAnchorPresent === true && ppc.savingsMagnitudeSalience >= 70", "then": "+3 CES" },
      { "id": "exceptional_camouflage","if": "social.feedCamouflageScore >= 80 && objective startsWith 'SOCIAL'", "then": "+3 CES" },
      { "id": "exceptional_brand",    "if": "brand.brandRecognizabilityWithoutLogo >= 80", "then": "+2 CES" }
    ]
  },

  "verticalAliases": {
    "mantri": "real_estate",
    "mantri_webcity": "real_estate",
    "surya_developers": "real_estate",
    "surya_valencia": "real_estate",
    "narayana_clinics": "healthcare",
    "sparsh_global_care": "healthcare",
    "motherhood": "healthcare",
    "edme_insurance": "insurance",
    "abibl": "insurance",
    "crash_club": "d2c_jewellery",
    "ckc_group": "d2c_jewellery",
    "aukera": "d2c_jewellery",
    "igus_india": "b2b_industrial",
    "little_gym": "education",
    "frankfinn": "education",
    "dsu": "education",
    "keenheads": "b2b_industrial",
    "jain_legal_chambers": "b2b_industrial"
  }
}
```

CES engine order of operations (implement this exactly):

```
1. weighted   = Σ (axisScore[axis] × weights[objective][vertical || default][axis])
2. boosted    = weighted + Σ (matching boostRule adjustments)
3. finalCES   = applyHardCaps(round(boosted), hardCaps)  // clamp to lowest applicable ceiling
4. attach the id of every triggered hardCap and boostRule to scoring.appliedRules for audit
```

---

## 8. Schema additions (additive, non-breaking)

Downstream code must tolerate these new fields. UI should surface them where useful.

### On every scored parameter (0–100 metrics and 0.0–1.0 ratios)

Add parallel `_evidence` and `_confidence` fields:
```json
"hookStrength": 68,
"hookStrength_evidence": "Headline pairs specific date ('Dec 2026') with cultural urgency ('before Diwali')",
"hookStrength_confidence": 0.82
```

### On findings

```json
{
  "type": "WEAKNESS",
  "category": "COMPLIANCE",
  "title": "RERA number illegible at 6pt gray-on-white",
  "description": "disclaimerLegibilityScore = 32 despite mandatoryDisclaimerPresent = true. RERA text sits below WCAG contrast threshold.",
  "recommendation": "Increase disclaimer type to 10pt minimum and shift to solid dark tone; target legibility ≥65.",
  "impactPriority": "HIGH",
  "effortEstimate": "LOW",
  "expectedLift": "Reduces policy review flag risk by ~40% (internal benchmark, real_estate)",
  "verticalBenchmarkDelta": -18,
  "evidenceRefs": ["compliance.disclaimerLegibilityScore", "descriptive.textBlocks[4]"]
}
```

### New top-level field

```json
"quickWins": [
  "Swap headline CTA from 'Learn More' to 'Book Site Visit' — matches objective without design changes.",
  "Add 'RERA-approved' as a suffix to headline text in ad manager copy for extra trust signal."
]
```

### New audit field

```json
"scoring": {
  "creativeEffectivenessScore": 62,
  "subscores": { ... },
  "confidenceInterval": [56, 68],
  "appliedRules": ["boost:exceptional_offer", "cap:missing_mandatory_disclosure"],
  "vertical": "real_estate",
  "objective": "PPC_CONVERSION"
}
```

---

## 9. Prompt injection order (call construction)

For the extraction call:

```ts
const systemPrompt = SIGNAL_SYSTEM_PROMPT
  .replace("{inject SCORE_ANCHORS constant verbatim here}", SCORE_ANCHORS)
  .replace("{inject VERTICAL_COMPLIANCE_RULES constant verbatim here}", VERTICAL_COMPLIANCE_RULES)
  .replace("{inject the full extraction schema ... here}", JSON.stringify(EXTRACTION_SCHEMA, null, 2));

const response = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL || "gpt-4o",
  temperature: 0.15,                          // TIGHTENED from 0.2 for score consistency
  response_format: { type: "json_object" },
  seed: 42,                                   // NEW: for reproducibility during regression runs
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: [
        { type: "text", text: JSON.stringify({ campaignContext, brandFingerprintDiff, localImageMath }) },
        { type: "image_url", image_url: { url: `data:image/png;base64,${originalBase64}`, detail: "high" } },
        { type: "image_url", image_url: { url: `data:image/png;base64,${thumbnailBase64}`, detail: "high" } }
      ]
    }
  ]
});
```

For the synthesis call:

```ts
const synthesis = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL || "gpt-4o",
  temperature: 0.35,                          // TIGHTENED from 0.4 for wording consistency
  response_format: { type: "json_object" },
  seed: 42,
  messages: [
    { role: "system", content: SIGNAL_SYNTHESIS_PROMPT },
    { role: "user", content: JSON.stringify(extractionJsonWithCES) }
  ]
});
```

**Key parameter changes:**
- `temperature` reduced (0.2 → 0.15 extraction, 0.4 → 0.35 synthesis) for consistency across runs on the same creative.
- `seed: 42` added for reproducibility during regression testing. Remove or randomise in production if consistent same-image outputs are undesirable.

---

## 10. Validation criteria (must pass before shipping)

Run these on the 30-creative regression pack before merging.

1. **Score spread test.** For each scored parameter across the 30 creatives, distribution must have standard deviation ≥ 15 (on a 0–100 scale). Middle-bias failure if all creatives cluster around 50–60.
2. **Evidence completeness.** 100% of scored parameters must have a non-null `_evidence` string of at least 8 words. Zero tolerance.
3. **Confidence honesty.** Creatives with known-blurry OCR (deliberately included in the regression pack) must have `ocrConfidence < 0.7` AND their CES must trigger the `low_ocr_confidence` hard cap.
4. **Findings priority ordering.** Findings must be sorted by (impactPriority DESC, effortEstimate ASC). Automated check on output.
5. **No forbidden phrases.** Grep the synthesis output for "consider", "perhaps", "might want to". Zero occurrences allowed.
6. **CES anti-inflation.** No creative in the regression pack scores > 85 unless it passes: focalPointDominance ≥ 0.55, hierarchyClarityScore ≥ 75, specificityScore ≥ 60, platformPolicyRiskScore < 30.
7. **Determinism check.** Run the same creative 5 times. CES must be within ± 4 across runs. Larger variance = temperature still too high.
8. **Compliance recall.** Known-non-compliant creatives (deliberately included: missing RERA, superlatives, before/after) must trigger the correct compliance flags AND the correct hard cap. Recall target: 100% on known cases.
9. **Vertical calibration sanity.** Compare CES distributions per vertical. Healthcare and insurance creatives should skew slightly lower than d2c_jewellery on average (higher compliance load). If distributions are identical, weights aren't doing their job.

---

## 11. Deliverables checklist

- [ ] Replace `signal-system-prompt.ts` with the new extraction prompt (Section 4)
- [ ] Replace `signal-synthesis-prompt.ts` with the new synthesis prompt (Section 5)
- [ ] Create `score-anchors.ts` (Section 3)
- [ ] Create `vertical-compliance-rules.ts` (Section 6)
- [ ] Replace `ces-weights.json` with v2 weights + boostRules + expanded hardCaps (Section 7)
- [ ] Update CES engine to apply boostRules before hardCaps and to emit `appliedRules` audit array (Section 7)
- [ ] Extend schema with `_evidence` + `_confidence` on every scored parameter (Section 8)
- [ ] Add `quickWins` + `appliedRules` to top-level output shape (Section 8)
- [ ] Update OpenAI call params: temperature 0.15 / 0.35, add `seed: 42` for regression, remove for production if undesired (Section 9)
- [ ] Run 30-creative regression pack against all validation criteria (Section 10)
- [ ] Shadow-run for one week alongside current prompts before cutover
- [ ] Update UI to surface `_evidence` on hover for each score, and to render `quickWins` as a dedicated action card

---

## 12. What this refinement is NOT

To keep this focused, the following are explicitly OUT of scope:

- No provider changes. OpenAI stays the only vision provider.
- No pipeline restructuring. Two-call flow remains: extraction → local scoring → synthesis.
- No new external dependencies.
- No landing page continuity feature (deferred — separate ticket).
- No cross-creative portfolio analysis (deferred — separate ticket).
- No model change (stay on gpt-4o until we benchmark alternatives on the regression pack).

---

**End of brief.** Ping engine lead if any anchor rubric, weight, or hard-cap rule is ambiguous before implementation. The single biggest win is Section 3 (anchors) — get that right and 60% of the accuracy gain follows automatically.
