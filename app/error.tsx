"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>A little kitchen pause.</h1>
      <p>Something went wrong loading the table.</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
