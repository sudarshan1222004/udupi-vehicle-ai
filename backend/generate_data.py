import pandas as pd
import numpy as np
import random
import time
import os

def generate_synthetic_data(num_samples=10000):
    np.random.seed(int(time.time())) 
    random.seed(time.time())

    print(f"Generating synthetic data for Udupi-Manipal region...")
    
    # 1. Map Boundaries (Udupi & Manipal, Karnataka)
    # Latitude: Approx 13.32 to 13.37 | Longitude: Approx 74.72 to 74.80
    lat_min, lat_max = 13.3200, 13.3700
    lon_min, lon_max = 74.7200, 74.8000
    
    # 2. Random Start and End Points
    start_lats = np.round(np.random.uniform(lat_min, lat_max, num_samples), 4)
    start_lons = np.round(np.random.uniform(lon_min, lon_max, num_samples), 4)
    end_lats = np.round(np.random.uniform(lat_min, lat_max, num_samples), 4)
    end_lons = np.round(np.random.uniform(lon_min, lon_max, num_samples), 4)

    # 3. Distance Calculation (Haversine Approximation)
    dist = np.sqrt((end_lats - start_lats)**2 + (end_lons - start_lons)**2) * 111
    trip_distance = np.round(dist, 2)
    trip_distance = np.where(trip_distance < 0.1, 0.5, trip_distance)
    
    # 4. Time and Vehicle Selection
    # Operating hours: 6 AM to 11 PM 
    hour_of_day = np.random.randint(6, 23, num_samples)
    vehicle_types = ['Bike', 'Auto', 'Mini', 'Sedan', 'SUV']
    vehicle_type = np.random.choice(vehicle_types, num_samples)
    
    # 5. Rush Hour Logic for Udupi-Manipal
    traffic_multiplier = np.ones(num_samples)
    rush_hour_mask = ((hour_of_day >= 9) & (hour_of_day <= 11)) | ((hour_of_day >= 17) & (hour_of_day <= 20))
    # Trips take 30% to 60% longer during rush hours 
    traffic_multiplier[rush_hour_mask] = np.random.uniform(1.3, 1.6, np.sum(rush_hour_mask))
    
    # 6. Define avg Speed of Vehicle (km/h)
    speed_map = {'Bike': 45, 'Auto': 35, 'Mini': 40, 'Sedan': 42, 'SUV': 40}
    speed = np.array([speed_map[v] for v in vehicle_type])
        
    # 7. Duration Calculation (ETA Prediction) [cite: 12]
    duration_min = (trip_distance / speed) * 60 * traffic_multiplier
    
    # Add noise for Udupi traffic signals and narrow roads [cite: 10]
    random_noise = np.random.uniform(-0.5, 2.0, num_samples)
    duration_min = np.round(duration_min + random_noise, 1)
    duration_min = np.maximum(duration_min, 2) 
    
    # 8. Fare Calculation with Dynamic Surge Pricing [cite: 16, 17]
    fare_map = {'Bike': (20, 6), 'Auto': (30, 10), 'Mini': (50, 14), 'Sedan': (70, 18), 'SUV': (100, 25)}
    bases = np.array([fare_map[v][0] for v in vehicle_type])
    rates = np.array([fare_map[v][1] for v in vehicle_type])
    
    fare = np.round((bases + (trip_distance * rates)) * traffic_multiplier, 0)
    
    # Bundling columns [cite: 9]
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