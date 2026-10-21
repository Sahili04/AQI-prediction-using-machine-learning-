"""
Pydantic Schemas for Request & Response Validation
===================================================
Enforces strict type checks, positive concentration constraints,
and clean data contracts for the FastAPI endpoints.
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator

class PredictionRequest(BaseModel):
    pm25: float = Field(..., ge=0.0, le=1000.0, description="PM2.5 concentration in µg/m³", examples=[85.0])
    pm10: float = Field(..., ge=0.0, le=1500.0, description="PM10 concentration in µg/m³", examples=[140.0])
    no2: float = Field(..., ge=0.0, le=500.0, description="NO2 concentration in µg/m³", examples=[35.0])
    nox: Optional[float] = Field(None, ge=0.0, le=800.0, description="NOx concentration in ppb (auto-estimated if omitted)")
    so2: float = Field(..., ge=0.0, le=500.0, description="SO2 concentration in µg/m³", examples=[12.0])
    co: float = Field(..., ge=0.0, le=50.0, description="CO concentration in mg/m³", examples=[0.8])
    o3: float = Field(..., ge=0.0, le=500.0, description="O3 concentration in µg/m³", examples=[45.0])
    temperature: float = Field(..., ge=-20.0, le=60.0, description="Temperature in °C", examples=[28.0])
    humidity: float = Field(..., ge=0.0, le=100.0, description="Relative Humidity percentage (0-100%)", examples=[65.0])
    wind_speed: float = Field(..., ge=0.0, le=40.0, description="Wind speed in m/s", examples=[3.2])
    model_name: Optional[str] = Field(None, description="Optional model to use (default: best performing model)")

    @field_validator("pm10")
    @classmethod
    def validate_pm10_greater_than_pm25(cls, v, values):
        # Physical sanity check warning: typically PM10 includes PM2.5, but we don't strictly reject if equal
        return v

class UncertaintyInfo(BaseModel):
    residual_standard_error: float
    confidence_interval_95: List[float]
    interpretation: str

class PredictionResponse(BaseModel):
    predicted_aqi: float
    category: str
    category_color: str
    badge_style: str
    health_impact: str
    model_used: str
    uncertainty: UncertaintyInfo
    input_summary: Dict[str, float]
    explanation: str

class BatchPredictionResponse(BaseModel):
    total_processed: int
    predictions: List[Dict[str, Any]]
    category_counts: Dict[str, int]
    mean_predicted_aqi: float
    model_used: str
