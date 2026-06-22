'use client';

import { useCallback, useEffect, useState } from 'react';

export interface SavedDocument {
  id: string;
  title: string;
  created_at: string;
  pdf_url: string;
  created_by_name?: string | null;
}

export interface UseSavedDocumentsLibraryReturn {
  documents: SavedDocument[];
  isLoading: boolean;
  searchTerm: string;
  filteredDocs: SavedDocument[];
  setSearchTerm: (v: string) => void;
  refetch: () => void;
  isAdmin: boolean;
}

export function useSavedDocumentsLibrary(): UseSavedDocumentsLibraryReturn {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Lấy vai trò của user hiện tại
  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setIsAdmin(data.user.level_rank !== null && data.user.level_rank >= 5);
          }
        }
      } catch (err) {
        console.error('[useSavedDocumentsLibrary] Error fetching user role:', err);
      }
    }
    checkRole();
  }, []);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/documentcustom/list');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('[useSavedDocumentsLibrary] Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    documents,
    isLoading,
    searchTerm,
    filteredDocs,
    setSearchTerm,
    refetch: fetchDocuments,
    isAdmin,
  };
}
