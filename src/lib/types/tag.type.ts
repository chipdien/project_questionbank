export interface Tag {
  id: string;
  name: string;
  category: string;
  color_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TagFormData {
  name: string;
  category: string;
  color_code?: string | null;
}

export interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null;
  onSave: (data: TagFormData) => Promise<void>;
  onDelete?: (tag: Tag) => Promise<void>;
}
