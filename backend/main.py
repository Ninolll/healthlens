from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load NHANES data
biopro = pd.read_sas("../data/BIOPRO_L.xpt")
cbc    = pd.read_sas("../data/CBC_L.xpt")
demo   = pd.read_sas("../data/DEMO_L.xpt")

merged = pd.merge(biopro, demo[["SEQN", "RIAGENDR", "RIDAGEYR"]], on="SEQN")
merged = pd.merge(merged, cbc, on="SEQN", suffixes=("", "_cbc"))

BIOMARKERS = {
    "LBXSGL": "Glucose (mg/dL)",
    "LBXSCH": "Total Cholesterol (mg/dL)",
    "LBXSTR": "Triglycerides (mg/dL)",
    "LBXSCR": "Creatinine (mg/dL)",
    "LBXSUA": "Uric Acid (mg/dL)",
    "LBXSAL": "Albumin (g/dL)",
    "LBXHGB": "Hemoglobin (g/dL)",
    "LBXPLTSI": "Platelets (1000 cells/uL)",
}

def get_percentile(value: float, biomarker: str, age: int, gender: int):
    subset = merged[
        (merged["RIAGENDR"] == gender) &
        (merged["RIDAGEYR"] >= age - 5) &
        (merged["RIDAGEYR"] <= age + 5) &
        (merged[biomarker].notna())
    ][biomarker]

    if len(subset) < 30:
        return None

    percentile = round((subset < value).mean() * 100, 1)

    def interpret(p):
        if p >= 90: return "Very high"
        if p >= 75: return "Above average"
        if p >= 25: return "Normal range"
        if p >= 10: return "Below average"
        return "Very low"

    return {
        "biomarker": BIOMARKERS.get(biomarker, biomarker),
        "user_value": value,
        "percentile": percentile,
        "pop_mean": round(subset.mean(), 2),
        "pop_median": round(subset.median(), 2),
        "interpretation": interpret(percentile),
    }

class AnalyseRequest(BaseModel):
    age: int
    gender: int  # 1=Male, 2=Female
    glucose: float | None = None
    cholesterol: float | None = None
    triglycerides: float | None = None
    creatinine: float | None = None
    hemoglobin: float | None = None

@app.post("/analyse")
def analyse(req: AnalyseRequest):
    inputs = {
        "LBXSGL": req.glucose,
        "LBXSCH": req.cholesterol,
        "LBXSTR": req.triglycerides,
        "LBXSCR": req.creatinine,
        "LBXHGB": req.hemoglobin,
    }
    results = []
    for col, value in inputs.items():
        if value is not None:
            result = get_percentile(value, col, req.age, req.gender)
            if result:
                results.append(result)
    return {"results": results}

@app.get("/health")
def health():
    return {"status": "ok"}