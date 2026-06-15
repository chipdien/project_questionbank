import axios from 'axios';

export interface Topic {
  id: string;
  title: string | null;
  code: string | null;
  content: string | null;
  parent_id: string | null;
  path: string | null;
  order_index: string | null;
  subject_id: string | null;
  syllabus_id: string | null;
  type: string | null;
  created_at?: string;
  updated_at?: string;
  _count?: {
    questions: number;
  };
}

export interface RelatedData {
  topic_id: string;
  title: string | null;
  subtopics_count: number;
  subtopics: Topic[];
  questions_count: number;
  questions: {
    id: string;
    code: string | null;
    statement: string | null;
  }[];
}

export const topicsService = {
  async fetchTopics(): Promise<Topic[]> {
    const response = await axios.get('/api/topics');
    return response.data;
  },

  async createTopic(data: Partial<Topic>): Promise<Topic> {
    const response = await axios.post('/api/topics', data);
    return response.data;
  },

  async updateTopic(id: string, data: Partial<Topic>): Promise<Topic> {
    const response = await axios.patch(`/api/topics/${id}`, data);
    return response.data;
  },

  async deleteTopic(id: string): Promise<any> {
    const response = await axios.delete(`/api/topics/${id}`);
    return response.data;
  },

  async fetchRelated(id: string): Promise<RelatedData> {
    const response = await axios.get(`/api/topics/${id}/related`);
    return response.data;
  },

  async transferQuestions(
    id: string,
    data: { target_topic_id: string; include_subtopics: boolean }
  ): Promise<any> {
    const response = await axios.post(`/api/topics/${id}/transfer`, data);
    return response.data;
  },

  async bulkMoveTopics(
    topicIds: string[],
    targetParentId: string | null
  ): Promise<any> {
    const response = await axios.post('/api/topics/bulk-move', {
      topic_ids: topicIds,
      target_parent_id: targetParentId
    });
    return response.data;
  },

  async bulkDeleteTopics(topicIds: string[]): Promise<any> {
    const response = await axios.post('/api/topics/bulk-delete', {
      topic_ids: topicIds
    });
    return response.data;
  }
};
