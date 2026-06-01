# HFE Worked Example Trace

**Why this example exists:** This document proves that the DNA layer in this product can change the interpretation priority, the clinician question, and the most relevant follow-up — not just the wording. It replaces the earlier LDL-C + generic diet example, which did not demonstrate genotype-aware personalization.

---

## Why LDL-C + generic diet advice is not a valid worked example

A common framing in early DNA-health products is:

> "Your LDL-C is elevated. Given your genotype, we recommend reducing saturated fat."

This fails to demonstrate genotype-aware value because:

- Reducing dietary saturated fat is guideline-recommended advice for *any* LDL-C elevation, regardless of genotype.
- The output is identical whether or not a genotype is present.
- The genotype layer is therefore decorative — it adds words but does not change the interpretation or the specific follow-up.

A real worked example must show: **if you remove the genotype, the output changes in a meaningful way** (priority, question, or which uncertainty matters).

---

## Worked Example: HFE Genotype + Elevated Ferritin + Elevated Transferrin Saturation

### Why this example is stronger

HFE genotype genuinely changes:

| What changes | How |
|---|---|
| Interpretation priority | Ferritin alone is a non-specific marker; HFE variant changes the priority of the specific differential |
| Clinician question | From "repeat iron studies, consider inflammation/liver context" to "discuss whether HFE-related iron overload evaluation is appropriate" |
| Which uncertainty matters | With HFE: the key conflict is whether ferritin reflects iron overload vs. other causes; without HFE: no specific genetic context to anchor the differential |
| Most relevant follow-up | With HFE: fasting iron studies, transferrin saturation confirmation; without HFE: broader metabolic/liver workup |

---

## Biomarker-Only Output (no genotype)

**Input blood markers:**
- Ferritin: 280 µg/L (above upper normal ~200 µg/L for adult males; reference range varies by lab)
- Transferrin saturation: 48% (elevated; reference range typically 20–50%, saturation ≥45–50% warrants follow-up)

**Standard output:**

> Your ferritin and transferrin saturation are both elevated. Elevated ferritin can result from iron excess, inflammation, liver disease, or metabolic syndrome. Repeat fasting iron studies and discuss these values with your clinician — they may want to consider inflammation markers, liver function, and metabolic context.

**Assessment:** Useful, accurate, and appropriate. But not genotype-aware. The same output applies to any patient with these values.

---

## Genotype-Aware Output (with HFE variant)

**Same blood markers as above, plus:**
- HFE genotype: C282Y homozygous (the most common variant associated with hereditary hemochromatosis in Northern European populations; OMIM: 235200)

**Genotype-aware output:**

> Your ferritin and transferrin saturation are elevated, and an HFE variant is present in your genetic data. This combination changes the question worth asking at your next clinical visit: discuss whether an HFE-related iron overload evaluation is appropriate. This does not diagnose iron overload — ferritin can be elevated for other reasons, and clinical confirmation is required.

**What is different:**
- The output now frames a *specific* diagnostic pathway to consider, not just "repeat labs broadly".
- The clinician question is more targeted.
- The uncertainty is named: ferritin may not reflect iron overload even with HFE variant.

---

## What Genotype Changes

1. **Interpretation priority** — the same blood values now trigger a more specific interpretation pathway
2. **Clinician question specificity** — from "consider inflammation, liver, metabolic context" to "discuss whether HFE-related iron overload evaluation is appropriate"
3. **Which uncertainty matters** — with HFE: the key conflict is iron overload vs. other ferritin drivers; without HFE: no specific anchor for the differential
4. **Most relevant additional follow-up** — with HFE: fasting iron studies, transferrin saturation confirmation; without: broader metabolic/liver workup

---

## What Genotype Does NOT Prove

- HFE variant does not diagnose iron overload. Penetrance is incomplete; most C282Y homozygotes do not develop clinical hemochromatosis without other factors.
- Ferritin can be elevated for reasons unrelated to iron: acute-phase response, liver disease, alcohol, metabolic syndrome, certain cancers.
- Elevated transferrin saturation alone does not confirm iron overload.
- This output does not tell the user to start, stop, or change any treatment.
- A clinician confirmation (additional labs, clinical history) is required before any interpretation is acted upon.

---

## Full End-to-End Trace

### Inputs

```
DNA:
  - Gene: HFE
  - Variant: rs1800562 (C282Y) — homozygous

Blood:
  - Ferritin: 280 µg/L
  - Transferrin saturation: 48%

Optional context (if available):
  - hs-CRP / CRP (helps distinguish iron overload from inflammatory ferritin elevation)
  - ALT/AST (liver function context)
  - Alcohol intake (user-declared)
```

### Retrieval / Evidence Used

```
Guideline sources:
  - EASL Clinical Practice Guidelines: Haemochromatosis (2022)
    → C282Y homozygosity + elevated transferrin saturation → evaluate for iron overload
  - AASLD guidance on hereditary hemochromatosis

Lab reference sources:
  - Ferritin upper normal: ~200 µg/L (adult male); ~150 µg/L (adult female) — lab-dependent
  - Transferrin saturation: ≥45% in fasting sample warrants further evaluation (EASL)
  - Note: both ranges vary by laboratory and population; source-level label preserved

HFE evidence level:
  - C282Y homozygosity: strongest known HFE-associated iron overload genotype
  - Evidence level: strong (ClinVar pathogenic; ClinGen: definitive gene-disease association)
  - C282Y heterozygous: much lower penetrance; context only in this framework
  - H63D: weaker evidence; compound heterozygote C282Y/H63D: moderate evidence
```

### Rules Fired

```
1. elevated_ferritin
   → ferritin > 200 µg/L (male) / 150 µg/L (female) → flag for review

2. elevated_transferrin_saturation
   → transferrin saturation ≥ 45% → flag for further evaluation

3. hfe_genotype_relevant
   → HFE C282Y homozygous detected in DNA file
   → genotype_changes_priority = true

4. combined_iron_signal
   → elevated_ferritin AND elevated_transferrin_saturation AND hfe_genotype_relevant
   → priority = clinician_discussion (not just "monitor")
   → dnaBloodStatus = "supported_by_blood"
   → specific_question = "discuss HFE-related iron overload evaluation"
```

### Conflict Checks

```
Conflict 1: Ferritin may not reflect iron overload
  - Ferritin is an acute-phase reactant; elevated CRP/inflammation can raise ferritin independently
  - Resolution: transferrin saturation is less affected by inflammation; elevated saturation + elevated ferritin + HFE genotype increases specificity of the signal
  - If CRP is available and elevated: add note that inflammatory ferritin elevation cannot be excluded

Conflict 2: Incomplete penetrance of HFE C282Y homozygosity
  - Not all C282Y homozygotes develop clinical iron overload
  - Resolution: genotype changes the question to ask, not the diagnosis — output framed as "discuss evaluation", not "you have iron overload"

Conflict 3: Lab reference range variability
  - Ferritin and transferrin saturation reference ranges vary by laboratory, sex, age
  - Resolution: flag the reference used, note lab-dependency, do not present as absolute threshold
```

### Final Consumer-Facing Output

**Priority:** Clinician discussion

**Status label:** Monitor · Supported by blood

**User-facing result:**

> Your ferritin and transferrin saturation are elevated, and an HFE variant is present in your DNA file. DNA can change which question is worth asking next. Blood shows the current signal; DNA changes how we frame the follow-up.
>
> **Discuss with your clinician:** Is an HFE-related iron overload evaluation appropriate given these values?
>
> This does not diagnose iron overload. Ferritin can be elevated for other reasons. A clinician can review your full history, repeat fasting iron studies if needed, and determine whether further investigation is warranted.

**Safety boundary:** No diagnosis. No self-treatment. No recommendation to start or stop any supplement without clinician guidance.

---

## Clinician Discussion Questions

1. My ferritin is elevated and an HFE variant is in my DNA file — does this warrant a fasting iron panel or specialist referral?
2. Could my ferritin elevation be explained by inflammation, alcohol, liver disease, or another cause rather than iron overload?
3. If HFE-related iron overload is being considered, what additional tests would you want to order?
4. Does the specific HFE variant I carry (C282Y homozygous) change the clinical priority compared to a heterozygous result?

---

## Notes for Future Development

- This example is hand-curated for the prototype. The evidence items (EASL, ClinVar) should be preserved with source-level provenance in a production evidence schema.
- HFE is a strong worked example because genotype meaningfully narrows the differential. Not all gene–biomarker pairs have this property — the evidence schema should track whether `genotype_changes_priority = true` for each rule.
- When scaling: add HFE H63D, compound heterozygote C282Y/H63D as lower-evidence variants with different output text.
- This example complements the CYP2C19 + clopidogrel example (pharmacogenomics) with a nutrient/metabolic example where genotype changes diagnostic priority rather than drug metabolism.
