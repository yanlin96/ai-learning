import type { Metadata } from "next";
import { AppBanner } from "@/app/app-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Line Watch Melbourne",
  description: "Personal reminders for Melbourne train line disruptions.",
  other: {
    "apple-itunes-app":
      "app-id=6752239608, affiliate-data=pt=2158661&ct=mobile_app_launch_promotion_cpa_landing_page_website&mt=8",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppBanner />
        {children}
      </body>
    </html>
  );
}
