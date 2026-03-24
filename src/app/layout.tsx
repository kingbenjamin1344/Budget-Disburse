import "./globals.css";
import ClientLayout from "../components/ClientLayout";
import { seedAdminUser } from "@/lib/seed-admin";

export const metadata = {
  title: "Budget and Disbursement",
  description: "LGU Magallanes Budget Management",
  icons: {
    // Put your preferred favicon file at `public/favicon.ico` or change the path below
    icon: '/favicon.ico',
    // Optional: include PNG/Apple touch icon variants if you have them
    apple: '/apple-touch-icon.png',
  },
};

// Seed the admin user from environment variables on first startup.
// This runs server-side during the initial render of the root layout.
await seedAdminUser();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
