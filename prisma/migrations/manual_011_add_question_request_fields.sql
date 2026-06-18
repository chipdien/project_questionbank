-- Migration: 011_add_question_request_fields
-- Date: 2026-06-17
-- Feature: specs/011-question-requests
-- Applied via `prisma db push` (shadow DB unavailable on managed MySQL: P3014/P1010).
-- This file records the equivalent SQL for traceability.
--
-- Table: lms_requests (only ADD columns; no existing column changed/dropped)

ALTER TABLE lms_requests
  ADD COLUMN question_id BIGINT NULL,
  ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN admin_note LONGTEXT NULL;

CREATE INDEX idx_lms_requests_question_id ON lms_requests (question_id);
CREATE INDEX idx_lms_requests_status ON lms_requests (status);
