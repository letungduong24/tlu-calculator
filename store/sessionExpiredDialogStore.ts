import { create } from 'zustand';

interface SessionExpiredDialogState {
  isOpen: boolean;
  openSessionExpiredDialog: () => void;
  closeSessionExpiredDialog: () => void;
}

const useSessionExpiredDialogStore = create<SessionExpiredDialogState>((set) => ({
  isOpen: false,
  openSessionExpiredDialog: () => set({ isOpen: true }),
  closeSessionExpiredDialog: () => set({ isOpen: false }),
}));

export default useSessionExpiredDialogStore;

