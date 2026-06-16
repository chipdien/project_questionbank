import { buildTopicTree, TopicFlatNode } from '../topic-tree-helper';

function testBuildTopicTree() {
  const flatData: TopicFlatNode[] = [
    { id: '1', title: 'Toán 12', parent_id: null, code: 'T12', type: 'SYLLABUS', order_index: '1', path: null },
    { id: '2', title: 'Giải tích', parent_id: '1', code: 'GT', type: 'DOMAIN', order_index: '1', path: null },
    { id: '3', title: 'Đạo hàm', parent_id: '2', code: 'DH', type: 'TOPIC', order_index: '1', path: null }
  ];

  console.log("Running testBuildTopicTree...");
  const tree = buildTopicTree(flatData);

  if (tree.length !== 1) throw new Error(`Expected tree root length to be 1, got ${tree.length}`);
  if (tree[0].id !== '1') throw new Error(`Expected root ID to be 1, got ${tree[0].id}`);
  if (tree[0].breadcrumb !== 'Toán 12') throw new Error(`Expected root breadcrumb to be 'Toán 12', got '${tree[0].breadcrumb}'`);
  
  if (tree[0].children.length !== 1) throw new Error(`Expected level 1 children length to be 1, got ${tree[0].children.length}`);
  if (tree[0].children[0].id !== '2') throw new Error(`Expected level 1 ID to be 2`);
  if (tree[0].children[0].breadcrumb !== 'Toán 12 > Giải tích') throw new Error(`Expected level 1 breadcrumb, got '${tree[0].children[0].breadcrumb}'`);

  if (tree[0].children[0].children.length !== 1) throw new Error(`Expected level 2 children length to be 1`);
  if (tree[0].children[0].children[0].id !== '3') throw new Error(`Expected level 2 ID to be 3`);
  if (tree[0].children[0].children[0].breadcrumb !== 'Toán 12 > Giải tích > Đạo hàm') {
    throw new Error(`Expected level 2 breadcrumb, got '${tree[0].children[0].children[0].breadcrumb}'`);
  }

  console.log("✅ testBuildTopicTree passed successfully!");
}

try {
  testBuildTopicTree();
} catch (error) {
  console.error("❌ Test failed:", error);
  process.exit(1);
}
