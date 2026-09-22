import { calculateEstimate } from "@/lib/catalog";
export async function POST(request: Request) {
  const fail = (message: string, status: number) =>
    Response.json({ error: { message } }, { status });
  if (process.env.NODE_ENV === "development") {
    if (process.env.DEMO_DELAY === "1")
      await new Promise((resolve) => setTimeout(resolve, 1800));
    if (process.env.DEMO_ERROR === "1")
      return fail("Kitchen is taking a moment. Please try again.", 503);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Request must contain valid JSON.", 400);
  }
  try {
    return Response.json(calculateEstimate(body));
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Invalid selection.",
      422,
    );
  }
}
