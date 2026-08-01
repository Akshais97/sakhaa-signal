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
