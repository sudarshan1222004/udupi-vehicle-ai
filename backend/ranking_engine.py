import pandas as pd
import numpy as np
import joblib
import os

# We look for the trained AI model (the brain) in the backend folder
model_path = os.path.join('backend', 'eta_model.pkl')

model = None
try:
    if os.path.exists(model_path):
        model = joblib.load(model_path)
    elif os.path.exists('eta_model.pkl'):
        model = joblib.load('eta_model.pkl')
    else:
        print(f"❌ Error: Model not found at {model_path}. Please run train_model.py first!")
except Exception as e:
    print(f"❌ Error loading model: {e}")

def get_vehicle_recommendations(start_lat, start_lon, end_lat, end_lon, hour, preference='balanced'):
    """
    How this works:
    1. We calculate the real distance using latitudes and longitudes.
    2. we check if it's rush hour to add extra 'surge' costs.
    3. We ask the AI to predict the time for each car type.
    4. We sort them based on what the user wants (Cheap, Fast, or Balanced).
    """
    if model is None:
        return {"error": "The AI model is not loaded correctly."}

    # --- STEP 1: DISTANCE MATH ---
    # We use basic geometry to find the distance between two points on the map
    dist = np.sqrt((end_lat - start_lat)**2 + (end_lon - start_lon)**2) * 111
    if dist < 0.1: dist = 0.5 # Minimum distance so we don't have 0km rides

    # --- STEP 2: TRAFFIC & PRICE CHECK ---
    # Peak hours in Udupi usually happen in the morning and evening
    is_rush_hour = (9 <= hour <= 11) or (17 <= hour <= 21)
    surge_multiplier = 1.45 if is_rush_hour else 1.0
    demand_label = "High" if is_rush_hour else "Normal"

    vehicle_types = ['Bike', 'Auto', 'Mini', 'Sedan', 'SUV']
    analysis_output = []

    # --- STEP 3: AI PREDICTION LOOP ---
    for vehicle in vehicle_types:
        # We tell the AI the current hour, distance, and vehicle type
        input_dict = {
            'hour_of_day': hour, 
            'trip_distance': dist,
            'vehicle_type_Auto': 0, 
            'vehicle_type_Bike': 0,
            'vehicle_type_Mini': 0, 
            'vehicle_type_SUV': 0, 
            'vehicle_type_Sedan': 0
        }
        
        # We set only the current vehicle to '1' (Active)
        v_col = f'vehicle_type_{vehicle}'
        if v_col in input_dict: 
            input_dict[v_col] = 1
        
        # Converting the dictionary to a format the AI understands (DataFrame)
        input_df = pd.DataFrame([input_dict])
        predicted_eta = model.predict(input_df)[0]

        # Calculate fare based on base price + km rate
        fare_map = {'Bike': (20, 5), 'Auto': (30, 8), 'Mini': (50, 12), 'Sedan': (70, 15), 'SUV': (100, 20)}
        base, rate = fare_map[vehicle]
        total_fare = (base + (dist * rate)) * surge_multiplier

        analysis_output.append({
            'vehicle': vehicle,
            'eta': round(predicted_eta, 1),
            'fare': int(round(total_fare, 0)),
            'distance': round(dist, 2),
            'demand': demand_label
        })

    # --- STEP 4: RANKING LOGIC ---
    df = pd.DataFrame(analysis_output)

    if preference == 'fastest' or preference == '3':
        df = df.sort_values(by='eta')
    elif preference == 'cheapest' or preference == '1':
        df = df.sort_values(by='fare')
    else:
        # Balanced score: 60% importance to time, 40% importance to money
        df['score'] = (df['eta'] * 0.6) + (df['fare'] * 0.04)
        df = df.sort_values(by='score')

    return df.head(3)

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚗 UDUPI VEHICLE AI: SMART RANKING ENGINE")
    print("="*50)
    
    try:
        # Now asking for both Lat and Lon for both points
        s_lat = float(input("📍 Pickup Latitude  (e.g., 13.34): "))
        s_lon = float(input("📍 Pickup Longitude (e.g., 74.74): "))
        e_lat = float(input("🏁 Drop Latitude    (e.g., 13.35): "))
        e_lon = float(input("🏁 Drop Longitude   (e.g., 74.77): "))
        hr = int(input("⏰ Time of Day (6-23 hour): "))
        
        print("\nHow do you want to rank the rides?")
        print("1) Cheapest")
        print("2) Balanced (Best Value)")
        print("3) Fastest")
        
        choice = input("\nSelect (1-3): ")
        pref_map = {"1": "cheapest", "2": "balanced", "3": "fastest"}
        selected_pref = pref_map.get(choice, "balanced")

        print("\n" + "-"*50)
        print(f"🔍 ANALYSING {selected_pref.upper()} OPTIONS...")
        print("-" * 50)
        
        # Sending all 4 coordinates to the engine
        result = get_vehicle_recommendations(s_lat, s_lon, e_lat, e_lon, hr, selected_pref)
        
        # Printing a nice clean table
        print(result[['vehicle', 'distance', 'fare', 'eta', 'demand']].to_string(index=False))
        print("-" * 50)
        
    except ValueError:
        print("❌ Error: Please enter numbers only for coordinates and time.")