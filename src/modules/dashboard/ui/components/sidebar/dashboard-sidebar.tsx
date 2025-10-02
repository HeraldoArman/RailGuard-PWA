"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarMenu,
  SidebarFooter,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { GraduationCap, OctagonAlert, Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { DashboardUserButton } from "./dashboard-user-button";
const Section = [
  {
    icon: OctagonAlert,
    label: "Peringatan",
    href: "/dashboard/peringatan",
  },
  {
    icon: Bell,
    label: "Notifikasi",
    href: "/dashboard/notifikasi",
  },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-foreground">
        <Link href={"/dashboard"} className="flex items-center gap-2 px-2 pt-2">
          <div className="flex gap-4 items-center justify-center">
            <Image src="/logo.svg" height={32} width={32} alt="RailGuard" />
            <p className="text-2xl font-bold">RailGuard</p>
          </div>
        </Link>
      </SidebarHeader>
      <div className="px-4 py-2">
        <Separator className="bg-sidebar-border/70" />
      </div>
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {Section.map((item) => {
                const active = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "h-10 border transition-colors duration-200 rounded-md",
                        "bg-transparent border-transparent hover:bg-sidebar-accent/30 hover:text-sidebar-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                        active &&
                          "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-sm"
                      )}
                      isActive={active}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-5" />
                        <span className="text-sm font-medium tracking-tight">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border/60">
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
};
