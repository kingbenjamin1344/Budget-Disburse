
import "./globals.css";
import DashboardLayout from "../components/DashboardLayout";

export const metadata = {
  title: "Budget and Disbursement Management System",
  description: "LGU Magallanes Budget Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
