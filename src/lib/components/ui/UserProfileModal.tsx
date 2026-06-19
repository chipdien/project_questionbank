'use client';

import React, { useTransition } from 'react';
import { LogOut, User as UserIcon, Mail, Shield } from 'lucide-react';
import { Modal } from './Modal';
import { User } from '@/lib/utils/auth.utils';
import { logoutAction } from '@/lib/actions/auth.action';
import { useConfirm } from '@/lib/components/providers/ConfirmProvider';

interface UserProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ user, isOpen, onClose }: UserProfileModalProps) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'Xác nhận đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      confirmLabel: 'Đăng xuất',
      cancelLabel: 'Quay lại',
      confirmStyle: 'error',
    });
    if (isConfirmed) {
      startTransition(async () => {
        await logoutAction();
      });
    }
  };

  if (!user) return null;

  const getRoleLabel = (rank: number | undefined | null) => {
    if (typeof rank !== 'number') return 'User';
    if (rank === 0 || rank >= 5) return 'Admin';
    if (rank === 1) return 'Teacher';
    return 'User';
  };

  const getRoleBadgeClass = (rank: number | undefined | null) => {
    if (typeof rank !== 'number') return 'bg-blue-50/80 text-blue-600 border border-blue-200/50';
    if (rank === 0 || rank >= 5) return 'bg-rose-50/80 text-rose-600 border border-rose-200/50';
    if (rank === 1) return 'bg-emerald-50/80 text-emerald-600 border border-emerald-200/50';
    return 'bg-blue-50/80 text-blue-600 border border-blue-200/50';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={null} maxWidth="xl">
      <div className="flex flex-col items-center pt-2 pb-1 text-on-surface">
        {/* Header Title */}
        <h2 className="text-base font-extrabold tracking-tight text-on-surface/90 font-headline mb-5">
          Thông tin tài khoản
        </h2>

        {/* Minimalist Avatar */}
        <div className="w-18 h-18 rounded-2xl bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant/30 shadow-xs mb-3">
          {user.avatar ? (
            <img
              alt={user.nickname || "User Avatar"}
              className="w-full h-full object-cover"
              src={user.avatar}
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-primary/10 to-primary/20 text-primary flex items-center justify-center font-bold text-2xl font-headline select-none">
              {(user.nickname || user.username || "A")[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Display name and Role Badge */}
        <div className="flex flex-col items-center gap-1.5 mb-6">
          <span className="text-base font-bold tracking-tight text-on-surface font-headline">
            {user.nickname || user.username}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getRoleBadgeClass(user.level_rank)}`}>
            {getRoleLabel(user.level_rank)}
          </span>
        </div>

        {/* User Info Fields */}
        <div className="w-full flex flex-col gap-3 bg-surface-container-low/55 border border-outline-variant/15 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
            <span className="text-xs font-semibold text-outline flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5" /> Biệt danh
            </span>
            <span className="text-xs font-bold text-on-surface-variant truncate max-w-[200px]">
              {user.nickname || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
            <span className="text-xs font-semibold text-outline flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Tên tài khoản
            </span>
            <span className="text-xs font-semibold text-on-surface-variant font-mono">
              {user.username}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-outline flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> Phân quyền
            </span>
            <span className="text-xs font-bold text-on-surface-variant">
              {getRoleLabel(user.level_rank)}
            </span>
          </div>
        </div>

        {/* Action Buttons (including logout at bottom) */}
        <div className="w-full grid grid-cols-2 gap-3 mt-1 border-t border-outline-variant/10 pt-4">
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-full py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
