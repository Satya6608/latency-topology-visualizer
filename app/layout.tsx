import "./globals.css";
import Providers from "./components/Providers";

export const metadata = {
  title: "Latency Topology Visualizer",
  description: "Real-time exchange-to-region latency visualization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
