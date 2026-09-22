// Run with a browser-use Tab handle. All assertions inspect rendered DOM.
export async function checkBrowserFlow(tab) {
  const page = tab.playwright;
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  await tab.reload();
  await page.waitForLoadState({ state: "networkidle", timeoutMs: 20000 });
  const button = (name) => page.getByRole("button", { name, exact: true });
  await button("2D view").click({ timeoutMs: 20000 });
  await button("Add to your table").press("Enter");
  await button("Next dish").press("Enter");
  await button("Add to your table").press("Enter");
  await button("Sweet").click();
  check(
    !(await button("Coming to the table").isEnabled()),
    "Unavailable dish must not be addable",
  );
  check(
    await page
      .getByRole("group", { name: "House Crispy Sisig", exact: true })
      .isVisible(),
    "Filtering must preserve selected items",
  );
  await button("Savory").click();
  await button("The whole table").click();
  const sisig = page.getByRole("group", {
    name: "House Crispy Sisig",
    exact: true,
  });
  await sisig.getByLabel("Portion").selectOption("Large");
  await sisig.getByLabel("Quantity").fill("2");
  await button("Calculate estimate").click();
  await page
    .getByText("Your estimate", { exact: true })
    .waitFor({ state: "visible", timeoutMs: 20000 });
  check(
    (
      await page
        .getByRole("region", { name: "Make room for one more." })
        .innerText()
    ).includes("₱1,585"),
    "Mixed-size total incorrect",
  );
  await sisig.getByLabel("Quantity").fill("3");
  check(
    (await page.getByText("Your estimate", { exact: true }).count()) === 0,
    "Input changes must remove stale totals",
  );
  await button("Remove House Crispy Sisig").press("Enter");
  await button("Remove Watermelon sinigang").press("Enter");
  check(
    !(await button("Calculate estimate").isEnabled()),
    "Empty selection must disable calculation",
  );
  check(
    (await page.evaluate(() => document.activeElement?.id)) === "your-table",
    "Removing final item must restore focus",
  );
  return "PASS: keyboard selection, filter persistence, 2D controls, unavailable dish, mixed-size estimate, stale total clearing, removal focus, empty state";
}

// Requires a development server started with DEMO_DELAY=1.
export async function checkDelayedResponse(tab) {
  const page = tab.playwright;
  await tab.reload();
  await page.waitForLoadState({ state: "networkidle", timeoutMs: 20000 });
  await page
    .getByRole("button", { name: "Add to your table", exact: true })
    .click({ timeoutMs: 20000 });
  await page
    .getByRole("button", { name: "Calculate estimate", exact: true })
    .click();
  await page
    .getByRole("group", { name: "House Crispy Sisig", exact: true })
    .getByLabel("Portion")
    .selectOption("Large");
  await page
    .getByRole("button", { name: "Calculate estimate", exact: true })
    .click();
  await page
    .getByText("Your estimate", { exact: true })
    .waitFor({ state: "visible", timeoutMs: 20000 });
  const table = await page
    .getByRole("region", { name: "Make room for one more." })
    .innerText();
  if (!table.includes("₱595") || table.includes("₱295"))
    throw new Error("Older response overwrote latest inputs");
  return "PASS: edited input cancels pending response; latest Large estimate is ₱595";
}

// Requires DEMO_WEBGL_FAILURE=1 and DEMO_ERROR=1 on development server.
export async function checkFailureFallback(tab) {
  const page = tab.playwright;
  await tab.reload();
  await page
    .getByText(
      "3D could not load on this device. Your full menu and table are available in 2D.",
      { exact: true },
    )
    .waitFor({ state: "visible", timeoutMs: 20000 });
  if (
    await page.getByRole("button", { name: "3D view", exact: true }).isEnabled()
  )
    throw new Error("Failed renderer must disable 3D");
  await page
    .getByRole("button", { name: "Add to your table", exact: true })
    .press("Enter");
  await page
    .getByRole("button", { name: "Calculate estimate", exact: true })
    .click();
  await page
    .getByText("Kitchen is taking a moment. Please try again.", { exact: true })
    .waitFor({ state: "visible", timeoutMs: 20000 });
  if (
    !(await page
      .getByRole("group", { name: "House Crispy Sisig", exact: true })
      .isVisible())
  )
    throw new Error("Server failure lost inputs");
  if (
    !(await page
      .getByRole("button", { name: "Calculate estimate", exact: true })
      .isEnabled())
  )
    throw new Error("Retry unavailable");
  return "PASS: WebGL fallback preserves full form; server error retains selection and retry";
}
