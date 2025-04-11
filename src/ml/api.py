from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Optional
from integration import InsuranceMLIntegration
import logging
import uvicorn
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Insurance Recommendation API",
    description="API for insurance policy recommendations using ML",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://insurasphere.vercel.app",  # Vercel production URL
        "https://insurasphere-ml.onrender.com"  # Render production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML integration
ml_integration = InsuranceMLIntegration(model_path='models/insurance_recommender.joblib')

# Pydantic models for request/response validation
class UserProfile(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    age: int
    income: float
    occupation: str
    family_size: int
    marital_status: str
    education_level: str
    risk_tolerance: float
    health_status: str
    existing_conditions: int
    lifestyle: str
    family_medical_history: str
    smoking_status: str
    bmi: float
    savings_rate: float
    debt: float
    investment_experience: float
    coverage_preference: str
    policy_duration_preference: str
    premium_budget: float
    location_type: str
    property_ownership: str
    vehicle_ownership: str

class RecommendationResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    policy_type: str
    score: float
    confidence: str
    explanation: str

class ModelMetricsResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    feature_importance: List[Dict[str, float]]
    model_type: str
    n_features: int

class TrainingResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    status: str
    message: str
    model_initialized: bool

@app.on_event("startup")
async def startup_event():
    """Initialize the ML model on startup"""
    if not ml_integration.initialize_model():
        logger.error("Failed to initialize ML model")
        raise RuntimeError("Failed to initialize ML model")
    logger.info("ML model initialized successfully")

@app.post("/train", response_model=TrainingResponse)
async def train_model():
    """Train the model with current data"""
    try:
        # Get the absolute path to the training data
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(current_dir, 'insurance_training_data.csv')
        
        logger.info(f"Looking for training data at: {data_path}")
        
        if not os.path.exists(data_path):
            return {
                "status": "error",
                "message": f"Training data not found at {data_path}",
                "model_initialized": False
            }
        
        success = ml_integration.train_model(data_path)
        if not success:
            return {
                "status": "error",
                "message": "Failed to train model. Please check the training data.",
                "model_initialized": False
            }
        
        # Initialize the model after training
        if ml_integration.initialize_model():
            return {
                "status": "success",
                "message": "Model trained and initialized successfully",
                "model_initialized": True
            }
        else:
            return {
                "status": "error",
                "message": "Model trained but failed to initialize",
                "model_initialized": False
            }
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "model_initialized": False
        }

@app.post("/recommend", response_model=List[RecommendationResponse])
async def get_recommendations(user_profile: UserProfile):
    """Get insurance policy recommendations for a user"""
    try:
        recommendations = ml_integration.get_recommendations(user_profile.dict())
        if not recommendations:
            raise HTTPException(status_code=500, detail="Failed to generate recommendations")
        return recommendations
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/profiles/{user_id}")
async def update_user_profile(user_id: str, user_profile: UserProfile):
    """Update a user's profile in the training data"""
    try:
        success = ml_integration.update_user_profile(user_id, user_profile.dict())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update user profile")
        return {"status": "success", "message": f"Profile updated for user {user_id}"}
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/metrics", response_model=ModelMetricsResponse)
async def get_model_metrics():
    """Get model performance metrics"""
    try:
        metrics = ml_integration.get_model_metrics()
        if not metrics:
            raise HTTPException(status_code=500, detail="Failed to get model metrics")
        return metrics
    except Exception as e:
        logger.error(f"Error getting model metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test model with sample data
        sample_profile = {
            "age": 35,
            "income": 75000,
            "occupation": "professional",
            "family_size": 2,
            "marital_status": "married",
            "education_level": "bachelors",
            "risk_tolerance": 0.7,
            "health_status": "good",
            "existing_conditions": 1,
            "lifestyle": "active",
            "family_medical_history": "none",
            "smoking_status": "never",
            "bmi": 24.5,
            "savings_rate": 0.15,
            "debt": 25000,
            "investment_experience": 0.6,
            "coverage_preference": "comprehensive",
            "policy_duration_preference": "long_term",
            "premium_budget": 5000,
            "location_type": "urban",
            "property_ownership": "owned",
            "vehicle_ownership": "single"
        }
        recommendations = ml_integration.get_recommendations(sample_profile)
        return {
            "status": "healthy",
            "model_loaded": bool(ml_integration.recommender),
            "test_prediction_successful": bool(recommendations)
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 