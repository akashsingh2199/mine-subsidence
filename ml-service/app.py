from pathlib import Path
from typing import Dict

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict


MODEL_PATH = Path(__file__).with_name("mine_subsidence_models.joblib")
DEFAULT_FEATURES = [
    "tilt_magnitude_deg",
    "tilt_rate_deg_per_min",
    "vibration_rms_g",
    "dominant_frequency_hz",
    "displacement_mm",
    "displacement_rate_mm_per_min",
    "crack_event",
    "crack_opening_mm",
]


class PredictionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tilt_magnitude_deg: float
    tilt_rate_deg_per_min: float
    vibration_rms_g: float
    dominant_frequency_hz: float
    displacement_mm: float
    displacement_rate_mm_per_min: float
    crack_event: float
    crack_opening_mm: float


app = FastAPI(title="Mine Subsidence V1 ML Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_bundle = None
model_load_error = None


def load_model():
    global model_bundle, model_load_error
    try:
        model_bundle = joblib.load(MODEL_PATH)
        model_load_error = None
    except Exception as exc:
        model_bundle = None
        model_load_error = str(exc)


def get_estimator(name: str):
    if model_bundle is None:
        raise HTTPException(status_code=503, detail=f"Model is not loaded: {model_load_error}")
    if name not in model_bundle:
        raise HTTPException(status_code=500, detail=f"Model bundle missing {name}")
    return model_bundle[name]


def get_features():
    if model_bundle and "features" in model_bundle:
        return list(model_bundle["features"])
    return DEFAULT_FEATURES


def as_python_number(value):
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    return value


def class_probabilities(estimator, frame: pd.DataFrame) -> Dict[str, float]:
    if not hasattr(estimator, "predict_proba"):
        return {}

    probabilities = estimator.predict_proba(frame)[0]
    classes = getattr(estimator, "classes_", range(len(probabilities)))
    return {
        str(as_python_number(label)): round(float(probability), 6)
        for label, probability in zip(classes, probabilities)
    }


def positive_class_probability(estimator, frame: pd.DataFrame) -> float:
    if not hasattr(estimator, "predict_proba"):
        return 0.0

    probabilities = estimator.predict_proba(frame)[0]
    classes = list(getattr(estimator, "classes_", range(len(probabilities))))
    positive_index = 1 if len(probabilities) > 1 else 0

    for index, label in enumerate(classes):
        if str(label).lower() in {"1", "true", "risk", "high_risk", "active_subsidence"}:
            positive_index = index
            break

    return round(float(probabilities[positive_index]), 6)


@app.on_event("startup")
def startup_event():
    load_model()


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model_bundle is not None}


@app.post("/predict")
def predict(payload: PredictionInput):
    features = get_features()
    input_values = payload.model_dump()

    missing_features = [feature for feature in features if feature not in input_values]
    if missing_features:
        raise HTTPException(status_code=400, detail=f"Missing required features: {missing_features}")

    frame = pd.DataFrame([[input_values[feature] for feature in features]], columns=features)

    isolation_forest = get_estimator("isolation_forest")
    three_class_model = get_estimator("three_class_random_forest")
    binary_risk_model = get_estimator("binary_risk_random_forest")
    risk_threshold = float(model_bundle.get("risk_threshold", 0.5))

    prediction = str(three_class_model.predict(frame)[0])
    probabilities = class_probabilities(three_class_model, frame)
    anomaly = bool(isolation_forest.predict(frame)[0] == -1)
    risk_probability = positive_class_probability(binary_risk_model, frame)

    if prediction == "active_subsidence":
        final_status = "ACTIVE SUBSIDENCE"
    elif anomaly and risk_probability >= risk_threshold:
        final_status = "HIGH RISK / INVESTIGATION REQUIRED"
    elif prediction == "early_subsidence":
        final_status = "EARLY SUBSIDENCE"
    else:
        final_status = "NORMAL"

    return {
        "prediction": prediction,
        "probabilities": probabilities,
        "anomaly": anomaly,
        "risk_probability": risk_probability,
        "risk_threshold": risk_threshold,
        "final_status": final_status,
    }
