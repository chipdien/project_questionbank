import { Pencil, Tags, Flag, type LucideIcon } from 'lucide-react';
import type { RequestType, RequestStatus } from '@/lib/actions/question-request.action';

/**
 * Nguồn duy nhất cho nhãn / màu sắc / icon của yêu cầu câu hỏi.
 * Dùng chung cho mọi nơi hiển thị loại (EDIT/CLASSIFY/REPORT) và trạng thái,
 * để màu sắc đồng bộ và dễ nhận biết.
 */

export interface RequestTypeMeta {
  /** Nhãn đầy đủ (dùng cho tiêu đề modal). */
  label: string;
  /** Nhãn ngắn (dùng cho badge trong bảng). */
  short: string;
  icon: LucideIcon;
  /** Class cho badge/tag (nền + chữ). */
  badge: string;
  /** Class chữ/icon đơn sắc (khi đặt trên nền trắng). */
  text: string;
}

export const REQUEST_TYPE_META: Record<RequestType, RequestTypeMeta> = {
  EDIT: {
    label: 'Đề xuất sửa nội dung',
    short: 'Đề xuất sửa',
    icon: Pencil,
    badge: 'bg-blue-100 text-blue-700',
    text: 'text-blue-600',
  },
  CLASSIFY: {
    label: 'Đề xuất phân loại',
    short: 'Phân loại',
    icon: Tags,
    badge: 'bg-violet-100 text-violet-700',
    text: 'text-violet-600',
  },
  REPORT: {
    label: 'Báo lỗi câu hỏi',
    short: 'Báo lỗi',
    icon: Flag,
    badge: 'bg-rose-100 text-rose-700',
    text: 'text-rose-600',
  },
};

export interface RequestStatusMeta {
  label: string;
  /** Class cho badge dạng pill (nền + chữ). */
  badge: string;
}

export const REQUEST_STATUS_META: Record<RequestStatus, RequestStatusMeta> = {
  PENDING: { label: 'Chờ duyệt', badge: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Đã duyệt', badge: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Từ chối', badge: 'bg-rose-100 text-rose-700' },
  CANCELLED: { label: 'Đã hủy', badge: 'bg-slate-100 text-slate-600' },
};

export const REQUEST_TYPES: RequestType[] = ['EDIT', 'CLASSIFY', 'REPORT'];
export const REQUEST_STATUSES: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

/** Helper an toàn: trả về meta loại yêu cầu, fallback khi không khớp. */
export function typeMeta(type: string): RequestTypeMeta {
  return REQUEST_TYPE_META[type as RequestType] ?? {
    label: type, short: type, icon: Flag, badge: 'bg-primary/10 text-primary', text: 'text-primary',
  };
}

/** Helper an toàn: trả về meta trạng thái, fallback về PENDING. */
export function statusMeta(status: string): RequestStatusMeta {
  return REQUEST_STATUS_META[status as RequestStatus] ?? REQUEST_STATUS_META.PENDING;
}
