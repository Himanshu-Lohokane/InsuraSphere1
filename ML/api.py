# api.py
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI()

# Load model and encoders
model = joblib.load("model.pkl")
encoders = joblib.load("label_encoders.pkl")

class UserInput(BaseModel):
    age: int
    gender: str
    annual_income_inr: int
    marital_status: str
    has_dependents: str
    occupation: str
    health_issues: str
    vehicle_owner: str
    existing_policies: int
    city_type: str
    education_level: str
    digital_literacy_score: int
    family_medical_history: str
    policy_duration_preference: str
    investment_goal: str

@app.post("/predict/")
def predict(data: UserInput):
    input_dict = data.dict()

    # Encode inputs
    for key in input_dict:
        if key in encoders:
            input_dict[key] = encoders[key].transform([input_dict[key]])[0]

    input_df = pd.DataFrame([input_dict])
    prediction = model.predict(input_df)[0]

    # Decode the prediction
    policy_decoder = encoders["interested_policy"]
    prediction_label = policy_decoder.inverse_transform([prediction])[0]

    return {"recommended_policy": prediction_label}
