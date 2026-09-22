"use client";
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  money,
  reconcileSelection,
  type Dish,
  type Estimate,
  type Selection,
  type Size,
} from "@/lib/types";

const Scene = dynamic(() => import("./FoodScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading" role="status">
      Setting the table<span>Good things take a little simmer.</span>
    </div>
  ),
});
class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Experience({ dishes }: { dishes: Dish[] }) {
  const [activeId, setActiveId] = useState(dishes[0]?.id ?? "");
  const [category, setCategory] = useState("All");
  const [mode, setMode] = useState<"2D" | "3D">("2D");
  const [reduced, setReduced] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selection, setSelection] = useState<Selection[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const version = useRef(0);
  const request = useRef<AbortController | null>(null);
  const filtered = dishes.filter(
    (d) => category === "All" || d.category === category,
  );
  const dish = reconcileSelection(filtered, activeId);
  const position = filtered.findIndex((d) => d.id === dish?.id);
  const current = selection.find((item) => item.id === dish?.id);
  const failScene = useCallback(() => {
    setFailed(true);
    setMode("2D");
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    setMode(media.matches ? "2D" : "3D");
    const change = () => {
      setReduced(media.matches);
      if (media.matches) setMode("2D");
    };
    media.addEventListener("change", change);
    return () => {
      media.removeEventListener("change", change);
      request.current?.abort();
    };
  }, []);
  function update(items: Selection[]) {
    version.current++;
    request.current?.abort();
    setPending(false);
    setEstimate(null);
    setError("");
    setSelection(items);
  }
  function addDish() {
    if (!dish?.available) return;
    if (!current) {
      update([...selection, { id: dish.id, size: "Small", quantity: 1 }]);
      setAnnouncement(`${dish.name} added to your table.`);
    } else
      document
        .getElementById("your-table")
        ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!selection.length) {
      setError("Add a dish before calculating.");
      return;
    }
    if (
      selection.some(
        (item) =>
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 5,
      )
    ) {
      setError("Quantity must be a whole number from 1 to 5.");
      return;
    }
    const id = ++version.current,
      controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    setEstimate(null);
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selection }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (version.current !== id) return;
      if (!response.ok)
        throw new Error(
          result.error?.message ?? "Unable to calculate. Please try again.",
        );
      setEstimate(result);
    } catch (failure) {
      if (version.current === id && !controller.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : "Connection failed. Please try again.",
        );
    } finally {
      if (version.current === id) setPending(false);
    }
  }
  return (
    <>
      <a className="skip-link" href="#your-table">
        Skip to your table
      </a>
      <header className="site-header">
        <a href="/experience" className="brand" aria-label="Manam home">
          <span className="wordmark">manam</span>
          <span className="brand-caption">COMFORT FILIPINO</span>
        </a>
        <nav aria-label="Main navigation">
          <a className="nav-active" href="#journey">
            The experience
          </a>
          <a href="#your-table">
            Your table <span className="table-count">{selection.length}</span>
          </a>
          <a
            className="official-link"
            href="https://manam.momentfood.com/"
            target="_blank"
            rel="noreferrer"
          >
            Order from Manam <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <main>
        <section
          id="journey"
          className="journey"
          aria-labelledby="journey-title"
        >
          <div className="intro-line">
            <span>FAMILIAR FLAVORS. A FRESH PERSPECTIVE.</span>
            <span className="edition">A little taste of home / 01</span>
          </div>
          <div className="hero-composition">
            <div className="hero-copy">
              <p className="chapter">Come hungry. Stay a little.</p>
              <h1 id="journey-title">
                A table full
                <br />
                of <em>stories.</em>
              </h1>
              <p className="hero-description">
                Take a little trip through Filipino comfort food.
                <br className="desktop-break" /> The familiar, the unexpected,
                and the extra rice.
              </p>
              <a className="text-link" href="#dish-details">
                Meet your first bite <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="stage" data-mode={mode}>
              <span className="table-lettering" aria-hidden="true">
                kain tayo!
              </span>
              {dish && mode === "3D" ? (
                <SceneBoundary onFailure={failScene}>
                  <Scene
                    index={dish.scene}
                    reduced={reduced}
                    onFailure={failScene}
                  />
                </SceneBoundary>
              ) : (
                <div
                  className={`flat-dish flat-${dish?.id ?? "empty"}`}
                  aria-hidden="true"
                >
                  <div className="flat-plate">
                    <span>{dish?.shortName ?? "Your table"}</span>
                    <small>{dish?.note ?? "Something good is coming."}</small>
                  </div>
                </div>
              )}
              <div className="scene-note">
                <span className="small-cross" aria-hidden="true">
                  +
                </span>
                <span>
                  {mode === "3D"
                    ? "A new angle on an old favorite."
                    : "All the flavor. A quieter view."}
                </span>
              </div>
              <div className="mode-switch" aria-label="View mode">
                <button
                  aria-pressed={mode === "3D"}
                  disabled={failed}
                  onClick={() => setMode("3D")}
                >
                  3D view
                </button>
                <button
                  aria-pressed={mode === "2D"}
                  onClick={() => setMode("2D")}
                >
                  2D view
                </button>
              </div>
            </div>
          </div>
          {failed && (
            <p className="fallback-notice" role="status">
              3D could not load on this device. Your full menu and table are
              available in 2D.
            </p>
          )}
          <div className="dish-strip" id="dish-details">
            <div className="dish-identity">
              <span className="dish-number">
                {String(position + 1).padStart(2, "0")}
                <small> / {String(filtered.length).padStart(2, "0")}</small>
              </span>
              <div>
                <p className="eyebrow">
                  {dish?.category === "Sweet"
                    ? "THE SWEET ENDING"
                    : "FILIPINO COMFORT, REIMAGINED"}
                </p>
                <h2>{dish?.name ?? "The table is taking a break."}</h2>
              </div>
            </div>
            <p className="dish-description">
              {dish?.description ??
                "No dishes here right now. Try another category or come back shortly."}
            </p>
            <div className="dish-action">
              {dish && (
                <>
                  <span>
                    From {money(dish.prices.Small)} <small>/ demo price</small>
                  </span>
                  <button
                    className="primary-button"
                    disabled={!dish.available}
                    onClick={addDish}
                  >
                    {!dish.available
                      ? "Coming to the table"
                      : current
                        ? "View your table"
                        : "Add to your table"}
                    <span aria-hidden="true">{dish.available ? "+" : ""}</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="journey-controls">
            <div className="filters" aria-label="Dish category">
              {["All", "Savory", "Sweet"].map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  onClick={() => {
                    setCategory(c);
                    const next = reconcileSelection(
                      dishes.filter((d) => c === "All" || d.category === c),
                      dish?.id ?? "",
                    );
                    setActiveId(next?.id ?? "");
                  }}
                >
                  {c === "All" ? "The whole table" : c}
                </button>
              ))}
            </div>
            <div className="dish-tabs" aria-label="Choose a dish">
              {filtered.map((d, i) => (
                <button
                  key={d.id}
                  aria-pressed={dish?.id === d.id}
                  onClick={() => setActiveId(d.id)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {d.shortName}
                </button>
              ))}
            </div>
            <div className="arrows">
              <button
                aria-label="Previous dish"
                disabled={position <= 0}
                onClick={() => setActiveId(filtered[position - 1].id)}
              >
                ←
              </button>
              <button
                aria-label="Next dish"
                disabled={position < 0 || position >= filtered.length - 1}
                onClick={() => setActiveId(filtered[position + 1].id)}
              >
                →
              </button>
            </div>
          </div>
        </section>
        <section
          className="table-section"
          id="your-table"
          tabIndex={-1}
          aria-labelledby="table-title"
        >
          <div className="table-intro">
            <p className="eyebrow">GOOD FOOD IS BETTER SHARED</p>
            <h2 id="table-title">
              Make room
              <br />
              for <em>one more.</em>
            </h2>
            <p>
              A little of this. A little of that.
              <br />
              Put together your own table of favorites.
            </p>
            <div className="ingredient-note">
              <span aria-hidden="true">✳</span>
              <p>
                Made for the middle of the table.
                <br />
                And everyone around it.
              </p>
            </div>
          </div>
          <form className="selection-form" onSubmit={submit}>
            <div className="selection-heading">
              <h3>Your tasting table</h3>
              <span>
                {selection.length} {selection.length === 1 ? "dish" : "dishes"}
              </span>
            </div>
            {!selection.length ? (
              <div className="empty-table">
                <span aria-hidden="true">◯</span>
                <h4>There’s a seat for your favorites.</h4>
                <p>Add something from the table above to get started.</p>
                <a href="#dish-details">Choose your first dish ↑</a>
              </div>
            ) : (
              <div className="selection-items">
                {selection.map((item) => {
                  const d = dishes.find((d) => d.id === item.id)!;
                  return (
                    <fieldset key={item.id}>
                      <legend>{d.name}</legend>
                      <div className="item-fields">
                        <label>
                          Portion
                          <select
                            value={item.size}
                            onChange={(e) =>
                              update(
                                selection.map((s) =>
                                  s.id === item.id
                                    ? { ...s, size: e.target.value as Size }
                                    : s,
                                ),
                              )
                            }
                          >
                            <option>Small</option>
                            <option>Large</option>
                          </select>
                        </label>
                        <label>
                          Quantity
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="1"
                            required
                            value={
                              Number.isNaN(item.quantity) ? "" : item.quantity
                            }
                            aria-describedby={
                              error ? "estimate-error" : undefined
                            }
                            aria-invalid={
                              Number.isNaN(item.quantity) ||
                              !Number.isInteger(item.quantity) ||
                              item.quantity < 1 ||
                              item.quantity > 5
                            }
                            onChange={(e) =>
                              update(
                                selection.map((s) =>
                                  s.id === item.id
                                    ? { ...s, quantity: e.target.valueAsNumber }
                                    : s,
                                ),
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="remove-button"
                          aria-label={`Remove ${d.name}`}
                          onClick={() => {
                            update(selection.filter((s) => s.id !== item.id));
                            setAnnouncement(`${d.name} removed.`);
                            document
                              .getElementById("your-table")
                              ?.focus({ preventScroll: true });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            )}
            {error && (
              <p id="estimate-error" className="form-error" role="alert">
                {error}
              </p>
            )}
            <div aria-live="polite" aria-atomic="true">
              {pending && <p className="status">Checking your table…</p>}
              {estimate && (
                <div className="estimate">
                  {estimate.items.map((item) => (
                    <p key={item.id}>
                      <span>
                        {item.quantity} × {item.name} · {item.size}
                      </span>
                      <span>{money(item.total)}</span>
                    </p>
                  ))}
                  <p className="estimate-total">
                    <span>Your estimate</span>
                    <strong>{money(estimate.total)}</strong>
                  </p>
                </div>
              )}
            </div>
            <button
              id="calculate"
              className="calculate-button"
              disabled={pending || !selection.length}
            >
              {pending ? "Calculating…" : "Calculate estimate"}
              <span aria-hidden="true">↗</span>
            </button>
            <p className="demo-note">
              A creative prototype. Prices and availability are examples.
              <br />
              This does not place an order.
            </p>
          </form>
        </section>
        <section className="menu-notes" aria-label="Dish ingredients">
          {dishes.map((d) => (
            <article key={d.id}>
              <p className="eyebrow">
                {d.category} ·{" "}
                {d.available ? "On our demo table" : "Coming soon"}
              </p>
              <h3>{d.name}</h3>
              <p>{d.description}</p>
              <p>{d.ingredients.join(" · ")}</p>
              <p>
                Small {money(d.prices.Small)} / Large {money(d.prices.Large)}
              </p>
            </article>
          ))}
        </section>
      </main>
      <footer>
        <span className="wordmark">manam</span>
        <p>A love letter to Filipino comfort food.</p>
        <span>Independent concept · Not an official Manam website</span>
      </footer>
      <div className="sr-only" role="status">
        {announcement}
      </div>
    </>
  );
}
