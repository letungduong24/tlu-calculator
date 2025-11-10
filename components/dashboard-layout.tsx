'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Home, GraduationCap, Target, LogOut, LogIn } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import useStudentStore from '@/store/studentStore';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const { clearStudentData } = useStudentStore();

  const handleLogout = () => {
    clearStudentData();
    logout();
  };

  const menuItems = isAuthenticated
    ? [
        {
          title: 'Trang chủ',
          url: '/',
          icon: Home,
          active: pathname === '/',
        },
        {
          title: 'Xem điểm',
          url: '/grade',
          icon: GraduationCap,
          active: pathname === '/grade',
        },
        {
          title: 'Tính GPA mục tiêu',
          url: '/aim',
          icon: Target,
          active: pathname === '/aim',
        },
      ]
    : [
        {
          title: 'Trang chủ',
          url: '/',
          icon: Home,
          active: pathname === '/',
        },
      ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-sidebar-foreground">
                TLU Extension
              </span>
              <span className="text-sm text-sidebar-foreground/70">
                Tiện ích sinh viên
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.url)}
                      isActive={item.active}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {isAuthenticated ? (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  tooltip="Đăng xuất"
                >
                  <LogOut />
                  <span>Đăng xuất</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push('/login')}
                  tooltip="Đăng nhập"
                >
                  <LogIn />
                  <span>Đăng nhập</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">
              {pathname === '/' && 'Trang chủ'}
              {pathname === '/grade' && 'Xem điểm'}
              {pathname === '/aim' && 'Tính GPA mục tiêu'}
              {pathname === '/login' && 'Đăng nhập'}
            </h1>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

