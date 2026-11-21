
import { useEffect, useState } from "react";
import { getOptions, predictETA } from "../services/api";

const initialForm = {
  agent_age: "",
  agent_rating: "",
  store_latitude: "",
  store_longitude: "",
  drop_latitude: "",
  drop_longitude: "",
  order_date: "",
  order_time: "",
  weather: "",
  traffic: "",
  vehicle: "",
  area: "",
  category: "",
};

function PredictionForm({ onPrediction }) {
  const [formData, setFormData] = useState(initialForm);
  const [options, setOptions] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const data = await getOptions();
        setOptions(data);
        setError("");
      } catch {
        setError("Unable to load options. Please check the backend server.");
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setResult(null);
    setError("");
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const toRadians = (value) => (value * Math.PI) / 180;

    const latDifference = toRadians(lat2 - lat1);
    const lngDifference = toRadians(lng2 - lng1);

    const haversine =
      Math.sin(latDifference / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(lngDifference / 2) ** 2;

    const distance =
      6371 *
      2 *
      Math.atan2(
        Math.sqrt(haversine),
        Math.sqrt(1 - haversine)
      );

    return distance;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setResult(null);

    // Check required fields
    const requiredFields = Object.entries(formData);

    const emptyField = requiredFields.find(
      ([, value]) => !String(value).trim()
    );

    if (emptyField) {
      setError("Please fill in all required fields.");
      return;
    }

    // Convert numeric fields
    const age = Number(formData.agent_age);
    const rating = Number(formData.agent_rating);
    const storeLat = Number(formData.store_latitude);
    const storeLng = Number(formData.store_longitude);
    const dropLat = Number(formData.drop_latitude);
    const dropLng = Number(formData.drop_longitude);

    // Check valid numeric values
    const numericValues = [
      age,
      rating,
      storeLat,
      storeLng,
      dropLat,
      dropLng,
    ];

    if (!numericValues.every(Number.isFinite)) {
      setError("Please enter valid numeric values.");
      return;
    }

    // Agent age validation
    if (!Number.isInteger(age) || age < 18 || age > 70) {
      setError("Agent age must be between 18 and 70 years.");
      return;
    }

    // Agent rating validation
    if (rating < 1 || rating > 5) {
      setError("Agent rating must be between 1 and 5.");
      return;
    }

    // Latitude validation
    if (
      storeLat < -90 ||
      storeLat > 90 ||
      dropLat < -90 ||
      dropLat > 90
    ) {
      setError("Latitude must be between -90 and 90.");
      return;
    }

    // Longitude validation
    if (
      storeLng < -180 ||
      storeLng > 180 ||
      dropLng < -180 ||
      dropLng > 180
    ) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    // Delivery distance validation
    const distance = calculateDistance(
      storeLat,
      storeLng,
      dropLat,
      dropLng
    );

    // Provisional limit: 100 km
    if (distance > 100) {
      setError(
        `Delivery distance is ${distance.toFixed(
          2
        )} km. Please enter coordinates within 100 km.`
      );
      return;
    }

    // Prevent prediction for future order dates
    const selectedDate = new Date(`${formData.order_date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setError("Order date cannot be in the future.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        agent_age: age,
        agent_rating: rating,
        store_latitude: storeLat,
        store_longitude: storeLng,
        drop_latitude: dropLat,
        drop_longitude: dropLng,
      };

      const data = await predictETA(payload);

      setResult(data);

      if (onPrediction) {
        onPrediction({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: new Date().toISOString(),
          predicted_delivery_time: data.predicted_delivery_time,
          estimated_hours: data.estimated_hours,
          distance_km: data.distance_km,
          weather: formData.weather,
          traffic: formData.traffic,
          vehicle: formData.vehicle,
          area: formData.area,
          category: formData.category,
          order_date: formData.order_date,
          order_time: formData.order_time,
        });
      }
    } catch (err) {
      setError(
        err.message || "Prediction failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-[#263445] text-sm outline-none transition placeholder:text-slate-400 focus:border-[#32816E] focus:ring-2 focus:ring-[#32816E]/10";

  const labelClass =
    "block text-sm font-medium text-[#334155] mb-2";

  const renderInput = (label, name, type = "text", extra = {}) => (
    <div>
      <label className={labelClass} htmlFor={name}>
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleChange}
        className={inputClass}
        required
        {...extra}
      />
    </div>
  );

  const renderSelect = (label, name) => (
    <div>
      <label className={labelClass} htmlFor={name}>
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className={inputClass}
        required
        disabled={!options}
      >
        <option value="">Select {label}</option>

        {(options?.[name] || []).map((item) => (
          <option key={item} value={item}>
            {item.trim()}
          </option>
        ))}
      </select>
    </div>
  );

  const sectionClass =
    "bg-white border border-slate-200 rounded-xl p-5 md:p-6";

  if (loadingOptions) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
        Loading prediction form...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Agent Information */}
        <section className={sectionClass}>
          <div className="mb-6">
            <h3 className="text-base font-semibold">
              Agent Information
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Enter the delivery agent's details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInput("Agent Age", "agent_age", "number", {
              min: 18,
              max: 70,
              step: "1",
              placeholder: "e.g. 30",
            })}

            {renderInput("Agent Rating", "agent_rating", "number", {
              min: 1,
              max: 5,
              step: "0.1",
              placeholder: "e.g. 4.5",
            })}
          </div>
        </section>

        {/* Pickup Location */}
        <section className={sectionClass}>
          <div className="mb-6">
            <h3 className="text-base font-semibold">
              Pickup Location
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Enter the store coordinates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInput("Store Latitude", "store_latitude", "number", {
              min: -90,
              max: 90,
              step: "any",
              placeholder: "e.g. 22.745049",
            })}

            {renderInput("Store Longitude", "store_longitude", "number", {
              min: -180,
              max: 180,
              step: "any",
              placeholder: "e.g. 75.892471",
            })}
          </div>
        </section>

        {/* Delivery Location */}
        <section className={sectionClass}>
          <div className="mb-6">
            <h3 className="text-base font-semibold">
              Delivery Location
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Enter the customer's delivery coordinates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInput("Drop Latitude", "drop_latitude", "number", {
              min: -90,
              max: 90,
              step: "any",
              placeholder: "e.g. 22.765049",
            })}

            {renderInput("Drop Longitude", "drop_longitude", "number", {
              min: -180,
              max: 180,
              step: "any",
              placeholder: "e.g. 75.912471",
            })}
          </div>
        </section>

        {/* Order Information */}
        <section className={sectionClass}>
          <div className="mb-6">
            <h3 className="text-base font-semibold">
              Order Information
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Provide order timing and delivery conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInput("Order Date", "order_date", "date", {
              max: new Date().toISOString().split("T")[0],
            })}

            {renderInput("Order Time", "order_time", "time")}

            {renderSelect("Weather", "weather")}
            {renderSelect("Traffic", "traffic")}
            {renderSelect("Vehicle", "vehicle")}
            {renderSelect("Area", "area")}
            {renderSelect("Product Category", "category")}
          </div>
        </section>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            All fields are required for a prediction.
          </p>

          <button
            type="submit"
            disabled={loading || !options}
            className="w-full sm:w-auto px-8 py-3 bg-[#32816E] hover:bg-[#286957] text-white rounded-lg text-sm font-semibold transition disabled:opacity-60"
          >
            {loading
              ? "Calculating ETA..."
              : "Predict Delivery Time →"}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Prediction Result */}
      {result && (
        <section className="bg-white border border-[#32816E]/30 rounded-xl overflow-hidden">
          <div className="bg-[#EAF3EF] px-6 py-4 border-b border-[#32816E]/20">
            <p className="text-sm font-semibold text-[#286957]">
              Prediction completed successfully
            </p>
          </div>

          <div className="p-6 md:p-8">
            <p className="text-sm text-slate-500">
              Estimated Delivery Time
            </p>

            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-4xl md:text-5xl font-bold text-[#263445]">
                {result.predicted_delivery_time}
              </h3>

              <span className="text-lg text-slate-500">
                minutes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
              <div className="bg-[#F4F6F8] rounded-lg p-4">
                <p className="text-sm text-slate-500">
                  Estimated Hours
                </p>

                <p className="text-xl font-semibold mt-2">
                  {result.estimated_hours} hrs
                </p>
              </div>

              <div className="bg-[#F4F6F8] rounded-lg p-4">
                <p className="text-sm text-slate-500">
                  Delivery Distance
                </p>

                <p className="text-xl font-semibold mt-2">
                  {result.distance_km} km
                </p>
              </div>
            </div>

            <p className="text-sm text-[#32816E] mt-6 font-medium">
              {result.message}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

export default PredictionForm;
