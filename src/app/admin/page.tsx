import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getResources } from "@/lib/resources";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
  const resources = getResources();
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <AdminDashboard initialResources={resources} />
    </div>
  );
}
