'use server';

import { prisma } from '@/lib/db';

export interface DocumentItem {
  id: number;
  title: string;
  created_at: string;
  is_ai_classified: number;
  public: string | null;
  link_s3: string | null;
  creator_name: string;
}

export interface GradeItem {
  label: string;
  count: number;
  rawGrade: number;
}

export interface DistributionItem {
  label: string;
  count: number;
}

export interface DashboardStatsResult {
  stats: {
    questions: number;
    documents: number;
    collections: number;
    topics: number;
  };
  recentDocuments: DocumentItem[];
  gradesData: GradeItem[];
  difficultiesData: DistributionItem[];
  typesData: DistributionItem[];
}

/**
 * Lấy toàn bộ thông tin thống kê phục vụ cho trang Dashboard.
 * Tách biệt hoàn toàn phần truy vấn/map logic khỏi phần giao diện UI.
 */
export async function getDashboardStats(): Promise<DashboardStatsResult | null> {
  try {
    // Truy vấn song song tối ưu hóa hiệu năng
    const [
      questionCount,
      documentCount,
      collectionCount,
      topicCount,
      recentDocsRaw,
      gradesGroupBy,
      difficultiesGroupBy,
      typesGroupBy
    ] = await Promise.all([
      prisma.lms_questions.count(),
      prisma.lms_documents.count(),
      prisma.lms_collections.count(),
      prisma.lms_topics.count(),
      prisma.lms_documents.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      prisma.lms_questions.groupBy({
        by: ['grade'],
        _count: { id: true },
      }),
      prisma.lms_questions.groupBy({
        by: ['question_difficulty'],
        _count: { id: true },
      }),
      prisma.lms_questions.groupBy({
        by: ['question_type'],
        _count: { id: true },
      })
    ]);

    // Lấy thông tin người tạo cho các tài liệu gần đây
    const userIds = recentDocsRaw
      .map(d => d.created_by_id)
      .filter((id): id is bigint => id !== null);

    const users = await prisma.lms_users.findMany({
      where: { id: { in: userIds.map(id => Number(id)) } },
      select: { id: true, username: true, nickname: true },
    });

    const userMap = new Map(users.map(u => [u.id, u.nickname || u.username]));

    const recentDocuments = recentDocsRaw.map(d => ({
      id: Number(d.id),
      title: d.title ?? 'Tài liệu không tên',
      created_at: d.created_at?.toISOString() ?? '',
      is_ai_classified: d.is_ai_classified ? 1 : 0,
      public: d.public ?? '0',
      link_s3: d.link_s3 ?? null,
      creator_name: d.created_by_id ? userMap.get(Number(d.created_by_id)) || 'Giáo viên' : 'Hệ thống',
    }));

    // Chuẩn hóa dữ liệu Khối lớp (Grades)
    const gradesData = gradesGroupBy.map(g => {
      const gradeVal = g.grade;
      let label = 'Khác';
      if (gradeVal !== null && gradeVal !== undefined && gradeVal > 0) {
        label = `Lớp ${gradeVal}`;
      }
      return {
        label,
        count: g._count.id,
        rawGrade: gradeVal ?? 0,
      };
    }).sort((a, b) => {
      if (a.label === 'Khác') return 1;
      if (b.label === 'Khác') return -1;
      return a.rawGrade - b.rawGrade;
    });

    // Chuẩn hóa dữ liệu Độ khó (Difficulties)
    const difficultyMap: Record<string, string> = {
      'cb': 'Cơ bản',
      'nc': 'Nâng cao',
      'c': 'Chuyên sâu',
      'chuyenso': 'Chuyên sâu',
      'Dễ': 'Dễ',
      'Trung Bình': 'Trung bình',
      'Khó': 'Khó',
    };

    const difficultiesMapResult: Record<string, number> = {};
    difficultiesGroupBy.forEach(d => {
      const rawDiff = d.question_difficulty;
      const mappedLabel = rawDiff ? (difficultyMap[rawDiff] || rawDiff) : 'Chưa phân loại';
      difficultiesMapResult[mappedLabel] = (difficultiesMapResult[mappedLabel] || 0) + d._count.id;
    });

    const difficultiesData = Object.entries(difficultiesMapResult).map(([label, count]) => ({
      label,
      count,
    })).sort((a, b) => b.count - a.count);

    // Chuẩn hóa dữ liệu Loại câu hỏi (Question Types)
    const typeMap: Record<string, string> = {
      'fib': 'Điền khuyết',
      'essay': 'Tự luận',
      'mc': 'Trắc nghiệm (MC)',
      'SINGLE_CHOICE': 'Trắc nghiệm 1 đáp án',
      'MULTIPLE_CHOICE': 'Trắc nghiệm nhiều đáp án',
    };

    const typesMapResult: Record<string, number> = {};
    typesGroupBy.forEach(t => {
      const rawType = t.question_type;
      const mappedLabel = rawType ? (typeMap[rawType] || rawType) : 'Chưa phân loại';
      typesMapResult[mappedLabel] = (typesMapResult[mappedLabel] || 0) + t._count.id;
    });

    const typesData = Object.entries(typesMapResult).map(([label, count]) => ({
      label,
      count,
    })).sort((a, b) => b.count - a.count);

    return {
      stats: {
        questions: questionCount,
        documents: documentCount,
        collections: collectionCount,
        topics: topicCount,
      },
      recentDocuments,
      gradesData,
      difficultiesData,
      typesData,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats action:', error);
    return null;
  }
}
