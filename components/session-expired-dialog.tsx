'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import useSessionExpiredDialogStore from '@/store/sessionExpiredDialogStore';
import useLoginDialogStore from '@/store/loginDialogStore';

export function SessionExpiredDialog() {
  const { isOpen, closeSessionExpiredDialog } = useSessionExpiredDialogStore();
  const { openLoginDialog } = useLoginDialogStore();

  const handleClose = () => {
    closeSessionExpiredDialog();
    // Tự động mở login dialog sau khi đóng dialog thông báo
    setTimeout(() => {
      openLoginDialog();
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Phiên đăng nhập đã hết hạn</DialogTitle>
          <DialogDescription>
            Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Đăng nhập lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

