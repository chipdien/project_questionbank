'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import AppSelect from '@/lib/components/ui/AppSelect';
import TopicTreeSelect from '@/lib/components/ui/topic-tree-select';
import VditorEditor from '@/lib/components/ui/VditorEditor';
import { cleanMathDelimiters } from '@/lib/components/common/hooks/useQuestionEditModal';
import { createQuestionRequest, RequestType, ClassifySuggest } from '@/lib/actions/question-request.action';
import { typeMeta } from '@/lib/constants/requests.constant';

interface Tag { id: number; name: string; category: string }

interface Props {
  question: any;
  mode: RequestType;
  tagsByCategory: Record<string, Tag[]>;
  onClose: () => void;
  onSubmitted: () => void;
}

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function RequestSubmitModal({ question, mode, tagsByCategory, onClose, onSubmitted }: Props) {
  const [reason, setReason] = useState('');
  const [editContent, setEditContent] = useState(cleanMathDelimiters(question?.statement || ''));
  const [reportDesc, setReportDesc] = useState('');
  const [reportSuggest, setReportSuggest] = useState('');
  const [grade, setGrade] = useState<number | null>(question?.grade ? Number(question.grade) : null);
  const [topicIds, setTopicIds] = useState<number[]>((question?.topics || []).map((t: any) => t.topic_id));
  const [tagIds, setTagIds] = useState<number[]>((question?.tags || []).map((t: any) => t.id));
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (id: number) => setTagIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const submit = async () => {
    setSubmitting(true);
    let payload: { content?: string; contentSuggest?: ClassifySuggest | string };
    if (mode === 'EDIT') {
      payload = { content: reason, contentSuggest: editContent };
    } else if (mode === 'CLASSIFY') {
      payload = { content: reason, contentSuggest: { grade, topicIds, tagIds } };
    } else {
      payload = { content: `Mô tả lỗi: ${reportDesc}\n\nGợi ý: ${reportSuggest}` };
    }
    const res = await createQuestionRequest({ questionId: Number(question.id), type: mode, ...payload });
    setSubmitting(false);
    if (res.success) {
      toast.success('Đã gửi yêu cầu.');
      onSubmitted();
      onClose();
    } else {
      toast.error(res.error || 'Gửi thất bại.');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-7xl bg-surface-container-lowest rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-on-surface font-headline">
            {(() => { const tm = typeMeta(mode); const TIcon = tm.icon; return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${tm.badge}`}><TIcon className="w-4 h-4" /></span>; })()}
            {typeMeta(mode).label} (Q-{question.id})
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {mode === 'EDIT' && (
            <>
              <label className="text-xs font-bold uppercase text-outline">Nội dung đề xuất mới (soạn thảo, hỗ trợ công thức toán)</label>
              <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
                <VditorEditor value={editContent} onChange={setEditContent} mode="ir" isStickyToolbar={false} placeholder="Nhập nội dung đề xuất..." />
              </div>
              <label className="text-xs font-bold uppercase text-outline">Lý do</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
            </>
          )}

          {mode === 'CLASSIFY' && (
            <>
              <label className="text-xs font-bold uppercase text-outline">Khối lớp</label>
              <div className="w-[160px]">
                <AppSelect value={grade ?? ''} onChange={e => setGrade(e.target.value ? Number(e.target.value) : null)} placeholder="Khối lớp">
                  <option value="">— Chọn —</option>
                  {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
                </AppSelect>
              </div>
              <label className="text-xs font-bold uppercase text-outline">Chủ đề</label>
              <TopicTreeSelect multiple value={topicIds.map(String)} onChange={v => setTopicIds(Array.isArray(v) ? v.map(Number) : [])} placeholder="Chọn chủ đề..." />
              <label className="text-xs font-bold uppercase text-outline">Tags</label>
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto">
                {Object.entries(tagsByCategory).filter(([, l]) => l.length > 0).map(([cat, list]) => (
                  <div key={cat} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase text-outline">{cat}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map(tag => (
                        <button key={tag.id} onClick={() => toggleTag(tag.id)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${tagIds.includes(tag.id) ? 'bg-primary/10 border-primary/40 text-primary' : 'border-outline-variant/30 text-on-surface-variant'}`}>
                          #{tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <label className="text-xs font-bold uppercase text-outline">Ghi chú</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
            </>
          )}

          {mode === 'REPORT' && (
            <>
              <label className="text-xs font-bold uppercase text-outline">Mô tả lỗi</label>
              <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} rows={4}
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
              <label className="text-xs font-bold uppercase text-outline">Gợi ý sửa</label>
              <textarea value={reportSuggest} onChange={e => setReportSuggest(e.target.value)} rows={3}
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface text-sm" />
            </>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant/20 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-surface-container-low">Hủy</button>
          <button onClick={submit} disabled={submitting}
            className="px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50">
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  );
}
