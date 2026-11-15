export async function getJson(path, { signal } = {}) {
  const response = await fetch(`/api${path}`, { signal });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}
