
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        ...formData,
        agent_age: Number(formData.agent_age),
        agent_rating: Number(formData.agent_rating),
        store_latitude: Number(formData.store_latitude),
        store_longitude: Number(formData.store_longitude),
        drop_latitude: Number(formData.drop_latitude),
        drop_longitude: Number(formData.drop_longitude),
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
      setError(err.message || "Prediction failed. Please try again.");
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

        <section className={sectionClass}>
          <div className="mb-6">
            <h3 className="text-base font-semibold">Agent Information</h3>
            <p className="text-sm text-slate-500 mt-1">
              Enter the delivery agent's details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInput("Agent Age", "agent_age", "number", {
              min: 1,
              step: "1",
              placeholder: "e.g. 30",
            })}
            {renderInput("Agent Rating", "agent_rating", "number", {
              min: 0,
              max: 5,
              step: "0.1",
              placeholder: "e.g. 4.5",
            })}
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mb-6">
            <h3 className="text-base font-semibold">Pickup Location</h3>
            <p className="text-sm text-slate-500 mt-1">
              Enter the store coordinates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInput("Store Latitude", "store_latitude", "number", {
              step: "any",
              placeholder: "e.g. 22.745049",
            })}
            {renderInput("Store Longitude", "store_longitude", "number", {
              step: "any",
              placeholder: "e.g. 75.892471",
            })}
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mb-6">
            <h3 className="text-base font-semibold">Delivery Location</h3>
            <p className="text-sm text-slate-500 mt-1">
              Enter the customer's delivery coordinates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInput("Drop Latitude", "drop_latitude", "number", {
              step: "any",
              placeholder: "e.g. 22.765049",
            })}
            {renderInput("Drop Longitude", "drop_longitude", "number", {
              step: "any",
              placeholder: "e.g. 75.912471",
            })}
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mb-6">
            <h3 className="text-base font-semibold">Order Information</h3>
            <p className="text-sm text-slate-500 mt-1">
              Provide order timing and delivery conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderInput("Order Date", "order_date", "date")}
            {renderInput("Order Time", "order_time", "time")}
            {renderSelect("Weather", "weather")}
            {renderSelect("Traffic", "traffic")}
            {renderSelect("Vehicle", "vehicle")}
            {renderSelect("Area", "area")}
            {renderSelect("Product Category", "category")}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            All fields are required for a prediction.
          </p>

          <button
            type="submit"
            disabled={loading || !options}
            className="w-full sm:w-auto px-8 py-3 bg-[#32816E] hover:bg-[#286957] text-white rounded-lg text-sm font-semibold transition disabled:opacity-60"
          >
            {loading ? "Calculating ETA..." : "Predict Delivery Time →"}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

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
              <span className="text-lg text-slate-500">minutes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
              <div className="bg-[#F4F6F8] rounded-lg p-4">
                <p className="text-sm text-slate-500">Estimated Hours</p>
                <p className="text-xl font-semibold mt-2">
                  {result.estimated_hours} hrs
                </p>
              </div>

              <div className="bg-[#F4F6F8] rounded-lg p-4">
                <p className="text-sm text-slate-500">Delivery Distance</p>
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
