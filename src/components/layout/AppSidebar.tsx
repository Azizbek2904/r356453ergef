import {
    Users, FileText, UserPlus, DollarSign, FileBox, Phone, LogOut, LayoutDashboard, UserCog, Wallet, TrendingUp,
    LayoutList
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Employees", url: "/dashboard/employees", icon: Users },
  { title: "Leads", url: "/dashboard/leads", icon: UserPlus },
  { title: "Lead Assign", url: "/dashboard/lead-assign", icon: UserCog },
  { title: "Clients", url: "/dashboard/clients", icon: FileText },
  { title: "Main Payment", url: "/dashboard/main-payment", icon: Wallet },
  { title: "Finance", url: "/dashboard/finance", icon: DollarSign },
  { title: "Performance", url: "/dashboard/performance", icon: TrendingUp },
  { title: "Documents", url: "/dashboard/documents", icon: FileBox },
  { title: "Reception", url: "/dashboard/reception", icon: Phone },
    { title: "Kanban Board", url: "/dashboard/kanban", icon: LayoutList },

];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-6">
          <h1 className={`font-bold text-xl text-sidebar-foreground ${collapsed ? "hidden" : "block"}`}>
            CRM Admin
          </h1>
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold">C</span>
            </div>
          )}
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-5 w-5 mr-3" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
