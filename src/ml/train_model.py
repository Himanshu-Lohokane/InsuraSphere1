import pandas as pd
import numpy as np
from insurance_recommender import InsuranceRecommender
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_sample_data(n_samples=5000):
    """Generate synthetic insurance data for training with realistic distributions and correlations"""
    np.random.seed(42)
    
    # Define possible values for categorical features with realistic distributions
    occupations = {
        'professional': 0.3,
        'self-employed': 0.15,
        'salaried': 0.25,
        'business-owner': 0.1,
        'retired': 0.1,
        'student': 0.1
    }
    
    health_statuses = {
        'excellent': 0.2,
        'good': 0.5,
        'fair': 0.2,
        'poor': 0.1
    }
    
    lifestyles = {
        'active': 0.3,
        'moderate': 0.5,
        'sedentary': 0.2
    }
    
    coverage_preferences = {
        'basic': 0.2,
        'standard': 0.4,
        'premium': 0.3,
        'comprehensive': 0.1
    }
    
    marital_statuses = {
        'single': 0.3,
        'married': 0.5,
        'divorced': 0.15,
        'widowed': 0.05
    }
    
    education_levels = {
        'high_school': 0.2,
        'bachelors': 0.4,
        'masters': 0.3,
        'phd': 0.1
    }
    
    family_medical_histories = {
        'none': 0.6,
        'diabetes': 0.2,
        'heart_disease': 0.15,
        'cancer': 0.05
    }
    
    smoking_statuses = {
        'never': 0.6,
        'former': 0.2,
        'current': 0.2
    }
    
    policy_duration_preferences = {
        'short_term': 0.2,
        'medium_term': 0.5,
        'long_term': 0.3
    }
    
    location_types = {
        'urban': 0.4,
        'suburban': 0.4,
        'rural': 0.2
    }
    
    property_ownerships = {
        'owned': 0.4,
        'mortgaged': 0.3,
        'rented': 0.2,
        'none': 0.1
    }
    
    vehicle_ownerships = {
        'multiple': 0.2,
        'single': 0.6,
        'none': 0.2
    }
    
    # Generate correlated features
    age = np.random.normal(40, 15, n_samples)
    age = np.clip(age, 18, 75).astype(int)
    
    # Income correlated with age and education
    base_income = np.random.normal(60000, 20000, n_samples)
    age_factor = (age - 18) / (75 - 18)  # Normalize age to 0-1
    income = base_income * (1 + age_factor * 0.5)  # Income increases with age
    
    # Generate categorical features with realistic distributions
    data = {
        # Basic Demographic Information
        'age': age,
        'income': income,
        'occupation': np.random.choice(list(occupations.keys()), n_samples, p=list(occupations.values())),
        'family_size': np.random.poisson(2, n_samples) + 1,  # Poisson distribution for family size
        'marital_status': np.random.choice(list(marital_statuses.keys()), n_samples, p=list(marital_statuses.values())),
        'education_level': np.random.choice(list(education_levels.keys()), n_samples, p=list(education_levels.values())),
        
        # Risk and Health Assessment
        'risk_tolerance': np.random.beta(2, 2, n_samples),  # Beta distribution for risk tolerance
        'health_status': np.random.choice(list(health_statuses.keys()), n_samples, p=list(health_statuses.values())),
        'existing_conditions': np.random.poisson(0.5, n_samples),  # Poisson distribution for conditions
        'lifestyle': np.random.choice(list(lifestyles.keys()), n_samples, p=list(lifestyles.values())),
        'family_medical_history': np.random.choice(list(family_medical_histories.keys()), n_samples, p=list(family_medical_histories.values())),
        'smoking_status': np.random.choice(list(smoking_statuses.keys()), n_samples, p=list(smoking_statuses.values())),
        'bmi': np.random.normal(25, 4, n_samples),  # Normal distribution for BMI
        
        # Financial Information
        'savings_rate': np.random.beta(2, 5, n_samples),  # Beta distribution for savings rate
        'debt': np.random.normal(20000, 10000, n_samples),
        'investment_experience': np.random.beta(2, 3, n_samples),  # Beta distribution for investment experience
        
        # Insurance Preferences
        'coverage_preference': np.random.choice(list(coverage_preferences.keys()), n_samples, p=list(coverage_preferences.values())),
        'policy_duration_preference': np.random.choice(list(policy_duration_preferences.keys()), n_samples, p=list(policy_duration_preferences.values())),
        'premium_budget': np.random.normal(500, 200, n_samples),
        
        # Location and Assets
        'location_type': np.random.choice(list(location_types.keys()), n_samples, p=list(location_types.values())),
        'property_ownership': np.random.choice(list(property_ownerships.keys()), n_samples, p=list(property_ownerships.values())),
        'vehicle_ownership': np.random.choice(list(vehicle_ownerships.keys()), n_samples, p=list(vehicle_ownerships.values()))
    }
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Generate policy recommendations based on sophisticated rules
    recommendations = []
    for _, row in df.iterrows():
        scores = {}
        
        # Critical Illness Cover
        if (30 <= row['age'] <= 50 and 
            row['income'] >= 50000 and 
            row['coverage_preference'] in ['premium', 'comprehensive'] and
            row['family_medical_history'] != 'none'):
            base_score = 0.7
            # Adjust score based on additional factors
            if row['smoking_status'] == 'current':
                base_score -= 0.1
            if row['health_status'] in ['fair', 'poor']:
                base_score += 0.1
            scores['Critical Illness Cover'] = np.random.uniform(base_score, base_score + 0.2)
        
        # Health Insurance - Premium
        if (row['health_status'] in ['fair', 'poor'] or 
            row['existing_conditions'] > 0 or 
            row['smoking_status'] == 'current' or
            (row['family_size'] >= 3 and row['income'] >= 60000)):
            base_score = 0.7
            # Adjust score based on additional factors
            if row['bmi'] > 30:
                base_score += 0.1
            if row['lifestyle'] == 'sedentary':
                base_score += 0.05
            scores['Health Insurance - Premium'] = np.random.uniform(base_score, base_score + 0.25)
        
        # Term Life Insurance
        if (row['family_size'] > 1 and 
            row['income'] >= 40000 and
            row['age'] <= 60):
            base_score = 0.6
            # Adjust score based on additional factors
            if row['marital_status'] == 'married':
                base_score += 0.1
            if row['education_level'] in ['masters', 'phd']:
                base_score += 0.05
            scores['Term Life Insurance'] = np.random.uniform(base_score, base_score + 0.25)
        
        # Whole Life Insurance
        if (row['income'] >= 80000 and 
            row['coverage_preference'] in ['premium', 'comprehensive'] and 
            row['risk_tolerance'] < 0.4 and
            row['investment_experience'] > 0.5):
            base_score = 0.75
            # Adjust score based on additional factors
            if row['savings_rate'] > 0.2:
                base_score += 0.1
            if row['debt'] < 10000:
                base_score += 0.05
            scores['Whole Life Insurance'] = np.random.uniform(base_score, base_score + 0.15)
        
        # Property Insurance
        if (row['property_ownership'] in ['owned', 'mortgaged'] or 
            row['income'] >= 70000):
            base_score = 0.6
            # Adjust score based on additional factors
            if row['location_type'] == 'urban':
                base_score += 0.1
            if row['property_ownership'] == 'owned':
                base_score += 0.05
            scores['Property Insurance'] = np.random.uniform(base_score, base_score + 0.2)
        
        # Vehicle Insurance
        if (row['vehicle_ownership'] != 'none' and
            25 <= row['age'] <= 60 and 
            row['income'] >= 40000):
            base_score = 0.5
            # Adjust score based on additional factors
            if row['vehicle_ownership'] == 'multiple':
                base_score += 0.1
            if row['location_type'] == 'urban':
                base_score += 0.05
            scores['Vehicle Insurance'] = np.random.uniform(base_score, base_score + 0.2)
        
        # Add some randomness for other policies with lower scores
        all_policies = [
            'Critical Illness Cover',
            'Health Insurance - Premium',
            'Term Life Insurance',
            'Whole Life Insurance',
            'Property Insurance',
            'Vehicle Insurance',
            'Travel Insurance',
            'Disability Insurance'
        ]
        
        for policy in all_policies:
            if policy not in scores:
                base_score = 0.1
                # Add small variations based on user profile
                if row['coverage_preference'] in ['premium', 'comprehensive']:
                    base_score += 0.1
                if row['income'] > 100000:
                    base_score += 0.05
                scores[policy] = np.random.uniform(base_score, base_score + 0.3)
        
        # Sort by score and select the highest
        best_policy = max(scores.items(), key=lambda x: x[1])[0]
        recommendations.append(best_policy)

        
    
    df['recommended_policy'] = recommendations
    
    df.to_csv('insurance_training_data.csv', index=False)
    print("Dataset exported to 'insurance_training_data.csv'")
    
    return df

def save_sample_data(df, filename='insurance_training_data.csv'):
    """Save the generated data to a CSV file"""
    try:
        # Get the absolute path of the current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_dir, filename)
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save the DataFrame to CSV
        df.to_csv(file_path, index=False)
        print(f"Sample data saved to {file_path}")
        
        # Verify the file was created
        if os.path.exists(file_path):
            print(f"File verification successful: {file_path} exists")
            print(f"File size: {os.path.getsize(file_path)} bytes")
        else:
            print(f"Error: File {file_path} was not created")
    except Exception as e:
        print(f"Error saving sample data: {str(e)}")

def main():
    try:
        # Load the training data
        logger.info("Loading training data...")
        df = pd.read_csv('insurance_training_data.csv')
        
        # Verify all required columns are present
        required_columns = [
            'age', 'income', 'occupation', 'family_size', 'marital_status',
            'education_level', 'risk_tolerance', 'health_status', 'existing_conditions',
            'lifestyle', 'family_medical_history', 'smoking_status', 'bmi',
            'savings_rate', 'debt', 'investment_experience', 'coverage_preference',
            'policy_duration_preference', 'premium_budget', 'location_type',
            'property_ownership', 'vehicle_ownership', 'recommended_policy'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Split the data
        logger.info("Splitting data into training and testing sets...")
        X = df.drop(columns=['recommended_policy'])
        y = df['recommended_policy']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Initialize and train the model
        logger.info("Initializing and training the model...")
        recommender = InsuranceRecommender()
        recommender.train(X_train, y_train)
        
        # Evaluate the model
        logger.info("Evaluating model performance...")
        y_pred = recommender.predict(X_test)
        
        # Extract top policy type from each prediction
        y_pred_top = [pred[0]['policy_type'] for pred in y_pred]
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred_top)
        f1 = f1_score(y_test, y_pred_top, average='weighted')
        
        logger.info(f"Model Performance:")
        logger.info(f"Accuracy: {accuracy:.4f}")
        logger.info(f"F1 Score: {f1:.4f}")
        
        # Print feature importance
        logger.info("\nFeature Importance Analysis:")
        feature_importance = pd.DataFrame({
            'feature': recommender.features,
            'importance': recommender.model.feature_importances_
        }).sort_values('importance', ascending=False)
        logger.info(feature_importance)
        
        # Save the trained model
        logger.info("Saving the trained model...")
        recommender.save_model()
        
        # Test with a sample user
        logger.info("\nTesting with sample user...")
        sample_user = {
            'age': 35,
            'income': 75000,
            'occupation': 'professional',
            'family_size': 2,
            'marital_status': 'married',
            'education_level': 'bachelors',
            'risk_tolerance': 0.7,
            'health_status': 'good',
            'existing_conditions': 1,
            'lifestyle': 'active',
            'family_medical_history': 'none',
            'smoking_status': 'never',
            'bmi': 24.5,
            'savings_rate': 0.15,
            'debt': 25000,
            'investment_experience': 0.6,
            'coverage_preference': 'comprehensive',
            'policy_duration_preference': 'long_term',
            'premium_budget': 5000,
            'location_type': 'urban',
            'property_ownership': 'owned',
            'vehicle_ownership': 'single'
        }
        
        recommendations = recommender.predict(sample_user)
        logger.info("\nSample Recommendations:")
        for rec in recommendations:
            logger.info(f"\nPolicy Type: {rec['policy_type']}")
            logger.info(f"Score: {rec['score']:.4f}")
            logger.info(f"Confidence: {rec['confidence']}")
            logger.info(f"Explanation: {rec['explanation']}")
            
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        raise

if __name__ == "__main__":
    main() 