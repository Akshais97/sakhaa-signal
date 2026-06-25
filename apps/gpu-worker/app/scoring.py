import csv
import json
import math
from dataclasses import dataclass, asdict
from pathlib import Path
from statistics import mean
from typing import Any, Iterable, Dict, List, Tuple

@dataclass
class ClusterSummary:
    cluster_id: str
    cluster_name: str
    matched_region_count: int
    missing_parcels: List[str]
    mean_activation: float
    max_activation: float
    min_activation: float
    std_activation_mean: float
    total_vertices: int
    peak_timestep: int | None
    hook_mean_0_3s: float
    whole_video_timeseries_mean: float
    strength_0_1: float
    activation_label: str
    psychological_proxy: str
    primary_outcomes: str
    scoring_windows: str
    scoring_logic: str
    negative_or_penalty_logic: str
    why_it_matters: str
    caveat: str
    top_regions: List[Dict[str, Any]]

def read_csv_rows(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))

def read_timeseries(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        columns = reader.fieldnames or []
        rows = []
        for row in reader:
            parsed_row = {}
            for key, val in row.items():
                try:
                    parsed_row[key] = float(val) if val else 0.0
                except ValueError:
                    parsed_row[key] = 0.0
            rows.append(parsed_row)
    return {"columns": columns, "rows": rows}

def parcel_to_hcp_names(parcel: str) -> Tuple[str, str]:
    clean = parcel.strip()
    if clean.endswith("_ROI"):
        clean = clean[:-4]
    if clean.startswith(("L_", "R_")):
        clean = clean[2:]
    return f"L_{clean}_ROI", f"R_{clean}_ROI"

def match_hcp_columns(parcel_expression: str, columns: Iterable[str]) -> Tuple[List[str], List[str]]:
    column_set = set(columns)
    matched: List[str] = []
    missing: List[str] = []
    for raw_parcel in parcel_expression.split("|"):
        parcel = raw_parcel.strip()
        if not parcel:
            continue
        l_name, r_name = parcel_to_hcp_names(parcel)
        found = []
        if l_name in column_set:
            found.append(l_name)
        if r_name in column_set:
            found.append(r_name)
        if found:
            matched.extend(found)
        else:
            missing.append(parcel)
    return matched, missing

def build_cluster_summaries(
    reference_rows: List[Dict[str, str]],
    activation_rows: List[Dict[str, str]],
    timeseries: Dict[str, Any],
) -> Dict[str, ClusterSummary]:
    activation_by_region = {row["region_name"]: row for row in activation_rows}
    region_columns = list(timeseries["columns"])
    ts_rows = list(timeseries["rows"])
    summaries: Dict[str, ClusterSummary] = {}

    for ref in reference_rows:
        cluster_id = ref["cluster_id"].strip()
        matched, missing = match_hcp_columns(
            ref["hcp_parcels_bilateral"],
            region_columns,
        )
        matched_rows = [
            activation_by_region[name]
            for name in matched
            if name in activation_by_region
        ]
        
        mean_values = [float(row["mean_activation"]) for row in matched_rows]
        max_values = [float(row.get("max_activation", row["mean_activation"])) for row in matched_rows]
        min_values = [float(row.get("min_activation", row["mean_activation"])) for row in matched_rows]
        std_values = [float(row.get("std_activation", 0.0)) for row in matched_rows]
        
        cluster_series = []
        for row in ts_rows:
            vals = [row[name] for name in matched if name in row]
            cluster_series.append(mean(vals) if vals else 0.0)
            
        hook_values = cluster_series[:min(3, len(cluster_series))]
        peak_timestep = (
            max(range(len(cluster_series)), key=lambda idx: cluster_series[idx])
            if cluster_series
            else None
        )
        
        top_regions = sorted(
            [
                {
                    "region_name": row["region_name"],
                    "mean_activation": float(row["mean_activation"]),
                    "peak_timestep": int(float(row.get("peak_timestep", 0))),
                    "n_vertices": int(row["n_vertices"]),
                }
                for row in matched_rows
            ],
            key=lambda item: item["mean_activation"],
            reverse=True,
        )[:8]

        summaries[cluster_id] = ClusterSummary(
            cluster_id=cluster_id,
            cluster_name=ref["cluster_name"],
            matched_region_count=len(matched_rows),
            missing_parcels=missing,
            mean_activation=mean(mean_values) if mean_values else 0.0,
            max_activation=max(max_values) if max_values else 0.0,
            min_activation=min(min_values) if min_values else 0.0,
            std_activation_mean=mean(std_values) if std_values else 0.0,
            total_vertices=sum(int(row["n_vertices"]) for row in matched_rows),
            peak_timestep=peak_timestep,
            hook_mean_0_3s=mean(hook_values) if hook_values else 0.0,
            whole_video_timeseries_mean=mean(cluster_series) if cluster_series else 0.0,
            strength_0_1=0.0,
            activation_label="not computed",
            psychological_proxy=ref.get("cognitive_neuro_functions", "") or ref.get("psychological_proxy", ""),
            primary_outcomes=ref.get("primary_marketing_kpi", "") or ref.get("primary_outcomes", ""),
            scoring_windows=ref.get("creative_stimuli_triggers", "") or ref.get("scoring_windows", ""),
            scoring_logic=ref.get("algorithmic_neuro_equation_mapping", "") or ref.get("scoring_logic", ""),
            negative_or_penalty_logic=ref.get("mismatches_risk", "") or ref.get("negative_or_penalty_logic", ""),
            why_it_matters=ref.get("why_it_matters_hook_retention_conversion", "") or ref.get("why_it_matters", ""),
            caveat=ref.get("caveat_reverse_inference", "") or ref.get("caveat", ""),
            top_regions=top_regions,
        )

    apply_strength_labels(summaries.values())
    return summaries

def apply_strength_labels(summaries: Iterable[ClusterSummary]) -> None:
    items = list(summaries)
    if not items:
        return
    values = [item.mean_activation for item in items]
    low, high = min(values), max(values)
    spread = high - low
    for item in items:
        item.strength_0_1 = 0.5 if spread == 0 else (item.mean_activation - low) / spread
        if item.mean_activation <= 0:
            item.activation_label = "suppressed/low"
        elif item.strength_0_1 >= 0.75:
            item.activation_label = "strongly activated"
        elif item.strength_0_1 >= 0.5:
            item.activation_label = "activated"
        else:
            item.activation_label = "weakly activated"

def term(factor: str, weight: float, clusters: str, role: str = "positive") -> dict[str, Any]:
    return {
        "factor": factor,
        "weight": weight,
        "clusters": list(clusters),
        "role": role,
    }

# Canonical provisional weights transcribing the neuromarketing outcome equations
OUTCOMES: Dict[str, Dict[str, Any]] = {
    "Engagement": {
        "code": "EP",
        "terms": [
            term("C_social", 0.20, "C"),
            term("A_hook", 0.15, "A"),
            term("D_moderate", 0.13, "D"),
            term("G_clarity", 0.12, "G"),
            term("I_target", 0.11, "I"),
            term("B_person", 0.08, "B"),
            term("H_audio", 0.06, "H"),
            term("L_resolved", 0.05, "LG"),
            term("Q_story_arc", 0.04, "Q"),
            term("M_congruent", 0.04, "M"),
            term("P_positive_tone", 0.03, "P"),
            term("O_fluency", 0.03, "O"),
            term("BxI_gaze_cue", 0.05, "BI", "interaction"),
            term("HxP_music", 0.04, "HP", "interaction"),
            term("J_friction", 0.12, "JG", "penalty"),
            term("D_high", 0.09, "D", "penalty"),
            term("P_neg_unresolved", 0.06, "P", "penalty"),
        ],
    },
    "Virality": {
        "code": "VP",
        "terms": [
            term("D_high_arousal", 0.18, "D"),
            term("C_social", 0.15, "C"),
            term("F_identity", 0.14, "F"),
            term("P_positive", 0.12, "P"),
            term("FxC_identity_expr", 0.11, "FC", "interaction"),
            term("A_hook", 0.08, "A"),
            term("L_resolved", 0.06, "LG"),
            term("N_symbolic", 0.05, "N"),
            term("H_audio", 0.05, "H"),
            term("Q_resolved_arc", 0.04, "QGE"),
            term("AxBxC_biomotion", 0.06, "ABC", "interaction"),
            term("B_human", 0.04, "B"),
            term("M_congruent", 0.03, "M"),
            term("O_polish", 0.02, "O"),
            term("D_high_penalty", 0.10, "D", "penalty"),
            term("J_unresolved", 0.08, "JG", "penalty"),
            term("P_neg_climax", 0.05, "P", "penalty"),
            term("low_G_after_L", 0.03, "GL", "penalty"),
        ],
    },
    "Conversion": {
        "code": "CS",
        "terms": [
            term("F_value_CTA", 0.26, "F"),
            term("N_trust", 0.17, "N"),
            term("G_offer_clarity", 0.14, "G"),
            term("P_positive_at_CTA", 0.11, "P"),
            term("I_CTA", 0.10, "I"),
            term("E_offer_encoded", 0.07, "E"),
            term("K_product_use", 0.06, "K"),
            term("F_urgency_scarcity", 0.05, "F"),
            term("M_CTA_binding", 0.05, "M"),
            term("O_premium", 0.04, "O"),
            term("J_friction_CTA", 0.18, "JG", "penalty"),
            term("D_high_at_CTA", 0.14, "D", "penalty"),
            term("L_unresolved_CTA", 0.07, "LG", "penalty"),
        ],
    },
    "Brand Recall": {
        "code": "BR",
        "terms": [
            term("E_brand_boundary", 0.24, "E"),
            term("N_brand_trust", 0.18, "N"),
            term("M_logo_audio_binding", 0.15, "M"),
            term("F_self_reference", 0.13, "F"),
            term("G_brand_semantics", 0.11, "G"),
            term("P_positive_at_brand", 0.07, "P"),
            term("H_sonic_logo", 0.05, "H"),
            term("I_brand_attention", 0.04, "I"),
            term("B_scene_context", 0.04, "B"),
            term("A_brand_visual", 0.03, "A"),
            term("O_brand_aesthetic", 0.03, "O"),
            term("BxK_expression_contagion", 0.05, "BK", "interaction"),
            term("E_unbranded_prebrand", 0.15, "EN", "penalty"),
            term("J_confusion", 0.08, "JG", "penalty"),
        ],
    },
}

TIMING_PROXY_FACTORS = {
    "A_hook", "F_value_CTA", "P_positive_at_CTA", "I_CTA", "E_offer_encoded",
    "M_CTA_binding", "J_friction_CTA", "D_high_at_CTA", "L_unresolved_CTA",
    "E_brand_boundary", "N_brand_trust", "M_logo_audio_binding", "P_positive_at_brand",
    "H_sonic_logo", "I_brand_attention", "A_brand_visual", "E_unbranded_prebrand", "P_neg_climax"
}

def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, float(value)))

def coactivation(*values: float) -> float:
    return min(clamp(value) for value in values) if values else 0.0

def cluster_strength(clusters: Dict[str, ClusterSummary], cluster_id: str) -> float | None:
    item = clusters.get(cluster_id)
    if item is None:
        return None
    return clamp(float(item.strength_0_1))

def p_valence(clusters: Dict[str, ClusterSummary]) -> Tuple[float | None, float | None]:
    item = clusters.get("P")
    if item is None:
        return None, None
    strength = clamp(float(item.strength_0_1))
    mean_activation = float(item.mean_activation)
    if mean_activation >= 0:
        return strength, 0.0
    return 0.0, clamp(1.0 - strength)

def derive_factor(
    factor: str,
    clusters: Dict[str, ClusterSummary],
    context: Dict[str, Any],
) -> Tuple[float | None, str, str]:
    overrides = context.get("factor_overrides", {})
    if factor in overrides:
        value = clamp(float(overrides[factor]))
        return value, "measured_override", "Supplied explicitly in factor_overrides."

    s = {letter: cluster_strength(clusters, letter) for letter in "ABCDEFGHIJKLMNOPQ"}
    positive_p, negative_p = p_valence(clusters)

    required = next(
        (
            definition["clusters"]
            for outcome in OUTCOMES.values()
            for definition in outcome["terms"]
            if definition["factor"] == factor
        ),
        [],
    )
    missing = sorted({letter for letter in required if s.get(letter) is None})
    if missing:
        return None, "unavailable", f"Missing upstream cluster(s): {', '.join(missing)}."

    base_factor = {
        "C_social": "C", "A_hook": "A", "G_clarity": "G", "I_target": "I",
        "B_person": "B", "H_audio": "H", "Q_story_arc": "Q", "M_congruent": "M",
        "O_fluency": "O", "D_high_arousal": "D", "F_identity": "F", "N_symbolic": "N",
        "B_human": "B", "O_polish": "O", "F_value_CTA": "F", "N_trust": "N",
        "G_offer_clarity": "G", "I_CTA": "I", "E_offer_encoded": "E", "K_product_use": "K",
        "M_CTA_binding": "M", "O_premium": "O", "E_brand_boundary": "E", "N_brand_trust": "N",
        "M_logo_audio_binding": "M", "F_self_reference": "F", "G_brand_semantics": "G",
        "H_sonic_logo": "H", "I_brand_attention": "I", "B_scene_context": "B",
        "A_brand_visual": "A", "O_brand_aesthetic": "O",
    }
    
    if factor in base_factor:
        value = s[base_factor[factor]]
    elif factor == "D_moderate":
        value = max(0.0, 1.0 - abs(float(s["D"] or 0.0) - 0.55) / 0.55)
    elif factor in {"D_high", "D_high_penalty", "D_high_at_CTA"}:
        value = max(0.0, (float(s["D"] or 0.0) - 0.75) / 0.25)
    elif factor in {"P_positive_tone", "P_positive", "P_positive_at_CTA", "P_positive_at_brand"}:
        value = positive_p
    elif factor in {"P_neg_unresolved", "P_neg_climax"}:
        value = negative_p
    elif factor == "L_resolved":
        value = coactivation(float(s["L"] or 0.0), float(s["G"] or 0.0))
    elif factor in {"L_unresolved_CTA"}:
        value = float(s["L"] or 0.0) * (1.0 - float(s["G"] or 0.0))
    elif factor in {"J_friction", "J_unresolved", "J_friction_CTA", "J_confusion"}:
        value = float(s["J"] or 0.0) * (1.0 - float(s["G"] or 0.0))
    elif factor == "low_G_after_L":
        value = float(s["L"] or 0.0) * (1.0 - float(s["G"] or 0.0))
    elif factor == "Q_resolved_arc":
        value = coactivation(float(s["Q"] or 0.0), float(s["G"] or 0.0), float(s["E"] or 0.0))
    elif factor == "HxP_music":
        value = coactivation(float(s["H"] or 0.0), float(positive_p or 0.0))
    elif factor == "FxC_identity_expr":
        value = coactivation(float(s["F"] or 0.0), float(s["C"] or 0.0))
    elif factor == "E_unbranded_prebrand":
        value = float(s["E"] or 0.0) * (1.0 - float(s["N"] or 0.0))
    elif factor == "F_urgency_scarcity":
        if not context.get("scarcity_framed", False):
            return 0.0, "context_gated", "Zero unless scarcity_framed is explicitly true."
        value = float(s["F"] or 0.0)
    elif factor == "BxI_gaze_cue":
        if not context.get("gaze_cue_to_product_or_cta", False):
            return 0.0, "context_gated", "Zero unless product/CTA gaze cue is explicitly supplied."
        value = coactivation(float(s["B"] or 0.0), float(s["I"] or 0.0))
    elif factor == "AxBxC_biomotion":
        if not context.get("biological_motion_present", False):
            return 0.0, "context_gated", "Zero unless biological motion is explicitly supplied."
        value = coactivation(float(s["A"] or 0.0), float(s["B"] or 0.0), float(s["C"] or 0.0))
    elif factor == "BxK_expression_contagion":
        if not context.get("expressive_face_at_brand", False):
            return 0.0, "context_gated", "Zero unless expressive face at brand is explicitly supplied."
        value = coactivation(float(s["B"] or 0.0), float(s["K"] or 0.0))
    else:
        raise KeyError(f"Unimplemented factor: {factor}")

    if factor.startswith("Q_") and context.get("story_format") is False:
        return 0.0, "context_gated", "Zero because story_format is explicitly false."

    status = "whole_video_proxy"
    note = "Derived from normalized whole-video cluster strength."
    if factor in TIMING_PROXY_FACTORS:
        status = "timing_proxy"
        note = "Required event timing was not supplied; whole-video cluster strength is a proxy."
    elif "x" in factor:
        status = "interaction_proxy"
        note = "Uses min(cluster strengths); summary data does not prove same-window coactivation."
    return clamp(float(value or 0.0)), status, note

def score_outcome(
    definition: dict[str, Any],
    clusters: Dict[str, ClusterSummary],
    context: Dict[str, Any],
) -> dict[str, Any]:
    rows = []
    raw_index = 0.0
    available_positive_capacity = 0.0
    available_abs_weight = 0.0
    measured_override_weight = 0.0
    proxy_weight = 0.0
    total_abs_weight = sum(float(item["weight"]) for item in definition["terms"])

    for item in definition["terms"]:
        value, status, note = derive_factor(item["factor"], clusters, context)
        sign = -1.0 if item["role"] == "penalty" else 1.0
        contribution = None if value is None else sign * float(item["weight"]) * value
        if contribution is not None:
            raw_index += contribution
            available_abs_weight += float(item["weight"])
            if status == "measured_override":
                measured_override_weight += float(item["weight"])
            if status in {"whole_video_proxy", "timing_proxy", "interaction_proxy"}:
                proxy_weight += float(item["weight"])
            if item["role"] != "penalty":
                available_positive_capacity += float(item["weight"])
        rows.append(
            {
                **item,
                "value_0_1": None if value is None else round(value, 6),
                "signed_contribution": None if contribution is None else round(contribution, 6),
                "points_0_100": None if contribution is None else round(contribution * 100.0, 2),
                "status": status,
                "note": note,
            }
        )

    normalized = 0.0 if available_positive_capacity == 0 else raw_index / available_positive_capacity
    return {
        "code": definition["code"],
        "score_0_100": round(clamp(normalized) * 100.0, 1),
        "raw_weighted_index": round(raw_index, 6),
        "available_positive_weight": round(available_positive_capacity, 4),
        "formula_weight_coverage_0_1": round(available_abs_weight / total_abs_weight, 4),
        "measured_override_coverage_0_1": round(
            measured_override_weight / total_abs_weight,
            4,
        ),
        "proxy_weight_share_0_1": round(proxy_weight / total_abs_weight, 4),
        "contributions": rows,
    }

def compact_cluster(item: ClusterSummary) -> dict[str, Any]:
    d = asdict(item)
    return {
        "cluster_id": d.get("cluster_id"),
        "cluster_name": d.get("cluster_name"),
        "strength_0_1": d.get("strength_0_1"),
        "mean_activation": d.get("mean_activation"),
        "activation_label": d.get("activation_label"),
        "matched_region_count": d.get("matched_region_count"),
        "missing_parcels": d.get("missing_parcels", []),
        "psychological_proxy": d.get("psychological_proxy"),
        "caveat": d.get("caveat"),
        "top_regions": d.get("top_regions", [])[:8],
    }

def build_score_report(
    clusters: Dict[str, ClusterSummary],
    context: Dict[str, Any],
) -> dict[str, Any]:
    missing_clusters = [letter for letter in "ABCDEFGHIJKLMNOPQ" if letter not in clusters]
    outcomes = {
        name: score_outcome(definition, clusters, context)
        for name, definition in OUTCOMES.items()
    }
    warnings = [
        "Weights are provisional research priors and are not calibrated business KPI probabilities.",
        "The dashboard specifies sigma notation but no sigmoid midpoint/slope; scores use a transparent bounded weighted normalization.",
        "Timing-specific terms remain proxies unless factor_overrides supplies measured 0-1 values.",
        "TRIBE/HCP outputs are predictive cortical proxies, not direct measurements of a viewer's thoughts or purchase intent.",
    ]
    if missing_clusters:
        warnings.append(
            f"Missing clusters were not fabricated: {', '.join(missing_clusters)}."
        )
    return {
        "schema_version": "tribev2-marketing-score-v1",
        "methodology": {
            "weight_source": "tribe_weighted_equations_dashboard.html",
            "cluster_source": "tribe_cluster_v4_final.html",
            "calibration_status": "research_prior_uncalibrated",
            "normalization": "100 * clamp(raw_weighted_index / available_positive_weight, 0, 1)",
            "interaction_rule": "min(normalized coactive factors), matching v4 recommendation",
            "d_thresholds": {
                "moderate_center": 0.55,
                "excessive_high_start": 0.75,
            },
        },
        "context": context,
        "data_quality": {
            "missing_clusters": missing_clusters,
            "warnings": warnings,
        },
        "outcomes": outcomes,
        "clusters": {
            key: compact_cluster(value)
            for key, value in sorted(clusters.items())
        },
    }

def write_outcome_csv(report: dict[str, Any], path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "outcome",
                "code",
                "score_0_100",
                "raw_weighted_index",
                "available_positive_weight",
                "formula_weight_coverage_0_1",
                "measured_override_coverage_0_1",
                "proxy_weight_share_0_1",
            ]
        )
        for name, payload in report["outcomes"].items():
            writer.writerow(
                [
                    name,
                    payload["code"],
                    payload["score_0_100"],
                    payload["raw_weighted_index"],
                    payload["available_positive_weight"],
                    payload["formula_weight_coverage_0_1"],
                    payload["measured_override_coverage_0_1"],
                    payload["proxy_weight_share_0_1"],
                ]
            )

def write_contribution_csv(report: dict[str, Any], path: Path) -> None:
    fields = [
        "outcome",
        "factor",
        "clusters",
        "role",
        "weight",
        "value_0_1",
        "signed_contribution",
        "points_0_100",
        "status",
        "note",
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for outcome, payload in report["outcomes"].items():
            for row in payload["contributions"]:
                writer.writerow(
                    {
                        **row,
                        "outcome": outcome,
                        "clusters": "|".join(row["clusters"]),
                    }
                )

def markdown_report(report: dict[str, Any]) -> str:
    lines = [
        "# TRIBE v2 Marketing Score Report (17-Cluster Model)",
        "",
        "This report aggregates HCP-MMP1 predictions into the canonical 17 A-Q clusters and computes outcome scores using weighted neuro-equations.",
        "",
        "| Outcome | Score / 100 | Formula coverage | Measured override coverage |",
        "|---|---:|---:|---:|",
    ]
    for name, payload in report["outcomes"].items():
        lines.append(
            f"| {name} | {payload['score_0_100']:.1f} | "
            f"{payload['formula_weight_coverage_0_1'] * 100:.1f}% | "
            f"{payload['measured_override_coverage_0_1'] * 100:.1f}% |"
        )
    lines.extend(["", "## Factor Contributions", ""])
    for name, payload in report["outcomes"].items():
        lines.extend(
            [
                f"### {name}",
                "",
                "| Factor | Role | Value | Points | Evidence status |",
                "|---|---|---:|---:|---|",
            ]
        )
        for row in payload["contributions"]:
            value = "N/A" if row["value_0_1"] is None else f"{row['value_0_1']:.3f}"
            points = "N/A" if row["points_0_100"] is None else f"{row['points_0_100']:+.2f}"
            lines.append(
                f"| {row['factor']} | {row['role']} | {value} | {points} | "
                f"{row['status']} |"
            )
        lines.append("")
    lines.extend(["## Verified HCP-MMP1 Evidence", ""])
    for cluster_id, cluster in report["clusters"].items():
        regions = ", ".join(
            f"{row.get('region_name')} ({float(row.get('mean_activation', 0.0)):.3f})"
            for row in cluster.get("top_regions", [])[:5]
        )
        lines.append(
            f"- **{cluster_id}. {cluster.get('cluster_name')}**: "
            f"strength={float(cluster.get('strength_0_1') or 0):.3f}; "
            f"top parcels={regions or 'none'}."
        )
    lines.extend(["", "## Guardrails", ""])
    lines.extend(f"- {warning}" for warning in report["data_quality"]["warnings"])
    return "\n".join(lines) + "\n"

def execute_scoring(
    reference_path: Path,
    activations_path: Path,
    timeseries_path: Path,
    context_data: dict,
    output_dir: Path
) -> dict:
    reference_rows = read_csv_rows(reference_path)
    activation_rows = read_csv_rows(activations_path)
    timeseries = read_timeseries(timeseries_path)

    summaries = build_cluster_summaries(
        reference_rows,
        activation_rows,
        timeseries,
    )

    report = build_score_report(summaries, context_data)

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "marketing_scores.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=True),
        encoding="utf-8",
    )
    (output_dir / "llm_handoff_payload.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=True),
        encoding="utf-8",
    )
    write_outcome_csv(report, output_dir / "marketing_outcome_scores.csv")
    write_contribution_csv(report, output_dir / "marketing_cluster_contributions.csv")
    (output_dir / "marketing_score_report.md").write_text(
        markdown_report(report),
        encoding="utf-8",
    )
    return report
