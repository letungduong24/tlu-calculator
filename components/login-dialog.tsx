'use client';

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import useLoginDialogStore from '@/store/loginDialogStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function LoginDialog() {
  const { isAuthenticated, loading, error, login } = useAuthStore();
  const { isOpen, closeLoginDialog } = useLoginDialogStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Đóng dialog khi đăng nhập thành công
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      closeLoginDialog();
      setUsername('');
      setPassword('');
    }
  }, [isAuthenticated, isOpen, closeLoginDialog]);

  // Reset form khi dialog đóng
  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setPassword('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      // Dialog sẽ tự đóng khi isAuthenticated thay đổi
    } catch (err) {
      // Error đã được xử lý trong store
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        closeLoginDialog();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đăng nhập</DialogTitle>
          <DialogDescription>
            Nhập thông tin đăng nhập của bạn để tiếp tục
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-username">
              Tên đăng nhập
            </Label>
            <Input
              id="dialog-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nhập tên đăng nhập"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-password">
              Mật khẩu
            </Label>
            <Input
              id="dialog-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
              disabled={loading}
            />
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

