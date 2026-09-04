/**
 * Cliente HTTP unificado para o PetPrev Admin / RT Web
 * Conecta às rotas REST da API NestJS com suporte a autenticação JWT e uploads multipart/form-data.
 */

const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const envUrl = (import.meta as any).env?.["VITE_API_BASE_URL"];
    if (envUrl) return envUrl;
  }
  return "http://localhost:3000/api/v1";
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("petprev_auth_token");
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("petprev_auth_token", token);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("petprev_auth_token");
  }
};

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined> | undefined;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  let url = `${baseUrl}${cleanEndpoint}`;

  if (options.params) {
    const query = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = getAuthToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Se o body for FormData, NUNCA definir Content-Type manualmente para que o browser
  // calcule automaticamente o boundary necessário para o multipart/form-data.
  let requestBody: any = options.body;
  const isFormData = typeof FormData !== "undefined" && requestBody instanceof FormData;
  if (
    !isFormData &&
    requestBody &&
    typeof requestBody === "object" &&
    !(requestBody instanceof Blob)
  ) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(requestBody);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: await response.text() };
    }
    const errorMessage =
      errorData?.message ||
      (Array.isArray(errorData?.message) ? errorData.message.join(", ") : null) ||
      `Erro ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  // Resposta vazia (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Endpoints específicos para o painel de Auditoria e RT
 */
export const adminApi = {
  getMedicalRecords: (params?: {
    has_conflict?: boolean | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
  }) => apiRequest("/medical-records", { method: "GET", params }),

  getAppointments: (params?: { status?: string | undefined; date?: string | undefined }) =>
    apiRequest("/appointments", { method: "GET", params }),

  getPets: () => apiRequest("/pets", { method: "GET" }),
};
