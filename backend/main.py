"""
FastAPI Backend Application
===========================
REST API serving real machine learning predictions, model evaluations,
CPCB AQI categories, feature importances, and exploratory data analysis.
"""

import io
import os
import sys
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure root directory is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.schemas import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionResponse
)
from backend.services import model_service, FEATURE_NAMES
from backend.config import AQI_CATEGORIES, FEATURE_METADATA

app = FastAPI(
    title="Air Quality Index (AQI) Prediction API",
    description="College-level Machine Learning System for predicting ambient AQI based on environmental and pollutant parameters.",
    version="1.0.0"
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "project": "AIR QUALITY PREDICTION USING MACHINE LEARNING",
        "author": "B.Tech Artificial Intelligence & Data Science",
        "status": "Online",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    """Health check endpoint to verify backend status and loaded models."""
    return {
        "status": "healthy",
        "models_loaded": model_service.is_loaded,
        "available_models": model_service.get_available_models(),
        "best_model": model_service.metrics.get("best_model_name", "None")
    }

@app.get("/model-info")
def model_info():
    """Returns metadata about the active best model and feature specifications."""
    best_name = model_service.metrics.get("best_model_name", "Gradient Boosting")
    best_metrics = model_service.metrics.get("best_model_metrics", {})
    return {
        "model_name": best_name,
        "target_variable": "AQI (Air Quality Index)",
        "input_features": FEATURE_NAMES,
        "feature_metadata": FEATURE_METADATA,
        "cpcb_categories": AQI_CATEGORIES,
        "test_performance": best_metrics.get("test_metrics", {}),
        "cv_performance": best_metrics.get("cv_metrics", {}),
        "overfitting_diagnosis": best_metrics.get("overfitting_analysis", {})
    }

@app.get("/available-models")
def available_models():
    """Lists all trained regression models available for interactive selection."""
    return {
        "models": model_service.get_available_models(),
        "best_model": model_service.metrics.get("best_model_name", "Gradient Boosting")
    }

@app.get("/metrics")
def get_model_metrics():
    """Returns comparative metrics (MAE, MSE, RMSE, R2, 5-Fold CV, Overfitting) for all models."""
    if not model_service.metrics:
        raise HTTPException(status_code=500, detail="Model metrics artifact not found.")
    return model_service.metrics

@app.get("/feature-importance")
def get_feature_importance():
    """Returns feature importance rankings for tree-based ensemble models."""
    feat_imp = model_service.metrics.get("feature_importance", {})
    if not feat_imp:
        raise HTTPException(status_code=404, detail="Feature importance data not found.")
    return feat_imp

@app.get("/dataset-summary")
def get_dataset_summary():
    """Returns dataset overview: record counts, features, missing values, and descriptive stats."""
    if not model_service.eda_summary:
        raise HTTPException(status_code=500, detail="Dataset summary not found.")
    
    eda = model_service.eda_summary
    return {
        "total_records": eda.get("total_records"),
        "cleaned_records": eda.get("cleaned_records"),
        "features": eda.get("features"),
        "target": eda.get("target"),
        "missing_analysis": eda.get("missing_analysis"),
        "feature_stats": eda.get("feature_stats"),
        "aqi_category_distribution": eda.get("aqi_category_distribution")
    }

@app.get("/eda-data")
def get_eda_data():
    """Returns full exploratory data analysis data including correlation and covariance matrices."""
    if not model_service.eda_summary:
        raise HTTPException(status_code=500, detail="EDA data not found.")
    return model_service.eda_summary

@app.get("/gradient-descent-demo")
def get_gradient_descent_demo():
    """Returns cost reduction curves, iterations, and weight vectors for manual GD demo."""
    if not model_service.gd_history:
        raise HTTPException(status_code=500, detail="Gradient descent demo data not found.")
    return model_service.gd_history

@app.post("/predict", response_model=PredictionResponse)
def predict_aqi(request: PredictionRequest):
    """
    Predicts AQI for a single set of environmental parameters.
    Validates physical bounds, runs through the trained pipeline, determines CPCB category,
    and returns legitimate 95% uncertainty intervals.
    """
    try:
        response = model_service.predict_single(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(file: UploadFile = File(...), model_name: str = Form(None)):
    """
    Accepts an uploaded CSV file, cleans columns, runs batch inference,
    and returns predictions with category distribution.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a CSV format.")
        
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="ignore")))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty.")
            
        result = model_service.predict_batch_df(df, model_name=model_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
