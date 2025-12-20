import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def train_model():
    # --- SMARTER PATH DETECTION ---
    # Checks if we are in the project root or inside the 'backend' folder
    if os.path.exists(os.path.join("data", "rides_dataset.csv")):
        data_path = os.path.join("data", "rides_dataset.csv")
        output_dir = "backend"
    else:
        # If we are already inside 'backend', the data is one level up
        data_path = os.path.join("..", "data", "rides_dataset.csv")
        output_dir = "." # Save in current folder (which is backend)

    if not os.path.exists(data_path):
        print(f"❌ Error: {data_path} not found. Please run generate_data.py first.")
        return

    print(f"📂 Loading data from: {data_path}...")
    df = pd.read_csv(data_path)

    # 1. Feature Engineering (One-Hot Encoding)
    X = pd.get_dummies(df[['hour_of_day', 'trip_distance', 'vehicle_type']])
    y = df['duration_min']

    # 2. Save column names for consistent inference later
    model_columns = list(X.columns)
    
    # 3. Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("🧠 Training the Random Forest Regressor...")
    # 4. Model Configuration
    model = RandomForestRegressor(
        n_estimators=250, 
        max_depth=15, 
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1 
    )
    model.fit(X_train, y_train)

    # 5. Full Evaluation (Take the "Final Exam")
    predictions = model.predict(X_test)

    # Calculating all metrics from your previous version
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)
    # MAPE: Mean Absolute Percentage Error
    mape = np.mean(np.abs((y_test - predictions) / y_test)) * 100

    print("\n--- ✅ Model Evaluation ---")
    print(f"MAE:  {mae:.2f} min")   # Average mistake in minutes
    print(f"RMSE: {rmse:.2f} min")  # Penalizes large errors heavily
    print(f"R2:   {r2:.2f}")       # Variance explained (Target: 0.70+)
    print(f"MAPE: {mape:.2f}%")     # Error as a percentage of total trip time

    # 6. Saving Artifacts
    if not os.path.exists(output_dir) and output_dir != ".":
        os.makedirs(output_dir)

    model_file = os.path.join(output_dir, "eta_model.pkl")
    columns_file = os.path.join(output_dir, "model_columns.pkl")

    joblib.dump(model, model_file)
    joblib.dump(model_columns, columns_file)
    
    print(f"\n💾 Files successfully saved to: {os.path.abspath(output_dir)}")

if __name__ == "__main__":
    train_model()