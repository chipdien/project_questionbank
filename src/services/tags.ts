import axios from 'axios';

export interface Tag {
  id: string;
  name: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export const tagsService = {
  async fetchTags(params?: { category?: string }): Promise<Tag[]> {
    const response = await axios.get('/api/tags', { params });
    return response.data;
  },

  async createTag(data: { name: string; category: string }): Promise<Tag> {
    const response = await axios.post('/api/tags', data);
    return response.data;
  },

  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const response = await axios.patch(`/api/tags/${id}`, data);
    return response.data;
  },

  async deleteTag(id: string): Promise<any> {
    const response = await axios.delete(`/api/tags/${id}`);
    return response.data;
  }
};
