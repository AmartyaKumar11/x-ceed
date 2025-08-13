
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./fonts.css";
import "./no-scroll.css";
import "./cursor.css";
import "./sidebar.css";
import "./animations.css";
import "./jobs.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Web3Provider } from "@/providers/Web3Provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "X-CEED",
  description: "X-CEED - Login or Register",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Provider>
            {children}
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
