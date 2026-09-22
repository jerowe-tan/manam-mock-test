import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Manam · Through the table",
  description:
    "A playful 3D love letter to Filipino comfort food. Come hungry, stay a little.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
