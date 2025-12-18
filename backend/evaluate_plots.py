import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import os
import warnings
from sklearn.model_selection import train_test_split

# Stop those annoying future warnings from popping up
warnings.filterwarnings("ignore", category=FutureWarning)

def plot_evaluation():
    print("📊 Starting Data Visualization...")
    
    # 📁 Path to the graphs folder inside the main backend directory
    # Based on your structure, we keep this in the top-level 'backend' folder
    graph_dir = os.path.join("backend", "graphs")
    
    if not os.path.exists(graph_dir):
        os.makedirs(graph_dir)
        print(f"📁 Verified folder: {graph_dir}")

    # 1. Load the dataset from the data folder
    data_path = os.path.join("data", "rides_dataset.csv")
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"❌ Error: Cannot find {data_path}. Please run generate_data.py first.")
        return

    # 2. Prepare the data for testing
    X = pd.get_dummies(df[['hour_of_day', 'trip_distance', 'vehicle_type']])
    y = df['duration_min']
    
    # Using the same split as training (80/20) to stay consistent
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Load the trained AI model 
    # Pointing to the main 'backend' folder where we consolidated the files
    model_path = os.path.join("backend", "eta_model.pkl")
    try:
        model = joblib.load(model_path)
    except FileNotFoundError:
        print(f"❌ Error: Model file not found at {model_path}")
        return

    # Predict times to compare with reality
    y_pred = model.predict(X_test)
    
    # --- PLOT 1: Actual vs Predicted Scatter Plot ---
    plt.figure(figsize=(10, 6))
    sns.scatterplot(x=y_test, y=y_pred, alpha=0.4, color='teal')
    
    # The red line represents a 100% perfect prediction for reference
    plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
    
    plt.xlabel("Actual Trip Time (min)")
    plt.ylabel("AI Predicted Time (min)")
    plt.title("AI Accuracy: Actual vs Predicted Trip Times")
    
    plt.savefig(os.path.join(graph_dir, "accuracy_scatter.png"))
    print(f"✅ Accuracy Chart saved in: {graph_dir}")

    # --- PLOT 2: Feature Importance Bar Chart ---
    importances = model.feature_importances_
    feature_names = X.columns
    feature_df = pd.DataFrame({'Feature': feature_names, 'Importance': importances})
    feature_df = feature_df.sort_values(by='Importance', ascending=False)

    plt.figure(figsize=(10, 6))
    sns.barplot(x='Importance', y='Feature', data=feature_df, hue='Feature', palette='viridis', legend=False)
    
    plt.title("What factors drive the AI's ETA predictions?")
    plt.tight_layout() 
    
    plt.savefig(os.path.join(graph_dir, "feature_importance.png"))
    print(f"✅ Feature Importance Chart saved in: {graph_dir}")
    
    print("\n✨ All visualizations are updated in the backend/graphs folder!")

if __name__ == "__main__":
    plot_evaluation()