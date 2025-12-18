import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import os
import warnings
from sklearn.model_selection import train_test_split

# Suppress warnings for a cleaner terminal output
warnings.filterwarnings("ignore", category=FutureWarning)

def plot_evaluation():
    print("📊 Generating Evaluation Plots...")
    
    # 1. Load Data
    data_path = os.path.join("data", "rides_dataset.csv")
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"❌ Error: {data_path} not found.")
        return

    # 2. Prepare Data
    X = pd.get_dummies(df[['hour_of_day', 'trip_distance', 'vehicle_type']])
    y = df['duration_min']
    
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Load Model
    model_path = os.path.join("backend", "eta_model.pkl")
    try:
        model = joblib.load(model_path)
    except FileNotFoundError:
        print(f"❌ Error: {model_path} not found.")
        return

    y_pred = model.predict(X_test)
    
    # --- PLOT 1: Accuracy Scatter ---
    plt.figure(figsize=(10, 6))
    sns.scatterplot(x=y_test, y=y_pred, alpha=0.4, color='teal')
    plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
    plt.xlabel("Actual Duration (min)")
    plt.ylabel("AI Predicted Duration (min)")
    plt.title("Model Accuracy: Actual vs Predicted")
    plt.savefig(os.path.join("backend", "accuracy_scatter.png"))
    print("✅ Saved: accuracy_scatter.png")

    # --- PLOT 2: Feature Importance (Modern Syntax) ---
    importances = model.feature_importances_
    feature_names = X.columns
    feature_df = pd.DataFrame({'Feature': feature_names, 'Importance': importances})
    feature_df = feature_df.sort_values(by='Importance', ascending=False)

    plt.figure(figsize=(10, 6))
    # Fixed syntax: Assigned 'Feature' to 'hue' to remove the warning
    sns.barplot(x='Importance', y='Feature', data=feature_df, hue='Feature', palette='viridis', legend=False)
    plt.title("Feature Importance: What drives ETA Predictions?")
    plt.tight_layout() # Ensures labels don't get cut off
    plt.savefig(os.path.join("backend", "feature_importance.png"))
    print("✅ Saved: feature_importance.png")
    print("\n✨ All evaluation tasks completed successfully!")

if __name__ == "__main__":
    plot_evaluation()