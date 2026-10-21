"""
Educational Implementation: Linear Regression via Gradient Descent
===================================================================
A manual, from-scratch implementation using pure NumPy.
Designed for B.Tech AI & Data Science viva explanations and coursework demonstration.

Mathematical Derivation:
1. Hypothesis:
   y_hat = X . w + b
   where:
   - X is the feature matrix (m samples, n features)
   - w is the weight vector (n features,)
   - b is the scalar bias (intercept)

2. Cost Function (Mean Squared Error with 1/2 factor):
   J(w, b) = (1 / (2 * m)) * sum((y_hat_i - y_i)^2)

3. Partial Derivatives (Gradients):
   dJ/dw = (1 / m) * X.T . (y_hat - y)
   dJ/db = (1 / m) * sum(y_hat - y)

4. Update Rule (Simultaneous Parameter Updates):
   w := w - alpha * (dJ/dw)
   b := b - alpha * (dJ/db)
   where alpha is the learning rate.
"""

import os
import json
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

class ScratchLinearRegressionGD:
    """
    Scratch Linear Regression trained using Batch Gradient Descent.
    """
    def __init__(self, learning_rate=0.05, n_iterations=300):
        self.learning_rate = learning_rate
        self.n_iterations = n_iterations
        self.weights = None
        self.bias = 0.0
        self.cost_history = []
        self.iteration_history = []
        
    def compute_cost(self, X, y, w, b):
        """Calculates MSE cost J(w, b)."""
        m = len(y)
        predictions = np.dot(X, w) + b
        cost = (1.0 / (2.0 * m)) * np.sum((predictions - y) ** 2)
        return float(cost)
        
    def fit(self, X, y):
        """
        Fits linear regression weights and bias using batch gradient descent.
        """
        m, n = X.shape
        # Initial parameters
        self.weights = np.zeros(n)
        self.bias = 0.0
        self.cost_history = []
        self.iteration_history = []
        
        for iteration in range(1, self.n_iterations + 1):
            # Step 1: Forward prediction
            y_hat = np.dot(X, self.weights) + self.bias
            
            # Step 2: Error calculation
            errors = y_hat - y
            
            # Step 3: Gradient calculation
            dw = (1.0 / m) * np.dot(X.T, errors)
            db = (1.0 / m) * np.sum(errors)
            
            # Step 4: Parameter update
            self.weights -= self.learning_rate * dw
            self.bias -= self.learning_rate * db
            
            # Step 5: Cost recording
            cost = self.compute_cost(X, y, self.weights, self.bias)
            self.cost_history.append(cost)
            
            # Record periodic snapshots for viva demonstration
            if iteration in [1, 5, 10, 25, 50, 100, 150, 200, 250, 300]:
                self.iteration_history.append({
                    "iteration": iteration,
                    "cost": round(cost, 4),
                    "bias": round(float(self.bias), 4),
                    "weight_norm": round(float(np.linalg.norm(self.weights)), 4)
                })
                
        return self
        
    def predict(self, X):
        """Vectorized inference."""
        return np.dot(X, self.weights) + self.bias

def run_gradient_descent_lab(csv_path="data/air_quality.csv"):
    """
    Academic experiment comparing different learning rates:
    alpha = 0.001 (too slow), alpha = 0.05 (optimal), alpha = 0.2 (fast/aggressive).
    """
    os.makedirs("models", exist_ok=True)
    df = pd.read_csv(csv_path).dropna()
    
    features = ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3", "Temperature", "Humidity", "Wind_Speed"]
    X = df[features].values
    y = df["AQI"].values
    
    # Gradient descent REQUIREMENT: Feature scaling (Z-score standardization)
    # Without scaling, features with large variance (like PM10) cause elongated cost contours
    # leading to zig-zagging or divergence.
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    
    # Train across multiple learning rates to demonstrate convergence dynamics
    learning_rates = [0.005, 0.03, 0.08]
    histories = {}
    
    plt.figure(figsize=(10, 6))
    
    best_model = None
    for lr in learning_rates:
        model = ScratchLinearRegressionGD(learning_rate=lr, n_iterations=200)
        model.fit(X_train, y_train)
        histories[f"lr_{lr}"] = {
            "learning_rate": lr,
            "cost_history": [round(c, 2) for c in model.cost_history],
            "iterations": list(range(1, len(model.cost_history) + 1)),
            "snapshots": model.iteration_history,
            "final_cost": round(model.cost_history[-1], 2),
            "final_bias": round(float(model.bias), 2),
            "final_weights": {feat: round(float(w), 3) for feat, w in zip(features, model.weights)}
        }
        plt.plot(range(1, 201), model.cost_history, label=f"Learning Rate alpha = {lr}")
        if lr == 0.08:
            best_model = model
            
    plt.title("Gradient Descent: Cost Function J(w, b) vs Iterations (Academic Demo)", fontsize=13, fontweight="bold")
    plt.xlabel("Iteration Number", fontsize=11)
    plt.ylabel("Cost J(w, b) [Half MSE]", fontsize=11)
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend(fontsize=11)
    plot_path = "models/gd_convergence_plot.png"
    plt.tight_layout()
    plt.savefig(plot_path, dpi=200)
    plt.close()
    
    # Evaluate scratch model on test set
    y_pred = best_model.predict(X_test)
    test_mae = float(np.mean(np.abs(y_test - y_pred)))
    test_rmse = float(np.sqrt(np.mean((y_test - y_pred) ** 2)))
    ss_tot = np.sum((y_test - np.mean(y_test)) ** 2)
    ss_res = np.sum((y_test - y_pred) ** 2)
    test_r2 = float(1.0 - (ss_res / ss_tot))
    
    output_data = {
        "experiments": histories,
        "optimal_lr": 0.08,
        "n_iterations": 200,
        "features": features,
        "test_metrics": {
            "mae": round(test_mae, 3),
            "rmse": round(test_rmse, 3),
            "r2": round(test_r2, 4)
        },
        "plot_path": plot_path
    }
    
    with open("models/gd_history.json", "w") as f:
        json.dump(output_data, f, indent=2)
        
    print(f"[Gradient Descent] Lab executed successfully. Saved plot to {plot_path}")
    print(f"[Gradient Descent] Test R2: {test_r2:.4f}, RMSE: {test_rmse:.3f}, MAE: {test_mae:.3f}")
    return output_data

if __name__ == "__main__":
    run_gradient_descent_lab()
