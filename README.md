# EduForge AI — Study Material Studio

EduForge AI converts academic files into source-grounded study material, question banks, MCQs, flashcards, quizzes and tutor answers.

## Current pipeline
Upload -> validate -> extract -> normalize -> chunk -> generate -> practice -> export.

## Supported formats
PDF, DOCX, PPTX, XLSX, XLS, CSV, TXT, MD, JPG, JPEG, PNG, WEBP.

## Upload architecture
Files up to 4 MB use the Next.js Route Handler directly. Larger files use Vercel Blob client uploads so the browser does not send the file through a Vercel Function. Large-file processing uses private Blob storage and server-side Blob retrieval.

The client never calls response.json() blindly. Responses are read as text first and validated as JSON, so an empty/HTML/error response becomes a useful UI error instead of "Unexpected end of JSON input".

Vercel Functions have a 4.5 MB request/response payload limit, so the old 25 MB server-upload design was removed.

## Environment
Copy .env.example to .env.local:
- AI_API_KEY: optional for real LLM generation.
- AI_BASE_URL: optional provider endpoint.
- AI_MODEL: optional model.
- BLOB_READ_WRITE_TOKEN: required for direct large-file uploads.

For Vercel, create a private Blob store and connect it to the project. Private storage is appropriate for student documents.

## AI behavior
Without AI_API_KEY the app uses a deterministic source-grounded fallback so the core UI remains usable. With AI_API_KEY, generation requests are constrained to the uploaded source and return structured JSON.

## Production roadmap
1. PostgreSQL + Prisma/Drizzle persistence
2. Secure server sessions and RBAC
3. Multi-tenant university/department/course model
4. Retrieval + pgvector citations
5. Background document processing queue
6. OCR/vision pipeline
7. Human review workflow
8. PDF/DOCX/PPTX exports
9. Question-bank versioning and duplicate detection
10. Analytics, billing and audit logs

## Research-informed design
- QuerIA: adaptive question generation and evaluation in higher education (2026), DOI 10.1016/j.eswa.2025.130140.
- Retrieval-Augmented Generation for Multiple-Choice Questions and Answers Generation (2025), DOI 10.1016/j.procs.2025.03.352.
- MCQGen: A Large Language Model-Driven MCQ Generator for Personalized Learning (2024), DOI 10.1109/ACCESS.2024.3420709.
- MCQs Generation With Large Language Models: A Survey (IEEE Access, 2026), DOI 10.1109/ACCESS.2026.3652006.
- AI-assisted MCQ generation with multimodal LLMs in engineering higher education (IEEE EDUCON, 2025), DOI 10.1109/EDUCON62633.2025.11016449.

Security references:
- OWASP Authentication Cheat Sheet
- OWASP Session Management Cheat Sheet
- OWASP File Upload Cheat Sheet
