
import streamlit as st
import pandas as pd
import numpy as np
import joblib

from pathlib import Path
from datetime import date, time


# =====================================================
# PAGE CONFIGURATION
# =====================================================

st.set_page_config(
    page_title="Delivery ETA Predictor",
    page_icon="🚚",
    layout="wide",
    initial_sidebar_state="expanded"
)

BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_PATH = BASE_DIR / "models" / "random_forest_model.pkl"
PREPROCESSOR_PATH = BASE_DIR / "models" / "preprocessor.pkl"
DATA_PATH = BASE_DIR / "data" / "processed" / "engineered_delivery.csv"


# =====================================================
# CUSTOM CSS
# =====================================================

st.markdown("""
<style>

.main {
    background-color: #0e1117;
}

.block-container {
    padding-top: 2rem;
    padding-bottom: 2rem;
}

[data-testid="stMetric"] {
    background-color: #1c2333;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #30394d;
}

[data-testid="stMetricLabel"] {
    color: #aab6cc;
}

[data-testid="stMetricValue"] {
    color: #ffffff;
}

div.stButton > button {
    border-radius: 10px;
    height: 48px;
    font-weight: 600;
}

div[data-testid="stSidebar"] {
    background-color: #151a25;
}

.hero {
    padding: 25px;
    border-radius: 15px;
    background: linear-gradient(120deg, #172b4d, #243b65);
    margin-bottom: 25px;
}

.hero h1 {
    color: white;
    margin-bottom: 5px;
}

.hero p {
    color: #c6d6f2;
    font-size: 16px;
}

</style>
""", unsafe_allow_html=True)


# =====================================================
# LOAD MODEL AND DATA
# =====================================================

@st.cache_resource
def load_artifacts():

    if not MODEL_PATH.exists():
        raise FileNotFoundError("Random Forest model not found.")

    if not PREPROCESSOR_PATH.exists():
        raise FileNotFoundError("Preprocessor not found.")

    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)

    return model, preprocessor


@st.cache_data
def load_reference_data():

    if not DATA_PATH.exists():
        raise FileNotFoundError("Engineered dataset not found.")

    return pd.read_csv(DATA_PATH)


try:
    model, preprocessor = load_artifacts()
    reference_df = load_reference_data()

except Exception as error:
    st.error(f"Unable to load project files: {error}")
    st.stop()


# =====================================================
# SESSION STATE - PREDICTION HISTORY
# =====================================================

if "prediction_history" not in st.session_state:
    st.session_state.prediction_history = []


# =====================================================
# FEATURE ENGINEERING
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

    c = 2 * np.arcsin(np.sqrt(a))

    return 6371 * c


def create_features(data):

    distance = calculate_distance(
        data["Store_Latitude"],
        data["Store_Longitude"],
        data["Drop_Latitude"],
        data["Drop_Longitude"]
    )

    order_date = data["Order_Date"]
    order_time = data["Order_Time"]

    traffic_map = {
        "Low": 1,
        "Medium": 2,
        "High": 3,
        "Jam": 4
    }

    traffic_score = traffic_map[data["Traffic"]]

    order_hour = order_time.hour
    day = order_date.day
    day_of_week = order_date.weekday()
    month = order_date.month

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
        [data["Agent_Rating"]],
        bins=[0, 3, 4, 6],
        labels=["Low", "Medium", "High"],
        include_lowest=True
    )[0]

    features = pd.DataFrame([{
        "Agent_Age": data["Agent_Age"],
        "Agent_Rating": data["Agent_Rating"],
        "Store_Latitude": data["Store_Latitude"],
        "Store_Longitude": data["Store_Longitude"],
        "Drop_Latitude": data["Drop_Latitude"],
        "Drop_Longitude": data["Drop_Longitude"],
        "Distance": distance,
        "Order_Hour": order_hour,
        "Day": day,
        "Day_Of_Week": day_of_week,
        "Month": month,
        "Is_Weekend": is_weekend,
        "Is_Peak_Hour": is_peak_hour,
        "Weather": data["Weather"],
        "Traffic": data["Traffic"],
        "Vehicle": data["Vehicle"],
        "Area": data["Area"],
        "Category": data["Category"],
        "Distance_Category": distance_category,
        "Distance_Traffic": distance * traffic_score,
        "Rating_Category": rating_category
    }])

    return features, distance


# =====================================================
# SIDEBAR
# =====================================================

with st.sidebar:

    st.title("🚚 ETA Predictor")

    st.caption("Machine Learning Dashboard")

    st.divider()

    page = st.radio(
        "NAVIGATION",
        [
            "🏠 Dashboard",
            "📊 Model Performance",
            "📜 Prediction History"
        ]
    )

    st.divider()

    st.markdown("### About Project")

    st.write(
        "An ML-powered delivery time prediction system "
        "using delivery location, agent, weather and "
        "traffic information."
    )

    st.divider()

    st.markdown("### Technology Stack")

    st.write("""
    - Python
    - Pandas
    - NumPy
    - Scikit-learn
    - Random Forest
    - Streamlit
    """)

    st.divider()

    st.caption("Delivery ETA Prediction Project")


# =====================================================
# DASHBOARD PAGE
# =====================================================

if page == "🏠 Dashboard":

    st.markdown("""
    <div class="hero">
        <h1>🚚 Delivery Time Prediction</h1>
        <p>
        Predict estimated delivery time using Machine Learning.
        Enter delivery details and get an instant ETA.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.subheader("📍 Delivery Location")

    col1, col2 = st.columns(2)

    with col1:

        st.markdown("**Pickup / Store Location**")

        store_lat = st.number_input(
            "Store Latitude",
            min_value=-90.0,
            max_value=90.0,
            value=22.745049,
            format="%.6f"
        )

        store_lon = st.number_input(
            "Store Longitude",
            min_value=-180.0,
            max_value=180.0,
            value=75.892471,
            format="%.6f"
        )

    with col2:

        st.markdown("**Customer / Drop Location**")

        drop_lat = st.number_input(
            "Drop Latitude",
            min_value=-90.0,
            max_value=90.0,
            value=22.765049,
            format="%.6f"
        )

        drop_lon = st.number_input(
            "Drop Longitude",
            min_value=-180.0,
            max_value=180.0,
            value=75.912471,
            format="%.6f"
        )

    st.divider()

    st.subheader("👨‍✈️ Delivery Agent Details")

    col1, col2 = st.columns(2)

    with col1:

        agent_age = st.number_input(
            "Agent Age",
            min_value=18,
            max_value=60,
            value=30
        )

    with col2:

        agent_rating = st.number_input(
            "Agent Rating",
            min_value=1.0,
            max_value=5.0,
            value=4.5,
            step=0.1
        )

    st.divider()

    st.subheader("📦 Order Details")

    col1, col2 = st.columns(2)

    with col1:

        order_date = st.date_input(
            "Order Date",
            value=date.today()
        )

        order_time = st.time_input(
            "Order Time",
            value=time(11, 30)
        )

        weather_options = sorted(
            reference_df["Weather"].dropna().unique().tolist()
        )

        weather = st.selectbox(
            "Weather",
            weather_options
        )

        traffic = st.selectbox(
            "Traffic",
            ["Low", "Medium", "High", "Jam"]
        )

    with col2:

        vehicle_options = sorted(
            reference_df["Vehicle"].dropna().unique().tolist()
        )

        vehicle = st.selectbox(
            "Vehicle Type",
            vehicle_options
        )

        area_options = sorted(
            reference_df["Area"].dropna().unique().tolist()
        )

        area = st.selectbox(
            "Area Type",
            area_options
        )

        category_options = sorted(
            reference_df["Category"].dropna().unique().tolist()
        )

        category = st.selectbox(
            "Product Category",
            category_options
        )

    st.divider()

    predict_button = st.button(
        "🚀 Predict Delivery Time",
        use_container_width=True,
        type="primary"
    )

    if predict_button:

        distance_check = calculate_distance(
            store_lat,
            store_lon,
            drop_lat,
            drop_lon
        )

        if not (1 <= agent_rating <= 5):

            st.error("Agent rating must be between 1 and 5.")

        elif store_lat == drop_lat and store_lon == drop_lon:

            st.error("Pickup and drop locations cannot be the same.")

        elif not np.isfinite(distance_check) or distance_check <= 0:

            st.error("Please enter valid coordinates.")

        else:

            input_data = {
                "Agent_Age": agent_age,
                "Agent_Rating": agent_rating,
                "Store_Latitude": store_lat,
                "Store_Longitude": store_lon,
                "Drop_Latitude": drop_lat,
                "Drop_Longitude": drop_lon,
                "Order_Date": order_date,
                "Order_Time": order_time,
                "Weather": weather,
                "Traffic": traffic,
                "Vehicle": vehicle,
                "Area": area,
                "Category": category
            }

            try:

                input_features, distance = create_features(input_data)

                prediction_input = preprocessor.transform(
                    input_features
                )

                prediction = model.predict(
                    prediction_input
                )[0]

                prediction = max(0, float(prediction))

                st.session_state.prediction_history.append({
                    "Date": date.today().strftime("%Y-%m-%d"),
                    "Order Time": order_time.strftime("%H:%M"),
                    "Distance (km)": round(float(distance), 2),
                    "Traffic": traffic,
                    "Weather": weather,
                    "Vehicle": vehicle,
                    "Area": area,
                    "Predicted ETA (min)": round(prediction, 2)
                })

                st.success("Prediction generated successfully!")

                st.divider()

                st.subheader("📊 Prediction Results")

                col1, col2, col3 = st.columns(3)

                with col1:

                    st.metric(
                        "Estimated Delivery Time",
                        f"{prediction:.1f} min"
                    )

                with col2:

                    st.metric(
                        "Delivery Distance",
                        f"{distance:.2f} km"
                    )

                with col3:

                    st.metric(
                        "Estimated Time",
                        f"{prediction / 60:.2f} hours"
                    )

                st.info(
                    "This is a machine learning estimate, "
                    "not a guaranteed delivery time."
                )

            except Exception as error:

                st.error(f"Prediction failed: {error}")


# =====================================================
# MODEL PERFORMANCE PAGE
# =====================================================

elif page == "📊 Model Performance":

    st.title("📊 Model Performance")

    st.write(
        "Performance of the trained Random Forest Regression model "
        "on its held-out test dataset."
    )

    st.divider()

    col1, col2, col3 = st.columns(3)

    with col1:

        st.metric(
            "Mean Absolute Error",
            "17.08 min"
        )

    with col2:

        st.metric(
            "Root Mean Squared Error",
            "22.18 min"
        )

    with col3:

        st.metric(
            "R² Score",
            "0.8153"
        )

    st.divider()

    st.subheader("Prediction Accuracy")

    accuracy_data = pd.DataFrame({
        "Tolerance": [
            "Within 5 minutes",
            "Within 10 minutes",
            "Within 15 minutes"
        ],
        "Predictions": [
            20.68,
            38.37,
            53.37
        ]
    })

    st.dataframe(
        accuracy_data,
        use_container_width=True,
        hide_index=True
    )

    st.bar_chart(
        accuracy_data.set_index("Tolerance")
    )

    st.info(
        "These metrics represent the previously evaluated "
        "test-set results, not live performance."
    )


# =====================================================
# PREDICTION HISTORY PAGE
# =====================================================

elif page == "📜 Prediction History":

    st.title("📜 Prediction History")

    st.write(
        "View and download predictions generated during this session."
    )

    st.divider()

    history = st.session_state.prediction_history

    if history:

        history_df = pd.DataFrame(history)

        col1, col2 = st.columns(2)

        with col1:

            st.metric(
                "Total Predictions",
                len(history_df)
            )

        with col2:

            st.metric(
                "Average Predicted ETA",
                f"{history_df['Predicted ETA (min)'].mean():.2f} min"
            )

        st.divider()

        st.dataframe(
            history_df,
            use_container_width=True,
            hide_index=True
        )

        csv_data = history_df.to_csv(index=False).encode("utf-8")

        st.download_button(
            label="⬇️ Download Prediction History",
            data=csv_data,
            file_name="delivery_prediction_history.csv",
            mime="text/csv",
            use_container_width=True
        )

        if st.button("🗑️ Clear Prediction History"):

            st.session_state.prediction_history = []

            st.rerun()

    else:

        st.info(
            "No predictions available yet. "
            "Go to Dashboard and generate your first prediction."
        )


# =====================================================
# FOOTER
# =====================================================

st.divider()

st.caption(
    "Delivery ETA Prediction | Built with Python, "
    "Streamlit, Pandas, NumPy and Scikit-learn"
)
