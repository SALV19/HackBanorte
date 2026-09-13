const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message ?? "No fue posible comunicarse con el servidor.")
  return body
}

export function getRegisteredUsers() { return request("/users") }
export function getRegisteredUser(name) { return request(`/users/${encodeURIComponent(name)}`) }

export function sendFinancialMessage({ userName, content, conversationId }) {
  return request("/mcp/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, content, ...(conversationId ? { conversationId } : {}) }),
  })
}
