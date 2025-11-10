import { create } from 'zustand';

interface LoginDialogState {
  isOpen: boolean;
  openLoginDialog: () => void;
  closeLoginDialog: () => void;
}

const useLoginDialogStore = create<LoginDialogState>((set) => ({
  isOpen: false,
  openLoginDialog: () => set({ isOpen: true }),
  closeLoginDialog: () => set({ isOpen: false }),
}));

export default useLoginDialogStore;

