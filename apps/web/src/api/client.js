const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const TOKEN_KEY = "beanhelps_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function api(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.message || "Something went wrong";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload.data ?? payload;
}

export const authApi = {
  login: (body) =>
    api("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  signup: (body) =>
    api("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  me: () => api("/auth/me"),
};

export const usersApi = {
  updateProfile: (body) =>
    api("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
};
