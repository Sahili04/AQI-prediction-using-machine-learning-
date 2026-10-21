"""
Command-Line Prediction Interface
=================================
Allows running single sample and batch predictions directly from the command line.
"""

import sys
import os
import argparse
import joblib
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.config import get_aqi_category_info

FEATURE_NAMES = [
    "PM2.5", "PM10", "NO2", "NOx", "SO2", "CO", "O3", "Temperature", "Humidity", "Wind_Speed"
]

def predict_sample(pm25, pm10, no2, so2, co, o3, temp, humidity, wind, nox=None, model_path="models/best_model.joblib"):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Run ml/train.py first.")
        
    model = joblib.load(model_path)
    
    if nox is None:
        nox = round(no2 * 1.5 + 4.0, 2)
        
    df = pd.DataFrame([{
        "PM2.5": pm25,
        "PM10": pm10,
        "NO2": no2,
        "NOx": nox,
        "SO2": so2,
        "CO": co,
        "O3": o3,
        "Temperature": temp,
        "Humidity": humidity,
        "Wind_Speed": wind
    }])[FEATURE_NAMES]
    
    aqi_pred = round(float(model.predict(df)[0]), 1)
    category = get_aqi_category_info(aqi_pred)
    
    print("\n" + "="*50)
    print("       AIR QUALITY PREDICTION RESULT")
    print("="*50)
    print(f"Predicted AQI : {aqi_pred}")
    print(f"CPCB Category : {category['name']}")
    print(f"Health Impact : {category['impact']}")
    print("="*50 + "\n")
    return {"aqi": aqi_pred, "category": category["name"]}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict Air Quality Index (AQI)")
    parser.add_argument("--pm25", type=float, default=85.0)
    parser.add_argument("--pm10", type=float, default=140.0)
    parser.add_argument("--no2", type=float, default=35.0)
    parser.add_argument("--so2", type=float, default=12.0)
    parser.add_argument("--co", type=float, default=0.8)
    parser.add_argument("--o3", type=float, default=45.0)
    parser.add_argument("--temp", type=float, default=28.0)
    parser.add_argument("--humidity", type=float, default=65.0)
    parser.add_argument("--wind", type=float, default=3.2)
    args = parser.parse_args()
    
    predict_sample(
        args.pm25, args.pm10, args.no2, args.so2, args.co, args.o3, args.temp, args.humidity, args.wind
    )
