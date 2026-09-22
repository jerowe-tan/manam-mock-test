import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateEstimate, catalog } from "../lib/catalog";
import { reconcileSelection } from "../lib/types";
import { POST } from "../app/api/estimate/route";
const item = { id: "sisig", size: "Small", quantity: 1 };
test("server prices override forged totals and calculate mixed sizes exactly", () => {
  const result = calculateEstimate({
    items: [
      { ...item, price: 1, total: 1, quantity: 3 },
      { id: "sinigang", size: "Large", quantity: 2 },
    ],
  });
  assert.equal(result.total, 247500);
  assert.equal(result.items[0].unitPrice, 29500);
});
for (const quantity of [0, 6, -1, 1.2, "2", null, NaN, Infinity])
  test(`reject quantity ${quantity}`, () =>
    assert.throws(
      () => calculateEstimate({ items: [{ ...item, quantity }] }),
      /Quantity/,
    ));
test("reject duplicates, missing dishes, unavailable dishes and bad sizes", () => {
  assert.throws(() => calculateEstimate({ items: [item, item] }), /once/);
  assert.throws(
    () => calculateEstimate({ items: [{ ...item, id: "missing" }] }),
    /Unknown/,
  );
  assert.throws(
    () => calculateEstimate({ items: [{ ...item, id: "ube" }] }),
    /unavailable/,
  );
  assert.throws(
    () => calculateEstimate({ items: [{ ...item, size: "Medium" }] }),
    /Small or Large/,
  );
});
for (const body of [
  null,
  [],
  {},
  { items: [] },
  { items: [null] },
  { items: [item, item, item, item] },
])
  test(`reject malformed body ${JSON.stringify(body)}`, () =>
    assert.throws(() => calculateEstimate(body)));
test("filter retains valid selection, replaces hidden selection, handles empty", () => {
  assert.equal(reconcileSelection(catalog, "sinigang")?.id, "sinigang");
  assert.equal(
    reconcileSelection(
      catalog.filter((d) => d.category === "Sweet"),
      "sisig",
    )?.id,
    "ube",
  );
  assert.equal(reconcileSelection([], "sisig"), undefined);
});
test("API returns stable error envelope and HTTP statuses", async () => {
  const malformed = await POST(
    new Request("http://localhost/api/estimate", { method: "POST", body: "{" }),
  );
  assert.equal(malformed.status, 400);
  assert.equal(typeof (await malformed.json()).error.message, "string");
  const invalid = await POST(
    new Request("http://localhost/api/estimate", {
      method: "POST",
      body: JSON.stringify({ items: [] }),
    }),
  );
  assert.equal(invalid.status, 422);
  const valid = await POST(
    new Request("http://localhost/api/estimate", {
      method: "POST",
      body: JSON.stringify({ items: [item] }),
    }),
  );
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).total, 29500);
});
