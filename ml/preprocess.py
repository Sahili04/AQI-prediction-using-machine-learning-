"""
Data Preprocessing Pipeline
============================
Handles data ingestion, validation, cleaning, missing value imputation,
feature scaling, and train/test splitting without data leakage.

Key Principles for College ML Viva:
1. Data Leakage Prevention: Transformers (Imputer, Scaler) are fitted ONLY on the
   training set (X_train.fit_transform) and then applied to the test set (X_test.transform).
2. Scaling Rationale:
   - Linear Regression, Ridge, Lasso, and Gradient Descent are sensitive to feature scales.
     Unequal feature scales distort L1/L2 penalties and cause slow or unstable gradient descent.
   - Decision Trees and Tree Ensembles (Random Forest, Gradient Boosting) split on single
     features based on information gain / MSE reduction and are monotonically invariant to scaling.
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import joblib

FEATURE_COLUMNS = [
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

TARGET_COLUMN = "AQI"

def load_and_inspect_dataset(csv_path="data/air_quality.csv"):
    """
    Step 1: Load CSV and inspect structure (shape, columns, dtypes, nulls, duplicates).
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")
    
    df = pd.read_csv(csv_path)
    
    inspection_report = {
        "shape": list(df.shape),
        "columns": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_counts": df.isnull().sum().to_dict(),
        "duplicate_rows_count": int(df.duplicated().sum())
    }
    
    return df, inspection_report

def clean_raw_data(df):
    """
    Step 2: Clean invalid values and drop exact duplicates.
    - Remove negative pollutant values (physically impossible concentrations)
    - Bound humidity to [0, 100]
    - Drop duplicate observations
    """
    cleaned_df = df.drop_duplicates().copy()
    
    # Check and clean invalid pollutant concentrations (< 0)
    pollutant_cols = ["PM2.5", "PM10", "NO2", "NOx", "SO2", "CO", "O3", "Wind_Speed"]
    for col in pollutant_cols:
        if col in cleaned_df.columns:
            cleaned_df.loc[cleaned_df[col] < 0, col] = np.nan
            
    # Humidity validation [0, 100]
    if "Humidity" in cleaned_df.columns:
        cleaned_df.loc[(cleaned_df["Humidity"] < 0) | (cleaned_df["Humidity"] > 100), "Humidity"] = np.nan
        
    # Temperature physical range [-20, 60]
    if "Temperature" in cleaned_df.columns:
        cleaned_df.loc[(cleaned_df["Temperature"] < -20) | (cleaned_df["Temperature"] > 60), "Temperature"] = np.nan
        
    # Drop rows where target AQI is missing or invalid
    if TARGET_COLUMN in cleaned_df.columns:
        cleaned_df = cleaned_df.dropna(subset=[TARGET_COLUMN])
        cleaned_df = cleaned_df[cleaned_df[TARGET_COLUMN] > 0]
        
    return cleaned_df

def compute_eda_summary(df):
    """
    Computes Pearson correlation matrix, covariance matrix, distribution stats,
    and pollutant vs AQI relationship samples for the dashboard.
    """
    numeric_df = df[FEATURE_COLUMNS + [TARGET_COLUMN]].dropna()
    
    # Correlation & Covariance matrices
    corr_matrix = numeric_df.corr(method="pearson").round(4)
    cov_matrix = numeric_df.cov().round(4)
    
    # Feature distribution stats
    stats = {}
    for col in numeric_df.columns:
        series = numeric_df[col]
        stats[col] = {
            "mean": round(float(series.mean()), 2),
            "std": round(float(series.std()), 2),
            "min": round(float(series.min()), 2),
            "q25": round(float(series.quantile(0.25)), 2),
            "median": round(float(series.median()), 2),
            "q75": round(float(series.quantile(0.75)), 2),
            "max": round(float(series.max()), 2),
            "skew": round(float(series.skew()), 2)
        }
        
    # Sample 150 points for interactive scatter charts (AQI vs key pollutants)
    sample_df = numeric_df.sample(n=min(200, len(numeric_df)), random_state=42)
    scatter_data = []
    for _, row in sample_df.iterrows():
        scatter_data.append({
            "aqi": round(float(row["AQI"]), 1),
            "pm25": round(float(row["PM2.5"]), 1),
            "pm10": round(float(row["PM10"]), 1),
            "no2": round(float(row["NO2"]), 1),
            "so2": round(float(row["SO2"]), 1),
            "co": round(float(row["CO"]), 2),
            "o3": round(float(row["O3"]), 1),
            "temp": round(float(row["Temperature"]), 1),
            "humidity": round(float(row["Humidity"]), 1),
            "wind": round(float(row["Wind_Speed"]), 2)
        })
        
    # Missing values breakdown
    missing_analysis = df[FEATURE_COLUMNS + [TARGET_COLUMN]].isnull().sum().to_dict()
    
    # AQI Category Distribution according to CPCB NAQI
    aqi_cats = {
        "Good (0-50)": int((numeric_df["AQI"] <= 50).sum()),
        "Satisfactory (51-100)": int(((numeric_df["AQI"] > 50) & (numeric_df["AQI"] <= 100)).sum()),
        "Moderate (101-200)": int(((numeric_df["AQI"] > 100) & (numeric_df["AQI"] <= 200)).sum()),
        "Poor (201-300)": int(((numeric_df["AQI"] > 200) & (numeric_df["AQI"] <= 300)).sum()),
        "Very Poor (301-400)": int(((numeric_df["AQI"] > 300) & (numeric_df["AQI"] <= 400)).sum()),
        "Severe (401-500)": int((numeric_df["AQI"] > 400).sum())
    }
    
    eda_summary = {
        "total_records": len(df),
        "cleaned_records": len(numeric_df),
        "features": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "missing_analysis": missing_analysis,
        "correlation_matrix": corr_matrix.to_dict(),
        "covariance_matrix": cov_matrix.to_dict(),
        "feature_stats": stats,
        "aqi_category_distribution": aqi_cats,
        "scatter_samples": scatter_data
    }
    
    return eda_summary

def prepare_train_test_data(csv_path="data/air_quality.csv", test_size=0.2, random_state=42):
    """
    Full preprocessing execution:
    1. Ingest & clean
    2. Split X and y
    3. Train/Test Split (prevents data leakage)
    4. Fit Preprocessor (Median Imputer + StandardScaler) on X_train only
    5. Save preprocessor artifacts
    """
    os.makedirs("models", exist_ok=True)
    df, _ = load_and_inspect_dataset(csv_path)
    cleaned_df = clean_raw_data(df)
    
    # Compute and save EDA summary
    eda_summary = compute_eda_summary(cleaned_df)
    with open("models/eda_summary.json", "w") as f:
        json.dump(eda_summary, f, indent=2)
        
    X = cleaned_df[FEATURE_COLUMNS]
    y = cleaned_df[TARGET_COLUMN]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )
    
    # Pipeline 1: Imputation + StandardScaler (Standardization Z-Score)
    # Median is preferred over Mean for air quality pollutants because concentration distributions are right-skewed.
    standard_preprocessor = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    # Pipeline 2: Imputation + MinMaxScaler (Min-Max Normalization to [0, 1])
    minmax_preprocessor = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", MinMaxScaler())
    ])
    
    # Pipeline 3: Imputation only (Preserving original natural units for Tree-based models)
    tree_preprocessor = Pipeline([
        ("imputer", SimpleImputer(strategy="median"))
    ])
    
    # Fit strictly on X_train
    standard_preprocessor.fit(X_train)
    minmax_preprocessor.fit(X_train)
    tree_preprocessor.fit(X_train)
    
    # Save fitted preprocessors
    joblib.dump(standard_preprocessor, "models/standard_preprocessor.joblib")
    joblib.dump(minmax_preprocessor, "models/minmax_preprocessor.joblib")
    joblib.dump(tree_preprocessor, "models/tree_preprocessor.joblib")
    
    print(f"[Preprocessing] Train shape: {X_train.shape}, Test shape: {X_test.shape}")
    print(f"[Preprocessing] Preprocessor pipelines saved to models/")
    
    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "standard_preprocessor": standard_preprocessor,
        "minmax_preprocessor": minmax_preprocessor,
        "tree_preprocessor": tree_preprocessor,
        "eda_summary": eda_summary
    }

if __name__ == "__main__":
    prepare_train_test_data()
