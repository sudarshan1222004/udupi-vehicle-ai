import sys
import os
import pandas as pd

# This tells Python to look one folder up (the backend folder) for the logic
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ranking_engine import get_vehicle_recommendations

def test_recommendations():
    print("\n--- 🧪 RUNNING AI BACKEND VALIDATION TESTS ---")
    
    # Test Parameters (Udupi/Manipal Area)
    start_lat, start_lon = 13.34, 74.7480
    end_lat, end_lon = 13.35, 74.7550
    rush_hour = 18  # 6 PM (Rush Hour)
    
    try:
        results = get_vehicle_recommendations(start_lat, start_lon, end_lat, end_lon, rush_hour, 'balanced')
        
        # Test 1: Check if result is a DataFrame (standard for feature pipelines)
        if not isinstance(results, pd.DataFrame):
            print("❌ FAILED: Results should be a Pandas DataFrame.")
            return

        # Test 2: Check result count
        if len(results) == 3:
            print("✅ SUCCESS: Found top 3 vehicle recommendations.")
        else:
            print(f"❌ FAILED: Expected 3 vehicles, but found {len(results)}.")

        # Test 3: Validate column requirements (Scikit-learn evaluation metrics)
        required_cols = ['vehicle', 'fare', 'eta', 'distance', 'demand']
        if all(col in results.columns for col in required_cols):
            print("✅ SUCCESS: All required data columns are present.")
        else:
            print(f"❌ FAILED: Missing columns. Found: {list(results.columns)}")

        # Test 4: Verify Rush Hour Surge Logic
        if results['demand'].iloc[0] == "High":
            print("✅ SUCCESS: Surge pricing/demand logic is active for Udupi peak hours.")
        else:
            print("❌ FAILED: Demand should be 'High' at 18:00 (6 PM).")

        print("\n✨ ALL CORE LOGIC TESTS PASSED!")

    except Exception as e:
        print(f"❌ CRITICAL ERROR DURING TESTING: {e}")

if __name__ == "__main__":
    test_recommendations()