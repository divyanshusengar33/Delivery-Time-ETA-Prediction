
import { useEffect, useState } from "react";
import PredictionForm from "./components/PredictionForm";

const STORAGE_KEY = "eta_prediction_history";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Load saved prediction history
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  // Add new prediction
  const handleNewPrediction = (record) => {
    setHistory((prev) => [record, ...prev]);
  };

  // Clear history
  const clearHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all prediction history?"
      )
    ) {
      setHistory([]);
    }
  };

  // Dashboard analytics
  const totalPredictions = history.length;

  const averageETA =
    totalPredictions > 0
      ? (
          history.reduce(
            (total, item) =>
              total + Number(item.predicted_delivery_time),
            0
          ) / totalPredictions
        ).toFixed(1)
      : "—";

  const latestPrediction = history[0] || null;

  const recentPredictions = history.slice(0, 5);

  // Navigation
  const navigation = [
    { id: "dashboard", label: "Overview", icon: "◫" },
    { id: "predict", label: "Predict ETA", icon: "↗" },
    { id: "history", label: "Prediction History", icon: "◷" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#263445] flex">

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-[#E2E8F0] flex-col fixed inset-y-0 left-0 z-20">

        {/* Logo */}
        <div className="px-7 py-7 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-[#32816E] text-white flex items-center justify-center font-bold text-lg">
              E
            </div>

            <div>
              <h1 className="font-bold text-lg tracking-tight">
                ETA Predictor
              </h1>

              <p className="text-xs text-slate-500">
                Delivery Intelligence
              </p>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <div className="px-5 py-7 flex-1">

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-4">
            Workspace
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  activeTab === item.id
                    ? "bg-[#EAF3EF] text-[#32816E]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="text-lg">{item.icon}</span>

                {item.label}

                {item.id === "history" && history.length > 0 && (
                  <span className="ml-auto text-xs bg-slate-100 px-2 py-1 rounded-full">
                    {history.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Model Status */}
        <div className="p-5 border-t border-[#E2E8F0]">

          <div className="bg-[#F4F6F8] rounded-xl p-4">

            <p className="text-sm font-semibold">
              ML Model
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Random Forest Regressor
            </p>

            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-[#32816E]" />

              <span className="text-xs text-[#32816E] font-medium">
                Model available
              </span>
            </div>

          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 md:ml-64 min-w-0">

        {/* TOPBAR */}
        <header className="h-20 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 md:px-10">

          <p className="text-sm text-slate-500">
            Workspace /{" "}
            {activeTab === "dashboard"
              ? "Overview"
              : activeTab === "predict"
                ? "Prediction"
                : "History"}
          </p>

          <div className="flex items-center gap-3">

            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold">
                Delivery Analytics
              </p>

              <p className="text-xs text-slate-500">
                Machine Learning Platform
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#EAF3EF] text-[#32816E] flex items-center justify-center font-semibold">
              ETA
            </div>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="px-6 md:px-10 py-9 max-w-7xl mx-auto">

          {/* =====================================
              DASHBOARD
          ====================================== */}
          {activeTab === "dashboard" && (
            <>

              {/* Heading */}
              <div className="mb-9">

                <p className="text-sm font-medium text-[#32816E] mb-2">
                  DELIVERY INTELLIGENCE
                </p>

                <h2 className="text-3xl font-bold tracking-tight">
                  Overview
                </h2>

                <p className="text-slate-500 mt-2">
                  Monitor model performance and delivery prediction activity.
                </p>

              </div>

              {/* ANALYTICS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                {/* Total Predictions */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">

                  <p className="text-sm text-slate-500">
                    Total Predictions
                  </p>

                  <h3 className="text-3xl font-bold mt-3">
                    {totalPredictions}
                  </h3>

                  <p className="text-xs text-[#32816E] mt-3">
                    Saved predictions
                  </p>

                </div>

                {/* Average ETA */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">

                  <p className="text-sm text-slate-500">
                    Average ETA
                  </p>

                  <h3 className="text-3xl font-bold mt-3">
                    {averageETA === "—" ? "—" : `${averageETA} min`}
                  </h3>

                  <p className="text-xs text-slate-500 mt-3">
                    Across generated predictions
                  </p>

                </div>

                {/* Model R2 */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">

                  <p className="text-sm text-slate-500">
                    Model R² Score
                  </p>

                  <h3 className="text-3xl font-bold mt-3">
                    81.53%
                  </h3>

                  <p className="text-xs text-[#32816E] mt-3">
                    Random Forest Regressor
                  </p>

                </div>

                {/* MAE */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">

                  <p className="text-sm text-slate-500">
                    Mean Absolute Error
                  </p>

                  <h3 className="text-3xl font-bold mt-3">
                    17.08 min
                  </h3>

                  <p className="text-xs text-slate-500 mt-3">
                    Model evaluation metric
                  </p>

                </div>

              </div>

              {/* LATEST PREDICTION */}
              <div className="mt-8 bg-white border border-[#E2E8F0] rounded-xl p-6 md:p-8">

                <div className="flex items-center justify-between gap-4 mb-6">

                  <div>
                    <h3 className="text-lg font-semibold">
                      Latest Prediction
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      Most recently generated delivery estimate.
                    </p>
                  </div>

                  <span className="text-xs font-medium text-[#32816E] bg-[#EAF3EF] px-3 py-1.5 rounded-full">
                    {latestPrediction ? "Completed" : "No data"}
                  </span>

                </div>

                {latestPrediction ? (

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

                    <div className="bg-[#F4F6F8] rounded-lg p-5">
                      <p className="text-sm text-slate-500">
                        Predicted ETA
                      </p>

                      <h3 className="text-2xl font-bold mt-2 text-[#32816E]">
                        {latestPrediction.predicted_delivery_time} min
                      </h3>
                    </div>

                    <div className="bg-[#F4F6F8] rounded-lg p-5">
                      <p className="text-sm text-slate-500">
                        Delivery Distance
                      </p>

                      <h3 className="text-2xl font-bold mt-2">
                        {latestPrediction.distance_km} km
                      </h3>
                    </div>

                    <div className="bg-[#F4F6F8] rounded-lg p-5">
                      <p className="text-sm text-slate-500">
                        Weather & Traffic
                      </p>

                      <h3 className="text-lg font-semibold mt-2">
                        {latestPrediction.weather} / {latestPrediction.traffic}
                      </h3>
                    </div>

                  </div>

                ) : (

                  <div className="bg-[#F4F6F8] rounded-lg p-6 text-center">

                    <p className="text-slate-500 text-sm">
                      No predictions available yet. Create your first prediction to see analytics.
                    </p>

                    <button
                      onClick={() => setActiveTab("predict")}
                      className="mt-4 text-sm font-semibold text-[#32816E] hover:underline"
                    >
                      Create Prediction →
                    </button>

                  </div>

                )}

              </div>

              {/* RECENT PREDICTIONS */}
              <div className="mt-8 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">

                <div className="p-6 flex items-center justify-between gap-4">

                  <div>
                    <h3 className="text-lg font-semibold">
                      Recent Predictions
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      Your last five delivery estimates.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab("history")}
                    className="text-sm text-[#32816E] font-semibold hover:underline whitespace-nowrap"
                  >
                    View all →
                  </button>

                </div>

                {recentPredictions.length > 0 ? (

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[600px] text-sm text-left">

                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-medium">
                            Date
                          </th>

                          <th className="px-6 py-4 font-medium">
                            ETA
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Distance
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Weather
                          </th>

                          <th className="px-6 py-4 font-medium">
                            Traffic
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">

                        {recentPredictions.map((item) => (

                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 transition"
                          >

                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                              {new Date(item.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </td>

                            <td className="px-6 py-4 font-semibold text-[#32816E] whitespace-nowrap">
                              {item.predicted_delivery_time} min
                            </td>

                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                              {item.distance_km} km
                            </td>

                            <td className="px-6 py-4 text-slate-600">
                              {item.weather}
                            </td>

                            <td className="px-6 py-4 text-slate-600">
                              {item.traffic}
                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                ) : (

                  <div className="px-6 pb-7 text-sm text-slate-500">
                    No prediction records available yet.
                  </div>

                )}

              </div>

              {/* MODEL INFORMATION */}
              <div className="mt-8 bg-white border border-[#E2E8F0] rounded-xl p-6">

                <h3 className="font-semibold text-lg">
                  About the model
                </h3>

                <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                  This application uses a Random Forest Regressor trained on
                  delivery data to estimate delivery time based on agent
                  characteristics, order details, traffic, weather and
                  delivery distance.
                </p>

                <div className="flex flex-wrap gap-8 mt-5 text-sm">

                  <div>
                    <p className="text-slate-500">RMSE</p>
                    <p className="font-semibold mt-1">
                      22.18 min
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">MAE</p>
                    <p className="font-semibold mt-1">
                      17.08 min
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">R² Score</p>
                    <p className="font-semibold mt-1">
                      81.53%
                    </p>
                  </div>

                </div>

              </div>

            </>
          )}

          {/* =====================================
              PREDICTION PAGE
          ====================================== */}
          {activeTab === "predict" && (
            <>

              <div className="mb-8">

                <p className="text-sm font-medium text-[#32816E] mb-2">
                  DELIVERY INTELLIGENCE
                </p>

                <h2 className="text-3xl font-bold tracking-tight">
                  Predict ETA
                </h2>

                <p className="text-slate-500 mt-2">
                  Provide delivery details to generate an estimated arrival time.
                </p>

              </div>

              <PredictionForm onPrediction={handleNewPrediction} />

            </>
          )}

          {/* =====================================
              PREDICTION HISTORY
          ====================================== */}
          {activeTab === "history" && (
            <>

              {/* Heading */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">

                <div>

                  <p className="text-sm font-medium text-[#32816E] mb-2">
                    DELIVERY INTELLIGENCE
                  </p>

                  <h2 className="text-3xl font-bold tracking-tight">
                    Prediction History
                  </h2>

                  <p className="text-slate-500 mt-2">
                    Review your previously generated delivery estimates.
                  </p>

                </div>

                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
                  >
                    Clear History
                  </button>
                )}

              </div>

              {/* Empty State */}
              {history.length === 0 ? (

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center">

                  <div className="text-4xl text-slate-300 mb-4">
                    ◷
                  </div>

                  <h3 className="text-lg font-semibold">
                    No predictions yet
                  </h3>

                  <p className="text-sm text-slate-500 mt-2">
                    Your successful delivery predictions will appear here.
                  </p>

                  <button
                    onClick={() => setActiveTab("predict")}
                    className="mt-6 bg-[#32816E] hover:bg-[#286957] text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Create your first prediction
                  </button>

                </div>

              ) : (

                /* History Table */
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[650px] text-sm text-left">

                      <thead className="bg-slate-50 text-slate-500">

                        <tr>
                          <th className="px-5 py-4 font-medium whitespace-nowrap">
                            Date
                          </th>

                          <th className="px-5 py-4 font-medium whitespace-nowrap">
                            ETA
                          </th>

                          <th className="px-5 py-4 font-medium whitespace-nowrap">
                            Distance
                          </th>

                          <th className="px-5 py-4 font-medium whitespace-nowrap">
                            Weather
                          </th>

                          <th className="px-5 py-4 font-medium whitespace-nowrap">
                            Traffic
                          </th>
                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-100">

                        {history.map((item) => (

                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 transition"
                          >

                            <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                              {new Date(item.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </td>

                            <td className="px-5 py-4 font-semibold text-[#32816E] whitespace-nowrap">
                              {item.predicted_delivery_time} min
                            </td>

                            <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                              {item.distance_km} km
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {item.weather}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {item.traffic}
                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>
                </div>

              )}

            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
