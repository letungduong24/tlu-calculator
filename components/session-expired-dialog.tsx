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

export function SessionExpiredDialog() {
  const { isOpen, closeSessionExpiredDialog } = useSessionExpiredDialogStore();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        closeSessionExpiredDialog();
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
          <Button onClick={closeSessionExpiredDialog} className="w-full sm:w-auto">
            Đã hiểu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

