from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
REPORT_DIR = ROOT / "reports"
FIGURE_DIR = REPORT_DIR / "figures"
REPORT_PATH = REPORT_DIR / "dataset_review.md"

os.environ.setdefault("MPLCONFIGDIR", "/private/tmp/codex_matplotlib_cache")
os.environ.setdefault("XDG_CACHE_HOME", "/private/tmp/codex_cache")

import matplotlib.pyplot as plt


SEX_LABELS = {1: "Male", 2: "Female"}
RACE_ETHNICITY_LABELS = {
    1: "Mexican American",
    2: "Other Hispanic",
    3: "Non-Hispanic White",
    4: "Non-Hispanic Black",
    6: "Non-Hispanic Asian",
    7: "Other / multiracial",
}

BIOMARKERS = {
    "LBXSGL": "Glucose, serum (mg/dL)",
    "LBXSCH": "Total cholesterol, serum (mg/dL)",
    "LBXSTR": "Triglycerides, serum (mg/dL)",
    "LBXSCR": "Creatinine, serum (mg/dL)",
    "LBXSUA": "Uric acid, serum (mg/dL)",
    "LBXSAL": "Albumin, serum (g/dL)",
    "LBXWBCSI": "White blood cell count",
    "LBXHGB": "Hemoglobin (g/dL)",
    "LBXPLTSI": "Platelet count",
    "URXUMA": "Albumin, urine (ug/mL)",
    "URXUCR": "Creatinine, urine (mg/dL)",
    "URDACT": "Albumin/creatinine ratio, urine (mg/g)",
}

DATASET_ROLES = [
    {
        "Dataset": "NHANES",
        "Role": "Population reference layer",
        "What it adds": "Biomarker distributions and demographic comparison groups.",
        "Direct user linkage": "Yes, if user provides matching biomarker values.",
    },
    {
        "Dataset": "CTD",
        "Role": "Biological explanation layer",
        "What it adds": "Chemical-gene, chemical-disease, gene-disease, pathway-style evidence links.",
        "Direct user linkage": "Indirect; use after a marker or exposure has been identified.",
    },
    {
        "Dataset": "ClinVar",
        "Role": "Genetic interpretation layer",
        "What it adds": "Variant, gene, condition, clinical significance, review status.",
        "Direct user linkage": "Yes, if user has genetic variant input.",
    },
]

SOURCE_LINKS = [
    "- NHANES DEMO_L documentation: https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/DEMO_L.htm",
    "- NHANES BIOPRO_L documentation: https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/BIOPRO_L.htm",
    "- NHANES CBC_L documentation: https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/CBC_L.htm",
    "- NHANES ALB_CR_L documentation: https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/ALB_CR_L.htm",
    "- CTD update 2023: https://pubmed.ncbi.nlm.nih.gov/36169237/",
    "- NCBI ClinVar overview: https://www.ncbi.nlm.nih.gov/clinvar/intro/",
]


@dataclass(frozen=True)
class DatasetBundle:
    demo: pd.DataFrame
    biopro: pd.DataFrame
    cbc: pd.DataFrame
    urine: pd.DataFrame


def load_data() -> DatasetBundle:
    return DatasetBundle(
        demo=pd.read_sas(DATA_DIR / "DEMO_L.xpt"),
        biopro=pd.read_sas(DATA_DIR / "BIOPRO_L.xpt"),
        cbc=pd.read_sas(DATA_DIR / "CBC_L.xpt"),
        urine=pd.read_sas(DATA_DIR / "ALB_CR_L.xpt"),
    )


def pct(numerator: int, denominator: int) -> str:
    if denominator == 0:
        return "0.0%"
    return f"{numerator / denominator * 100:.1f}%"


def pct_value(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator * 100


def markdown_table(rows: list[dict[str, object]], columns: list[str]) -> str:
    header = "| " + " | ".join(columns) + " |"
    divider = "| " + " | ".join(["---"] * len(columns)) + " |"
    body = []
    for row in rows:
        body.append("| " + " | ".join(str(row.get(col, "")) for col in columns) + " |")
    return "\n".join([header, divider, *body])


def save_donut_chart(
    rows: list[dict[str, object]],
    label_col: str,
    value_col: str,
    title: str,
    filename: str,
) -> str:
    """Donut chart for a small number of categories (ideal for 2-3 groups like Sex)."""
    path = FIGURE_DIR / filename
    labels = [str(row[label_col]) for row in rows]
    values = [float(row[value_col]) for row in rows]
    total = sum(values)
    colors = ["#2f7d6d", "#c46f42", "#4f6f9f", "#9b7c3b"]

    fig, ax = plt.subplots(figsize=(6, 5))
    wedges, _ = ax.pie(
        values,
        colors=colors[: len(values)],
        startangle=90,
        counterclock=False,
        wedgeprops=dict(width=0.38, edgecolor="white", linewidth=2),
    )
    # center text: total N
    ax.text(0, 0.08, f"{int(total):,}", ha="center", va="center",
            fontsize=18, fontweight="bold", color="#222222")
    ax.text(0, -0.12, "total", ha="center", va="center",
            fontsize=10, color="#777777")

    # legend with N and %
    legend_labels = [
        f"{label}   {int(value):,}  ({value/total*100:.1f}%)"
        for label, value in zip(labels, values)
    ]
    ax.legend(wedges, legend_labels, loc="center left",
              bbox_to_anchor=(1.0, 0.5), frameon=False, fontsize=10)
    ax.set_title(title, pad=15)
    plt.tight_layout()
    plt.savefig(path, dpi=180, bbox_inches="tight")
    plt.close()
    return str(path.relative_to(REPORT_DIR))


def save_age_distribution(demo: pd.DataFrame) -> str:
    path = FIGURE_DIR / "nhanes_age_distribution.png"
    ages = demo["RIDAGEYR"].dropna()
    total = len(ages)
    bins = range(0, 86, 5)
    plt.figure(figsize=(9, 5))
    counts, edges, patches = plt.hist(ages, bins=bins, color="#2f7d6d", edgecolor="white")
    plt.title("NHANES Age Distribution")
    plt.xlabel("Age")
    plt.ylabel("Participants")

    # Only label the top 5 bins to avoid clutter; use horizontal text
    if len(counts):
        max_count = max(counts)
        offset = max_count * 0.015
        # find indices of top 5 bins by count
        top_indices = sorted(range(len(counts)), key=lambda i: counts[i], reverse=True)[:5]
        for i in top_indices:
            count = counts[i]
            if count == 0:
                continue
            patch = patches[i]
            percent = count / total * 100 if total else 0
            plt.text(
                patch.get_x() + patch.get_width() / 2,
                count + offset,
                f"{percent:.1f}%",
                ha="center",
                va="bottom",
                fontsize=9,
                color="#333333",
            )
        plt.ylim(0, max_count * 1.12)
    plt.tight_layout()
    plt.savefig(path, dpi=180)
    plt.close()
    return str(path.relative_to(REPORT_DIR))


def save_bar_chart(
    rows: list[dict[str, object]],
    label_col: str,
    value_col: str,
    title: str,
    filename: str,
    annotation_col: str | None = None,
    secondary_col: str | None = None,
) -> str:
    """Bar chart for count-based Y axis.

    Primary label (large, dark) matches the Y axis units (counts).
    Secondary label (small, grey, in parentheses) is the supporting metric (e.g. %).
    """
    path = FIGURE_DIR / filename
    labels = [str(row[label_col]) for row in rows]
    values = [float(row[value_col]) for row in rows]
    plt.figure(figsize=(8.5, 5))
    bars = plt.bar(labels, values, color=["#2f7d6d", "#c46f42", "#4f6f9f", "#9b7c3b", "#6d5a7d", "#5b7f95"])
    plt.title(title)
    plt.ylabel(value_col)
    plt.xticks(rotation=25, ha="right")
    if annotation_col:
        offset = max(values) * 0.015 if values else 0
        for bar, row in zip(bars, rows):
            primary = str(row[annotation_col])
            x = bar.get_x() + bar.get_width() / 2
            bar_top = bar.get_height()
            # secondary label (small grey) sits just above the bar top
            if secondary_col:
                plt.text(
                    x,
                    bar_top + offset,
                    f"({row[secondary_col]})",
                    ha="center",
                    va="bottom",
                    fontsize=8,
                    color="#777777",
                )
                primary_y = bar_top + max(values) * 0.05
            else:
                primary_y = bar_top + offset
            # primary label (large dark) sits above the secondary
            plt.text(
                x,
                primary_y,
                primary,
                ha="center",
                va="bottom",
                fontsize=11,
                fontweight="bold",
                color="#222222",
            )
        # leave more headroom when there are two-line labels
        headroom = 1.20 if secondary_col else 1.12
        plt.ylim(0, max(values) * headroom if values else 1)
    plt.tight_layout()
    plt.savefig(path, dpi=180)
    plt.close()
    return str(path.relative_to(REPORT_DIR))


def save_horizontal_bar_chart(
    rows: list[dict[str, object]],
    label_col: str,
    value_col: str,
    title: str,
    filename: str,
    sort_descending: bool = True,
) -> str:
    """Horizontal bar chart, sorted by value. Best for many categories with uneven values."""
    path = FIGURE_DIR / filename
    sorted_rows = sorted(rows, key=lambda r: float(r[value_col]), reverse=sort_descending)
    labels = [str(row[label_col]) for row in sorted_rows]
    values = [float(row[value_col]) for row in sorted_rows]
    total = sum(values)

    palette = ["#2f7d6d", "#4f6f9f", "#c46f42", "#9b7c3b", "#6d5a7d", "#5b7f95"]
    colors = [palette[i % len(palette)] for i in range(len(values))]

    fig, ax = plt.subplots(figsize=(9, 0.55 * len(values) + 1.8))
    bars = ax.barh(labels, values, color=colors)
    ax.set_title(title)
    ax.set_xlabel(value_col)
    ax.invert_yaxis()  # largest at top
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    max_value = max(values) if values else 1
    for bar, value in zip(bars, values):
        pct = value / total * 100 if total else 0
        ax.text(
            bar.get_width() + max_value * 0.015,
            bar.get_y() + bar.get_height() / 2,
            f"N={int(value):,}  ({pct:.1f}%)",
            ha="left",
            va="center",
            fontsize=10,
            color="#222222",
        )
    ax.set_xlim(0, max_value * 1.18)
    plt.tight_layout()
    plt.savefig(path, dpi=180)
    plt.close()
    return str(path.relative_to(REPORT_DIR))


def save_percent_coverage_chart(
    rows: list[dict[str, object]],
    label_col: str,
    percent_col: str,
    count_col: str,
    title: str,
    filename: str,
) -> str:
    """Horizontal progress bars showing coverage percent against a 100% baseline.

    Each row renders as: [filled bar     ] 73.1% (n=8,727)
    Better than vertical bars for "% of a known total" since the baseline is meaningful.
    """
    path = FIGURE_DIR / filename
    labels = [str(row[label_col]) for row in rows]
    values = [float(row[percent_col]) for row in rows]
    counts = [int(float(row[count_col])) for row in rows]

    palette = ["#2f7d6d", "#c46f42", "#4f6f9f", "#9b7c3b", "#6d5a7d"]
    colors = [palette[i % len(palette)] for i in range(len(values))]

    fig, ax = plt.subplots(figsize=(9, 0.65 * len(values) + 1.8))
    y_positions = list(range(len(values)))

    # background track (the "100%" baseline)
    ax.barh(y_positions, [100] * len(values), color="#eeeeee", height=0.55)
    # filled portion
    bars = ax.barh(y_positions, values, color=colors, height=0.55)

    ax.set_yticks(y_positions)
    ax.set_yticklabels(labels)
    ax.invert_yaxis()
    ax.set_xlim(0, 118)  # extra space for labels at the right end
    ax.set_xlabel("% of DEMO participants")
    ax.set_title(title)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.set_xticks([0, 25, 50, 75, 100])

    for y, value, count in zip(y_positions, values, counts):
        ax.text(
            101,
            y,
            f"{value:.1f}%   (n={count:,})",
            ha="left",
            va="center",
            fontsize=10,
            color="#222222",
        )

    plt.tight_layout()
    plt.savefig(path, dpi=180)
    plt.close()
    return str(path.relative_to(REPORT_DIR))


def summarize_nhanes(bundle: DatasetBundle) -> dict[str, object]:
    demo = bundle.demo
    total = demo["SEQN"].nunique()

    merged_biopro = demo[["SEQN", "RIAGENDR", "RIDAGEYR", "RIDRETH3"]].merge(bundle.biopro, on="SEQN", how="inner")
    merged_cbc = demo[["SEQN", "RIAGENDR", "RIDAGEYR", "RIDRETH3"]].merge(bundle.cbc, on="SEQN", how="inner")
    merged_urine = demo[["SEQN", "RIAGENDR", "RIDAGEYR", "RIDRETH3"]].merge(bundle.urine, on="SEQN", how="inner")
    participants_with_any_blood = pd.concat([bundle.biopro["SEQN"], bundle.cbc["SEQN"]]).nunique()

    summary_rows = [
        {
            "File": "DEMO_L.xpt",
            "Component": "Demographics / interview + exam status",
            "Rows": f"{len(demo):,}",
            "Unique participants": f"{total:,}",
            "Coverage of DEMO": "100.0%",
        },
        {
            "File": "BIOPRO_L.xpt",
            "Component": "Laboratory: standard biochemistry blood profile",
            "Rows": f"{len(bundle.biopro):,}",
            "Unique participants": f"{bundle.biopro['SEQN'].nunique():,}",
            "Coverage of DEMO": pct(bundle.biopro["SEQN"].nunique(), total),
        },
        {
            "File": "CBC_L.xpt",
            "Component": "Laboratory: complete blood count",
            "Rows": f"{len(bundle.cbc):,}",
            "Unique participants": f"{bundle.cbc['SEQN'].nunique():,}",
            "Coverage of DEMO": pct(bundle.cbc["SEQN"].nunique(), total),
        },
        {
            "File": "ALB_CR_L.xpt",
            "Component": "Laboratory: urine albumin and creatinine",
            "Rows": f"{len(bundle.urine):,}",
            "Unique participants": f"{bundle.urine['SEQN'].nunique():,}",
            "Coverage of DEMO": pct(bundle.urine["SEQN"].nunique(), total),
        },
    ]

    sex_rows = []
    for code, count in demo["RIAGENDR"].value_counts(dropna=False).sort_index().items():
        label = SEX_LABELS.get(int(code), "Missing / unknown") if pd.notna(code) else "Missing / unknown"
        sex_rows.append({"Sex": label, "Participants": int(count), "Percent": pct(int(count), total)})

    ethnicity_rows = []
    for code, count in demo["RIDRETH3"].value_counts(dropna=False).sort_index().items():
        label = RACE_ETHNICITY_LABELS.get(int(code), "Missing / unknown") if pd.notna(code) else "Missing / unknown"
        ethnicity_rows.append({"Race / ethnicity": label, "Participants": int(count), "Percent": pct(int(count), total)})

    coverage_rows = [
        {
            "Category": "Any blood lab",
            "Participants": participants_with_any_blood,
            "Coverage percent": pct_value(participants_with_any_blood, total),
            "Percent of DEMO": pct(participants_with_any_blood, total),
        },
        {
            "Category": "Biochemistry",
            "Participants": bundle.biopro["SEQN"].nunique(),
            "Coverage percent": pct_value(bundle.biopro["SEQN"].nunique(), total),
            "Percent of DEMO": pct(bundle.biopro["SEQN"].nunique(), total),
        },
        {
            "Category": "CBC",
            "Participants": bundle.cbc["SEQN"].nunique(),
            "Coverage percent": pct_value(bundle.cbc["SEQN"].nunique(), total),
            "Percent of DEMO": pct(bundle.cbc["SEQN"].nunique(), total),
        },
        {
            "Category": "Urine biomarkers",
            "Participants": bundle.urine["SEQN"].nunique(),
            "Coverage percent": pct_value(bundle.urine["SEQN"].nunique(), total),
            "Percent of DEMO": pct(bundle.urine["SEQN"].nunique(), total),
        },
    ]

    biomarker_rows = []
    for column, label in BIOMARKERS.items():
        if column in merged_biopro.columns:
            source_df = merged_biopro
        elif column in merged_cbc.columns:
            source_df = merged_cbc
        else:
            source_df = merged_urine
        n = int(source_df[source_df[column].notna()]["SEQN"].nunique())
        biomarker_rows.append(
            {
                "Biomarker": label,
                "Column": column,
                "Participants with value": f"{n:,}",
                "Percent of DEMO": pct(n, total),
            }
        )

    exam_rows = [
        {
            "Examination / lab category": "Demographics",
            "Local file": "DEMO_L.xpt",
            "Participants": total,
            "Coverage percent": 100.0,
            "Coverage": "100.0%",
        },
        {
            "Examination / lab category": "Biochemistry lab",
            "Local file": "BIOPRO_L.xpt",
            "Participants": bundle.biopro["SEQN"].nunique(),
            "Coverage percent": pct_value(bundle.biopro["SEQN"].nunique(), total),
            "Coverage": pct(bundle.biopro["SEQN"].nunique(), total),
        },
        {
            "Examination / lab category": "CBC lab",
            "Local file": "CBC_L.xpt",
            "Participants": bundle.cbc["SEQN"].nunique(),
            "Coverage percent": pct_value(bundle.cbc["SEQN"].nunique(), total),
            "Coverage": pct(bundle.cbc["SEQN"].nunique(), total),
        },
        {
            "Examination / lab category": "Urine albumin/creatinine lab",
            "Local file": "ALB_CR_L.xpt",
            "Participants": bundle.urine["SEQN"].nunique(),
            "Coverage percent": pct_value(bundle.urine["SEQN"].nunique(), total),
            "Coverage": pct(bundle.urine["SEQN"].nunique(), total),
        },
    ]

    return {
        "total": total,
        "summary_rows": summary_rows,
        "sex_rows": sex_rows,
        "ethnicity_rows": ethnicity_rows,
        "coverage_rows": coverage_rows,
        "biomarker_rows": biomarker_rows,
        "exam_rows": exam_rows,
    }


def get_percentile(bundle: DatasetBundle, value: float, biomarker: str, age: int, gender: int) -> dict[str, object]:
    merged = bundle.demo[["SEQN", "RIAGENDR", "RIDAGEYR"]].merge(bundle.biopro, on="SEQN", how="left")
    merged = merged.merge(bundle.cbc, on="SEQN", how="left", suffixes=("", "_cbc"))
    merged = merged.merge(bundle.urine, on="SEQN", how="left")

    subset = merged[
        (merged["RIAGENDR"] == gender)
        & (merged["RIDAGEYR"] >= age - 5)
        & (merged["RIDAGEYR"] <= age + 5)
        & (merged[biomarker].notna())
    ][biomarker]

    if len(subset) < 30:
        return {"Biomarker": BIOMARKERS.get(biomarker, biomarker), "Result": "Not enough comparison data"}

    percentile = (subset < value).mean() * 100
    return {
        "Biomarker": BIOMARKERS.get(biomarker, biomarker),
        "User value": value,
        "Percentile": f"{percentile:.1f}",
        "Population N": len(subset),
        "Median": f"{subset.median():.2f}",
        "P25-P75": f"{subset.quantile(0.25):.2f} - {subset.quantile(0.75):.2f}",
        "Interpretation": interpret_percentile(percentile),
    }


def interpret_percentile(percentile: float) -> str:
    if percentile >= 90:
        return "Very high compared with similar NHANES participants"
    if percentile >= 75:
        return "Above average"
    if percentile >= 25:
        return "Typical range"
    if percentile >= 10:
        return "Below average"
    return "Very low compared with similar NHANES participants"


def feature_examples(bundle: DatasetBundle) -> dict[str, list[dict[str, object]]]:
    nhanes_example = [
        get_percentile(bundle, 210, "LBXSCH", age=35, gender=2),
        get_percentile(bundle, 95, "LBXSGL", age=35, gender=2),
        get_percentile(bundle, 150, "LBXSTR", age=35, gender=2),
        get_percentile(bundle, 0.85, "LBXSCR", age=35, gender=2),
        get_percentile(bundle, 13.0, "LBXHGB", age=35, gender=2),
        get_percentile(bundle, 12.0, "URDACT", age=35, gender=2),
    ]

    ctd_example = [
        {
            "Flagged input": "Total cholesterol: 80.3rd percentile",
            "CTD query concept": "cholesterol",
            "Prototype explanation": "Retrieve lipid metabolism, cardiovascular disease, gene, and pathway evidence.",
        },
        {
            "Flagged input": "Triglycerides: 78.8th percentile",
            "CTD query concept": "triglycerides",
            "Prototype explanation": "Retrieve triglyceride and cardiometabolic disease relationship evidence.",
        },
        {
            "Flagged input": "Serum creatinine: 84.0th percentile",
            "CTD query concept": "creatinine / renal dysfunction",
            "Prototype explanation": "Retrieve kidney-function related chemical, gene, and disease evidence.",
        },
        {
            "Flagged input": "Urine ACR: 77.7th percentile",
            "CTD query concept": "albuminuria / kidney disease",
            "Prototype explanation": "Retrieve renal injury, kidney disease, exposure, and gene association evidence.",
        },
    ]

    clinvar_example = [
        {
            "Input": "User variant: BRCA1 c.68_69delAG",
            "ClinVar use": "Look up variant-condition clinical significance and review status.",
            "App output": "BRCA1 c.68_69delAG -> pathogenic; hereditary breast and ovarian cancer syndrome; show evidence/review status.",
        }
    ]

    return {
        "nhanes": nhanes_example,
        "ctd": ctd_example,
        "clinvar": clinvar_example,
    }


def build_report(bundle: DatasetBundle) -> str:
    REPORT_DIR.mkdir(exist_ok=True)
    FIGURE_DIR.mkdir(exist_ok=True)

    summary = summarize_nhanes(bundle)

    age_figure = save_age_distribution(bundle.demo)
    sex_figure = save_donut_chart(
        summary["sex_rows"],
        "Sex",
        "Participants",
        "NHANES Sex Distribution",
        "nhanes_sex_distribution.png",
    )
    ethnicity_figure = save_horizontal_bar_chart(
        summary["ethnicity_rows"],
        "Race / ethnicity",
        "Participants",
        "NHANES Race / Ethnicity Distribution",
        "nhanes_ethnicity_distribution.png",
    )
    coverage_chart_rows = [
        {
            "Category": row["Category"],
            "Participants": row["Participants"],
            "Coverage percent": row["Coverage percent"],
        }
        for row in summary["coverage_rows"]
        if isinstance(row["Participants"], int)
    ]
    coverage_figure = save_percent_coverage_chart(
        coverage_chart_rows,
        "Category",
        "Coverage percent",
        "Participants",
        "Downloaded NHANES Blood / Urine Coverage (% of DEMO)",
        "nhanes_blood_urine_coverage.png",
    )
    exam_chart_rows = [
        {
            "Examination / lab category": row["Examination / lab category"],
            "Participants": row["Participants"],
            "Coverage percent": row["Coverage percent"],
        }
        for row in summary["exam_rows"]
        if isinstance(row["Participants"], int)
    ]
    exam_figure = save_percent_coverage_chart(
        exam_chart_rows,
        "Examination / lab category",
        "Coverage percent",
        "Participants",
        "Downloaded NHANES Component Coverage (% of DEMO)",
        "nhanes_exam_component_coverage.png",
    )

    examples = feature_examples(bundle)

    report = f"""# Dataset Review for Tomorrow's Meeting

## Executive Summary

The current workspace contains four NHANES August 2021-August 2023 files: demographics, standard biochemistry blood profile, complete blood count, and urine albumin/creatinine. This is enough to show a strong NHANES prototype: demographic distributions, blood and urine biomarker coverage, and a user biomarker percentile comparison.

The current workspace does not contain CTD, ClinVar, questionnaire module files, or physical examination module files. For tomorrow, keep the focus on NHANES as the biomarker reference layer, while treating CTD and ClinVar as optional explanation/interpretation layers.

## Dataset Inventory and Product Role

{markdown_table(DATASET_ROLES, ["Dataset", "Role", "What it adds", "Direct user linkage"])}

## NHANES Deep Dive

### What the Current Files Contain

{markdown_table(summary["summary_rows"], ["File", "Component", "Rows", "Unique participants", "Coverage of DEMO"])}

Key point for the meeting: NHANES examination data is not one single exam. It is a set of separate MEC examination and laboratory components. Each component has its own eligible sample, file, variables, and coverage. The downloaded files here cover demographics, two blood laboratory components, and one urine laboratory component, not all questionnaire/examination/laboratory modules.

### Participant Distribution

![Age distribution]({age_figure})

{markdown_table(summary["sex_rows"], ["Sex", "Participants", "Percent"])}

![Sex distribution]({sex_figure})

{markdown_table(summary["ethnicity_rows"], ["Race / ethnicity", "Participants", "Percent"])}

![Race ethnicity distribution]({ethnicity_figure})

### Blood and Urine Biomarker Coverage

{markdown_table(summary["coverage_rows"], ["Category", "Participants", "Percent of DEMO"])}

![Blood urine coverage]({coverage_figure})

Interpretation: blood and urine biomarkers are available for large subsets, but not 100% of NHANES participants. Coverage should be calculated separately for each lab component.

### Examination / Laboratory Component Coverage

{markdown_table(summary["exam_rows"], ["Examination / lab category", "Local file", "Participants", "Coverage"])}

![Exam component coverage]({exam_figure})

### Selected Biomarker-Level Coverage

{markdown_table(summary["biomarker_rows"], ["Biomarker", "Column", "Participants with value", "Percent of DEMO"])}

## Feature Prototype Pipeline

Prototype workflow:

User input -> NHANES population comparison -> flag elevated/unusual biomarkers -> CTD biological explanation -> optional ClinVar genetic interpretation.

### 1. User Input

Simulated user: female, age 35, with blood and urine biomarkers plus an optional genetic variant (`BRCA1 c.68_69delAG`).

### 2. NHANES Population Reference Layer

The app compares each user biomarker with NHANES participants of the same sex and within +/- 5 years of age. Each comparison uses only participants who have that specific biomarker value.

{markdown_table(examples["nhanes"], ["Biomarker", "User value", "Percentile", "Population N", "Median", "P25-P75", "Interpretation"])}

Flag rule for this prototype: mark biomarkers above the 75th percentile or below the 10th percentile as elevated/unusual for follow-up explanation. In the current simulated user, cholesterol, urine albumin/creatinine ratio, triglycerides, and serum creatinine are flagged.

### 3. CTD Biological Explanation Layer

{markdown_table(examples["ctd"], ["Flagged input", "CTD query concept", "Prototype explanation"])}

CTD is triggered by flagged biomarkers or related marker concepts. It explains possible chemical-gene-disease relationships from curated evidence; it should not be presented as direct personal prediction.

### 4. ClinVar Genetic Interpretation Layer

{markdown_table(examples["clinvar"], ["Input", "ClinVar use", "App output"])}

ClinVar is triggered only if the user provides genetic variant data. Without user genetic input, this layer is skipped.

## Integration Framework

| Layer | Dataset | Purpose | Implementation note |
| --- | --- | --- | --- |
| User Data Layer | App input | User provides biomarker, lifestyle, or genetic data | Normalize units and collect age/sex/location where relevant |
| Reference Layer | NHANES | Compare user biomarkers to population distributions | Start with BIOPRO_L and CBC_L; add more lab modules later |
| Explanation Layer | CTD | Explain chemical-gene-disease/pathway evidence | Trigger from selected marker/exposure/gene |
| Genetic Layer | ClinVar | Interpret variant clinical significance | Only active when user has variant input |

## Current Challenge

These datasets do not share one universal participant ID or direct linkage key. The practical design is therefore layered, not a forced merge:

- NHANES supports direct biomarker reference comparisons.
- CTD supports mechanistic/evidence explanation.
- ClinVar supports variant interpretation when genetic data exists.

## Recommended Next Step

1. Keep NHANES as the first backend prototype because it already has local data and measurable coverage.
2. Download additional urine, exam, or questionnaire modules only if they support a concrete feature.
3. Add CTD and ClinVar as API/data lookup prototypes rather than core merged tables.

## Sources

{chr(10).join(SOURCE_LINKS)}
"""

    REPORT_PATH.write_text(report, encoding="utf-8")
    return str(REPORT_PATH)


def main() -> None:
    bundle = load_data()
    report_path = build_report(bundle)
    print(f"Generated report: {report_path}")
    print(f"Generated figures: {FIGURE_DIR}")


if __name__ == "__main__":
    main()
