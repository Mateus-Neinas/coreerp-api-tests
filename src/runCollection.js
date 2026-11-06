import { readFile } from "node:fs/promises";

function interpolate(value, vars) {
  if (typeof value === "string") return value.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Unknown variable: ${key}`);
    return String(vars[key]);
  });
  if (Array.isArray(value)) return value.map(item => interpolate(item, vars));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, interpolate(item, vars)]));
  return value;
}
function atPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}
export async function runCollection(collection, fetchImpl = fetch) {
  const vars = {};
  const results = [];
  const baseUrl = process.env.COREERP_API_URL || collection.baseUrl;
  for (const step of collection.steps) {
    const path = interpolate(step.path, vars);
    const response = await fetchImpl(new URL(path, baseUrl), {
      method: step.method,
      headers: { "content-type": "application/json", ...interpolate(step.headers || {}, vars) },
      ...(step.body ? { body: JSON.stringify(interpolate(step.body, vars)) } : {})
    });
    let json = {};
    try { json = await response.json(); } catch { /* reported through checks below */ }
    const failures = [];
    if (response.status !== step.expect.status) failures.push(`expected HTTP ${step.expect.status}, received ${response.status}`);
    for (const [key, expected] of Object.entries(step.expect.json || {})) {
      const wanted = interpolate(expected, vars);
      if (atPath(json, key) !== wanted) failures.push(`expected ${key}=${wanted}, received ${atPath(json, key)}`);
    }
    if (failures.length) {
      results.push({ name: step.name, ok: false, failures });
      break;
    }
    for (const [name, path] of Object.entries(step.capture || {})) {
      const value = atPath(json, path);
      if (value === undefined) throw new Error(`${step.name}: capture path ${path} was missing`);
      vars[name] = value;
    }
    results.push({ name: step.name, ok: true, status: response.status });
  }
  return { ok: results.length === collection.steps.length && results.every(item => item.ok), results };
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const collection = JSON.parse(await readFile(process.argv[2], "utf8"));
  const result = await runCollection(collection);
  for (const step of result.results) console.log(`${step.ok ? "✓" : "✗"} ${step.name}${step.failures ? ": " + step.failures.join("; ") : ""}`);
  if (!result.ok) process.exitCode = 1;
}
