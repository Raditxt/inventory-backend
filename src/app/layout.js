export const metadata = {
  title: "Inventory API",
  description: "REST API untuk sistem inventaris",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}