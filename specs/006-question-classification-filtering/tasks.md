# Tasks: Hoàn thiện Bộ Tiêu chí Phân loại và Bộ lọc Ngân hàng Câu hỏi

**Feature Branch**: `006-question-classification-filtering`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify database connection and Prisma client generation in `prisma/schema.prisma`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core query setup that blocks user story implementation

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete

- [x] T002 Update `src/actions/question.ts` data structures to support categories: `SOURCE`, `METHOD`, `SKILL`, `TYPE`, `EXAM`, `YEAR`
- [x] T003 Ensure database indexes are set on filtered fields (`lms_questions.grade`, `lms_questions.question_difficulty`, `lms_questions.question_type`, `lms_questions.complex`, `lms_topics.path`, `lms_tags.category`)

**Checkpoint**: Foundation ready - queries and indexes verified

---

## Phase 3: User Story 1 - Phân loại câu hỏi đa chiều (Priority: P1) 🎯 MVP

**Goal**: Support linking questions with multiple topics and multiple tags (classified by categories: SOURCE, METHOD, SKILL, TYPE, EXAM, YEAR).

**Independent Test**: Associate a question with grade 10, difficulty 'Trung bình', topic 'Phương trình bậc hai', tag source 'Chuyên Sư Phạm 2026', and check the database mapping in `lms_topics_questions` and `lms_questions_tags`.

### Implementation for User Story 1

- [x] T004 [US1] Create tag fetching server action in `src/actions/question.ts` that groups tags by category (`SOURCE`, `METHOD`, `SKILL`, `TYPE`, `EXAM`, `YEAR`)
- [x] T005 [US1] Implement link updates server action in `src/actions/question.ts` to associate questions to multiple topics and tags cleanly, handling additions and removals
- [x] T006 [US1] Integrate the tag selection UI/badge display on the question details page in `/question-bank`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Tìm kiếm và Lọc câu hỏi nâng cao (Priority: P1)

**Goal**: Filter panel with multi-select grades, difficulties, tree topics, categories tag, and question structure (complex/sub grouping).

**Independent Test**: Filter questions by a parent topic or a set of grades/difficulties and check that sub questions (`complex = 'sub'`) are grouped inside their respective parent question (`complex = 'main'`).

### Implementation for User Story 2

- [x] T007 [US2] Update `getLibraryQuestions` query in `src/actions/question.ts` to handle filter parameters: `grades[]`, `difficulties[]`, `questionTypes[]`, `topicIds[]` (supporting recursive path matching on `lms_topics`), `tagIds[]`, `complex`
- [x] T008 [US2] Update `getLibraryQuestions` query to group sub-questions (`complex = 'sub'`) inside their main question (`complex = 'main'`) via `ref_question_id`
- [x] T009 [US2] Implement hook `useQuestionBank` in `src/app/(main)/question-bank/hooks/useQuestionBank.ts` to manage advanced filters and sync with URL query parameters
- [x] T010 [US2] Create component `QuestionFilterPanel` in `src/app/(main)/question-bank/components/QuestionFilterPanel.tsx` representing the advanced UI filters
- [x] T011 [US2] Update component `QuestionBankManager` in `src/app/(main)/question-bank/components/QuestionBankManager.tsx` to integrate `QuestionFilterPanel` and utilize `useQuestionBank`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Tìm kiếm toàn văn kết hợp bộ lọc (Priority: P2)

**Goal**: Full-text search combining with selected filters.

**Independent Test**: Search for keyword "tích phân" and filter by Grade 12, check that the result only contains Grade 12 questions containing the keyword.

### Implementation for User Story 3

- [x] T012 [US3] Upgrade `getLibraryQuestions` query in `src/actions/question.ts` to support searching `keyword` (accent-insensitive/sensitive matching in `statement` and `content`)
- [x] T013 [US3] Integrate search keyword input in `QuestionBankManager` and sync it with `useQuestionBank` hook and URL query parameters

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T014 [P] Update UI badge styles and indicators for question difficulties, types, and tags in question bank
- [x] T015 Verify performance of the filter query with Prisma indexing and check query latency (< 300ms)
- [x] T016 Run `quickstart.md` validation scenarios to confirm everything works

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Different user stories can be worked on in parallel by different team members
