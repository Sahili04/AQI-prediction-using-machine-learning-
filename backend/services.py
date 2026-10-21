"""
Backend Model Service & Inference Engine
========================================
Loads pre-trained pipelines, applies strict feature transformations,
performs single and batch inference, and computes legitimate uncertainty intervals.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

from backend.config import get_aqi_category_info, FEATURE_METADATA
from backend.schemas import PredictionRequest, PredictionResponse, UncertaintyInfo, BatchPredictionResponse

# Feature order expected by the trained scikit-learn models
FEATURE_NAMES = [
    "PM2.5",
    "PM10",
    "NO2",
    "NOx",
    "SO2",
    "CO",
    "O3",
    "Temperature",
    "Humidity",
    "Wind_Speed"
]

class ModelService:
    def __init__(self, models_dir: str = "models"):
        self.models_dir = models_dir
        self.best_model = None
        self.all_models = {}
        self.metrics = {}
        self.eda_summary = {}
        self.gd_history = {}
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self):
        """Loads serialized models, preprocessing pipelines, and evaluation metrics."""
        best_model_path = os.path.join(self.models_dir, "best_model.joblib")
        all_models_path = os.path.join(self.models_dir, "all_models.joblib")
        metrics_path = os.path.join(self.models_dir, "metrics.json")
        eda_path = os.path.join(self.models_dir, "eda_summary.json")
        gd_path = os.path.join(self.models_dir, "gd_history.json")

        if os.path.exists(best_model_path):
            self.best_model = joblib.load(best_model_path)
            
        if os.path.exists(all_models_path):
            self.all_models = joblib.load(all_models_path)
            
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                self.metrics = json.load(f)
                
        if os.path.exists(eda_path):
            with open(eda_path, "r") as f:
                self.eda_summary = json.load(f)

        if os.path.exists(gd_path):
            with open(gd_path, "r") as f:
                self.gd_history = json.load(f)
                
        self.is_loaded = bool(self.best_model and self.all_models)
        print(f"[Service] Loaded ML artifacts. Models available: {list(self.all_models.keys())}")

    def get_available_models(self) -> List[str]:
        return list(self.all_models.keys())

    def get_model_by_name(self, name: str = None):
        """Returns requested model or defaults to the overall best model."""
        if not name:
            return self.best_model, self.metrics.get("best_model_name", "Gradient Boosting")
        
        # Direct lookup or fuzzy match
        for key in self.all_models:
            if name.lower() in key.lower():
                return self.all_models[key], key
                
        return self.best_model, self.metrics.get("best_model_name", "Gradient Boosting")

    def predict_single(self, req: PredictionRequest) -> PredictionResponse:
        """
        Executes single sample inference through the loaded model pipeline.
        """
        # If NOx was not supplied by user, estimate realistically from NO2
        nox_val = req.nox if req.nox is not None else round(req.no2 * 1.5 + 4.0, 2)
        
        # Create single-row DataFrame with explicit column names
        row_dict = {
            "PM2.5": [req.pm25],
            "PM10": [req.pm10],
            "NO2": [req.no2],
            "NOx": [nox_val],
            "SO2": [req.so2],
            "CO": [req.co],
            "O3": [req.o3],
            "Temperature": [req.temperature],
            "Humidity": [req.humidity],
            "Wind_Speed": [req.wind_speed]
        }
        input_df = pd.DataFrame(row_dict)[FEATURE_NAMES]
        
        # Select model
        model, model_name = self.get_model_by_name(req.model_name)
        
        # Predict
        raw_pred = float(model.predict(input_df)[0])
        predicted_aqi = round(max(0.0, raw_pred), 1)
        
        # Determine CPCB NAQI Category
        cat_info = get_aqi_category_info(predicted_aqi)
        
        # Legitimate 95% Confidence / Prediction interval calculation:
        # For supervised regression, point predictions do not have classification probabilities.
        # The appropriate uncertainty metric is the 95% prediction interval based on the model's test RMSE:
        # [y_pred - 1.96 * RMSE, y_pred + 1.96 * RMSE]
        rse = self.metrics.get("residual_std_error", 4.56)
        ci_lower = round(max(0.0, predicted_aqi - 1.96 * rse), 1)
        ci_upper = round(predicted_aqi + 1.96 * rse, 1)
        
        uncertainty = UncertaintyInfo(
            residual_standard_error=rse,
            confidence_interval_95=[ci_lower, ci_upper],
            interpretation=f"Based on the held-out test evaluation (RMSE = {rse:.2f}), there is a 95% statistical confidence that the true ambient AQI lies within [{ci_lower}, {ci_upper}]."
        )
        
        input_summary = {
            "PM2.5": req.pm25,
            "PM10": req.pm10,
            "NO2": req.no2,
            "NOx": nox_val,
            "SO2": req.so2,
            "CO": req.co,
            "O3": req.o3,
            "Temperature": req.temperature,
            "Humidity": req.humidity,
            "Wind_Speed": req.wind_speed
        }
        
        explanation = (
            f"Prediction generated using the trained {model_name} pipeline. "
            f"Air Quality is categorized as '{cat_info['name']}' based on the Indian Central Pollution Control Board (CPCB) NAQI standard."
        )
        
        return PredictionResponse(
            predicted_aqi=predicted_aqi,
            category=cat_info["name"],
            category_color=cat_info["color"],
            badge_style=cat_info["badge"],
            health_impact=cat_info["impact"],
            model_used=model_name,
            uncertainty=uncertainty,
            input_summary=input_summary,
            explanation=explanation
        )

    def predict_batch_df(self, df: pd.DataFrame, model_name: str = None) -> BatchPredictionResponse:
        """
        Processes a batch DataFrame, handling column aliases, running inference,
        and producing category aggregates.
        """
        # Map case-insensitive column names
        col_map = {}
        for col in df.columns:
            clean_col = col.strip()
            for target_col in FEATURE_NAMES:
                if clean_col.lower() == target_col.lower() or clean_col.lower().replace(".", "").replace("_", "") == target_col.lower().replace(".", "").replace("_", ""):
                    col_map[col] = target_col
                    
        renamed_df = df.rename(columns=col_map)
        
        # Ensure missing features are filled
        for f in FEATURE_NAMES:
            if f not in renamed_df.columns:
                if f == "NOx" and "NO2" in renamed_df.columns:
                    renamed_df["NOx"] = renamed_df["NO2"] * 1.5 + 4.0
                else:
                    renamed_df[f] = FEATURE_METADATA[f]["default"]
                    
        feature_df = renamed_df[FEATURE_NAMES].copy()
        
        # Fill nulls with medians
        feature_df = feature_df.fillna(feature_df.median(numeric_only=True))
        
        model, used_model_name = self.get_model_by_name(model_name)
        preds = model.predict(feature_df)
        
        results = []
        category_counts = {}
        
        for idx, row in feature_df.iterrows():
            aqi_val = round(max(0.0, float(preds[idx])), 1)
            cat_info = get_aqi_category_info(aqi_val)
            category_counts[cat_info["name"]] = category_counts.get(cat_info["name"], 0) + 1
            
            res_row = {
                "row_id": int(idx) + 1,
                "predicted_aqi": aqi_val,
                "category": cat_info["name"],
                "category_color": cat_info["color"],
                "pm25": float(row["PM2.5"]),
                "pm10": float(row["PM10"]),
                "temp": float(row["Temperature"]),
                "wind": float(row["Wind_Speed"])
            }
            results.append(res_row)
            
        mean_aqi = round(float(np.mean(preds)), 1)
        
        return BatchPredictionResponse(
            total_processed=len(results),
            predictions=results[:100],  # Return up to 100 preview rows
            category_counts=category_counts,
            mean_predicted_aqi=mean_aqi,
            model_used=used_model_name
        )

# Global service singleton
model_service = ModelService()
