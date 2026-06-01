# Evidence Schema

**Purpose:** Define the TypeScript-style types that represent how evidence is stored, linked, and surfaced in this product. These types preserve source-native evidence levels — they do not invent a new framework. UI labels are display-only mappings, not separate evidence categories.

---

## Design principles

1. **Preserve source-native evidence levels.** CPIC has its own recommendation tiers (1A, 1B, 2A, 2B, 3). PharmGKB has clinical annotation levels (1A, 1B, 2A, 2B). ClinGen uses a classification framework. ClinVar uses pathogenicity categories. GRADE uses certainty levels. None of these are the same. The schema stores the source-native level in `sourceEvidenceLevel` and `sourceFramework`, not flattened into a custom "strong / moderate / weak" ladder.

2. **UI labels are display mappings, not evidence categories.** The UI may show "Guideline-backed", "Supportive", "Exploratory", or "Conflicting" — these are reader-friendly summaries for consumers, not a replacement for the underlying evidence levels. The mapping is explicit and documented.

3. **Conflicts and supports are first-class.** Evidence items can conflict with or support each other. This is not an edge case — it is expected for markers like ferritin (elevated by iron overload, inflammation, liver disease, and metabolic syndrome simultaneously).

4. **Review status is required.** Every evidence item must carry a review status. No evidence item should be surfaced to users before it has been reviewed.

---

## Types

### SourceCitation

A pointer to a specific external source — guideline, paper, database record.

```typescript
type SourceCitation = {
  citationId: string;
  // The type of the source
  type:
    | "clinical_guideline"   // EASL, AASLD, ACC/AHA, etc.
    | "cpic_guideline"       // CPIC-specific
    | "pharmgkb_annotation"  // PharmGKB clinical annotation
    | "clinvar_record"       // ClinVar variant interpretation
    | "clingen_curated"      // ClinGen gene-disease curation
    | "gwas_catalog"         // GWAS Catalog association
    | "lab_reference"        // Lab reference range (source-specific)
    | "review_article"       // Peer-reviewed review / meta-analysis
    | "primary_study";       // Primary research paper

  // Human-readable citation
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  url?: string;

  // Where in the source this claim lives
  section?: string;      // e.g., "Section 3.2", "Table 2"
  pageOrTable?: string;
};
```

### EvidenceSource

A curated evidence source record — one per distinct evidence claim. Many evidence items (e.g. rules) can reference the same source.

```typescript
type EvidenceSource = {
  id: string;

  // Source-native evidence level — do not flatten these
  // Examples:
  //   CPIC: "1A" | "1B" | "2A" | "2B" | "3"
  //   PharmGKB: "1A" | "1B" | "2A" | "2B" | "3" | "4"
  //   ClinGen: "definitive" | "strong" | "moderate" | "limited" | "disputed" | "refuted"
  //   ClinVar: "pathogenic" | "likely_pathogenic" | "uncertain_significance" | "likely_benign" | "benign"
  //   GRADE: "high" | "moderate" | "low" | "very_low"
  //   lab_range: use sourceFramework = "lab_reference" with no standard tier
  sourceEvidenceLevel: string;

  // Which framework the level comes from
  sourceFramework:
    | "CPIC"
    | "PharmGKB"
    | "ClinGen"
    | "ClinVar"
    | "GRADE"
    | "EASL"
    | "AASLD"
    | "lab_reference"
    | "internal_review"   // hand-curated, no external standard
    | "other";

  // The citation(s) this source is drawn from
  citations: SourceCitation[];

  // Whether this evidence has been reviewed and approved for product use
  reviewStatus: "pending_review" | "approved" | "flagged_for_update" | "retired";
  reviewedBy?: string;    // curator name or reviewer role
  reviewedAt?: string;    // ISO date
  validatedBy?: string;   // second-level reviewer for clinically sensitive claims

  // What population this evidence was derived from or applies to
  populationScope?: string;   // e.g. "Northern European", "pan-ethnic", "East Asian"

  // IDs of evidence sources this one conflicts with or supports
  conflictsWith?: string[];   // IDs of other EvidenceSource records
  supports?: string[];        // IDs of other EvidenceSource records this corroborates

  // What type of claim this source supports
  appliesTo:
    | "gene_drug_interaction"
    | "gene_disease_association"
    | "biomarker_reference_range"
    | "gene_biomarker_interaction"
    | "metabolic_pathway"
    | "other";

  notes?: string;   // curator notes — not shown to users
};
```

---

### EvidenceItem

An evidence item links a specific evidence source to a specific claim within a rule or insight. One `EvidenceSource` can be referenced by many `EvidenceItem`s with different roles.

```typescript
type EvidenceItem = {
  id: string;
  evidenceSourceId: string;

  // The specific claim being made based on this source
  claim: string;

  // The role this evidence plays in the rule or insight
  role:
    | "primary"       // this evidence is the main basis for the conclusion
    | "supporting"    // corroborates the primary evidence
    | "conflict"      // raises a known alternative interpretation
    | "context";      // provides background, not the main claim

  // UI display label — a consumer-facing summary, NOT the source evidence level
  // This is a display mapping only. It does not replace sourceEvidenceLevel.
  uiLabel:
    | "Guideline-backed"    // maps from: CPIC 1A/1B, EASL recommendation, ClinGen definitive/strong
    | "Supportive"          // maps from: PharmGKB 2A, CPIC 2B, ClinGen moderate, GRADE moderate
    | "Exploratory"         // maps from: GWAS, single study, limited ClinGen, GRADE low/very low
    | "Conflicting"         // role = "conflict"; alternative interpretation present
    | "Context only";       // role = "context"; not a primary claim

  notes?: string;
};
```

**Important:** The `uiLabel` mapping table should be documented and version-controlled. It is a display convention, not a new evidence framework. Any change to this mapping requires review.

---

### RuleCondition

A single condition that must be met for a rule to fire. Conditions match genotype calls, blood marker values, or user-supplied context.

```typescript
type RuleCondition = {
  type: "genotype" | "blood_marker" | "medication" | "user_context";

  // For genotype conditions
  rsid?: string;
  genotypePattern?: string;           // e.g., "C282Y/C282Y", "*2/*2"
  gene?: string;                      // e.g., "HFE", "CYP2C19"

  // For blood marker conditions
  markerId?: string;                  // internal normalized marker ID
  markerCondition?: "high" | "low" | "normal" | "above_ref" | "available";

  // For medication conditions
  medicationName?: string;

  // For context conditions
  contextKey?: string;
  contextValue?: string;
};
```

---

### ConflictCheck

Specifies a known conflict that the rule engine must evaluate before finalizing output. If a conflict is unresolved, the output should be more conservative.

```typescript
type ConflictCheck = {
  id: string;
  description: string;

  // What additional data would help resolve this conflict
  resolvingDataNeeded?: string[];    // e.g., ["hs-CRP", "ALT", "alcohol_context"]

  // How to handle the conflict in output
  onConflict:
    | "add_caveat"        // add a specific conflict note to the output
    | "downgrade_priority" // reduce the output priority level
    | "require_context";   // do not produce output without additional context
};
```

---

### InsightRule

A single deterministic rule. If all `requiredConditions` are met and no `exclusionCriteria` block it, the rule fires and produces a structured insight candidate.

```typescript
type InsightRule = {
  id: string;
  category:
    | "medication_gene"
    | "lipid_cardiovascular"
    | "metabolic_glucose"
    | "methylation_nutrient"
    | "inflammation"
    | "iron_metabolism"
    | "other";

  requiredConditions: RuleCondition[];
  exclusionCriteria?: string[];     // plain-language exclusion descriptions

  // Output classification
  priority: "important" | "monitor" | "context" | "reassuring" | "insufficient";
  dnaBloodStatus:
    | "supported_by_blood"
    | "not_currently_reflected"
    | "blood_first_signal"
    | "context_only"
    | "insufficient_evidence";

  // Whether the genotype changes the output in a meaningful way
  genotypeChangesPriority: boolean;

  // Evidence underpinning this rule
  evidenceItemIds: string[];

  // Conflict checks to run before finalizing output
  conflictChecks: ConflictCheck[];

  // Text template identifiers — used by the renderer to select approved copy
  titleTemplateId: string;
  summaryTemplateId: string;
  nextStepsTemplateIds: string[];
  safetyBoundaryTemplateIds: string[];
};
```

---

### Insight

A structured output object produced by the rule engine for one matched rule. This is the input to the text renderer (and optionally the LLM rewriter). The LLM is not allowed to modify any field except `plainLanguageSummary`.

```typescript
type Insight = {
  id: string;
  userId: string;
  ruleId: string;

  category: InsightRule["category"];
  priority: InsightRule["priority"];
  dnaBloodStatus: InsightRule["dnaBloodStatus"];
  genotypeChangesPriority: boolean;

  title: string;

  // Produced by template; optionally rewritten by constrained LLM
  plainLanguageSummary: string;

  // Specific data points from the user's data that triggered this rule
  dataUsed: string[];

  // IDs of evidence items used — traceable to source citations
  evidenceItemIds: string[];

  // Next steps — LLM may not modify these
  nextSteps: string[];

  // Safety boundaries — LLM may not modify these
  safetyBoundaries: string[];

  // Conflicts present in this result
  activeConflicts: string[];   // ConflictCheck IDs that are unresolved

  createdAt: string;   // ISO date
};
```

---

### ClinicianQuestion

A question generated for the user to bring to their clinician. These are tied to a specific insight and tagged by topic.

```typescript
type ClinicianQuestion = {
  id: string;
  insightId: string;

  text: string;

  tag: "Medication" | "Blood" | "DNA" | "Iron" | "Methylation" | "General";

  // Source insight priority — used to sort questions in the UI
  priority: InsightRule["priority"];
};
```

---

## UI label mapping table

This table documents how `uiLabel` values in `EvidenceItem` are derived from source-native levels. This is a display convention only.

| Source framework | Source-native level | `uiLabel` |
|---|---|---|
| CPIC | 1A | Guideline-backed |
| CPIC | 1B | Guideline-backed |
| CPIC | 2A | Supportive |
| CPIC | 2B | Supportive |
| CPIC | 3 | Exploratory |
| PharmGKB | 1A | Guideline-backed |
| PharmGKB | 1B | Guideline-backed |
| PharmGKB | 2A | Supportive |
| PharmGKB | 2B | Supportive |
| PharmGKB | 3, 4 | Exploratory |
| ClinGen | definitive, strong | Guideline-backed |
| ClinGen | moderate | Supportive |
| ClinGen | limited | Exploratory |
| ClinGen | disputed, refuted | Conflicting |
| ClinVar | pathogenic | Guideline-backed (with ClinGen corroboration) |
| ClinVar | likely_pathogenic | Supportive |
| ClinVar | uncertain_significance | Exploratory |
| GRADE | high, moderate | Supportive |
| GRADE | low, very_low | Exploratory |
| EASL recommendation | strong | Guideline-backed |
| EASL recommendation | conditional | Supportive |
| lab_reference | n/a | Context only |
| GWAS | n/a | Exploratory |
| internal_review | n/a | Context only |

---

## What the LLM is allowed to change

| Field | LLM may modify | Reason |
|---|---|---|
| `plainLanguageSummary` | Yes | Plain-language rewrite of structured content |
| `title` | No | Set by template; changes affect priority perception |
| `priority` | No | Set deterministically by rule engine |
| `dnaBloodStatus` | No | Set deterministically by rule engine |
| `nextSteps` | No | Clinical guidance — must not be invented |
| `safetyBoundaries` | No | Safety-critical — must not be removed or softened |
| `evidenceItemIds` | No | Provenance — must not be modified |
| `dataUsed` | No | Audit trail — must not be modified |

The LLM rewrite step must fail safe: if the output contains forbidden phrases ("you should stop", "this confirms you have", "your DNA causes", "this diagnoses"), reject and fall back to the template version.
