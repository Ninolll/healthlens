from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
REPORT_DIR = ROOT / "reports"


def coverage_row(name: str, participants: int, denominator: int) -> dict[str, object]:
    return {
        "component": name,
        "participants": participants,
        "total_demo_participants": denominator,
        "coverage_percent": round(participants / denominator * 100, 1),
    }


def main() -> None:
    demo = pd.read_sas(DATA_DIR / "DEMO_L.xpt")
    biopro = pd.read_sas(DATA_DIR / "BIOPRO_L.xpt")
    cbc = pd.read_sas(DATA_DIR / "CBC_L.xpt")
    urine = pd.read_sas(DATA_DIR / "ALB_CR_L.xpt")

    total_demo = demo["SEQN"].nunique()
    any_downloaded_blood = pd.concat([biopro["SEQN"], cbc["SEQN"]]).nunique()

    rows = [
        coverage_row("DEMO_L demographics", total_demo, total_demo),
        coverage_row("BIOPRO_L standard biochemistry blood profile", biopro["SEQN"].nunique(), total_demo),
        coverage_row("CBC_L complete blood count", cbc["SEQN"].nunique(), total_demo),
        coverage_row("Any downloaded blood lab", any_downloaded_blood, total_demo),
        coverage_row("ALB_CR_L urine albumin/creatinine", urine["SEQN"].nunique(), total_demo),
    ]

    coverage = pd.DataFrame(rows)

    REPORT_DIR.mkdir(exist_ok=True)
    output_path = REPORT_DIR / "coverage_percentages.csv"
    coverage.to_csv(output_path, index=False)

    print("\nNHANES component coverage using DEMO_L as denominator")
    print("=" * 62)
    print(coverage.to_string(index=False))
    print(f"\nSaved CSV: {output_path}")
    print("\nNote: ALB_CR_L is a urine albumin/creatinine lab file, not all possible NHANES urine biomarkers.")


if __name__ == "__main__":
    main()
