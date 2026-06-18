'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { RequestType, RequestStatus } from '@/actions/question-request';
import { useQuestionRequestsQuery } from '../queries/useQuestionRequestsQuery';
import { useCancelRequestMutation } from '../queries/useRequestMutation';

interface UseRequestsManagerProps {
  pageSize?: number;
}

export function useRequestsManager({
  pageSize = 30,
}: UseRequestsManagerProps = {}) {
  const cancelMutation = useCancelRequestMutation();
  const [types, setTypes] = useState<RequestType[]>([]);
  const [statuses, setStatuses] = useState<RequestStatus[]>([]);
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState<any | null>(null);

  // Fetch using custom Query hook
  const { data: queryResult, isLoading: loading } = useQuestionRequestsQuery({
    types,
    statuses,
    page,
    pageSize,
  });

  const data = queryResult?.data || [];
  const total = queryResult?.total || 0;
  const totalPages = queryResult?.totalPages || 0;

  const toggleType = useCallback((v: RequestType) => {
    setTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    setPage(1);
  }, []);

  const toggleStatus = useCallback((v: RequestStatus) => {
    setStatuses(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    setPage(1);
  }, []);

  const onCancel = useCallback(async (id: number) => {
    try {
      await cancelMutation.mutateAsync(id);
      toast.success('Đã hủy.');
    } catch (err: any) {
      toast.error(err.message || 'Thất bại.');
    }
  }, [cancelMutation]);

  return {
    state: {
      types,
      statuses,
      page,
      reviewing,
      data,
      total,
      totalPages,
      loading,
    },
    actions: {
      setPage,
      setReviewing,
      toggleType,
      toggleStatus,
      onCancel,
    }
  };
}
