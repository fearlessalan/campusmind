import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusMind — Compagnon académique IA",
  description:
    "CampusMind — Plateforme d'apprentissage IA qui transforme vos documents académiques en parcours d'étude personnalisés.",
  icons: {
    icon: "/campusmindlogo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Flex:opsz,wght@8..144,400;8..144,500;8..144,700&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-title" content="CampusMind" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
