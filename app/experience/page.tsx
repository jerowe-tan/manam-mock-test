import "server-only";
import { catalog } from "@/lib/catalog";
import Experience from "@/components/Experience";
import { money } from "@/lib/types";
export default function Page() {
  const dishes =
    process.env.NODE_ENV === "development" && process.env.DEMO_EMPTY === "1"
      ? []
      : catalog;
  const simulateWebGLFailure =
    process.env.NODE_ENV === "development" &&
    process.env.DEMO_WEBGL_FAILURE === "1";
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
          <a href="#your-table">Your table</a>
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
        <Experience
          dishes={dishes}
          simulateWebGLFailure={simulateWebGLFailure}
          hero={
            <div key="hero-copy" className="hero-copy">
              <h1 id="journey-title">
                A table full
                <br />
                of <em>stories.</em>
              </h1>
            </div>
          }
          tableIntro={
            <div key="table-intro" className="table-intro">
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
          }
        />
        <section
          className="menu-notes"
          id="menu-cards"
          aria-label="Dish ingredients"
        >
          {dishes.map((d) => (
            <article key={d.id}>
              <img
                className="menu-photo"
                src={d.photo}
                alt={d.name}
                width={600}
                height={600}
                loading="lazy"
              />
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
        <a
          href="https://manam.momentfood.com/"
          target="_blank"
          rel="noreferrer"
        >
          Food photography: Manam / The Moment Group
        </a>
        <span>Independent concept · Not an official Manam website</span>
      </footer>
    </>
  );
}
