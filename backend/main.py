
from pathlib import Path
from datetime import date, time

import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator


# =====================================================
# PATHS
# =====================================================

BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_PATH = BASE_DIR / "models" / "random_forest_model.pkl"
PREPROCESSOR_PATH = BASE_DIR / "models" / "preprocessor.pkl"
DATA_PATH = BASE_DIR / "data" / "processed" / "engineered_delivery.csv"

MAX_DELIVERY_DISTANCE_KM = 100


# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(
    title="Delivery ETA Prediction API",
    description="Machine Learning API for delivery time prediction",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your frontend URL before production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# LOAD MODEL
# =====================================================

try:
    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    reference_df = pd.read_csv(DATA_PATH)

except Exception as error:
    raise RuntimeError(
        f"Could not load model or dataset: {error}"
    )


# =====================================================
# INPUT SCHEMA
# =====================================================

class PredictionRequest(BaseModel):

    agent_age: int = Field(ge=18, le=60)
    agent_rating: float = Field(ge=1, le=5)

    store_latitude: float = Field(ge=-90, le=90)
    store_longitude: float = Field(ge=-180, le=180)

    drop_latitude: float = Field(ge=-90, le=90)
    drop_longitude: float = Field(ge=-180, le=180)

    order_date: date
    order_time: time

    weather: str
    traffic: str
    vehicle: str
    area: str
    category: str

    @field_validator(
        "weather", "traffic", "vehicle", "area", "category"
    )
    @classmethod
    def validate_non_empty(cls, value):
        if not value.strip():
            raise ValueError("Value cannot be empty")

        # Preserve original value, including trailing spaces.
        return value


# =====================================================
# DISTANCE CALCULATION
# =====================================================

def calculate_distance(lat1, lon1, lat2, lon2):

    lat1, lon1, lat2, lon2 = map(
        np.radians,
        [lat1, lon1, lat2, lon2]
    )

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        np.sin(dlat / 2) ** 2
        + np.cos(lat1) * np.cos(lat2)
        * np.sin(dlon / 2) ** 2
    )

    # Protect against floating-point rounding errors.
    a = np.clip(a, 0, 1)

    c = 2 * np.arctan2(
        np.sqrt(a),
        np.sqrt(1 - a)
    )

    return 6371 * c


# =====================================================
# CATEGORY VALIDATION
# =====================================================

def validate_categories(data):

    category_columns = {
        "weather": "Weather",
        "traffic": "Traffic",
        "vehicle": "Vehicle",
        "area": "Area",
        "category": "Category"
    }

    for request_field, dataset_column in category_columns.items():

        allowed_values = set(
            reference_df[dataset_column]
            .dropna()
            .unique()
        )

        submitted_value = getattr(data, request_field)

        if submitted_value not in allowed_values:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {request_field} value. Please select a valid option."
            )


# =====================================================
# FEATURE ENGINEERING
# =====================================================

def create_features(data):

    distance = calculate_distance(
        data.store_latitude,
        data.store_longitude,
        data.drop_latitude,
        data.drop_longitude
    )

    traffic_map = {
        "Low": 1,
        "Medium": 2,
        "High": 3,
        "Jam": 4
    }

    if data.traffic not in traffic_map:
        raise HTTPException(
            status_code=400,
            detail="Invalid traffic category."
        )

    traffic_score = traffic_map[data.traffic]

    order_hour = data.order_time.hour
    day = data.order_date.day
    day_of_week = data.order_date.weekday()
    month = data.order_date.month

    is_weekend = int(day_of_week >= 5)

    is_peak_hour = int(
        order_hour in [8, 9, 10, 17, 18, 19, 20]
    )

    distance_category = pd.cut(
        [distance],
        bins=[0, 2, 5, 10, 20, float("inf")],
        labels=[
            "Very Short",
            "Short",
            "Medium",
            "Long",
            "Very Long"
        ],
        include_lowest=True
    )[0]

    rating_category = pd.cut(
        [data.agent_rating],
        bins=[0, 3, 4, 6],
        labels=["Low", "Medium", "High"],
        include_lowest=True
    )[0]

    features = pd.DataFrame([{
        "Agent_Age": data.agent_age,
        "Agent_Rating": data.agent_rating,
        "Store_Latitude": data.store_latitude,
        "Store_Longitude": data.store_longitude,
        "Drop_Latitude": data.drop_latitude,
        "Drop_Longitude": data.drop_longitude,
        "Distance": distance,
        "Order_Hour": order_hour,
        "Day": day,
        "Day_Of_Week": day_of_week,
        "Month": month,
        "Is_Weekend": is_weekend,
        "Is_Peak_Hour": is_peak_hour,
        "Weather": data.weather,
        "Traffic": data.traffic,
        "Vehicle": data.vehicle,
        "Area": data.area,
        "Category": data.category,
        "Distance_Category": distance_category,
        "Distance_Traffic": distance * traffic_score,
        "Rating_Category": rating_category
    }])

    return features, float(distance)


# =====================================================
# API ROUTES
# =====================================================

@app.get("/")
def home():

    return {
        "message": "Delivery ETA Prediction API is running!",
        "status": "success"
    }


@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "preprocessor_loaded": preprocessor is not None
    }


@app.get("/options")
def get_options():

    return {
        "weather": sorted(
            reference_df["Weather"].dropna().unique().tolist()
        ),
        "traffic": ["Low", "Medium", "High", "Jam"],
        "vehicle": sorted(
            reference_df["Vehicle"].dropna().unique().tolist()
        ),
        "area": sorted(
            reference_df["Area"].dropna().unique().tolist()
        ),
        "category": sorted(
            reference_df["Category"].dropna().unique().tolist()
        )
    }


@app.post("/predict")
def predict_delivery(data: PredictionRequest):

    try:

        # Reject future order dates
        if data.order_date > date.today():
            raise HTTPException(
                status_code=400,
                detail="Order date cannot be in the future."
            )

        # Validate categorical values against training data
        validate_categories(data)

        # Reject identical pickup and delivery coordinates
        if (
            data.store_latitude == data.drop_latitude
            and data.store_longitude == data.drop_longitude
        ):
            raise HTTPException(
                status_code=400,
                detail="Pickup and drop locations cannot be the same."
            )

        # Generate features and calculate distance
        input_features, distance = create_features(data)

        # Reject unrealistic delivery distances
        if distance > MAX_DELIVERY_DISTANCE_KM:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Delivery distance is {distance:.2f} km. "
                    f"Maximum allowed distance is "
                    f"{MAX_DELIVERY_DISTANCE_KM} km."
                )
            )

        # Transform input features
        transformed_features = preprocessor.transform(
            input_features
        )

        # Generate prediction
        prediction = model.predict(
            transformed_features
        )[0]

        prediction = max(0, float(prediction))

        return {
            "status": "success",
            "predicted_delivery_time": round(prediction, 2),
            "distance_km": round(distance, 2),
            "estimated_hours": round(prediction / 60, 2),
            "message": "Delivery ETA predicted successfully"
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )
