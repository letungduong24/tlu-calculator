'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSDialog, setShowIOSDialog] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    
    if (standalone) {
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    // iOS doesn't support beforeinstallprompt, so show instructions
    if (iOS) {
      setShowInstallButton(true);
      return;
    }

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show instructions dialog for iOS
      setShowIOSDialog(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showInstallButton || isStandalone) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleInstallClick}
          className="shadow-lg"
        >
          {isIOS ? 'Hướng dẫn cài đặt' : 'Cài đặt ứng dụng'}
        </Button>
      </div>

      {/* Dialog hướng dẫn cài đặt cho iOS */}
      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hướng dẫn cài đặt ứng dụng</DialogTitle>
            <DialogDescription>
              Để thêm ứng dụng vào màn hình chính trên iOS
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                1
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Nhấn nút Share</p>
                <p className="text-sm text-muted-foreground">
                  Tìm và nhấn vào nút Share (hình vuông với mũi tên lên) ở thanh công cụ dưới cùng của Safari
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                2
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Chọn "Thêm vào Màn hình chính"</p>
                <p className="text-sm text-muted-foreground">
                  Cuộn xuống trong menu Share và chọn tùy chọn "Thêm vào Màn hình chính"
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                3
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Xác nhận</p>
                <p className="text-sm text-muted-foreground">
                  Nhấn "Thêm" ở góc trên bên phải để hoàn tất
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowIOSDialog(false)}>
              Đã hiểu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

