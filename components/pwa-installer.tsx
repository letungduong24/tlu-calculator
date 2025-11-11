'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GoShare } from "react-icons/go";

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
      setShowIOSDialog(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallButton(false);
      }
      
      setDeferredPrompt(null);
    }
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
          {isIOS ? 'Hướng dẫn cài đặt ứng dụng' : 'Cài đặt ứng dụng'} 
        </Button>
      </div>

      {/* Dialog hướng dẫn cài đặt cho iOS */}
      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="max-w-md max-w-[calc(100vw-2rem)] sm:max-w-md">
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
              <div className="space-y-2 flex-1">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    Nhấn nút <GoShare className="h-4 w-4" /> Share
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tìm và nhấn vào nút Share ở thanh công cụ dưới cùng của Safari
                  </p>
                </div>
                <img 
                  src="/share.png" 
                  alt="Nút Share trên iOS Safari" 
                  className="w-full max-w-xs mx-auto rounded-lg border border-border"
                />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                2
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Chọn "Thêm vào Màn hình chính"</p>
                <p className="text-sm text-muted-foreground">
                  Tìm và nhấn nút "Thêm vào Màn hình chính" trong menu
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

