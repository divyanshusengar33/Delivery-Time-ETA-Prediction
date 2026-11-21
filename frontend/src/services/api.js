
const API_BASE_URL = "http://127.0.0.1:8000";

export const getOptions = async () => {
  const response = await fetch(`${API_BASE_URL}/options`);

  if (!response.ok) {
    throw new Error("Unable to fetch dropdown options");
  }

  return response.json();
};

export const predictETA = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Prediction failed");
  }

  return data;
};

