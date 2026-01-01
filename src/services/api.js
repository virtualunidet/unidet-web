// src/services/api.js

// =========================
//  BASE
// =========================
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/unidet-api/public";

const BASE_HEADERS = {
  Accept: "application/json",
};

function buildUrl(path) {
  if (!path.startsWith("/")) path = "/" + path;
  return API_BASE_URL + path;
}

// Helper para leer JSON y lanzar error si la respuesta no es OK
async function parseJsonResponse(res) {
  const text = await res.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const msg = data && data.error ? data.error : `Error HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// =========================
//  TOKEN USUARIO (ALUMNOS / PÚBLICO)
// =========================
const USER_TOKEN_KEY = "unidet_token";
const USER_DATA_KEY = "unidet_user";

export function saveAuth({ token, user }) {
  if (token) {
    localStorage.setItem(USER_TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }
}

export function getToken() {
  return localStorage.getItem(USER_TOKEN_KEY) || "";
}

export function getUser() {
  const raw = localStorage.getItem(USER_DATA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

// =========================
//  TOKEN ADMIN
// =========================
const ADMIN_TOKEN_KEY = "unidet_admin_token";
const ADMIN_USER_KEY = "unidet_admin_user";

export function saveAdminAuth({ token, user }) {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  }
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function getAdminUser() {
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAdminAuth() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

function redirectToAdminLogin() {
  clearAdminAuth();
  // Login admin está en /admin
  window.location.href = "/admin";
}

// =========================
//  LOGIN ADMIN
//  (POST /admin/login con x-www-form-urlencoded)
// =========================
export async function login(email, password) {
  const body = new URLSearchParams();
  body.append("email", email);
  body.append("password", password);

  const res = await fetch(buildUrl("/admin/login"), {
    method: "POST",
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Error al iniciar sesión");
  }

  // Guarda token + user como ADMIN
  saveAdminAuth(data);
  return data;
}

// =========================
//  HELPERS GENERALES (USUARIO)
// =========================

// POST form-url-encoded con Authorization (token usuario)
export async function postForm(path, values) {
  const body = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      body.append(key, String(value));
    }
  });

  const headers = {
    ...BASE_HEADERS,
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers,
    body,
  });

  return parseJsonResponse(res);
}

// GET con Authorization opcional (token usuario)
export async function getJson(path, { auth = false } = {}) {
  const headers = {
    ...BASE_HEADERS,
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), { headers });
  return parseJsonResponse(res);
}

// Helpers JSON públicos extra (por si los usas)
export async function postJson(path, body = {}, { auth = false } = {}) {
  const headers = {
    ...BASE_HEADERS,
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return parseJsonResponse(res);
}

export async function putJson(path, body = {}, { auth = false } = {}) {
  const headers = {
    ...BASE_HEADERS,
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  return parseJsonResponse(res);
}

export async function deleteJson(path, { auth = false } = {}) {
  const headers = {
    ...BASE_HEADERS,
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), {
    method: "DELETE",
    headers,
  });

  return parseJsonResponse(res);
}

// =========================
//  HELPER ADMIN: adminFetch
// =========================
export async function adminFetch(path, options = {}) {
  const token = getAdminToken();
  const isFormData = options.body instanceof FormData;

  if (!token) {
    redirectToAdminLogin();
    throw new Error("NO_ADMIN_AUTH");
  }

  const headers = {
    ...BASE_HEADERS,
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    redirectToAdminLogin();
    const err = new Error("NO_ADMIN_AUTH");
    err.status = response.status;
    throw err;
  }

  return response;
}

// =========================
//  WRAPPERS ADMIN JSON
// =========================

// GET /admin/...
export async function adminGetJson(path) {
  const res = await adminFetch(path, { method: "GET" });
  return parseJsonResponse(res);
}

// POST /admin/... (JSON)
export async function adminPostJson(path, body = {}) {
  const res = await adminFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return parseJsonResponse(res);
}

// PUT /admin/... (JSON)
export async function adminPutJson(path, body = {}) {
  const res = await adminFetch(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return parseJsonResponse(res);
}

// DELETE /admin/...
export async function adminDeleteJson(path) {
  const res = await adminFetch(path, {
    method: "DELETE",
  });
  return parseJsonResponse(res);
}

// =========================
//  UPLOADS ADMIN (FormData)
// =========================
export async function adminUpload(path, formData) {
  // formData debe ser instancia de FormData
  const res = await adminFetch(path, {
    method: "POST",
    body: formData,
  });
  return parseJsonResponse(res);
}

console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
console.log("API_BASE_URL =", API_BASE_URL);
