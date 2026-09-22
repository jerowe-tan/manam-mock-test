import "server-only";
import { catalog } from "@/lib/catalog";
import Experience from "@/components/Experience";
export default function Page() {
  const dishes =
    process.env.NODE_ENV === "development" && process.env.DEMO_EMPTY === "1"
      ? []
      : catalog;
  return <Experience dishes={dishes} />;
}
