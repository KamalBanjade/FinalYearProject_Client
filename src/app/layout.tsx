import type { Metadata } from "next";
import { Geist, Geist_Mono, Mukta, Yatra_One, Amita, Tiro_Devanagari_Hindi, Gotu } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider, ThemeScript } from "@/components/theme/ThemeProvider";
import { ConfirmProvider } from "@/context/ConfirmContext";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const mukta = Mukta({ variable: "--font-mukta", subsets: ["devanagari", "latin"], weight: ["200", "300", "400", "500", "600", "700", "800"] });
const yatraOne = Yatra_One({ variable: "--font-yatra", subsets: ["devanagari", "latin"], weight: ["400"] });
const amita = Amita({ variable: "--font-amita", subsets: ["devanagari", "latin"], weight: ["400", "700"] });
const tiro = Tiro_Devanagari_Hindi({ variable: "--font-tiro", subsets: ["devanagari", "latin"], weight: ["400"], style: ["normal", "italic"] });
const gotu = Gotu({ variable: "--font-gotu", subsets: ["devanagari", "latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "Sajilo स्वास्थ्य",
  description: "Next-generation secure medical record management with QR-based identification.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevents white flash on dark-mode page load */}
        <ThemeScript />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${mukta.variable} ${yatraOne.variable} ${amita.variable} ${tiro.variable} ${gotu.variable} antialiased`}>
        <ThemeProvider>
          <ConfirmProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'react-hot-toast',
                style: {
                  background: 'var(--surface)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--secondary)',
                    secondary: 'white',
                  },
                },
              }}
            />
            {children}
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
