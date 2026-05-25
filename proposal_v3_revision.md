# Evidence-Traceable Personalised Health Recommendation Engine

## Executive summary

This project will prototype a personalised health recommendation engine that turns a structured user profile into an auditable, evidence-linked recommendation. The prototype will focus on one narrow recommendation line: APOE genotype, LDL-C, and saturated-fat replacement. The goal is not broad clinical coverage or diagnosis; the goal is to prove that a consumer-facing system can connect genotype, biomarker, lifestyle input, biomedical evidence, deterministic rule logic, and a transparent user explanation.

The MVP will produce one recommendation with a reasoning trace: input profile, normalised signals, retrieved evidence, rules fired, confidence level, conflicting evidence, and missing evidence. The LLM will only phrase the final explanation from validated evidence and rule outputs; it will not decide the recommendation.

## Product target

The end-state demo will show a user profile such as:

Profile: APOE e3/e4, LDL-C 145 mg/dL, saturated fat 14% of daily energy, no diabetes input provided.

Generic guideline output: LDL-C is elevated and saturated-fat intake is high, so reduce saturated fat and replace it with healthier unsaturated fats or high-fibre carbohydrate sources.

Genotype-aware output: LDL-C is elevated and saturated-fat intake is high. Because the profile includes APOE-e4, the system prioritises replacing saturated fat with lower-GI, high-fibre carbohydrate sources and explicitly marks the evidence as limited. This is based on the RISCK secondary analysis, where APOE-e4 carriers had larger reductions in total cholesterol and apoB than E3/E3 participants after replacing saturated fat with low-GI carbohydrate. The output also shows conflicting DELTA evidence and avoids claiming that APOE-e4 guarantees a stronger response.

This is the behavioural difference the genotype layer must justify. Without APOE, the system gives only guideline-based LDL-C advice. With APOE-e4, it changes the ranking and explanation of replacement strategies, while lowering confidence because the intervention evidence is not definitive.

## Project definition

Inputs:

- Genetic variant or genotype annotation, initially APOE e2/e3/e4 status.
- Biomarker values, initially LDL-C and optional total cholesterol or apoB.
- Lifestyle input, initially saturated-fat intake or a proxy such as dietary pattern.
- Demographic and risk-factor fields needed for context, initially age, sex, and optional diabetes or medication status.

Outputs:

- A user-facing recommendation.
- Evidence citations and source identifiers such as PMID, PMCID, guideline reference, or database accession.
- A reasoning trace showing which evidence was used, which rule fired, confidence level, conflicts, and missing information.

Non-goals:

- Diagnosis, treatment, or medication advice.
- A broad nutrition chatbot.
- Direct clinical deployment without expert review.

## Architecture

Structured user profile
-> profile normalisation
-> evidence retrieval with metadata filters
-> evidence schema
-> deterministic rule engine
-> constrained explanation layer
-> UI reasoning trace

The rule engine owns the decision. Retrieval supplies candidate evidence. The LLM is constrained to cite only evidence statements that passed validation and to preserve the rule engine's confidence and caveats.

## Evidence schema and prior art

The evidence schema should not invent a new evidence framework from scratch. Pharmacogenomics already has structured evidence practices through CPIC and PharmGKB, and health guidelines commonly use GRADE-style certainty categories. CPIC assigns actionability levels to gene-drug pairs and notes that only Level A and B pairs have sufficient evidence for at least one prescribing action. PharmGKB assigns clinical annotation levels of evidence for variant-drug combinations. GRADE provides a transparent framework for rating certainty of evidence and strength of recommendations.

The MVP will adapt these principles rather than claim a full clinical evidence framework. For the APOE/diet example, evidence statements will use GRADE-style certainty labels: high, moderate, low, very low. The schema will also include provenance, population, intervention, comparator, outcome, effect size, conflict group, review status, and reviewer fields.

Example fields:

- id
- claim
- source_id
- source_type
- population
- genotype
- biomarker
- intervention
- comparator
- outcome
- effect_size
- certainty_grade
- recommendation_strength
- conflict_group
- review_status
- reviewed_by
- last_reviewed

## Architecture alternatives

Alternative 1: wrap CPIC or PharmGKB with a UI.

This is the right approach for drug-gene recommendations, and a future version should use CPIC or PharmGKB directly when the product covers pharmacogenomics. It is not enough for this MVP because the worked example is diet and LDL-C rather than medication prescribing.

Alternative 2: build a typed biomedical knowledge graph with provenance on edges.

This is the better long-term architecture for a broad clinically defensible product. It would represent variants, biomarkers, interventions, outcomes, evidence strength, conflicts, and provenance as typed nodes and edges. The cost is scope: designing, populating, validating, and querying a real knowledge graph is larger than a 2.5-month internship MVP.

Chosen MVP: a graph-compatible evidence table plus deterministic rules.

The flat evidence schema is intentionally a buildable first step toward a knowledge graph. Conflict groups, source IDs, intervention fields, and outcome fields are structured so they can later become typed graph edges. This keeps the demo auditable now without pretending the hand-curated corpus is already a scalable clinical knowledge base.

## Worked example: APOE x LDL-C x saturated fat

Input profile:

- APOE e3/e4.
- LDL-C 145 mg/dL.
- Saturated-fat intake 14% of energy.

Retrieved evidence:

- RISCK secondary analysis: APOE-e4 carriers showed larger reductions in total cholesterol and apoB than E3/E3 participants after replacing saturated fat with low-GI carbohydrate on a lower-fat diet. Carvalho-Wells et al., Nutrients 2018, PMCID: PMC6213759.
- DELTA: APOE genotype did not predict differential lipid response to saturated-fat reduction in a normolipidemic US population. DELTA Research Group, ATVB 1997, PMID: 9409276.
- Guideline background: elevated LDL-C and high saturated-fat intake support saturated-fat reduction independent of genotype.

Rules fired:

- LDL-C rule: elevated LDL-C plus high saturated-fat intake triggers guideline-based saturated-fat reduction.
- APOE rule: APOE-e4 plus RISCK evidence changes the preferred replacement strategy toward lower-GI, high-fibre carbohydrate sources.
- Conflict rule: DELTA conflicts with RISCK, so confidence is lowered and the output must not imply a guaranteed genotype-specific response.

Final output:

The user should reduce saturated-fat intake because LDL-C is elevated. Because the profile includes APOE-e4, the system prioritises lower-GI, high-fibre carbohydrate replacement as the first strategy to test, while presenting this as moderate or low-certainty evidence rather than a guaranteed genetic effect. The output shows RISCK as supporting evidence and DELTA as conflicting evidence.

## Scaling beyond hand-curation

The MVP corpus can be hand-curated, but the product cannot scale by manually writing every evidence statement. The scalable path is a human-in-the-loop evidence pipeline:

1. Candidate generation from PubMed, MeSH expansion, guidelines, CPIC/PharmGKB where applicable, and database APIs.
2. Structured extraction of population, genotype, intervention, comparator, outcome, and effect size.
3. Automated duplicate detection and conflict grouping.
4. Human review of source validity, claim wording, certainty grade, and clinical actionability.
5. Versioned evidence release with reviewer, date, source IDs, and change log.
6. Periodic review by a domain expert before any user-facing production use.

The previous school BioASQ project can contribute retrieval patterns, MeSH expansion, PMID validation, and reranking. It cannot validate recommendations by itself. BioASQ remains useful only as a retrieval-layer sanity check, not as an end-to-end benchmark for personalised advice.

## Evaluation plan

The main evaluation will use synthetic APOE/LDL/diet profiles, not BioASQ user questions. Each profile will test whether the system retrieves relevant evidence, fires the correct rule, exposes uncertainty, and avoids overclaiming.

Evaluation cases:

- APOE-e4, elevated LDL-C, high saturated-fat intake.
- APOE-e3/e3, elevated LDL-C, high saturated-fat intake.
- APOE-e4, normal LDL-C, high saturated-fat intake.
- Missing genotype, elevated LDL-C, high saturated-fat intake.

Metrics:

- Traceability: every recommendation cites validated evidence.
- Rule correctness: fired rules match the profile.
- Personalisation delta: genotype changes output only when evidence supports a meaningful difference.
- Conflict handling: conflicting evidence lowers confidence or appears in the trace.
- Coverage: missing fields and unsupported claims are shown explicitly.
- Retrieval sanity: BioASQ can test whether the retrieval layer finds biomedical documents, but it does not evaluate personalised recommendation correctness.

## Timeline and milestones

Weeks 1-2: Prior art and schema.

- Compare CPIC, PharmGKB, GRADE, knowledge graph design, and flat evidence schema.
- Produce evidence schema v1 and alternatives table.

Weeks 3-4: Product and architecture artifacts.

- Produce UI wireframe or mockup of the end-state demo.
- Produce architecture diagram.
- Produce one complete end-to-end paper trace for the APOE/LDL/diet example.

Weeks 5-6: Prototype planning and evidence corpus.

- Build curated evidence corpus v1.
- Implement a minimal retrieval and rule-trace prototype over synthetic profiles.
- Review evidence schema, trace format, and UI mockup before full build.

Weeks 7-10: Build and demo.

- Build profile normalisation, retrieval, deterministic rule engine, constrained explanation layer, and web UI.
- Test synthetic profiles and finalise demo report.

## Deliverables

- UI wireframe or mockup.
- Architecture diagram.
- Evidence schema v1 with alternatives comparison.
- Curated evidence corpus v1 for APOE/LDL/diet.
- End-to-end trace: input, retrieval, rules fired, conflicts, final output.
- Working prototype over synthetic profiles.
- Final demo and technical writeup.

## Risks

Evidence quality is the main risk. A polished UI can make weak evidence look stronger than it is. The mitigation is to expose source IDs, certainty, conflicts, and missing evidence in the UI.

Scaling is the second major risk. If every recommendation line requires manual evidence extraction, tagging, conflict mapping, rule writing, and review, the engineering and curation workload becomes large quickly. The MVP should therefore prove the workflow on one recommendation line while designing the schema and review process so additional lines can be added systematically.

Clinical validation is unresolved. The MVP can be a research prototype, but a user-facing health product would need review by clinicians, dietitians, or biomedical domain experts before making real-world recommendations.

Scope creep is likely. The MVP should stay limited to APOE, LDL-C, and saturated-fat replacement until the evidence schema, rule trace, and UI are convincing.

## Sources to cite

- Carvalho-Wells et al. Nutrients 2018. PMCID: PMC6213759.
- DELTA Research Group. Arteriosclerosis, Thrombosis, and Vascular Biology 1997. PMID: 9409276.
- CPIC gene-drug levels and guidelines: https://cpicpgx.org/genes-drugs/
- PharmGKB clinical annotation levels: https://www.pharmgkb.org/page/clinAnnLevels
- GRADE Working Group: https://www.gradeworkinggroup.org/
