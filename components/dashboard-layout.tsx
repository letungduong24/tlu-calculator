'use client';

import { useEffect, useState } from 'react';
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
import { Home, GraduationCap, Target, LogOut, LogIn, Info } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import useStudentStore from '@/store/studentStore';
import useLoginDialogStore from '@/store/loginDialogStore';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const { clearStudentData, studentData, loading: studentLoading, fetchStudentData } = useStudentStore();
  const { openLoginDialog } = useLoginDialogStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Fetch student data nếu đã đăng nhập, chưa có data và không đang loading
    if (isAuthenticated && !studentData && !studentLoading) {
      fetchStudentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated]);

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
                      className="h-12 px-4 text-base !font-bold"
                    >
                      <item.icon className="size-5" />
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
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/info')}
                isActive={pathname === '/info'}
                tooltip="Thông tin"
                className="h-12 px-4 text-base !font-bold"
              >
                <Info className="size-5" />
                <span>Thông tin</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isAuthenticated ? (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  tooltip="Đăng xuất"
                  className="h-12 px-4 text-base !font-bold"
                >
                  <LogOut className="size-5" />
                  <span>Đăng xuất</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={openLoginDialog}
                  tooltip="Đăng nhập"
                  className="h-12 px-4 text-base !font-bold"
                >
                  <LogIn className="size-5" />
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
              {pathname === '/student' && 'Thông tin sinh viên'}
              {pathname === '/grade' && 'Xem điểm'}
              {pathname === '/aim' && 'Tính GPA mục tiêu'}
              {pathname === '/info' && 'Thông tin'}
              {pathname === '/login' && 'Đăng nhập'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                {studentLoading && !studentData ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24 hidden sm:block" />
                  </div>
                ) : studentData ? (
                  <button
                    onClick={() => router.push('/student')}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                    aria-label="Xem thông tin sinh viên"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={studentData.fullName || studentData.studentName || 'Student'} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(studentData.fullName || studentData.studentName || 'S')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground hidden sm:inline-block">
                      {studentData.fullName || studentData.studentName || 'Sinh viên'}
                    </span>
                  </button>
                ) : null}
              </>
            )}
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 min-w-0 overflow-x-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

