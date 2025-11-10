'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Info, Code, Heart, Github, Mail, Facebook } from 'lucide-react';

export default function InfoPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Thông tin ứng dụng</h1>
          <p className="text-muted-foreground">
            TLU Extension - Tiện ích hỗ trợ sinh viên Đại học Thủy Lợi
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Giới thiệu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Giới thiệu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                TLU Extension là một ứng dụng web được phát triển để hỗ trợ sinh viên Đại học Thủy Lợi 
                trong việc theo dõi lịch học và kết quả học tập một cách dễ dàng và tiện lợi.
              </p>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Tính năng chính:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Xem điểm chi tiết</li>
                  <li>Tính toán GPA </li>
                  <li>Tính GPA mục tiêu để đạt điểm mong muốn</li>
                  <li>Xem lịch học</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin kỹ thuật */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Công nghệ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Công nghệ sử dụng:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Framework:</strong> Next.js 16</li>
                  <li>• <strong>UI Library:</strong> React 19, Tailwind CSS</li>
                  <li>• <strong>Components:</strong> Shadcn UI</li>
                  <li>• <strong>State Management:</strong> Zustand</li>
                  <li>• <strong>Data Fetching:</strong> Axios</li>
                  <li>• <strong>Storage:</strong> IndexedDB, LocalStorage</li>
                  <li>• <strong>Công cụ hỗ trợ lập trình:</strong> CursorAI</li>

                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Lưu ý */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Lưu ý
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Server đóng cửa:</strong> Server của trường đóng sau 12h đêm, 
                  hiện tại không thể lấy dữ liệu trong khoảng thời gian này.
                </p>
                <p>
                  <strong className="text-foreground">Dữ liệu:</strong> Ứng dụng lưu trữ dữ liệu cục bộ trên máy để 
                  có thể xem lại khi không có kết nối mạng.
                </p>
                <p>
                  <strong className="text-foreground">Quyền riêng tư:</strong> Tất cả dữ liệu được lấy từ server của trường và tính toán trực tiếp trên ứng dụng này, không có dữ liệu cá nhân nào bị thu thập.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Liên hệ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Về dự án
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Dự án được phát triển với mục đích hỗ trợ sinh viên. 
                Nếu có vi phạm bản quyền / có góp ý hoặc phát hiện lỗi, vui lòng liên hệ qua các kênh sau:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Facebook className="h-4 w-4" />
                  <span>Facebook: <a target="_blank" href="https://www.facebook.com/letungduongg" className="text-primary hover:underline">fb.com/letungduongg</a></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email: letungduong1624@gmail.com</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

