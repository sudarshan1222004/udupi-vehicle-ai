import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def train_model():
    # Path updated to point to the 'data' folder
    data_path = os.path.join("data", "rides_dataset.csv")
    
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found. Please run generate_data.py first.")
        return

    print("Loading data...")
    df = pd.read_csv(data_path)

    # Preparing the features (One-Hot Encoding vehicle types)
    X = pd.get_dummies(df[['hour_of_day', 'trip_distance', 'vehicle_type']])
    y = df['duration_min']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Model...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Predictions for evaluation
    predictions = model.predict(X_test)

    # Calculate metrics
    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, predictions)
    
    # MAPE (Mean Absolute Percentage Error)
    mape = np.mean(np.abs((y_test - predictions) / y_test)) * 100

    print("--- Model Evaluation ---")
    print(f"MAE:  {mae:.2f} min")
    print(f"RMSE: {rmse:.2f} min")
    print(f"R2:   {r2:.2f}")
    print(f"MAPE: {mape:.2f}%")

    # Ensure the backend directory exists
    output_dir = "backend"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    model_path = os.path.join(output_dir, "eta_model.pkl")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()