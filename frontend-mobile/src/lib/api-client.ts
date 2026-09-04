/**
 * Cliente HTTP unificado para o PetPrev Mobile / Tutor & Vet
 * Gerencia autenticação JWT, chamadas de agendamento, pets, prontuários e
 * sincronização de evidências (Cold Chain e Prontuários assinados via FormData).
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
  return localStorage.getItem("petprev_mobile_auth_token");
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("petprev_mobile_auth_token", token);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("petprev_mobile_auth_token");
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

  let requestBody: any = options.body;
  const isFormData = typeof FormData !== "undefined" && requestBody instanceof FormData;
  if (!isFormData && requestBody && typeof requestBody === "object" && !(requestBody instanceof Blob)) {
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

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Serviços da API para Tutor e Veterinário
 */
export const mobileApi = {
  requestOtp: (phone_number: string) =>
    apiRequest("/auth/otp/request", {
      method: "POST",
      body: { phone_number },
    }),

  verifyOtp: async (phone_number: string, code: string, device_info?: string) => {
    const data = await apiRequest("/auth/otp/verify", {
      method: "POST",
      body: { phone_number, code, device_info: device_info || "PetPrev Mobile Web" },
    });
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  getTutorProfile: () => apiRequest("/tutors/me", { method: "GET" }),
  updateTutorProfile: (data: {
    full_name?: string | undefined;
    address_street?: string | undefined;
    address_number?: string | undefined;
    address_neighborhood?: string | undefined;
    address_city?: string | undefined;
    address_zipcode?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
  }) => apiRequest("/tutors/me", { method: "PUT", body: data }),

  getPets: () => apiRequest("/pets", { method: "GET" }),
  createPet: (data: {
    name: string;
    species: "CANINE" | "FELINE";
    breed?: string | undefined;
    gender?: string | undefined;
    birth_date?: string | undefined;
    weight_kg?: number | undefined;
    photo_url?: string | undefined;
  }) => apiRequest("/pets", { method: "POST", body: data }),

  getAppointments: (params?: { status?: string | undefined; date?: string | undefined; pet_id?: string | undefined }) =>
    apiRequest("/appointments", { method: "GET", params }),

  requestAppointment: (data: {
    pet_id: string;
    scheduled_date: string;
    time_window_start: string;
    time_window_end: string;
  }) => apiRequest("/appointments", { method: "POST", body: data }),

  updateAppointmentStatus: (appointmentId: string, status: string) =>
    apiRequest(`/appointments/${appointmentId}/status`, {
      method: "PATCH",
      body: { status },
    }),

  getMedicalRecordsByPet: (petId: string) =>
    apiRequest(`/medical-records/pet/${petId}`, { method: "GET" }),

  uploadColdChainEvidence: (appointmentId: string, formData: FormData) =>
    apiRequest(`/appointments/${appointmentId}/cold-chain`, {
      method: "POST",
      body: formData,
    }),

  uploadSignedRecord: (formData: FormData) =>
    apiRequest("/medical-records/signed", {
      method: "POST",
      body: formData,
    }),

  getSubscription: () => apiRequest("/billing/subscriptions/me", { method: "GET" }),
  createSubscription: (plan_type: string, monthly_price?: number) =>
    apiRequest("/billing/subscriptions", {
      method: "POST",
      body: { plan_type, monthly_price },
    }),
};
