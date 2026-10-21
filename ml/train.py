"""
Model Training, Cross-Validation, Tuning, and Evaluation Pipeline
================================================================
Trains and comprehensively compares 5 regression models:
1. Linear Regression (Ordinary Least Squares)
2. Ridge Regression (L2 Regularization)
3. Lasso Regression (L1 Regularization)
4. Random Forest Regressor (Ensemble Bagging)
5. Gradient Boosting Regressor (Ensemble Boosting)

Features:
- Proper data leakage avoidance using sklearn Pipelines
- 5-Fold Cross Validation
- Train vs Test Overfitting Analysis
- Hyperparameter Tuning using GridSearchCV for RF and Gradient Boosting
- Feature Importance extraction for tree models
- Serialization of best model and metrics
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.pipeline import Pipeline
from sklearn.model_selection import KFold, cross_val_score, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from ml.preprocess import prepare_train_test_data, FEATURE_COLUMNS, TARGET_COLUMN

def calculate_metrics(y_true, y_pred):
    """Calculates MAE, MSE, RMSE, and R2 score."""
    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_true, y_pred))
    return {
        "mae": round(mae, 3),
        "mse": round(mse, 3),
        "rmse": round(rmse, 3),
        "r2": round(r2, 4)
    }

def train_and_evaluate_all():
    print("[Pipeline] Preparing preprocessed train/test data...")
    data_dict = prepare_train_test_data()
    X_train = data_dict["X_train"]
    X_test = data_dict["X_test"]
    y_train = data_dict["y_train"]
    y_test = data_dict["y_test"]
    
    std_prep = data_dict["standard_preprocessor"]
    tree_prep = data_dict["tree_preprocessor"]
    
    # 5-Fold Cross Validation Setup
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    
    # Define models
    # Note: Linear, Ridge, and Lasso use std_prep (Imputer + StandardScaler)
    # Random Forest and Gradient Boosting use tree_prep (Imputer only, invariant to scale)
    base_pipelines = {
        "Linear Regression": Pipeline([
            ("preprocessor", std_prep),
            ("regressor", LinearRegression())
        ]),
        "Ridge Regression": Pipeline([
            ("preprocessor", std_prep),
            ("regressor", Ridge(alpha=1.0, random_state=42))
        ]),
        "Lasso Regression": Pipeline([
            ("preprocessor", std_prep),
            ("regressor", Lasso(alpha=0.5, random_state=42))
        ]),
        "Random Forest": Pipeline([
            ("preprocessor", tree_prep),
            ("regressor", RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1))
        ]),
        "Gradient Boosting": Pipeline([
            ("preprocessor", tree_prep),
            ("regressor", GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=42))
        ])
    }
    
    trained_models = {}
    model_metrics = {}
    
    print("\n[Pipeline] Training and evaluating base regression models...")
    for name, pipe in base_pipelines.items():
        print(f"  Training {name}...")
        pipe.fit(X_train, y_train)
        trained_models[name] = pipe
        
        # Predictions
        y_train_pred = pipe.predict(X_train)
        y_test_pred = pipe.predict(X_test)
        
        train_scores = calculate_metrics(y_train, y_train_pred)
        test_scores = calculate_metrics(y_test, y_test_pred)
        
        # 5-Fold CV on training set
        cv_r2 = cross_val_score(pipe, X_train, y_train, cv=kf, scoring="r2", n_jobs=-1)
        cv_rmse = np.sqrt(-cross_val_score(pipe, X_train, y_train, cv=kf, scoring="neg_mean_squared_error", n_jobs=-1))
        
        # Overfitting Analysis
        gen_gap = round(train_scores["r2"] - test_scores["r2"], 4)
        if gen_gap > 0.08:
            overfit_status = "Potential Overfitting (High Variance)"
        elif test_scores["r2"] < 0.70:
            overfit_status = "Potential Underfitting (High Bias)"
        else:
            overfit_status = "Well Generalizing"
            
        model_metrics[name] = {
            "model_name": name,
            "train_metrics": train_scores,
            "test_metrics": test_scores,
            "cv_metrics": {
                "cv_r2_mean": round(float(np.mean(cv_r2)), 4),
                "cv_r2_std": round(float(np.std(cv_r2)), 4),
                "cv_rmse_mean": round(float(np.mean(cv_rmse)), 3),
                "cv_rmse_std": round(float(np.std(cv_rmse)), 3),
                "k_folds": 5
            },
            "overfitting_analysis": {
                "generalization_gap_r2": gen_gap,
                "status": overfit_status,
                "train_r2": train_scores["r2"],
                "test_r2": test_scores["r2"]
            }
        }
        print(f"    Test R2: {test_scores['r2']:.4f} | RMSE: {test_scores['rmse']:.3f} | CV Mean R2: {np.mean(cv_r2):.4f}")

    # Section 14: Hyperparameter Tuning for Random Forest and Gradient Boosting
    print("\n[Pipeline] Hyperparameter Tuning via GridSearchCV...")
    
    # 1. Tuning Random Forest
    rf_param_grid = {
        "regressor__n_estimators": [100, 150],
        "regressor__max_depth": [10, 15, None],
        "regressor__min_samples_split": [2, 5],
        "regressor__min_samples_leaf": [1, 2]
    }
    rf_grid = GridSearchCV(
        base_pipelines["Random Forest"],
        rf_param_grid,
        cv=3,
        scoring="neg_mean_squared_error",
        n_jobs=-1
    )
    rf_grid.fit(X_train, y_train)
    best_rf_pipe = rf_grid.best_estimator_
    best_rf_test_pred = best_rf_pipe.predict(X_test)
    best_rf_metrics = calculate_metrics(y_test, best_rf_test_pred)
    
    # 2. Tuning Gradient Boosting
    gb_param_grid = {
        "regressor__n_estimators": [100, 150],
        "regressor__learning_rate": [0.05, 0.1],
        "regressor__max_depth": [3, 5],
        "regressor__min_samples_split": [2, 5]
    }
    gb_grid = GridSearchCV(
        base_pipelines["Gradient Boosting"],
        gb_param_grid,
        cv=3,
        scoring="neg_mean_squared_error",
        n_jobs=-1
    )
    gb_grid.fit(X_train, y_train)
    best_gb_pipe = gb_grid.best_estimator_
    best_gb_test_pred = best_gb_pipe.predict(X_test)
    best_gb_metrics = calculate_metrics(y_test, best_gb_test_pred)
    
    tuning_comparison = {
        "Random Forest": {
            "best_params": {k.replace("regressor__", ""): v for k, v in rf_grid.best_params_.items()},
            "before_tuning": model_metrics["Random Forest"]["test_metrics"],
            "after_tuning": best_rf_metrics,
            "rmse_improvement": round(model_metrics["Random Forest"]["test_metrics"]["rmse"] - best_rf_metrics["rmse"], 3)
        },
        "Gradient Boosting": {
            "best_params": {k.replace("regressor__", ""): v for k, v in gb_grid.best_params_.items()},
            "before_tuning": model_metrics["Gradient Boosting"]["test_metrics"],
            "after_tuning": best_gb_metrics,
            "rmse_improvement": round(model_metrics["Gradient Boosting"]["test_metrics"]["rmse"] - best_gb_metrics["rmse"], 3)
        }
    }
    
    # Update trained models with tuned versions if they improved
    if best_rf_metrics["r2"] >= model_metrics["Random Forest"]["test_metrics"]["r2"]:
        trained_models["Random Forest (Tuned)"] = best_rf_pipe
        # Update metrics
        train_tuned_scores = calculate_metrics(y_train, best_rf_pipe.predict(X_train))
        model_metrics["Random Forest"]["test_metrics"] = best_rf_metrics
        model_metrics["Random Forest"]["train_metrics"] = train_tuned_scores
        
    if best_gb_metrics["r2"] >= model_metrics["Gradient Boosting"]["test_metrics"]["r2"]:
        trained_models["Gradient Boosting (Tuned)"] = best_gb_pipe
        train_tuned_scores = calculate_metrics(y_train, best_gb_pipe.predict(X_train))
        model_metrics["Gradient Boosting"]["test_metrics"] = best_gb_metrics
        model_metrics["Gradient Boosting"]["train_metrics"] = train_tuned_scores

    # Section 15: Feature Importance extraction
    print("\n[Pipeline] Extracting Feature Importance from tree-based models...")
    rf_reg = best_rf_pipe.named_steps["regressor"]
    gb_reg = best_gb_pipe.named_steps["regressor"]
    
    rf_feat_imp = sorted([
        {"feature": feat, "importance": round(float(imp), 4), "percentage": round(float(imp * 100), 2)}
        for feat, imp in zip(FEATURE_COLUMNS, rf_reg.feature_importances_)
    ], key=lambda x: x["importance"], reverse=True)
    
    gb_feat_imp = sorted([
        {"feature": feat, "importance": round(float(imp), 4), "percentage": round(float(imp * 100), 2)}
        for feat, imp in zip(FEATURE_COLUMNS, gb_reg.feature_importances_)
    ], key=lambda x: x["importance"], reverse=True)
    
    feature_importance_data = {
        "Random Forest": rf_feat_imp,
        "Gradient Boosting": gb_feat_imp
    }
    
    # Best Model Selection
    # Highest test R2 score / lowest test RMSE
    best_model_name = max(model_metrics.keys(), key=lambda k: model_metrics[k]["test_metrics"]["r2"])
    best_model_pipe = trained_models.get(best_model_name + " (Tuned)", trained_models[best_model_name])
    
    print(f"\n[Pipeline] Best Model Selected: {best_model_name} (Test R2: {model_metrics[best_model_name]['test_metrics']['r2']})")
    
    # Compute test set residual standard error for uncertainty estimation
    test_preds = best_model_pipe.predict(X_test)
    residuals = y_test - test_preds
    residual_std = float(np.std(residuals))
    
    # Model comparison summary table
    comparison_table = []
    for m_name, data in model_metrics.items():
        comparison_table.append({
            "model": m_name,
            "mae": data["test_metrics"]["mae"],
            "mse": data["test_metrics"]["mse"],
            "rmse": data["test_metrics"]["rmse"],
            "r2": data["test_metrics"]["r2"],
            "cv_r2_mean": data["cv_metrics"]["cv_r2_mean"],
            "cv_r2_std": data["cv_metrics"]["cv_r2_std"],
            "is_best": (m_name == best_model_name)
        })
        
    full_metrics = {
        "best_model_name": best_model_name,
        "best_model_metrics": model_metrics[best_model_name],
        "residual_std_error": round(residual_std, 2),
        "models": model_metrics,
        "comparison_table": sorted(comparison_table, key=lambda x: x["r2"], reverse=True),
        "tuning_comparison": tuning_comparison,
        "feature_importance": feature_importance_data
    }
    
    # Save artifacts
    os.makedirs("models", exist_ok=True)
    joblib.dump(best_model_pipe, "models/best_model.joblib")
    joblib.dump(trained_models, "models/all_models.joblib")
    
    with open("models/metrics.json", "w") as f:
        json.dump(full_metrics, f, indent=2)
        
    print("[Pipeline] Saved models/best_model.joblib, models/all_models.joblib, models/metrics.json successfully!")
    return full_metrics

if __name__ == "__main__":
    train_and_evaluate_all()
