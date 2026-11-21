
import { useState } from "react";
import PredictionForm from "./components/PredictionForm";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800 px-8 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          <span className="text-blue-500">ETA</span> Predictor
        </h1>

        <div className="flex gap-6 text-slate-400">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`transition hover:text-blue-400 ${
              activeTab === "dashboard" ? "text-blue-400" : ""
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab("predict")}
            className={`transition hover:text-blue-400 ${
              activeTab === "predict" ? "text-blue-400" : ""
            }`}
          >
            Predict ETA
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">

        <p className="text-blue-400 font-medium mb-3">
          MACHINE LEARNING POWERED
        </p>

        <h2 className="text-4xl font-bold mb-4">
          Delivery Time Prediction
        </h2>

        <p className="text-slate-400 text-lg">
          Intelligent delivery time estimation powered by Machine Learning.
        </p>

        {/* Model Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400">ML Model</p>
            <h3 className="text-2xl font-bold mt-3">
              Random Forest
            </h3>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400">Model Accuracy (R²)</p>
            <h3 className="text-2xl font-bold mt-3">
              81.53%
            </h3>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400">Mean Absolute Error</p>
            <h3 className="text-2xl font-bold mt-3">
              17.08 min
            </h3>
          </div>

        </div>

        {/* Dashboard / Prediction Form */}
        {activeTab === "dashboard" ? (

          <div className="mt-10 bg-slate-900 border border-slate-800 rounded-xl p-8">
            <h3 className="text-xl font-semibold">
              Welcome to ETA Predictor
            </h3>

            <p className="text-slate-400 mt-3">
              Explore delivery prediction insights and model performance.
            </p>

            <button
              onClick={() => setActiveTab("predict")}
              className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Start Prediction →
            </button>
          </div>

        ) : (

          <PredictionForm />

        )}

      </main>
    </div>
  );
}

export default App;
