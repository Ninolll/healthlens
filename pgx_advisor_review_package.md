# PGx Advisor: Evidence-Traceable Pharmacogenomics Recommendation Prototype

## Executive Summary

This project will prototype a pharmacogenomics advisor that maps a user's genotype, current medication, and clinical indication to a CPIC-grounded recommendation trace. The first worked example is CYP2C19 x clopidogrel for ACS/PCI patients, because this is a mature pharmacogenomics use case where genotype can meaningfully change the recommendation.

The goal is not to invent new biomedical recommendations. The goal is to build a transparent workflow around existing pharmacogenomics evidence: input normalisation, coverage checking, rule execution, citation-backed explanation, and explicit fallback when the user's case is outside the evidence base.

The MVP will produce a single end-to-end demo showing:

- user input,
- genotype-to-phenotype mapping,
- matched CPIC/PharmGKB evidence,
- deterministic rules fired,
- recommendation output,
- evidence trace,
- missing inputs and coverage boundary.

The LLM will not decide the recommendation. It will only phrase a plain-language explanation from the rule engine's structured output and approved citations.

## Why This Direction

The earlier APOE/LDL/diet example was useful for exploring the architecture, but the intervention evidence was limited and the genotype-specific behaviour change was hard to defend. CYP2C19 x clopidogrel is a stronger MVP because pharmacogenomics has mature prior art, structured guidelines, and a clearer personalisation delta.

Without genotype, the system can only say that clopidogrel is a standard antiplatelet option in many ACS/PCI workflows. With CYP2C19 loss-of-function information, the system can flag that clopidogrel may be less appropriate for poor or intermediate metabolisers and can show the CPIC-grounded reason.

## End-to-End Paper Trace

### Input Profile

Genotype: CYP2C19 *2/*2  
Current medication: clopidogrel  
Clinical indication: ACS/PCI  
Contraindication inputs: not provided  
Current clinician decision: unknown

### Normalised Signals

CYP2C19 *2 is a no-function allele.  
CYP2C19 *2/*2 maps to poor metabolizer.  
Medication is clopidogrel.  
Indication is ACS/PCI.  
The case is inside the CPIC-covered gene-drug pair.

### Evidence Matched

Primary guideline source: CPIC guideline for CYP2C19 and clopidogrel.  
Knowledgebase source: PharmGKB / ClinPGx gene-drug annotation.  
Evidence type: pharmacogenomics clinical guideline.  
Recommendation type: gene-drug medication guidance, not diagnosis.

### Rules Fired

Rule 1: If CYP2C19 genotype is present, map star alleles to phenotype.  
Rule 2: If medication is clopidogrel and phenotype is poor metabolizer, mark reduced clopidogrel activation risk.  
Rule 3: If indication is ACS/PCI and CPIC guidance exists, return CPIC-grounded alternative-antiplatelet recommendation.  
Rule 4: If contraindication inputs are missing, show missing-input warning and avoid final medication substitution language.

### Final Output

Clopidogrel may be less appropriate for this profile because CYP2C19 *2/*2 maps to poor metabolizer status, which can reduce conversion of clopidogrel to its active metabolite. For ACS/PCI contexts covered by CPIC guidance, an alternative antiplatelet strategy should be considered by a clinician, subject to contraindications and the user's full clinical context.

Confidence: high for the gene-drug guideline match; not a standalone prescribing decision.  
Coverage: in scope for CYP2C19 x clopidogrel; missing contraindication and clinical-history inputs.  
Trace: genotype -> phenotype -> gene-drug rule -> CPIC-grounded recommendation -> user-facing explanation.

## Product Mockup

### User Input Panel

Genotype: CYP2C19 *2/*2  
Medication: clopidogrel  
Indication: ACS/PCI  
Optional fields: age, sex, bleeding risk, current medications, contraindications to alternatives

### Recommendation Panel

Status: CPIC-covered gene-drug interaction found  
Phenotype: CYP2C19 poor metabolizer  
Recommendation: clopidogrel may be less appropriate; clinician should consider CPIC-grounded alternatives  
Confidence: high guideline match, clinical review required

### Evidence Trace Panel

Source: CPIC CYP2C19-clopidogrel guideline  
Source: PharmGKB / ClinPGx annotation  
Rule fired: poor metabolizer + clopidogrel + ACS/PCI  
Missing information: contraindications, bleeding risk, complete medication list

### Coverage Panel

In scope: CYP2C19 x clopidogrel  
Partially in scope: genotype present but indication missing  
Out of scope: unsupported drug, unsupported gene, or non-guideline lifestyle claim

## System Architecture

User profile
-> input normalisation
-> genotype-to-phenotype mapper
-> gene-drug coverage checker
-> evidence lookup
-> deterministic rule engine
-> recommendation trace
-> constrained LLM explanation
-> UI

The rule engine owns the recommendation. The evidence layer supplies structured guideline facts. The LLM receives only the approved recommendation object and citation metadata.

## Data Sources and Roles

CPIC: primary guideline source for gene-drug recommendations and actionability.  
PharmGKB / ClinPGx: curated pharmacogenomics knowledgebase and guideline annotations.  
ClinVar/dbSNP: variant identification and cross-reference support where needed.  
User input: medication, indication, genotype, and optional clinical context.  
OpenFDA or drug labels: future support for label-level pharmacogenomics warnings.  
PubMed: background source discovery, not the MVP's main decision authority.

## Evidence Schema

Each evidence item should be structured enough to support auditability and future migration to a knowledge graph.

Example fields:

- evidence_id
- gene
- variant_or_star_allele
- phenotype
- drug
- indication
- recommendation
- recommendation_strength
- source_name
- source_url_or_id
- evidence_level
- population_scope
- contraindication_notes
- review_status
- last_reviewed

Key design choice: conflict and coverage are separate from evidence strength. A recommendation can have strong guideline support while still requiring fallback if the user's indication or contraindication profile is missing.

## Why Not Just Wrap CPIC or PharmGKB

CPIC and PharmGKB are authoritative sources for pharmacogenomics evidence. This project should use them rather than compete with them.

The product value is the workflow around those sources:

- normalising messy user inputs,
- checking whether the case is inside a guideline-covered scope,
- mapping genotype to phenotype,
- exposing missing clinical fields,
- showing the exact rule path,
- producing a user-readable explanation without hiding uncertainty.

If the project later covers medication recommendations more broadly, CPIC and PharmGKB should remain upstream evidence sources, not replaced by a homemade evidence system.

## Why Not Pure RAG

Pure RAG is the wrong decision layer for this MVP. A retriever can find relevant documents, but a user-facing pharmacogenomics recommendation needs deterministic handling of gene, phenotype, drug, indication, and coverage boundaries.

RAG can still help with source discovery, citation lookup, and background explanation. It should not decide whether a drug is appropriate for a genotype.

## Why Not a Full Knowledge Graph Now

A typed knowledge graph is the better long-term representation for gene, variant, phenotype, drug, indication, recommendation, source, and contraindication relationships.

For the MVP, a graph-compatible evidence table is a safer first step. The schema uses typed fields so it can later become graph edges, but the first demo stays small enough to build and inspect.

## MVP Scope

The MVP covers one recommendation line:

CYP2C19 genotype -> CYP2C19 phenotype -> clopidogrel recommendation trace for ACS/PCI context.

MVP deliverables:

- UI wireframe,
- architecture diagram,
- evidence schema v1,
- one end-to-end paper trace,
- genotype-to-phenotype mapper for CYP2C19,
- deterministic rule engine for the clopidogrel example,
- small evidence corpus built from CPIC and PharmGKB/ClinPGx,
- demo UI showing recommendation, trace, coverage, and missing inputs.

## Evaluation

The evaluation will not claim clinical correctness beyond the cited guideline scope. It will test whether the system is traceable, conservative, and coverage-aware.

Test profiles:

- CYP2C19 *2/*2 + clopidogrel + ACS/PCI.
- CYP2C19 *1/*1 + clopidogrel + ACS/PCI.
- CYP2C19 *1/*2 + clopidogrel + ACS/PCI.
- CYP2C19 *2/*2 + unsupported drug.
- CYP2C19 genotype present + clopidogrel + missing indication.

Metrics:

- phenotype mapping correctness,
- rule firing correctness,
- citation presence,
- coverage classification,
- missing-input reporting,
- refusal to produce unsupported recommendations,
- consistency between structured trace and final explanation.

BioASQ is not an end-to-end benchmark for this product. It can only be used as a retrieval sanity check for biomedical document search if a retrieval layer is added later.

## Timeline

Weeks 1-2: Prior art and scope  
Deliver CPIC/PharmGKB notes, schema v1, alternatives comparison, and final worked example choice.

Weeks 3-4: Paper prototype  
Deliver UI mockup, architecture diagram, and full CYP2C19 x clopidogrel paper trace.

Weeks 5-6: Prototype logic  
Build genotype-to-phenotype mapping, evidence table, coverage checker, and deterministic rules for the worked example.

Weeks 7-10: Demo build  
Build the web UI, connect the trace output, add synthetic test profiles, and prepare final demo.

## Risks

Clinical overclaiming is the main risk. The UI must say when a recommendation is guideline-grounded but still requires clinician review.

Scope creep is a second risk. The MVP should stay on one gene-drug pair until the trace and fallback behaviour are convincing.

Evidence maintenance is a long-term risk. A production system would need versioned evidence updates and expert review.

User data sensitivity is a product risk. Real genetic and medication data would require stronger privacy, consent, and security handling than the MVP.

## Discussion Questions for Max

Is CYP2C19 x clopidogrel the right first use case, or should the MVP choose another CPIC Level A gene-drug pair?

Should the MVP remain a flat evidence table with graph-compatible fields, or should it start with a small typed graph?

What level of clinical review is enough for an internship demo versus a user-facing product?

What should the first UI mockup optimise for: patient-facing explanation, clinician-facing trace, or internal evidence debugging?
