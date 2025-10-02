import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/sidebar/dashboard-sidebar";
import { DashboardNavbar } from "@/modules/dashboard/ui/components/sidebar/dashboard-navbar";
interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div>
      <SidebarProvider>
        <DashboardSidebar />
        <main className="flex flex-col min-h-screen w-screen bg-background">
          <DashboardNavbar />
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
};

export default Layout;
