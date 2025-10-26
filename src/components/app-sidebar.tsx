import React from "react";
import { Gavel, LayoutDashboard, Settings, Users, Vote, History, Building } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth.store";
const menuItems = [
  { href: "/app", icon: LayoutDashboard, label: "Dashboard", adminOnly: false, superAdminOnly: false },
  { href: "/app/assemblies", icon: Gavel, label: "Assemblies", adminOnly: false, superAdminOnly: false },
  { href: "/app/users", icon: Users, label: "Users", adminOnly: true, superAdminOnly: false },
  { href: "/app/audit-logs", icon: History, label: "Audit Log", adminOnly: true, superAdminOnly: false },
  { href: "/app/settings", icon: Settings, label: "Settings", adminOnly: true, superAdminOnly: false },
  { href: "/app/superadmin/tenants", icon: Building, label: "Tenant Management", adminOnly: false, superAdminOnly: true },
];
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const pathname = location.pathname;
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'Admin';
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const visibleMenuItems = menuItems.filter(item => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (item.adminOnly) return isAdmin || isSuperAdmin;
    return true;
  });
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white">
            <Vote className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">AgoraEdge</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href))}
              >
                <Link to={item.href}>
                  <item.icon className="h-5 w-5" /> <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}