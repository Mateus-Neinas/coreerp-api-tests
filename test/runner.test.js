import test from "node:test";
import assert from "node:assert/strict";
import { runCollection } from "../src/runCollection.js";

test("runs ordered requests and passes captured values forward", async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url: String(url), options });
    const body = calls.length === 1 ? { data: { id: "c-1" } } : { data: { id: "o-2", customerId: "c-1" } };
    return new Response(JSON.stringify(body), { status: 201, headers: { "content-type": "application/json" } });
  };
  const result = await runCollection({
    baseUrl: "http://localhost:3000",
    steps: [
      { name: "customer", method: "POST", path: "/customers", body: { name: "Demo" }, expect: { status: 201 }, capture: { customerId: "data.id" } },
      { name: "order", method: "POST", path: "/orders", body: { customerId: "{{customerId}}" }, expect: { status: 201, json: { "data.customerId": "{{customerId}}" } } }
    ]
  }, fakeFetch);
  assert.equal(result.ok, true);
  assert.equal(calls[1].options.body, JSON.stringify({ customerId: "c-1" }));
});
