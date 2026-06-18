export interface TopicFlatNode {
  id: string;
  title: string;
  code: string | null;
  parent_id: string | null;
  path: string | null;
  type: string;
  order_index: string;
}

export interface TopicTreeNode extends TopicFlatNode {
  children: TopicTreeNode[];
  breadcrumb: string;
}

export function buildTopicTree(flatList: TopicFlatNode[]): TopicTreeNode[] {
  const map = new Map<string, TopicTreeNode>();
  const roots: TopicTreeNode[] = [];

  // Khởi tạo các node
  flatList.forEach((item) => {
    map.set(item.id, { ...item, children: [], breadcrumb: item.title });
  });

  // Xây dựng mối quan hệ cha con
  flatList.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parent_id && map.has(item.parent_id)) {
      const parent = map.get(item.parent_id)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Đệ quy tính toán breadcrumbs và sắp xếp theo order_index
  const processNode = (node: TopicTreeNode, parentBreadcrumb: string) => {
    node.breadcrumb = parentBreadcrumb ? `${parentBreadcrumb} > ${node.title}` : node.title;
    node.children.sort((a, b) => parseInt(a.order_index || '0') - parseInt(b.order_index || '0'));
    node.children.forEach((child) => processNode(child, node.breadcrumb));
  };

  roots.sort((a, b) => parseInt(a.order_index || '0') - parseInt(b.order_index || '0'));
  roots.forEach((root) => processNode(root, ''));

  return roots;
}
