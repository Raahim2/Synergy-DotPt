import Navbar from "@/components/dashboard/navbar";
import Sidebar from "@/components/dashboard/sidebar"; 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 ">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="ml-64 w-full p-4 mt-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}