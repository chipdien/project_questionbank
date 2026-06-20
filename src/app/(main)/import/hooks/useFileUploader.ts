import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';

import { UseFileUploaderProps } from '@/lib/types/import.type';

export function useFileUploader({
  files,
  onFilesChange,
  recentDocuments,
  isProcessing,
  currentUserId,
  isAdmin,
}: UseFileUploaderProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'pdf' | 'docx' | 'image'>('all');

  // Filter documents by selected file extension type and owner (mine for teacher, all for admin)
  const filteredDocuments = useMemo(() => {
    return recentDocuments.filter((doc) => {
      // If not admin (teacher), only display documents uploaded by themselves
      if (!isAdmin) {
        const isOwner = Number(doc.created_by_id) === Number(currentUserId);
        if (!isOwner) return false;
      }

      const docTitle = (doc.title || '').toLowerCase();

      // Match Document Type Category
      if (selectedType === 'all') return true;
      if (selectedType === 'pdf') return docTitle.endsWith('.pdf');
      if (selectedType === 'docx') return docTitle.endsWith('.docx');
      if (selectedType === 'image') {
        return !docTitle.endsWith('.pdf') && !docTitle.endsWith('.docx');
      }
      return true;
    });
  }, [recentDocuments, selectedType, currentUserId, isAdmin]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const firstFile = acceptedFiles[0];
        const isDoc =
          firstFile.type === 'application/pdf' ||
          firstFile.name.endsWith('.pdf') ||
          firstFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          firstFile.name.endsWith('.docx');

        if (isDoc) {
          // Chỉ cho phép 1 file PDF hoặc DOCX
          onFilesChange([firstFile]);
        } else {
          // Lọc ra các file ảnh
          const imageFiles = acceptedFiles.filter(
            (file) =>
              file.type.startsWith('image/') ||
              /\.(jpg|jpeg|png|webp)$/i.test(file.name)
          );

          if (imageFiles.length > 0) {
            // Cho phép gom chung với ảnh hiện tại
            const existingImages = files.filter(
              (f) => !(f.type === 'application/pdf' || f.name.endsWith('.pdf') || f.name.endsWith('.docx'))
            );
            onFilesChange([...existingImages, ...imageFiles]);
          }
        }
      }
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    onFilesChange([]);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 15 * 1024 * 1024, // 15MB
    disabled: isProcessing,
  });

  return {
    selectedType,
    setSelectedType,
    filteredDocuments,
    removeFile,
    clearAllFiles,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  };
}
