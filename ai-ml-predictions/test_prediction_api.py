import asyncio
import httpx
import json

async def test_predictions_api():
    """Test the predictions API endpoints."""
    base_url = "http://localhost:3004/api/v1/predictions"
    
    async with httpx.AsyncClient() as client:
        print("Testing GET /models endpoint...")
        try:
            response = await client.get(f"{base_url}/models")
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {str(e)}")
        
        print("\nTesting POST /predict endpoint...")
        try:
            # Use a valid UUID from the fetch_predictions.py output
            valid_item_id = "cccccccc-cccc-cccc-cccc-ccccccccccce"
            prediction_data = {
                "item_id": valid_item_id,
                "model_name": "demand_forecast_v1"
            }
            response = await client.post(
                f"{base_url}/predict", 
                json=prediction_data
            )
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error: {str(e)}")
        
        print("\nTesting GET / (list predictions) endpoint...")
        try:
            response = await client.get(f"{base_url}/")
            print(f"Status code: {response.status_code}")
            result = response.json()
            print(f"Total items: {result.get('total', 0)}")
            if result.get('items'):
                print(f"First item ID: {result['items'][0]['id']}")
                print(f"First item model: {result['items'][0]['model_name']}")
                print(f"First item predicted demand: {result['items'][0]['predicted_demand']}")
        except Exception as e:
            print(f"Error: {str(e)}")
        
        # Test getting a specific prediction by ID
        if result.get('items'):
            print("\nTesting GET /{prediction_id} endpoint...")
            try:
                prediction_id = result['items'][0]['id']
                response = await client.get(f"{base_url}/{prediction_id}")
                print(f"Status code: {response.status_code}")
                prediction = response.json()
                print(f"Prediction ID: {prediction['id']}")
                print(f"Prediction result: {prediction['predicted_demand']}")
            except Exception as e:
                print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_predictions_api()) 