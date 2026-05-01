const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getTokens() {
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken")
  };
}

function setTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

async function request(path, options = {}) {
  const { accessToken } = getTokens();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status !== 401) {
    return handleResponse(response);
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    clearTokens();
    throw new Error("Unauthorized");
  }

  const { accessToken: newAccessToken } = getTokens();
  const retry = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      Authorization: `Bearer ${newAccessToken}`
    }
  });

  return handleResponse(retry);
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    setTokens({ accessToken: data.accessToken });
    return true;
  } catch (error) {
    return false;
  }
}

export async function signup(payload) {
  const data = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function login(payload) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function getMe() {
  return request("/api/auth/me");
}

export async function logout() {
  await request("/api/auth/logout", { method: "POST" });
  clearTokens();
}

export async function getProjects() {
  return request("/api/projects");
}

export async function createProject(payload) {
  return request("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getProject(projectId) {
  return request(`/api/projects/${projectId}`);
}

export async function addMember(projectId, payload) {
  return request(`/api/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getProjectTasks(projectId) {
  return request(`/api/projects/${projectId}/tasks`);
}

export async function createTask(projectId, payload) {
  return request(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateTask(taskId, payload) {
  return request(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteTask(taskId) {
  return request(`/api/tasks/${taskId}`, { method: "DELETE" });
}

export async function getDashboard() {
  return request("/api/dashboard");
}
