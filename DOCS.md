# 칸반 보드 프로젝트 문서

## 목차
1. [프로젝트 구조](#1-프로젝트-구조)
2. [실행 방법](#2-실행-방법)
3. [API 문서](#3-api-문서)
4. [데이터 모델 설계](#4-데이터-모델-설계)
5. [동시성 처리 전략](#5-동시성-처리-전략)
6. [실시간 동기화](#6-실시간-동기화)
7. [AI 사용 내역](#7-ai-사용-내역)

---

## 1. 프로젝트 구조

```
├── docker-compose.yml              # Docker Compose 설정
├── shared/                         # 프론트엔드/백엔드 공통 타입
│   └── types.ts                    # User, Task, TaskStatus 등 공유 인터페이스
├── backend/                        # NestJS 백엔드
│   ├── Dockerfile
│   ├── src/
│   │   ├── main.ts                 # 앱 엔트리포인트
│   │   ├── app.module.ts           # 루트 모듈
│   │   ├── mikro-orm.config.ts     # ORM 설정
│   │   ├── auth/                   # 인증 모듈
│   │   │   ├── user.entity.ts      #   사용자 엔티티
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts     #   인증 비즈니스 로직
│   │   │   ├── auth.controller.ts  #   인증 API 엔드포인트
│   │   │   ├── jwt.strategy.ts     #   JWT 인증 전략
│   │   │   ├── jwt-auth.guard.ts   #   JWT 인증 가드
│   │   │   ├── auth.service.spec.ts#   인증 서비스 테스트
│   │   │   └── dto/
│   │   │       ├── signup.dto.ts
│   │   │       └── login.dto.ts
│   │   └── tasks/                  # 일감 모듈
│   │       ├── task.entity.ts      #   일감 엔티티
│   │       ├── tasks.module.ts
│   │       ├── tasks.service.ts    #   일감 비즈니스 로직
│   │       ├── tasks.controller.ts #   일감 API 엔드포인트
│   │       ├── tasks.gateway.ts    #   WebSocket 게이트웨이
│   │       ├── tasks.service.spec.ts#  일감 서비스 테스트
│   │       └── dto/
│   │           ├── create-task.dto.ts
│   │           └── update-task.dto.ts
│   └── test/
│       └── jest-e2e.json
├── frontend/                       # React 프론트엔드
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   │   ├── main.tsx                # 앱 엔트리포인트
│   │   ├── App.tsx                 # 라우터 및 인증 처리
│   │   ├── index.css               # 글로벌 스타일 + 재사용 CSS 클래스
│   │   ├── types/index.ts          # shared/types.ts를 re-export
│   │   ├── lib/
│   │   │   ├── axios.ts            # API 클라이언트 설정
│   │   │   └── socket.ts           # WebSocket 클라이언트
│   │   ├── stores/
│   │   │   ├── authStore.ts        # 인증 상태 관리 (Zustand)
│   │   │   └── authStore.spec.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts          # 인증 훅
│   │   │   └── useTasks.ts         # 일감 CRUD + 실시간 동기화 훅
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx       # 로그인 페이지
│   │   │   ├── SignupPage.tsx      # 회원가입 페이지
│   │   │   └── BoardPage.tsx       # 칸반 보드 페이지
│   │   └── components/
│   │       ├── KanbanColumn.tsx    # 칸반 컬럼 (droppable)
│   │       ├── TaskCard.tsx        # 일감 카드 (draggable)
│   │       ├── CreateTaskModal.tsx  # 일감 생성 모달
│   │       ├── CreateTaskModal.spec.tsx
│   │       ├── ui/                 # 재사용 UI 컴포넌트
│   │       │   ├── Input.tsx       #   입력 필드
│   │       │   ├── Button.tsx      #   버튼 (primary/secondary)
│   │       │   ├── Modal.tsx       #   모달 오버레이
│   │       │   └── SearchInput.tsx #   검색 입력
│   │       └── layout/
│   │           └── AuthLayout.tsx  #   인증 페이지 공통 레이아웃
│   └── tailwind.config.js          # Tailwind 디자인 토큰
└── DOCS.md                         # 이 문서
```

### 주요 아키텍처 결정

| 결정 사항 | 선택 | 이유 |
|-----------|------|------|
| 상태 관리 | Zustand (클라이언트) + TanStack Query (서버) | 역할 분리: 인증 상태는 Zustand, API 데이터는 TanStack Query |
| 실시간 통신 | Socket.IO (WebSocket) | 양방향 통신, 자동 재연결, fallback 지원 |
| 드래그앤드랍 | dnd-kit | 경량, React 18+ 호환, 접근성 지원 |
| 동시성 제어 | 낙관적 잠금 (Optimistic Locking) | 읽기 중심 워크로드에 최적, 데이터 손실 방지 |
| ORM | MikroORM | 요구 사항 충족, TypeScript 네이티브 지원 |

---

## 2. 실행 방법

```bash
docker compose up
```

- 프론트엔드: http://localhost:8080
- 백엔드 API: http://localhost:3000
- PostgreSQL: localhost:5432

---

## 3. API 문서

### 인증 API

#### POST /auth/signup - 회원가입

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "홍길동",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

**Error (409):**
```json
{
  "statusCode": 409,
  "message": "이미 가입된 이메일입니다."
}
```

#### POST /auth/login - 로그인

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

**Error (401):**
```json
{
  "statusCode": 401,
  "message": "이메일 또는 비밀번호가 올바르지 않습니다."
}
```

#### GET /auth/me - 현재 사용자 조회

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "홍길동"
}
```

### 일감 API

> 모든 일감 API는 `Authorization: Bearer <token>` 헤더가 필요합니다.

#### GET /tasks - 일감 목록 조회

**Query Parameters:**
- `search` (선택): 검색어 - 제목 또는 작성자 이름으로 필터링

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "API 설계",
    "status": "TODO",
    "version": 1,
    "creator": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "홍길동"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /tasks - 일감 생성

**Request Body:**
```json
{
  "title": "새 일감"
}
```

**Response (201):**
```json
{
  "id": "new-task-id",
  "title": "새 일감",
  "status": "TODO",
  "version": 1,
  "creator": { "id": "...", "email": "...", "name": "..." },
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### PATCH /tasks/:id - 일감 수정

**Request Body:**
```json
{
  "version": 1,
  "title": "수정된 제목",
  "status": "DOING"
}
```

- `version` (필수): 낙관적 잠금을 위한 현재 버전
- `title` (선택): 새 제목
- `status` (선택): 새 상태 (TODO | DOING | DONE)

**Response (200):** 수정된 일감 객체

**Error (409):**
```json
{
  "statusCode": 409,
  "message": "다른 사용자가 이미 이 일감을 수정했습니다. 최신 데이터를 확인해 주세요."
}
```

#### DELETE /tasks/:id - 일감 삭제

**Response (200):**
```json
{
  "success": true
}
```

### WebSocket 이벤트

| 이벤트 | 방향 | 데이터 | 설명 |
|--------|------|--------|------|
| `task:created` | Server → Client | Task 객체 | 새 일감 생성됨 |
| `task:updated` | Server → Client | Task 객체 | 일감 수정됨 |
| `task:deleted` | Server → Client | `{ id: string }` | 일감 삭제됨 |

---

## 4. 데이터 모델 설계

### User 엔티티

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | 사용자 고유 식별자 |
| email | VARCHAR (UNIQUE) | 이메일 (로그인 ID) |
| name | VARCHAR | 사용자 이름 |
| password | VARCHAR | bcrypt 해시된 비밀번호 |
| createdAt | TIMESTAMP | 가입일시 |

### Task 엔티티

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | 일감 고유 식별자 |
| title | VARCHAR | 일감 제목 |
| status | ENUM (TODO, DOING, DONE) | 일감 상태 |
| version | INTEGER | 낙관적 잠금용 버전 번호 |
| creator_id | UUID (FK → User) | 작성자 참조 |
| createdAt | TIMESTAMP | 생성일시 |
| updatedAt | TIMESTAMP | 수정일시 |

### ER 다이어그램

```
┌──────────────┐         ┌──────────────────┐
│    User      │         │      Task        │
├──────────────┤         ├──────────────────┤
│ id (PK)      │←──┐     │ id (PK)          │
│ email (UQ)   │   │     │ title            │
│ name         │   │     │ status (ENUM)    │
│ password     │   └─────│ creator_id (FK)  │
│ createdAt    │         │ version          │
└──────────────┘         │ createdAt        │
                         │ updatedAt        │
                         └──────────────────┘

관계: User 1 ──── N Task (한 사용자가 여러 일감을 생성 가능)
```

---

## 5. 동시성 처리 전략

### 문제 정의

칸반 보드에서 여러 사용자가 동시에 같은 일감을 수정할 때 데이터 정합성 문제가 발생합니다:

1. 사용자 A가 일감(version: 1)을 조회
2. 사용자 B가 같은 일감(version: 1)을 조회
3. 사용자 A가 상태를 TODO → DOING으로 변경 → 성공 (version: 1 → 2)
4. 사용자 B가 상태를 TODO → DONE으로 변경 → **충돌 발생**
   - B의 version(1)과 DB의 version(2)이 불일치

### 해결 전략: 낙관적 잠금 (Optimistic Locking)

**선택 이유:**

| 전략 | 장점 | 단점 | 적합성 |
|------|------|------|--------|
| 낙관적 잠금 ✅ | DB 잠금 없이 동시 읽기 가능, 충돌 감지 | 충돌 시 재시도 필요 | 읽기 >> 쓰기인 칸반 보드에 최적 |
| 비관적 잠금 | 충돌 원천 차단 | DB 잠금으로 성능 저하, 데드락 위험 | 동시 쓰기가 빈번한 경우 적합 |
| Last-Write-Wins | 구현 간단 | 데이터 손실 가능성 | 충돌이 문제되지 않는 경우 |

**구현 방식:**

1. **데이터 모델**: Task 엔티티에 `version` 필드 추가 (MikroORM의 `@Property({ version: true })`)
2. **수정 요청**: 클라이언트가 조회 시 받은 `version`을 수정 요청에 포함
3. **충돌 감지**: 서버에서 DB의 `version`과 요청의 `version`을 비교
4. **충돌 처리**: 불일치 시 `409 Conflict` 반환, 클라이언트에서 최신 데이터로 갱신

**코드 흐름:**

```typescript
// 백엔드 - TasksService.update()
if (task.version !== dto.version) {
  throw new ConflictException('다른 사용자가 이미 이 일감을 수정했습니다.');
}

// 프론트엔드 - useTasks 훅의 onError
if (error.response?.status === 409) {
  alert('다른 사용자가 이미 이 일감을 수정했습니다.');
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
}
```

---

## 6. 실시간 동기화

### 방식: WebSocket (Socket.IO)

**선택 이유:**
- **양방향 통신**: 서버에서 클라이언트로 즉시 이벤트 푸시 가능
- **자동 재연결**: Socket.IO가 연결 끊김 시 자동 재연결 처리
- **fallback**: WebSocket 불가 환경에서 long polling으로 자동 전환
- **SSE 대비**: 양방향 통신 지원, HTTP/1.1 연결 수 제한 없음
- **폴링 대비**: 불필요한 요청 없이 즉각적인 업데이트

**동작 흐름:**
1. 사용자 A가 일감 상태를 변경
2. REST API를 통해 백엔드에 변경 요청
3. 백엔드에서 DB 업데이트 후 WebSocket으로 `task:updated` 이벤트 브로드캐스트
4. 사용자 B의 클라이언트가 이벤트를 수신
5. TanStack Query 캐시 무효화 → 자동으로 최신 데이터 조회

---

## 7. AI 사용 내역

이 프로젝트의 **모든 코드는 AI(Claude)가 작성**했습니다.

구체적으로:
- 프로젝트 구조 설계
- 백엔드 전체 코드 (NestJS, MikroORM 엔티티, 서비스, 컨트롤러, WebSocket 게이트웨이)
- 프론트엔드 전체 코드 (React 컴포넌트, 훅, 상태 관리, 드래그앤드랍)
- Docker 및 Docker Compose 설정
- 테스트 코드
- 이 문서

사용자(개발자)가 요구 사항을 정의하고 기술 스택을 지정하면, AI가 이를 기반으로 전체 구현을 수행했습니다.
