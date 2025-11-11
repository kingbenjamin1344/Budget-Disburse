import "./globals.css";
import ClientLayout from "../components/ClientLayout";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
