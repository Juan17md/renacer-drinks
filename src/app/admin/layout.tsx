import { AdminShell } from "@/components/admin/AdminShell";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Panel Admin | Renacer Drinks & Coffe",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LayoutAdmin({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-panel">
      <AdminShell>{children}</AdminShell>
      <Toaster position="top-center" />
    </div>
  );
}