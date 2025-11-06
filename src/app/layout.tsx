import "./globals.css";
import ClientLayout from "../components/ClientLayout";

export const metadata = {
  title: "Budget and Disbursement Management System",
  description: "LGU Magallanes Budget Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
