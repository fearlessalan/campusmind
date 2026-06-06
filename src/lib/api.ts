export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem("campusmind_token");
  const finalInit: RequestInit = init ? { ...init } : {};
  
  if (token) {
    const headers = new Headers(finalInit.headers);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // Also set x-user-email if available
    const email = localStorage.getItem("campusmind_email");
    if (email && !headers.has("x-user-email")) {
      headers.set("x-user-email", email);
    }
    finalInit.headers = headers;
  }
  
  return fetch(input, finalInit);
}
