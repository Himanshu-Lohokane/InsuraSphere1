from insurance_recommender import InsuranceRecommender
import pandas as pd
import os
from typing import Dict, List, Optional
import logging

class InsuranceMLIntegration:
    def __init__(self, model_path: str = 'models/insurance_recommender.joblib'):
        """
        Initialize the ML integration service
        
        Args:
            model_path: Path to the saved model file
        """
        self.model_path = model_path
        self.recommender = None
        self.logger = logging.getLogger(__name__)
        
    def initialize_model(self) -> bool:
        """
        Initialize the ML model
        
        Returns:
            bool: True if initialization successful, False otherwise
        """
        try:
            self.recommender = InsuranceRecommender()
            if os.path.exists(self.model_path):
                self.recommender.load_model(self.model_path)
                self.logger.info("Model loaded successfully")
                return True
            else:
                self.logger.warning("Model file not found. Please train the model first.")
                return False
        except Exception as e:
            self.logger.error(f"Error initializing model: {str(e)}")
            return False
    
    def get_recommendations(self, user_profile: Dict) -> List[Dict]:
        """
        Get policy recommendations for a user profile
        
        Args:
            user_profile: Dictionary containing user profile data
            
        Returns:
            List of recommended policies with scores and explanations
        """
        try:
            if not self.recommender:
                if not self.initialize_model():
                    return []
            
            recommendations = self.recommender.predict(user_profile)
            return recommendations
        except Exception as e:
            self.logger.error(f"Error getting recommendations: {str(e)}")
            return []
    
    def train_model(self, data_path: str = 'insurance_training_data.csv') -> bool:
        """
        Train the model with new data
        
        Args:
            data_path: Path to the training data file
            
        Returns:
            bool: True if training successful, False otherwise
        """
        try:
            if not os.path.exists(data_path):
                self.logger.error(f"Training data file not found: {data_path}")
                return False
            
            # Load and preprocess data
            df = pd.read_csv(data_path)
            X = df.drop(columns=['recommended_policy'])
            y = df['recommended_policy']
            
            # Initialize and train model
            self.recommender = InsuranceRecommender()
            self.recommender.train(X, y)
            
            # Save model
            self.recommender.save_model(self.model_path)
            self.logger.info("Model trained and saved successfully")
            return True
        except Exception as e:
            self.logger.error(f"Error training model: {str(e)}")
            return False
    
    def update_user_profile(self, user_id: str, user_profile: Dict) -> bool:
        """
        Update user profile in the training data
        
        Args:
            user_id: Unique identifier for the user
            user_profile: Updated user profile data
            
        Returns:
            bool: True if update successful, False otherwise
        """
        try:
            data_path = 'insurance_training_data.csv'
            if not os.path.exists(data_path):
                self.logger.error("Training data file not found")
                return False
            
            # Load existing data
            df = pd.read_csv(data_path)
            
            # Update or add user profile
            if user_id in df['user_id'].values:
                df.loc[df['user_id'] == user_id, user_profile.keys()] = user_profile.values()
            else:
                new_row = {'user_id': user_id, **user_profile}
                df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            
            # Save updated data
            df.to_csv(data_path, index=False)
            self.logger.info(f"User profile updated for user_id: {user_id}")
            return True
        except Exception as e:
            self.logger.error(f"Error updating user profile: {str(e)}")
            return False
    
    def get_model_metrics(self) -> Dict:
        """
        Get model performance metrics
        
        Returns:
            Dictionary containing model metrics
        """
        try:
            if not self.recommender:
                if not self.initialize_model():
                    return {}
            
            # Get feature importance
            feature_importance = pd.DataFrame({
                'feature': self.recommender.features,
                'importance': self.recommender.model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            return {
                'feature_importance': feature_importance.to_dict('records'),
                'model_type': type(self.recommender.model).__name__,
                'n_features': len(self.recommender.features)
            }
        except Exception as e:
            self.logger.error(f"Error getting model metrics: {str(e)}")
            return {} 