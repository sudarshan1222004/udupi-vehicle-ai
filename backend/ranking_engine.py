import pandas as pd
import numpy as np
import joblib
import os

# Smart path detection to find your trained AI model in the backend folder
model_path = os.path.join('backend', 'eta_model.pkl')

model = None
try:
    if os.path.exists(model_path):
        model = joblib.load(model_path)
    elif os.path.exists('eta_model.pkl'):
        model = joblib.load('eta_model.pkl')
    else:
        print(f"❌ Error: Model not found at {model_path}. Run train_model.py first!")
except Exception as e:
    print(f"❌ Error loading model: {e}")

def get_vehicle_recommendations(start_lat, start_lon, end_lat, end_lon, hour, preference='balanced'):
    """
    Step 1: Calculate Travel Distance
    Step 2: Factor in Time of Day & Demand
    Step 3: AI Prediction & Choice-based Ranking
    """
    if model is None:
        return {"error": "Model is not loaded."}

    # --- STEP 1: CALCULATE DISTANCE (Udupi/Manipal Logic) ---
    dist = np.sqrt((end_lat - start_lat)**2 + (end_lon - start_lon)**2) * 111
    if dist < 0.1: dist = 0.5

    # --- STEP 2: ANALYZE TIME & DEMAND (Dynamic Pricing) ---
    is_rush_hour = (9 <= hour <= 11) or (17 <= hour <= 21)
    surge_multiplier = 1.45 if is_rush_hour else 1.0
    demand_label = "High" if is_rush_hour else "Normal"

    vehicle_types = ['Bike', 'Auto', 'Mini', 'Sedan', 'SUV']
    analysis_output = []

    for vehicle in vehicle_types:
        input_dict = {
            'hour_of_day': hour, 
            'trip_distance': dist,
            'vehicle_type_Auto': 0, 
            'vehicle_type_Bike': 0,
            'vehicle_type_Mini': 0, 
            'vehicle_type_SUV': 0, 
            'vehicle_type_Sedan': 0
        }
        
        v_col = f'vehicle_type_{vehicle}'
        if v_col in input_dict: 
            input_dict[v_col] = 1
        
        input_df = pd.DataFrame([input_dict])
        predicted_eta = model.predict(input_df)[0]

        fare_map = {'Bike': (20, 5), 'Auto': (30, 8), 'Mini': (50, 12), 'Sedan': (70, 15), 'SUV': (100, 20)}
        base, rate = fare_map[vehicle]
        total_fare = (base + (dist * rate)) * surge_multiplier

        analysis_output.append({
            'vehicle': vehicle,
            'eta': round(predicted_eta, 1),
            'fare': int(round(total_fare, 0)),
            'distance': round(dist, 2), # Now rounding to 2 decimal places
            'demand': demand_label
        })

    df = pd.DataFrame(analysis_output)

    if preference == 'fastest' or preference == '3':
        df = df.sort_values(by='eta')
    elif preference == 'cheapest' or preference == '1':
        df = df.sort_values(by='fare')
    else:
        # Balanced score
        df['score'] = (df['eta'] * 0.6) + (df['fare'] * 0.04)
        df = df.sort_values(by='score')

    return df.head(3)

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚗 UDUPI VEHICLE AI: SMART RANKING ENGINE")
    print("="*50)
    
    try:
        s_lat = float(input("📍 Enter Pickup Latitude (e.g., 13.34): "))
        e_lat = float(input("🏁 Enter Drop Latitude (e.g., 13.35): "))
        hr = int(input("⏰ Enter Time of Day (6-23 hour): "))
        
        print("\nHow would you like to rank your rides?")
        print("1) Cheapest")
        print("2) Balanced (Best Value)")
        print("3) Fastest")
        
        choice = input("\nSelect an option (1-3): ")
        
        # Map the numeric choice to the preference string
        pref_map = {"1": "cheapest", "2": "balanced", "3": "fastest"}
        selected_pref = pref_map.get(choice, "balanced")

        print("\n" + "-"*50)
        print(f"🔍 ANALYSING {selected_pref.upper()} OPTIONS...")
        print("-"*50)
        
        # Giving the analysed output
        result = get_vehicle_recommendations(s_lat, 74.74, e_lat, 74.77, hr, selected_pref)
        
        # Displaying the result including the DISTANCE column
        # Using a slightly wider table display
        print(result[['vehicle', 'distance', 'fare', 'eta', 'demand']].to_string(index=False))
        print("-" * 50)
        
    except ValueError:
        print("❌ Error: Please enter valid numeric inputs.")