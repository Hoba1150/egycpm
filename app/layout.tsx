import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import NavigationProgress from "@/components/shared/NavigationProgress";
import InAppNotificationToast from "@/components/shared/InAppNotificationToast";

export const metadata: Metadata = {
  title: "EGY CPM | متجر كار باركينج الاحترافي لخدمات وتعديل السيارات",
  description:
    "المتجر الأول لبيع وتعديل سيارات لعبة Car Parking Multiplayer، شحن كاش وأموال خضراء 50M، كوينز ذهبي، كينج رانك، وحسابات جاهزة بتسليم فوري وأمان 100%.",
  keywords: [
    "EGY CPM",
    "كار باركينج",
    "شحن كار باركينج",
    "سيارات كار باركينج معدلة",
    "كينج رانك",
    "شحن كاش 50M",
  ],
  openGraph: {
    title: "EGY CPM | متجر كار باركينج الاحترافي",
    description:
      "ورشة تعديل سيارات وخدمات Car Parking Multiplayer مع تسليم فوري وضمان ضد الباند.",
    type: "website",
    locale: "ar_EG",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="min-h-screen bg-[#08090d] bg-drift-texture text-[#f3f4f6] antialiased selection:bg-orange-500 selection:text-black">
        <ThemeProvider>
          <NavigationProgress />
          <InAppNotificationToast />
          {children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: {
                background: "#0f1218",
                color: "#f3f4f6",
                borderColor: "#1e2430",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
