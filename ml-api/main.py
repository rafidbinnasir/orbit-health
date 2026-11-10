from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib

# Initialize FastAPI
app = FastAPI(title="ORBIT Health ML API")

# Load trained model
saved_data = joblib.load("model/orbit_isolation_forest.joblib")

model = saved_data["model"]
features = saved_data["features"]


# Define incoming health data
class HealthReading(BaseModel):
    heart_rate: float
    spo2: float
    temperature: float


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "ORBIT Health ML API is running"
    }


# Prediction endpoint
@app.post("/predict")
def predict(reading: HealthReading):

    input_data = pd.DataFrame(
        [[
            reading.heart_rate,
            reading.spo2,
            reading.temperature
        ]],
        columns=features
    )

    prediction = model.predict(input_data)[0]
    score = model.decision_function(input_data)[0]

    return {
        "prediction": int(prediction),
        "status": "ANOMALY" if prediction == -1 else "NORMAL",
        "anomaly_score": round(float(score), 5)
    }