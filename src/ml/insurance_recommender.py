import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os

class InsuranceRecommender:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.features = [
            # Basic Demographic Information
            'age', 
            'income', 
            'occupation', 
            'family_size',
            'marital_status',
            'education_level',
            
            # Risk and Health Assessment
            'risk_tolerance', 
            'health_status', 
            'existing_conditions',
            'lifestyle',
            'family_medical_history',
            'smoking_status',
            'bmi',
            
            # Financial Information
            'savings_rate',
            'debt',
            'investment_experience',
            'premium',
            'premium_to_income_ratio',
            'debt_to_income_ratio',
            
            # Insurance Preferences
            'coverage_preference',
            'policy_duration_preference',
            'premium_budget',
            
            # Location and Assets
            'location_type',
            'property_ownership',
            'vehicle_ownership',
            
            # Engineered Features
            'age_range',
            'years_to_retirement',
            'family_income_burden',
            'per_capita_income',
            'risk_health_score',
            'lifestyle_health_score',
            'financial_stability_score',
            'property_score',
            'vehicle_score'
        ]
        
        self.categorical_features = [
            'occupation', 
            'health_status', 
            'lifestyle', 
            'coverage_preference',
            'marital_status',
            'education_level',
            'family_medical_history',
            'smoking_status',
            'policy_duration_preference',
            'location_type',
            'property_ownership',
            'vehicle_ownership'
        ]
        
    def preprocess_data(self, data):
        # Initialize label encoders for categorical features
        for feature in self.categorical_features:
            if feature not in self.label_encoders:
                self.label_encoders[feature] = LabelEncoder()
            
            if feature in data.columns:
                # Fill missing categorical values with most frequent value
                data[feature] = data[feature].fillna(data[feature].mode()[0])
                data[feature] = self.label_encoders[feature].fit_transform(data[feature])
        
        # Fill missing numerical values with appropriate defaults
        numerical_defaults = {
            'age': data['age'].median(),
            'income': data['income'].median(),
            'family_size': 1,
            'risk_tolerance': 0.5,
            'existing_conditions': 0,
            'bmi': 25,
            'savings_rate': 0.1,
            'debt': 0,
            'investment_experience': 0.5,
            'premium_budget': data['income'].median() * 0.05
        }
        
        for feature, default in numerical_defaults.items():
            if feature in data.columns:
                data[feature] = data[feature].fillna(default)
        
        # Add engineered features
        # Calculate premium based on income and coverage preference
        coverage_preference_map = {'basic': 0.02, 'standard': 0.04, 'premium': 0.06, 'comprehensive': 0.08}
        data['premium'] = data['income'] * data['coverage_preference'].map(coverage_preference_map)
        
        # Financial ratios with zero division handling
        data['premium_to_income_ratio'] = np.where(
            data['income'] > 0,
            data['premium'] / data['income'],
            0
        )
        data['debt_to_income_ratio'] = np.where(
            data['income'] > 0,
            data['debt'] / data['income'],
            0
        )
        
        # Age-related features
        data['age_range'] = pd.cut(
            data['age'], 
            bins=[18, 30, 45, 60, 100], 
            labels=[0, 1, 2, 3],
            include_lowest=True
        )
        data['years_to_retirement'] = np.maximum(65 - data['age'], 0)
        
        # Family and income features with zero division handling
        data['family_income_burden'] = np.where(
            data['income'] > 0,
            data['family_size'] / (data['income'] / 10000),
            0
        )
        data['per_capita_income'] = np.where(
            data['family_size'] > 0,
            data['income'] / data['family_size'],
            data['income']
        )
        
        # Health and risk scores
        health_status_map = {'excellent': 1.0, 'good': 0.75, 'fair': 0.5, 'poor': 0.25}
        data['risk_health_score'] = data['risk_tolerance'] * data['health_status'].map(health_status_map)
        
        lifestyle_map = {'active': 1.0, 'moderate': 0.75, 'sedentary': 0.5}
        data['lifestyle_health_score'] = data['lifestyle'].map(lifestyle_map) * (1 - data['existing_conditions'] / 4)
        
        # Financial stability score with safe calculations
        max_income = data['income'].max()
        if max_income == 0:
            max_income = 1
        data['financial_stability_score'] = (
            data['savings_rate'] * 0.3 +
            (1 - np.minimum(data['debt_to_income_ratio'], 1)) * 0.3 +
            data['investment_experience'] * 0.2 +
            (data['income'] / max_income) * 0.2
        )
        
        # Property and vehicle ownership scores
        property_map = {'owned': 1.0, 'mortgaged': 0.7, 'rented': 0.3, 'none': 0.0}
        vehicle_map = {'multiple': 1.0, 'single': 0.7, 'none': 0.0}
        
        data['property_score'] = data['property_ownership'].map(property_map)
        data['vehicle_score'] = data['vehicle_ownership'].map(vehicle_map)
        
        # Ensure all numerical features are finite
        numerical_features = [f for f in self.features if f not in self.categorical_features]
        for feature in numerical_features:
            if feature in data.columns:
                # Convert to numeric type if not already
                data[feature] = pd.to_numeric(data[feature], errors='coerce')
                # Replace inf/-inf with NaN
                data[feature] = data[feature].replace([np.inf, -np.inf], np.nan)
                # Fill NaN with median
                data[feature] = data[feature].fillna(data[feature].median())
        
        # Scale numerical features
        data[numerical_features] = self.scaler.fit_transform(data[numerical_features])
        
        # Final check for any remaining NaN values
        if data.isna().any().any():
            print("Warning: NaN values found after preprocessing. Filling with 0.")
            data = data.fillna(0)
        
        return data
    
    def train(self, training_data, labels):
        """
        Train the random forest model with feature importance analysis
        
        Args:
            training_data (pd.DataFrame): Training data with features
            labels (pd.Series): Target labels (policy types/recommendations)
        """
        processed_data = self.preprocess_data(training_data)
        
        # Initialize model with optimized parameters
        self.model = RandomForestClassifier(
            n_estimators=200,  # Increased from 100
            max_depth=15,      # Increased from 10
            min_samples_split=2,  # Decreased from 5
            min_samples_leaf=1,   # Decreased from 2
            max_features='sqrt',  # Added to reduce overfitting
            class_weight='balanced',  # Added to handle class imbalance
            random_state=42
        )
        
        # Train model
        self.model.fit(processed_data, labels)
        
        # Analyze feature importance
        feature_importance = pd.DataFrame({
            'feature': self.features,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nFeature Importance Analysis:")
        print(feature_importance)
        
        # Remove features with very low importance
        important_features = feature_importance[feature_importance['importance'] > 0.01]['feature'].tolist()
        self.features = [f for f in self.features if f in important_features]
        
        # Retrain model with important features only
        self.model.fit(processed_data[self.features], labels)
    
    def predict(self, user_data):
        """
        Predict policy recommendations for a user with detailed confidence scores
        
        Args:
            user_data (dict or pd.DataFrame): User profile data or test data
            
        Returns:
            list: Ranked list of recommended policy types with scores and explanations
        """
        # Handle both DataFrame and dict input
        if isinstance(user_data, dict):
            user_df = pd.DataFrame([user_data])
        else:
            user_df = user_data.copy()
        
        # Preprocess user data
        processed_data = self.preprocess_data(user_df)
        
        # Ensure we have all required features
        missing_features = set(self.features) - set(processed_data.columns)
        if missing_features:
            for feature in missing_features:
                processed_data[feature] = 0
        
        # Get probability scores for each class
        probabilities = self.model.predict_proba(processed_data[self.features])
        
        # Get class labels
        classes = self.model.classes_
        
        # Create recommendations with scores and explanations
        recommendations = []
        for i in range(len(processed_data)):
            sample_recommendations = []
            for class_idx, prob in enumerate(probabilities[i]):
                policy_type = classes[class_idx]
                score = float(prob)
                
                # Generate explanation based on feature importance
                explanation = self._generate_explanation(policy_type, processed_data.iloc[[i]])
                
                sample_recommendations.append({
                    'policy_type': policy_type,
                    'score': score,
                    'confidence': self._get_confidence_level(score),
                    'explanation': explanation
                })
            
            # Sort by probability score
            sample_recommendations.sort(key=lambda x: x['score'], reverse=True)
            recommendations.append(sample_recommendations)
        
        # If input was a single dict, return single list of recommendations
        if isinstance(user_data, dict):
            return recommendations[0]
        
        return recommendations
    
    def _get_confidence_level(self, score):
        """Determine confidence level based on score"""
        if score > 0.8:
            return 'Very High'
        elif score > 0.6:
            return 'High'
        elif score > 0.4:
            return 'Medium'
        elif score > 0.2:
            return 'Low'
        else:
            return 'Very Low'
    
    def _generate_explanation(self, policy_type, processed_data):
        """Generate explanation for the recommendation based on feature importance"""
        # Get feature importance for this policy type
        feature_importance = dict(zip(self.features, self.model.feature_importances_))
        
        # Get top 3 most important features
        top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:3]
        
        explanation = f"This recommendation is based on: "
        for feature, importance in top_features:
            value = processed_data[feature].iloc[0]
            explanation += f"\n- {feature}: {value} (importance: {importance:.2f})"
        
        return explanation
    
    def save_model(self, model_path: str = 'models/insurance_recommender.joblib'):
        """Save the trained model and preprocessing objects"""
        os.makedirs('models', exist_ok=True)
        joblib.dump(self.model, model_path)
        joblib.dump(self.label_encoders, 'models/label_encoders.joblib')
        joblib.dump(self.scaler, 'models/scaler.joblib')

    def load_model(self, model_path: str = 'models/insurance_recommender.joblib'):
        """Load the trained model and preprocessing objects"""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"No pre-trained model found at {model_path}")
        if not os.path.exists('models/label_encoders.joblib'):
            raise FileNotFoundError("No label encoders found")
        if not os.path.exists('models/scaler.joblib'):
            raise FileNotFoundError("No scaler found")
            
        self.model = joblib.load(model_path)
        self.label_encoders = joblib.load('models/label_encoders.joblib')
        self.scaler = joblib.load('models/scaler.joblib') 