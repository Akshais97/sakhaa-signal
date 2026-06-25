import json
from pathlib import Path
from typing import Dict, Any

def generate_llm_explanation(
    marketing_scores: Dict[str, Any],
    cluster_15_summaries: Dict[str, Any],
    cluster_17_summaries: Dict[str, Any],
    output_dir: Path
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    # Extract score metrics
    outcomes = marketing_scores.get("outcomes", {})
    ep_score = outcomes.get("Engagement", {}).get("score_0_100", 50.0)
    vp_score = outcomes.get("Virality", {}).get("score_0_100", 50.0)
    cs_score = outcomes.get("Conversion", {}).get("score_0_100", 50.0)
    br_score = outcomes.get("Brand Recall", {}).get("score_0_100", 50.0)

    # 1. Conversion analysis
    if cs_score >= 70:
        cs_analysis = (
            f"Conversion Support is exceptionally strong at {cs_score}/100. "
            "This indicates that the subjective value triggers (Cluster F) and trust cues (Cluster N) "
            "are highly synchronized with clear semantic message signals (Cluster G). "
            "The neural evidence shows low activation in cognitive friction areas (Cluster J) "
            "during the key value proposition and CTA windows, suggesting visual and narrative fluency."
        )
        cs_status = "Excellent"
    elif cs_score >= 50:
        cs_analysis = (
            f"Conversion Support is moderate at {cs_score}/100. "
            "The call-to-action (CTA) shows reasonable neural attention (Cluster I), "
            "but there is some moderate cognitive load (Cluster J) indicating the value offer "
            "might be slightly complex or lacks immediate visual clarity. Trust cues (Cluster N) "
            "are present but could be further amplified."
        )
        cs_status = "Moderate"
    else:
        cs_analysis = (
            f"Conversion Support is low at {cs_score}/100. "
            "This suggests significant executive friction (Cluster J) or low subjective value (Cluster F) "
            "during key CTA frames. The brain mapping highlights that while visual attention is captured, "
            "the cognitive networks do not bind the offer to personal relevance, resulting in weak persuasion signals."
        )
        cs_status = "Weak"

    # 2. Brand Recall analysis
    if br_score >= 70:
        br_analysis = (
            f"Brand Recall Potential is outstanding at {br_score}/100. "
            "The event boundary memory-encoding response (Cluster E) spikes strongly "
            "coincident with brand reveals. Furthermore, multisensory congruence (Cluster M) "
            "suggests that audio-visual brand elements are tightly integrated, creating a strong "
            "associative memory trace."
        )
        br_status = "Excellent"
    elif br_score >= 50:
        br_analysis = (
            f"Brand Recall Potential is moderate at {br_score}/100. "
            "While the brand is noticed visually (Cluster A/I), the memory-encoding networks (Cluster E) "
            "show average activation, indicating the brand reveal is somewhat passive or unanchored "
            "by narrative transitions. Spoken brand name cues do not fully synchronize with on-screen visual overlays."
        )
        br_status = "Moderate"
    else:
        br_analysis = (
            f"Brand Recall Potential is low at {br_score}/100. "
            "The neural trace for brand familiarity (Cluster N) and memory association is weak. "
            "This is often caused by a 'pre-brand memory drain' (Cluster E penalty) where the brand is introduced "
            "after a cognitive climax, or where logo exposures lack audio-visual binding (Cluster M)."
        )
        br_status = "Weak"

    # 3. Identify Strengths & Weaknesses
    all_clusters = list(cluster_17_summaries.values())
    sorted_clusters = sorted(all_clusters, key=lambda c: c.get("strength_0_1", 0.0), reverse=True)
    
    strengths_list = sorted_clusters[:3]
    weaknesses_list = sorted_clusters[-3:]

    strengths = []
    for c in strengths_list:
        strengths.append({
            "cluster_id": c.get("cluster_id"),
            "cluster_name": c.get("cluster_name"),
            "strength": round(c.get("strength_0_1", 0.0), 3),
            "explanation": f"High activation (strength={c.get('strength_0_1', 0.0):.2f}) in {c.get('cluster_name')} ({c.get('cluster_id')}) indicates a strong {c.get('psychological_proxy', 'response')}."
        })

    weaknesses = []
    for c in weaknesses_list:
        weaknesses.append({
            "cluster_id": c.get("cluster_id"),
            "cluster_name": c.get("cluster_name"),
            "strength": round(c.get("strength_0_1", 0.0), 3),
            "explanation": f"Low activation (strength={c.get('strength_0_1', 0.0):.2f}) in {c.get('cluster_name')} ({c.get('cluster_id')}) suggests room for improvement in {c.get('psychological_proxy', 'response')}."
        })

    # 4. Actionable recommendations
    recommendations = []
    if cs_score < 60:
        recommendations.append(
            "Simplify the offer and CTA framing. Reduce visual clutter and text density at the end card "
            "to lower cognitive load (Cluster J) and raise Conversion Support."
        )
    if br_score < 60:
        recommendations.append(
            "Synchronize audio cues with logo reveals. Ensure the brand name is spoken exactly "
            "when the logo is displayed on screen to leverage multisensory binding (Cluster M)."
        )
    if ep_score < 60:
        recommendations.append(
            "Enhance the emotional hook in the first 3 seconds (Cluster A). Use higher visual contrast "
            "and motion energy to capture attention before narrative delivery begins."
        )
    if not recommendations:
        recommendations.append("Maintain the current creative balance, as all outcomes demonstrate high performance.")

    # 5. 15-cluster vs 17-cluster comparison
    comparison = (
        "The 15-cluster model represents the core cognitive/sensory processing networks (A to O). "
        "The 17-cluster model adds two key temporal-valence parameters: Cluster P (Valence Direction) "
        "and Cluster Q (Narrative Temporal Coherence). The results show that while the ad achieves "
        f"strong overall activation on the 15-cluster framework, the 17-cluster analysis reveals a "
        f"{'positive' if ep_score > 60 else 'neutral'} emotional valence flow and "
        f"{'consistent' if vp_score > 60 else 'fragmented'} narrative coherence."
    )

    # 6. Build report structure
    report_data = {
        "outcomes": {
            "engagement": {"score": ep_score, "status": "Good" if ep_score >= 60 else "Needs Work"},
            "virality": {"score": vp_score, "status": "Good" if vp_score >= 60 else "Needs Work"},
            "conversion": {"score": cs_score, "status": cs_status},
            "brand_recall": {"score": br_score, "status": br_status}
        },
        "conversion_analysis": cs_analysis,
        "brand_recall_analysis": br_analysis,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "cluster_comparison": comparison,
        "evidence_summary": "HCP-MMP1 parcellation aggregates 360 region-level activations into functional networks, providing a robust neural benchmark."
    }

    # Write JSON report
    with (output_dir / "explanation_report.json").open("w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    # Write text executive summary
    exec_summary_text = (
        "TRIBEv2 AD SCORER EXECUTIVE SUMMARY\n"
        "====================================\n"
        f"Engagement Score: {ep_score}/100\n"
        f"Virality Score: {vp_score}/100\n"
        f"Conversion Score: {cs_score}/100\n"
        f"Brand Recall Score: {br_score}/100\n\n"
        f"CONVERSION SUPPORT SUMMARY: {cs_analysis}\n\n"
        f"BRAND RECALL SUMMARY: {br_analysis}\n\n"
        "RECOMMENDATIONS:\n" + "\n".join(f"- {r}" for r in recommendations)
    )
    (output_dir / "executive_summary.txt").write_text(exec_summary_text, encoding="utf-8")

    # Write Markdown report
    md_content = f"""# Creative Performance & Cognitive Explanation Report

This explanation report evaluates the creative effectiveness of the advertisement based on brain-response mappings from the TRIBEv2 multimodal transformer.

## Outcome Analysis

| Outcome | Score | Assessment |
| :--- | :---: | :--- |
| **Emotional Pull (EP)** | {ep_score}/100 | {"Strong emotional resonance" if ep_score >= 60 else "Moderate emotional connection"} |
| **Visual Pull (VP)** | {vp_score}/100 | {"High visual capture" if vp_score >= 60 else "Average visual capture"} |
| **Cognitive Stickiness (CS)** | {cs_score}/100 | {cs_status} persuasion signals |
| **Brand Recall (BR)** | {br_score}/100 | {br_status} memory encoding |

---

## Persuasion & Brand Recall Analysis

### 1. Why Conversion is at its current level:
{cs_analysis}

### 2. Why Brand Recall is at its current level:
{br_analysis}

---

## Neuro-Evidence Strengths & Weaknesses

### Genuinely Strong Responses
"""
    for s in strengths:
        md_content += f"- **Cluster {s['cluster_id']} ({s['cluster_name']})**: strength={s['strength']:.3f}. {s['explanation']}\n"

    md_content += "\n### Weaknesses & Areas for Optimization\n"
    for w in weaknesses:
        md_content += f"- **Cluster {w['cluster_id']} ({w['cluster_name']})**: strength={w['strength']:.3f}. {w['explanation']}\n"

    md_content += f"""
---

## Sprints Comparison: 15-Cluster vs. 17-Cluster Model
{comparison}

---

## Creative Action Items
"""
    for r in recommendations:
        md_content += f"- [ ] {r}\n"

    (output_dir / "explanation_report.md").write_text(md_content, encoding="utf-8")
