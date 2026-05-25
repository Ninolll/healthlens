import json
from pathlib import Path
import re
import urllib.parse
import urllib.request

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent
CTD_DIR = DATA_DIR / "ctd"
CTD_CACHE_PATH = CTD_DIR / "ctd_prototype_cache.json"

# ── Load data ──────────────────────────────────────────────
biopro = pd.read_sas(DATA_DIR / "BIOPRO_L.xpt")
cbc    = pd.read_sas(DATA_DIR / "CBC_L.xpt")
demo   = pd.read_sas(DATA_DIR / "DEMO_L.xpt")
urine  = pd.read_sas(DATA_DIR / "ALB_CR_L.xpt")

# ── Merge on SEQN ───────────────────────────────────────────
merged = pd.merge(biopro, demo[['SEQN', 'RIAGENDR', 'RIDAGEYR']], on='SEQN')
merged = pd.merge(merged, cbc, on='SEQN', suffixes=('', '_cbc'))
merged = pd.merge(merged, urine, on='SEQN', how='left')

# ── Biomarker reference map ─────────────────────────────────
BIOMARKERS = {
    'LBXSGL': 'Glucose (mg/dL)',
    'LBXSCH': 'Total Cholesterol (mg/dL)',
    'LBXSTR': 'Triglycerides (mg/dL)',
    'LBXSCR': 'Creatinine (mg/dL)',
    'LBXSUA': 'Uric Acid (mg/dL)',
    'LBXSAL': 'Albumin (g/dL)',
    'LBXWBCSI': 'WBC (1000 cells/uL)',
    'LBXHGB':  'Hemoglobin (g/dL)',
    'LBXPLTSI': 'Platelets (1000 cells/uL)',
    'URDACT': 'Urine albumin/creatinine ratio (mg/g)',
}

CTD_EXPLANATION_RULES = {
    'LBXSCH': {
        'trigger': 'Total cholesterol is above the comparable NHANES population range.',
        'ctd_kind': 'chemical',
        'ctd_query': 'Cholesterol',
        'focus_terms': ['cardiovascular', 'coronary', 'heart', 'lipid', 'metabolic', 'atherosclerosis', 'hyperlipidemia', 'cholesterol', 'obesity', 'diabetes'],
    },
    'LBXSTR': {
        'trigger': 'Triglycerides are above the comparable NHANES population range.',
        'ctd_kind': 'chemical',
        'ctd_query': 'Triglycerides',
        'focus_terms': ['cardiovascular', 'coronary', 'heart', 'lipid', 'metabolic', 'atherosclerosis', 'hyperlipidemia', 'triglyceride', 'obesity', 'diabetes'],
    },
    'LBXSCR': {
        'trigger': 'Serum creatinine is above the comparable NHANES population range.',
        'ctd_kind': 'chemical',
        'ctd_query': 'Creatinine',
        'focus_terms': ['kidney', 'renal', 'nephropathy', 'acute kidney injury'],
    },
    'URDACT': {
        'trigger': 'Urine albumin/creatinine ratio is above the comparable NHANES population range.',
        'ctd_kind': 'disease',
        'ctd_query': 'Albuminuria',
        'focus_terms': ['albuminuria', 'kidney', 'renal'],
    },
}

EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
CTD_CHEMICAL_DISEASE_COLUMNS = [
    'ChemicalName', 'ChemicalID', 'CasRN', 'DiseaseName', 'DiseaseID',
    'DirectEvidence', 'InferenceGeneSymbol', 'InferenceScore', 'OmimIDs', 'PubMedIDs',
]
CTD_CHEMICAL_GENE_COLUMNS = [
    'ChemicalName', 'ChemicalID', 'CasRN', 'GeneSymbol', 'GeneID', 'GeneForms',
    'Organism', 'OrganismID', 'Interaction', 'InteractionActions', 'PubMedIDs',
]

# ── Core function: calculate user percentile ────────────────
def get_percentile(value: float, biomarker: str, age: int, gender: int) -> dict:
    """
    Compare a user's biomarker value against the NHANES population.

    Parameters
    ----------
    value     : user's measured value
    biomarker : column name, e.g. 'LBXSCH'
    age       : user's age in years
    gender    : 1 = Male, 2 = Female

    Returns
    -------
    dict with percentile, population stats, and label
    """
    subset = merged[
        (merged['RIAGENDR'] == gender) &
        (merged['RIDAGEYR'] >= age - 5) &
        (merged['RIDAGEYR'] <= age + 5) &
        (merged[biomarker].notna())
    ][biomarker]

    if len(subset) < 30:
        return {"error": f"Not enough population data for age={age}, gender={gender}"}

    percentile = (subset < value).mean() * 100

    return {
        "column":      biomarker,
        "biomarker":   BIOMARKERS.get(biomarker, biomarker),
        "user_value":  value,
        "percentile":  round(percentile, 1),
        "pop_mean":    round(subset.mean(), 2),
        "pop_median":  round(subset.median(), 2),
        "pop_p25":     round(subset.quantile(0.25), 2),
        "pop_p75":     round(subset.quantile(0.75), 2),
        "pop_n":       len(subset),
        "interpretation": interpret(percentile),
    }

def interpret(percentile: float) -> str:
    if percentile >= 90:
        return "Very high — top 10% of similar population"
    elif percentile >= 75:
        return "Above average"
    elif percentile >= 25:
        return "Normal range"
    elif percentile >= 10:
        return "Below average"
    else:
        return "Very low — bottom 10% of similar population"

def is_flagged(result: dict) -> bool:
    return result['percentile'] >= 75 or result['percentile'] <= 10

def to_float(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0

def focus_score(text: str, focus_terms: list[str]) -> int:
    lowered = str(text).lower()
    return sum(1 for term in focus_terms if term in lowered)

def format_pmids(pmids: str, limit: int = 3) -> str:
    values = [item for item in str(pmids).split('|') if item and item != 'nan']
    if not values:
        return 'No PMID listed'
    suffix = '' if len(values) <= limit else f" +{len(values) - limit} more"
    return ', '.join(values[:limit]) + suffix

def read_ctd_chunks(path: Path, columns: list[str], usecols: list[str]):
    return pd.read_csv(
        path,
        sep='\t',
        comment='#',
        names=columns,
        usecols=usecols,
        dtype=str,
        chunksize=100_000,
        low_memory=False,
    )

def lookup_ctd_diseases(rule: dict, max_results: int = 4) -> list[dict]:
    path = CTD_DIR / 'CTD_chemicals_diseases.tsv.gz'
    usecols = ['ChemicalName', 'DiseaseName', 'DirectEvidence', 'InferenceGeneSymbol', 'InferenceScore', 'PubMedIDs']
    matches = []

    for chunk in read_ctd_chunks(path, CTD_CHEMICAL_DISEASE_COLUMNS, usecols):
        if rule['ctd_kind'] == 'chemical':
            mask = chunk['ChemicalName'].str.lower() == rule['ctd_query'].lower()
        else:
            mask = chunk['DiseaseName'].str.contains(rule['ctd_query'], case=False, na=False, regex=False)

        selected = chunk.loc[mask].copy()
        if selected.empty:
            continue

        selected['focus_matches'] = selected['DiseaseName'].apply(lambda text: focus_score(text, rule['focus_terms']))
        if selected['focus_matches'].max() > 0:
            selected = selected[selected['focus_matches'] > 0]

        selected['rank'] = selected.apply(
            lambda row: (
                100 if str(row.get('DirectEvidence', '')).strip() and str(row.get('DirectEvidence', '')).lower() != 'nan' else 0
            )
            + 50 * row.get('focus_matches', 0)
            + to_float(row.get('InferenceScore')),
            axis=1,
        )
        matches.append(selected.sort_values('rank', ascending=False).head(max_results * 3))

    if not matches:
        return []

    ranked = pd.concat(matches).sort_values('rank', ascending=False)
    ranked = ranked.drop_duplicates(subset=['DiseaseName', 'InferenceGeneSymbol']).head(max_results)
    results = []
    for _, row in ranked.iterrows():
        evidence = row.get('DirectEvidence')
        if not evidence or str(evidence).lower() == 'nan':
            gene = row.get('InferenceGeneSymbol')
            score = row.get('InferenceScore')
            evidence = f"inferred via {gene}, score={score}" if gene and str(gene).lower() != 'nan' else 'inferred'
        results.append({
            'disease': row.get('DiseaseName', 'Unknown disease'),
            'evidence': evidence,
            'pmids': format_pmids(row.get('PubMedIDs', '')),
        })
    return results

def lookup_ctd_genes(rule: dict, max_results: int = 4) -> list[dict]:
    if rule['ctd_kind'] != 'chemical':
        return []

    path = CTD_DIR / 'CTD_chem_gene_ixns.tsv.gz'
    usecols = ['ChemicalName', 'GeneSymbol', 'Organism', 'Interaction', 'PubMedIDs']
    matches = []

    for chunk in read_ctd_chunks(path, CTD_CHEMICAL_GENE_COLUMNS, usecols):
        selected = chunk[
            (chunk['ChemicalName'].str.lower() == rule['ctd_query'].lower())
            & (chunk['Organism'] == 'Homo sapiens')
        ].copy()
        if selected.empty:
            continue
        query = rule['ctd_query'].lower()
        selected['directness'] = selected['Interaction'].str.lower().apply(
            lambda text: (
                100 if str(text).startswith(query) else 0
            )
            + (40 if f"abundance of {query}" in str(text) else 0)
            + (30 if f"transport of {query}" in str(text) else 0)
            + (30 if f"export of {query}" in str(text) else 0)
            + (20 if f"secretion of {query}" in str(text) else 0)
            - (50 if "co-treated" in str(text) else 0)
        )
        selected['length'] = selected['Interaction'].str.len().fillna(9999)
        matches.append(selected.sort_values(['directness', 'length'], ascending=[False, True]).head(max_results * 3))

    if not matches:
        return []

    ranked = pd.concat(matches).sort_values(['directness', 'length'], ascending=[False, True])
    ranked = ranked.drop_duplicates(subset=['GeneSymbol']).head(max_results)
    results = []
    for _, row in ranked.iterrows():
        results.append({
            'gene': row.get('GeneSymbol', 'Unknown gene'),
            'interaction': row.get('Interaction', 'No interaction text'),
            'pmids': format_pmids(row.get('PubMedIDs', '')),
        })
    return results

def load_ctd_cache() -> dict:
    if not CTD_CACHE_PATH.exists():
        return {}
    return json.loads(CTD_CACHE_PATH.read_text())

def save_ctd_cache(cache: dict) -> None:
    CTD_CACHE_PATH.write_text(json.dumps(cache, indent=2))

def query_ctd(rule: dict) -> dict:
    cache_key = f"{rule['ctd_kind']}::{rule['ctd_query']}"
    cache = load_ctd_cache()
    if cache_key in cache:
        return cache[cache_key]

    result = {
        'source': 'CTD local downloaded TSV files',
        'query': rule['ctd_query'],
        'kind': rule['ctd_kind'],
        'diseases': lookup_ctd_diseases(rule),
        'genes': lookup_ctd_genes(rule),
    }
    cache[cache_key] = result
    save_ctd_cache(cache)
    return result

def explain_with_ctd(flagged_results: list[dict]) -> list[dict]:
    explanations = []
    for result in flagged_results:
        rule = CTD_EXPLANATION_RULES.get(result['column'])
        if not rule:
            continue
        ctd_evidence = query_ctd(rule)
        explanations.append({
            'biomarker': result['biomarker'],
            'ctd_query': rule['ctd_query'],
            'ctd_kind': rule['ctd_kind'],
            'why_triggered': rule['trigger'],
            'evidence': ctd_evidence,
        })
    return explanations

def eutils_json(endpoint: str, params: dict) -> dict:
    params = {**params, 'retmode': 'json'}
    url = f"{EUTILS_BASE}/{endpoint}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=20) as response:
        return json.loads(response.read().decode('utf-8'))

def expected_variant_parts(variant: str) -> tuple[str, str]:
    tokens = variant.strip().split()
    gene = tokens[0] if tokens else ''
    cdna_match = re.search(r'c\.[A-Za-z0-9_+\->*?=]+', variant)
    cdna = cdna_match.group(0) if cdna_match else ''
    return gene, cdna

def normalized_cdna_terms(cdna: str) -> list[str]:
    if not cdna:
        return []
    terms = [cdna]
    # ClinVar often normalizes examples like c.68_69delAG to c.68_69del.
    terms.append(re.sub(r'del[ACGT]+$', 'del', cdna))
    return list(dict.fromkeys(terms))

def record_conditions(record: dict) -> str:
    classification = record.get('germline_classification', {})
    traits = classification.get('trait_set', [])
    names = [trait.get('trait_name', '') for trait in traits if trait.get('trait_name')]
    return '; '.join(names) if names else 'Not reported'

def rank_clinvar_record(record: dict, gene: str, cdna: str) -> int:
    title = record.get('title', '')
    genes = [item.get('symbol', '') for item in record.get('genes', [])]
    score = 0

    if gene and gene in genes:
        score += 8
    if gene and gene in title:
        score += 4

    variation_text = title
    for item in record.get('variation_set', []):
        variation_text += ' ' + item.get('variation_name', '')
        variation_text += ' ' + item.get('cdna_change', '')

    for term in normalized_cdna_terms(cdna):
        if term and term in variation_text:
            score += 8
            break

    return score

def interpret_with_clinvar(variant: str | None) -> dict | None:
    if not variant:
        return None

    gene, cdna = expected_variant_parts(variant)
    try:
        search = eutils_json('esearch.fcgi', {
            'db': 'clinvar',
            'term': variant,
            'retmax': 50,
        })
        ids = search.get('esearchresult', {}).get('idlist', [])
        if not ids:
            return {
                'source': 'ClinVar E-utilities',
                'input': variant,
                'error': 'No ClinVar records found',
            }

        summary = eutils_json('esummary.fcgi', {
            'db': 'clinvar',
            'id': ','.join(ids),
        })
        records = [summary['result'][uid] for uid in summary['result'].get('uids', [])]
        best = max(records, key=lambda record: rank_clinvar_record(record, gene, cdna))
        classification = best.get('germline_classification', {})
        genes = ', '.join(item.get('symbol', '') for item in best.get('genes', []) if item.get('symbol'))

        return {
            'source': 'ClinVar E-utilities',
            'input': variant,
            'record_id': best.get('uid', ''),
            'accession': best.get('accession_version') or best.get('accession', ''),
            'title': best.get('title', ''),
            'gene': genes or gene or 'Not reported',
            'clinical_significance': classification.get('description', 'Not reported'),
            'condition': record_conditions(best),
            'review_status': classification.get('review_status', 'Not reported'),
            'url': f"https://www.ncbi.nlm.nih.gov/clinvar/variation/{best.get('uid', '')}/",
        }
    except Exception as exc:
        return {
            'source': 'ClinVar E-utilities',
            'input': variant,
            'error': f'ClinVar lookup failed: {exc}',
        }

# ── Example: simulate a user upload ────────────────────────
if __name__ == "__main__":
    # Simulated user: Female, age 35
    user_age    = 35
    user_gender = 2  # 1=Male, 2=Female

    user_results = {
        # General adult reference ranges are approximate and can vary by lab.
        'LBXSCH': 210,   # Total cholesterol, serum (mg/dL). Desirable: <200; borderline: 200-239; high: >=240.
        'LBXSGL': 95,    # Glucose, serum (mg/dL). Fasting reference: ~70-99; prediabetes: 100-125; diabetes: >=126.
        'LBXSTR': 150,   # Triglycerides, serum (mg/dL). Normal: <150; borderline high: 150-199; high: 200-499.
        'LBXSCR': 0.85,  # Creatinine, serum (mg/dL). Typical adult range: ~0.6-1.3, depends on sex/muscle mass.
        'LBXHGB': 13.0,  # Hemoglobin (g/dL). Typical adult range: female ~12.0-15.5; male ~13.5-17.5.
        'URDACT': 12.0,  # Urine albumin/creatinine ratio (mg/g). Normal: <30; moderately increased: 30-300.
    }
    user_variant = 'BRCA1 c.68_69delAG'

    print("Prototype pipeline")
    print("=" * 55)
    print("User input")
    print(f"  Age: {user_age}")
    print("  Sex: Female")
    print(f"  Genetic variant: {user_variant}")

    nhanes_results = []
    flagged_results = []
    print("\n1) NHANES population reference layer")
    print("-" * 55)
    for col, value in user_results.items():
        result = get_percentile(value, col, user_age, user_gender)
        if "error" in result:
            print(f"  {col}: {result['error']}")
        else:
            nhanes_results.append(result)
            if is_flagged(result):
                flagged_results.append(result)
            print(f"\n  {result['biomarker']}")
            print(f"    Your value   : {result['user_value']}")
            print(f"    Percentile   : {result['percentile']}th")
            print(f"    Pop mean     : {result['pop_mean']}  |  median: {result['pop_median']}")
            print(f"    Range (P25-P75): {result['pop_p25']} – {result['pop_p75']}")
            print(f"    Interpretation: {result['interpretation']}")

    print("\n2) Flag elevated / unusual biomarkers")
    print("-" * 55)
    if not flagged_results:
        print("  No biomarkers crossed the prototype flag threshold.")
    else:
        for result in flagged_results:
            print(f"  {result['biomarker']}: {result['percentile']}th percentile")

    print("\n3) CTD biological explanation layer")
    print("-" * 55)
    ctd_results = explain_with_ctd(flagged_results)
    if not ctd_results:
        print("  No CTD explanation triggered for the flagged biomarkers in this prototype.")
    else:
        for item in ctd_results:
            print(f"\n  {item['biomarker']}")
            print(f"    CTD query: {item['ctd_query']} ({item['ctd_kind']})")
            print(f"    Why triggered: {item['why_triggered']}")
            print(f"    Source: {item['evidence']['source']}")

            if item['evidence']['diseases']:
                print("    Top CTD disease associations:")
                for disease in item['evidence']['diseases']:
                    print(f"      - {disease['disease']} | {disease['evidence']} | PMID(s): {disease['pmids']}")
            else:
                print("    Top CTD disease associations: none found")

            if item['evidence']['genes']:
                print("    Top CTD gene interactions:")
                for gene in item['evidence']['genes']:
                    print(f"      - {gene['gene']}: {gene['interaction']} | PMID(s): {gene['pmids']}")
            else:
                print("    Top CTD gene interactions: none found for this query type")

    print("\n4) ClinVar genetic interpretation layer")
    print("-" * 55)
    clinvar_result = interpret_with_clinvar(user_variant)
    if not clinvar_result:
        print("  No genetic variant provided; ClinVar layer skipped.")
    elif "error" in clinvar_result:
        print(f"  Source: {clinvar_result['source']}")
        print(f"  Input: {clinvar_result['input']}")
        print(f"  Error: {clinvar_result['error']}")
    else:
        print(f"  Source: {clinvar_result['source']}")
        print(f"  Input: {clinvar_result['input']}")
        print(f"  ClinVar ID: {clinvar_result['record_id']}")
        print(f"  Accession: {clinvar_result['accession']}")
        print(f"  Title: {clinvar_result['title']}")
        print(f"  Gene: {clinvar_result['gene']}")
        print(f"  Clinical significance: {clinvar_result['clinical_significance']}")
        print(f"  Condition: {clinvar_result['condition']}")
        print(f"  Review status: {clinvar_result['review_status']}")
        print(f"  URL: {clinvar_result['url']}")
