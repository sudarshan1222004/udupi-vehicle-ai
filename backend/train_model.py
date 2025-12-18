import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def train_model():
    # Look for the data we generated in the 'data' folder
    data_path = os.path.join("data", "rides_dataset.csv")
    
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found. Please run generate_data.py first.")
        return

    print("Loading data...")
    df = pd.read_csv(data_path)

    # 1. Turn 'Vehicle Type' text into numbers (0s and 1s)
    # AI can't read 'Auto', but it can read 'vehicle_type_Auto = 1'
    X = pd.get_dummies(df[['hour_of_day', 'trip_distance', 'vehicle_type']])
    y = df['duration_min']

    # 2. Save the names of these new columns
    # We need this later so the UI knows exactly what inputs to send the AI
    model_columns = list(X.columns)
    
    # 3. Split the data: Use 80% to 'study' and 20% for a 'final exam'
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Model...")
    # 4. Building the Random Forest (The Brain)
    # n_estimators=250: Use 250 'mini-decision trees' to get a fair average
    # max_depth=15: Let the trees get a bit smarter but not too complex
    # min_samples_leaf=5: Don't learn from tiny accidents; focus on the main trends
    model = RandomForestRegressor(
        n_estimators=250, 
        max_depth=15, 
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1 # Use all my computer's power to finish fast
    )
    model.fit(X_train, y_train)

    # 5. Take the final exam
    predictions = model.predict(X_test)

    # 6. Check the results
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)
    mape = np.mean(np.abs((y_test - predictions) / y_test)) * 100

    print("--- Model Evaluation ---")
    print(f"MAE:  {mae:.2f} min") # Average mistake in minutes
    print(f"RMSE: {rmse:.2f} min") # Penalizes big mistakes more
    print(f"R2:   {r2:.2f}")      # Accuracy score 
    print(f"MAPE: {mape:.2f}%")    # Error as a percentage

    # 7. Save 
    output_dir = "backend"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    joblib.dump(model, os.path.join(output_dir, "eta_model.pkl"))
    joblib.dump(model_columns, os.path.join(output_dir, "model_columns.pkl"))
    
    print(f"Model and Column definitions saved to {output_dir}")

if __name__ == "__main__":
    train_model()