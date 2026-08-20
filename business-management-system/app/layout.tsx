import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/toast";
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
    <html lang="en">
      <body>
        <StoreProvider>
          <ToastProvider>{children}</ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
