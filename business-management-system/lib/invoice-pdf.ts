"use client";

import { money, shortDate } from "./format";
import { docTotal } from "./seed";
import type { Business, Customer, Invoice, InvoiceSettings } from "./types";

const BRAND: [number, number, number] = [29, 64, 245];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];

/** Renders a branded, print-ready A4 invoice and hands it to the browser. */
export async function downloadInvoicePdf({
  invoice,
  customer,
  business,
  settings,
  amountPaid,
}: {
  invoice: Invoice;
  customer?: Customer;
  business: Business;
  settings: InvoiceSettings;
  amountPaid: number;
}) {
  const { default: JsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new JsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 44;

  // ---- header band --------------------------------------------------------
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 6, "F");

  doc.setFillColor(...BRAND);
  doc.roundedRect(M, 40, 40, 40, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(business.logoInitials, M + 20, 66, { align: "center" });

  doc.setTextColor(...INK);
  doc.setFontSize(15);
  doc.text(business.name, M + 54, 58);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    [
      business.addressLine,
      `${business.city}, ${business.state} ${business.postalCode}`,
      `${business.phone}  ·  ${business.email}`,
      business.taxId ? `GSTIN: ${business.taxId}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    M + 54,
    72,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...INK);
  doc.text("INVOICE", pageW - M, 58, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(invoice.number, pageW - M, 74, { align: "right" });

  // status pill
  const status = invoice.status.toUpperCase();
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const pillW = doc.getTextWidth(status) + 18;
  const pillColor: [number, number, number] =
    invoice.status === "Paid"
      ? [16, 122, 87]
      : invoice.status === "Overdue"
        ? [190, 42, 62]
        : invoice.status === "Partially Paid"
          ? [180, 120, 20]
          : [100, 116, 139];
  doc.setFillColor(...pillColor);
  doc.roundedRect(pageW - M - pillW, 82, pillW, 18, 9, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(status, pageW - M - pillW / 2, 94, { align: "center" });

  // ---- bill-to / dates ----------------------------------------------------
  const top = 138;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("BILL TO", M, top);
  doc.text("INVOICE DATE", pageW - M - 150, top);
  doc.text("DUE DATE", pageW - M - 60, top);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(customer?.company || customer?.name || "—", M, top + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const billLines = [
    customer?.company ? customer.name : "",
    customer?.addressLine ?? "",
    [customer?.city, customer?.state, customer?.postalCode]
      .filter(Boolean)
      .join(", "),
    customer?.country ?? "",
    customer?.email ?? "",
    customer?.phone ?? "",
  ].filter(Boolean);
  doc.text(billLines.join("\n"), M, top + 33);

  doc.setTextColor(...INK);
  doc.setFontSize(10);
  doc.text(shortDate(invoice.issueDate), pageW - M - 150, top + 18);
  doc.text(shortDate(invoice.dueDate), pageW - M - 60, top + 18);

  // ---- line items ---------------------------------------------------------
  const totals = docTotal(invoice.items, invoice.discount);
  const currency = business.currency;

  autoTable(doc, {
    startY: Math.max(top + 33 + billLines.length * 11 + 16, 232),
    head: [["Description", "Qty", "Unit price", "Disc", "Tax", "Amount"]],
    body: invoice.items.map((l) => {
      const gross = l.unitPrice * l.quantity;
      const net = gross - (gross * l.discount) / 100;
      return [
        l.name,
        String(l.quantity),
        money(l.unitPrice, currency),
        l.discount ? `${l.discount}%` : "—",
        `${l.taxRate}%`,
        money(net, currency),
      ];
    }),
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 7,
      textColor: INK,
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: MUTED,
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 44 },
      2: { halign: "right", cellWidth: 76 },
      3: { halign: "right", cellWidth: 44 },
      4: { halign: "right", cellWidth: 44 },
      5: { halign: "right", cellWidth: 84 },
    },
    margin: { left: M, right: M },
  });

  let y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 18;

  // ---- totals -------------------------------------------------------------
  const balance = Math.max(0, totals.total - amountPaid);
  const rows: [string, string, boolean][] = [
    ["Subtotal", money(totals.subtotal, currency), false],
    ...(totals.discount > 0
      ? ([["Discount", `− ${money(totals.discount, currency)}`, false]] as [
          string,
          string,
          boolean,
        ][])
      : []),
    ["Tax", money(totals.tax, currency), false],
    ["Total", money(totals.total, currency), true],
    ...(amountPaid > 0
      ? ([
          ["Amount paid", `− ${money(amountPaid, currency)}`, false],
          ["Balance due", money(balance, currency), true],
        ] as [string, string, boolean][])
      : []),
  ];

  const boxX = pageW - M - 232;
  for (const [label, value, strong] of rows) {
    if (strong) {
      doc.setDrawColor(226, 232, 240);
      doc.line(boxX, y - 6, pageW - M, y - 6);
    }
    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setFontSize(strong ? 11 : 9.5);
    doc.setTextColor(...(strong ? INK : MUTED));
    doc.text(label, boxX, y + 4);
    doc.setTextColor(...INK);
    doc.text(value, pageW - M, y + 4, { align: "right" });
    y += strong ? 22 : 17;
  }

  // ---- payment instructions & notes ---------------------------------------
  y += 10;
  if (settings.paymentInstructions) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("PAYMENT INSTRUCTIONS", M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(settings.paymentInstructions, 300), M, y + 14);
    y += 14 + doc.splitTextToSize(settings.paymentInstructions, 300).length * 12;
  }

  const noteText = invoice.notes || settings.footerMessage;
  if (noteText) {
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("NOTES", M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(noteText, 380), M, y + 14);
  }

  // ---- footer -------------------------------------------------------------
  doc.setDrawColor(226, 232, 240);
  doc.line(M, pageH - 52, pageW - M, pageH - 52);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${business.name} · ${business.website || business.email}`,
    M,
    pageH - 36,
  );
  doc.text(`${invoice.number}`, pageW - M, pageH - 36, { align: "right" });

  doc.save(`${invoice.number}.pdf`);
}
