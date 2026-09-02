import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Line Watch Melbourne",
  description: "Personal reminders for Melbourne train line disruptions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
