import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/toast";
import { THEME_SCRIPT } from "@/components/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BizFlow — Run your entire business in one place",
    template: "%s · BizFlow",
  },
  description:
    "BizFlow is a business management and CRM platform for small and medium businesses: customers, products, orders, invoices, payments, expenses and analytics in one dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint to avoid a light flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <StoreProvider>
          <ToastProvider>{children}</ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
