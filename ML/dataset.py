import random
from faker import Faker
import pandas as pd

fake = Faker()

def generate_user():
    age = random.randint(18, 70)
    income = random.choices(
        population=[
            random.randint(200000, 400000),
            random.randint(400000, 1000000),
            random.randint(1000000, 3000000)
        ],
        weights=[0.3, 0.5, 0.2],
        k=1
    )[0]

    gender = random.choice(["Male", "Female"])
    marital_status = random.choice(["Single", "Married", "Divorced"])
    has_dependents = random.choice(["Yes", "No"])
    occupation = random.choice(["Engineer", "Teacher", "Doctor", "Driver", "Freelancer", "Retired"])
    health_issues = random.choices(["None", "Mild", "Chronic"], weights=[0.5, 0.3, 0.2])[0]
    vehicle_owner = random.choice(["Yes", "No"])
    existing_policies = random.randint(0, 3)

    # New features
    city_type = random.choice(["Urban", "Rural"])
    education_level = random.choice(["High School", "Graduate", "Postgraduate", "PhD"])
    digital_literacy_score = random.randint(1, 10)
    family_medical_history = random.choices(
        ["None", "Diabetes", "Heart Disease", "Cancer"],
        weights=[0.4, 0.2, 0.25, 0.15]
    )[0]
    policy_duration_preference = random.choice(["Short-Term", "Long-Term", "Lifetime"])
    investment_goal = random.choice(["None", "Child Education", "Retirement", "Wealth Creation"])

    # Premium: calculated as 2% to 10% of annual income
    premium = round(income * random.uniform(0.02, 0.1), 2)

    # Target: Interested Policy Type
    if age < 30 and vehicle_owner == "Yes":
        interested_policy = "auto"
    elif age > 50 and health_issues != "None":
        interested_policy = "health"
    elif has_dependents == "Yes":
        interested_policy = random.choice(["term", "life"])
    else:
        interested_policy = random.choice(["life", "health", "auto", "term"])

    return {
        "user_id": fake.uuid4(),
        "age": age,
        "gender": gender,
        "annual_income_inr": income,
        "premium": premium,
        "marital_status": marital_status,
        "has_dependents": has_dependents,
        "occupation": occupation,
        "health_issues": health_issues,
        "vehicle_owner": vehicle_owner,
        "existing_policies": existing_policies,
        "city_type": city_type,
        "education_level": education_level,
        "digital_literacy_score": digital_literacy_score,
        "family_medical_history": family_medical_history,
        "policy_duration_preference": policy_duration_preference,
        "investment_goal": investment_goal,
        "interested_policy": interested_policy
    }

# Generate dataset
data = [generate_user() for _ in range(1000)]
df = pd.DataFrame(data)
df.to_csv("insurance_recommendation_dataset_inr.csv", index=False)
print("Dataset saved as insurance_recommendation_dataset_inr.csv")
