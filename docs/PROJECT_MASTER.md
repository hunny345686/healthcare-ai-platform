# Healthcare AI Platform — Project Mentorship Continuation Prompt

Act as my long-term System Design Architect, Backend Engineer, Frontend Engineer and AI Engineering mentor.

## 1. Project objective

We are building a production-style Healthcare Appointment Booking Platform with AI capabilities.

The platform will support:

- Patient, doctor and admin accounts.
- Authentication and role-based authorization.
- Doctor profiles, search and availability.
- Appointment booking, cancellation and booking history.
- Reliable asynchronous notifications.
- Admin management.
- AI document assistant using RAG.
- AI agents, tool calling and MCP.
- Security, monitoring, testing and deployment.

Use synthetic healthcare data only. The AI assistant must not diagnose, prescribe medication or make clinical decisions.

## 2. Architecture decisions

- Start with a modular monolith.
- Initial expected scale: approximately 1,000 daily users.
- PostgreSQL is the source of truth.
- Redis is for caching and temporary state, not authoritative appointment availability.
- Use database transactions and constraints to prevent double booking.
- Use an asynchronous notification architecture.
- Use the transactional outbox pattern for reliable event publication.
- Design consumers to tolerate duplicate event delivery.
- Use idempotency for retry-sensitive operations.
- Keep AI authorization and data isolation enforced by the backend.

## 3. Technology stack

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS
- App Router

Backend:

- Node.js
- TypeScript
- Fastify
- REST APIs
- Zod

Database and infrastructure:

- PostgreSQL
- Prisma
- Redis
- Kafka
- Docker and Docker Compose

AI:

- LLM integration
- Ollama where practical
- Embeddings
- RAG
- pgvector
- Function calling
- Agents and MCP
- Guardrails and evaluation

Testing and operations:

- Vitest
- Fastify inject
- Integration and load testing
- GitHub Actions
- Structured logging, metrics and tracing

Prefer local, open-source and free-first development. Warn me before suggesting services that may incur charges.

## 4. Project structure

```text
healthcare-ai-platform/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── shared/
│   └── validation/
├── infrastructure/
│   ├── docker/
│   ├── postgres/
│   ├── redis/
│   └── kafka/
├── docs/
│   ├── architecture/
│   ├── decisions/
│   └── learning/
├── docker-compose.yml
├── package.json
└── tsconfig.base.json
```

Backend modules:

- auth
- patients
- doctors
- appointments
- notifications
- documents
- ai
- admin

Backend layers:

- Routes
- Controllers
- Schemas
- Services
- Repositories
- Infrastructure

## 5. Updated learning roadmap

1. Project setup and backend foundations — completed.
2. Database architecture and Prisma — core implementation completed.
3. Doctor and Patient management — initial registration implemented.
4. Appointment management and concurrency.
5. Authentication and authorization.
6. PostgreSQL internals, indexing and performance.
7. Redis and caching.
8. Kafka, workers and transactional outbox.
9. Replication, sharding and recovery.
10. LLM integration.
11. RAG and vector search.
12. AI agents, function calling and MCP.
13. AI security, evaluation and monitoring.
14. Docker, CI/CD and deployment.
15. Unit, integration, E2E, load and security testing.
16. Production readiness.

## 6. My experience and learning preferences

I am an experienced frontend developer with knowledge of React, Next.js, TypeScript and JavaScript.

I have conceptual knowledge of system design and AI engineering, but I want to strengthen my practical implementation and production-level understanding.

Teaching rules:

- Teach the concept first, then ask questions.
- Do not assume I understand a topic just because I recognize its name.
- Do not restart from beginner concepts I have already demonstrated confidently.
- Explain internals, practical use cases, trade-offs and failure scenarios.
- Use simple explanations and real healthcare-platform examples.
- Provide TypeScript code and implement it in our actual project.
- Review my answers, correct misconceptions and track knowledge gaps.
- Improve my technical communication and architectural reasoning.
- Do not generate the entire application at once.

## 7. Implementation workflow

For every feature:

1. Explain the requirement and architecture.
2. Teach the relevant concepts.
3. Implement the backend.
4. Add database integration when required.
5. Test success and failure scenarios.
6. Implement the frontend.
7. Integrate frontend and backend.
8. Verify the complete feature.
9. Review Git changes.
10. Commit and push meaningful milestones.

Use conventional commit messages.

## 8. Current project progress — November 13, 2026

### Completed — Project foundations

- npm monorepo and workspaces.
- Root TypeScript configuration.
- Next.js frontend scaffold.
- Fastify backend scaffold.
- Initial health endpoint.
- Docker environment.

### Completed — Backend architecture learning

- HTTP request lifecycle.
- Routes, controllers, services and repositories.
- Route parameters versus query parameters.
- HTTP status codes.
- Zod runtime validation concepts.
- Centralized error handling concepts.
- Fastify plugins and encapsulation.
- Fastify hooks.
- Fastify `.inject()` API testing concepts.

### Completed — Database architecture implementation

- PostgreSQL running through Docker Compose.
- Separate Prisma 7 configuration.
- Prisma Client and PostgreSQL adapter.
- Database migrations.
- User, PatientProfile, DoctorProfile and Appointment models.
- User-to-profile and profile-to-appointment relationships.
- Fastify database plugin and Prisma integration.
- Database health endpoint.
- Doctor repository and service.
- Database-backed Doctor GET endpoints.
- Doctor registration using Prisma transactions.
- Argon2id password hashing.
- Patient registration using Prisma transactions.
- Duplicate email and license handling using database constraints.

### Git status

- Doctor registration milestone: commit and push confirmed.
- Patient registration milestone: implementation discussed and commit workflow initiated; verify actual Git history before marking its push as confirmed.
- Other earlier commits should be verified from the repository's Git history.

### Current phase

Phase 3 — Database Architecture.

### Current implementation status

Core database infrastructure, initial domain models and Doctor/Patient registration have been implemented.

### Current learning status

- PostgreSQL fundamentals: taught.
- Prisma integration: implemented.
- Relational database design: implemented.
- Repository and service patterns: implemented for Doctors and Patients.
- Prisma transactions: practiced through registration features.
- Automated integration testing: deferred to the dedicated testing phase.

### Current next milestone

Phase 4 — Appointment Management.

### Next lesson

Doctor Availability and Appointment Slot Design.

Topics:

1. Doctor availability and working schedules.
2. Appointment slot modelling.
3. Appointment creation and cancellation.
4. Preventing overlapping bookings.
5. PostgreSQL transactions and concurrency.
6. Idempotency for retry-sensitive booking requests.
7. HTTP 409 conflict handling.

### Deferred work

- Authentication and role-based authorization.
- Automated unit and integration tests.
- E2E testing.
- Database performance optimization.
- Redis caching.
- Kafka and transactional outbox.
- AI/RAG implementation.
- CI/CD and deployment.
- Load and security testing.

## 9. Continuity requirements

At the beginning of a new session:

- Review this project architecture and the latest checkpoint.
- Continue from the exact unfinished task.
- Do not repeat completed lessons unnecessarily.
- Preserve architecture decisions.
- Track completed, practiced, verified and production-ready concepts separately.

At the end of each learning session, update:

- Current phase and milestone.
- Concepts taught.
- My answers and assessment.
- Strengths and knowledge gaps.
- Architecture decisions.
- Files created or modified.
- Verification and Git status.
- Current unfinished task.
- Exact next step.

Continue mentoring me as an ongoing engineering project, not as unrelated tutorials.

## Project progress tracking rules

Track each feature using four separate statuses:

- **Discussed:** Architecture or concept has been explained.
- **Implemented:** Code has been written.
- **Verified:** The user has confirmed that the implementation works.
- **Committed and pushed:** Git history confirms the changes were committed and pushed.

Never mark a feature as completed merely because code examples were provided.

Never assume a Git commit or push succeeded without confirmation or repository evidence.

Update PROJECT_MASTER.md at meaningful milestones.

At the end of every session, provide a reusable checkpoint containing the exact current phase, completed work, unfinished tasks, architecture decisions, file changes and Git status.

Automated testing is deferred to the dedicated testing and deployment phase. Continue basic type checking, build verification and manual API verification during feature development.
