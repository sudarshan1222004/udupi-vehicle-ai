import pandas as pd
import numpy as np
import random
import time
import os
from datetime import datetime, timedelta

def generate_synthetic_data(num_samples=10000):
    # This part ensures the randomness
    np.random.seed(int(time.time())) 
    random.seed(time.time())

    print(f"Generating synthetic data...") # Kept original print
    
    # 1. Map Boundaries (Udupi-Manipal, Karnataka Area)
    lat_min, lat_max = 13.3200, 13.3700
    lon_min, lon_max = 74.7200, 74.8000
    
    # 2. Random Start and End Points
    start_lats = np.round(np.random.uniform(lat_min, lat_max, num_samples), 4)
    start_lons = np.round(np.random.uniform(lon_min, lon_max, num_samples), 4)
    end_lats = np.round(np.random.uniform(lat_min, lat_max, num_samples), 4)
    end_lons = np.round(np.random.uniform(lon_min, lon_max, num_samples), 4)

    # 3. Distance Calculation
    dist = np.sqrt((end_lats - start_lats)**2 + (end_lons - start_lons)**2) * 111
    trip_distance = np.round(dist, 2)
    trip_distance = np.where(trip_distance < 0.1, 0.5, trip_distance)
    
    # 4. Time and Vehicle Selection (6am-11pm)
    hour_of_day = np.random.randint(6, 24, num_samples)
    vehicle_types = ['Bike', 'Auto', 'Mini', 'Sedan', 'SUV']
    vehicle_type = np.random.choice(vehicle_types, num_samples)
    
    # 5. Rush Hour Logic (9am-11am,5pm-8pm)
    traffic_multiplier = np.ones(num_samples)
    rush_hour_mask = ((hour_of_day >= 9) & (hour_of_day <= 11)) | ((hour_of_day >= 17) & (hour_of_day <= 20))
    # Adjusted variability: 1.2 to 1.8 to make it less linear
    traffic_multiplier[rush_hour_mask] = np.random.uniform(1.2, 1.8, np.sum(rush_hour_mask))
    
    # Base speeds for Udupi-Manipal roads
    speed_map = {'Bike': 42, 'Auto': 28, 'Mini': 32, 'Sedan': 38, 'SUV': 35}
    base_speed = np.array([speed_map[v] for v in vehicle_type])
    # Add ±15% variation to speed for realism
    speed_variance = np.random.uniform(0.85, 1.15, num_samples)
    speed = base_speed * speed_variance
        
    # 7. Duration Calculation (ETA Prediction)
    duration_min = (trip_distance / speed) * 60 * traffic_multiplier
    
    # Adding Gaussian noise to simulate real-world variance ( blocks, narrow roads)
    # This reduces R2 from 0.94 to a more realistic 0.88-0.90
    random_noise = np.random.normal(1.0, 2.5, num_samples) 
    duration_min = np.round(duration_min + random_noise, 1)
    duration_min = np.maximum(duration_min, 2) 
    
    # 8. Fare Calculation
    fare_map = {'Bike': (20, 5), 'Auto': (30, 8), 'Mini': (50, 12), 'Sedan': (70, 15), 'SUV': (100, 20)}
    bases = np.array([fare_map[v][0] for v in vehicle_type])
    rates = np.array([fare_map[v][1] for v in vehicle_type])
    
    fare = np.round((bases + (trip_distance * rates)) * traffic_multiplier, 0)
    
    # Bundling columns
    data_dict = {
        'start_lat': start_lats, 'start_lon': start_lons,
        'end_lat': end_lats, 'end_lon': end_lons,
        'hour_of_day': hour_of_day, 'vehicle_type': vehicle_type,
        'trip_distance': trip_distance, 'duration_min': duration_min,
        'fare': fare.astype(int)
    }
    
    output_dir = "data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    df = pd.DataFrame(data_dict)
    file_path = os.path.join(output_dir, "rides_dataset.csv")
    df.to_csv(file_path, index=False)
    
    print(f"Data Generation Complete.\nSaved {num_samples} rows to {file_path}") 
if __name__ == "__main__":
    generate_synthetic_data(10000)