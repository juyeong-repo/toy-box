# 칸반 보드 (Kanban Board)

풀스택 칸반 보드 애플리케이션입니다. JWT 기반 인증, 일감(Task) CRUD, 드래그앤드랍 상태 변경, WebSocket 실시간 동기화, 낙관적 잠금 동시성 제어를 제공합니다.

## 목차

1. [실행 방법](#1-실행-방법)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [기술 스택 및 선택 이유](#3-기술-스택-및-선택-이유)
4. [아키텍처 설계](#4-아키텍처-설계)
5. [설계 원칙](#5-설계-원칙)
6. [설계 리뷰 및 모호한 요구사항](#6-설계-리뷰-및-모호한-요구사항)
7. [프로덕션 환경을 위한 발전 방향](#7-프로덕션-환경을-위한-발전-방향)
8. [테스트](#8-테스트)
9. [AI 사용 내역](#9-ai-사용-내역)

---

## 1. 실행 방법

### 사전 요구사항

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
- Docker Compose v2 이상 (Docker Desktop에 포함)

### 실행 단계

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd juyeong.park.tech-fullstack-test

# 2. Docker Compose로 전체 서비스 실행
docker compose up --build

# 3. 브라우저에서 접속
# 프론트엔드: http://localhost:8080
# 백엔드 API: http://localhost:3000
```

### 서비스 포트 정보

| 서비스 | 포트 | 설명 |
|--------|------|------|
| 프론트엔드 (Nginx) | 8080 | React SPA 서빙 |
| 백엔드 (NestJS) | 3000 | REST API + WebSocket |
| PostgreSQL | 5432 | 데이터베이스 |

### 개발 모드 실행 (Docker 없이)

```bash
# 백엔드 (PostgreSQL은 별도 실행 필요)
cd backend
npm install
npm run start:dev

# 프론트엔드
cd frontend
npm install
npm run dev
```

### 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DB_HOST` | postgres | PostgreSQL 호스트 |
| `DB_PORT` | 5432 | PostgreSQL 포트 |
| `DB_USER` | kanban | DB 사용자 |
| `DB_PASSWORD` | kanban | DB 비밀번호 |
| `DB_NAME` | kanban | DB 이름 |
| `JWT_SECRET` | (docker-compose에서 설정) | JWT 서명 키 |
| `FRONTEND_URL` | http://localhost:8080 | CORS 허용 출처 |
| `VITE_API_URL` | http://localhost:3000 | 프론트엔드 API 주소 |

---

## 2. 프로젝트 구조

```
├── docker-compose.yml              # Docker Compose 설정
├── shared/                         # 프론트엔드/백엔드 공통 타입 (Single Source of Truth)
│   └── types.ts                    # User, Task, TaskStatus 등 공유 인터페이스
├── backend/                        # NestJS 백엔드
│   ├── Dockerfile                  # 프로덕션 Docker 빌드
│   ├── src/
│   │   ├── main.ts                 # 앱 엔트리포인트 (CORS, ValidationPipe)
│   │   ├── app.module.ts           # 루트 모듈 (자동 스키마 동기화)
│   │   ├── mikro-orm.config.ts     # MikroORM 데이터베이스 설정
│   │   ├── auth/                   # 인증 모듈 ──────────────────
│   │   │   ├── user.entity.ts      #   사용자 엔티티 (UUID, bcrypt)
│   │   │   ├── auth.module.ts      #   인증 모듈 정의
│   │   │   ├── auth.service.ts     #   회원가입/로그인 비즈니스 로직
│   │   │   ├── auth.controller.ts  #   인증 API 엔드포인트
│   │   │   ├── jwt.strategy.ts     #   Passport JWT 전략
│   │   │   ├── jwt-auth.guard.ts   #   JWT 인증 가드
│   │   │   ├── auth.service.spec.ts#   인증 서비스 단위 테스트
│   │   │   └── dto/
│   │   │       ├── signup.dto.ts   #     회원가입 요청 DTO
│   │   │       └── login.dto.ts    #     로그인 요청 DTO
│   │   └── tasks/                  # 일감 모듈 ──────────────────
│   │       ├── task.entity.ts      #   일감 엔티티 (version 낙관적 잠금)
│   │       ├── tasks.module.ts     #   일감 모듈 정의
│   │       ├── tasks.service.ts    #   CRUD + 동시성 제어 로직
│   │       ├── tasks.controller.ts #   일감 API + WebSocket 브로드캐스트
│   │       ├── tasks.gateway.ts    #   Socket.IO WebSocket 게이트웨이
│   │       ├── tasks.service.spec.ts#  일감 서비스 단위 테스트
│   │       └── dto/
│   │           ├── create-task.dto.ts#    생성 요청 DTO
│   │           └── update-task.dto.ts#    수정 요청 DTO (version 필수)
│   └── test/
│       └── jest-e2e.json
├── frontend/                       # React 프론트엔드
│   ├── Dockerfile                  # 멀티스테이지 빌드 (Node→Nginx)
│   ├── nginx.conf                  # SPA 라우팅 + 정적 파일 캐싱
│   ├── src/
│   │   ├── main.tsx                # 앱 엔트리포인트
│   │   ├── App.tsx                 # 라우터 및 인증 상태별 페이지 제어
│   │   ├── index.css               # 글로벌 스타일 + 재사용 CSS 클래스
│   │   ├── types/index.ts          # shared/types.ts를 re-export
│   │   ├── lib/
│   │   │   ├── axios.ts            # Axios 인스턴스 (인터셉터)
│   │   │   └── socket.ts           # Socket.IO 클라이언트
│   │   ├── stores/
│   │   │   ├── authStore.ts        # Zustand 인증 상태 스토어
│   │   │   └── authStore.spec.ts   # 인증 스토어 테스트
│   │   ├── hooks/
│   │   │   ├── useAuth.ts          # 인증 훅 (회원가입/로그인/로그아웃)
│   │   │   └── useTasks.ts         # 일감 CRUD + WebSocket 실시간 동기화
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx       # 로그인 페이지
│   │   │   ├── SignupPage.tsx      # 회원가입 페이지
│   │   │   └── BoardPage.tsx       # 칸반 보드 메인 페이지
│   │   └── components/
│   │       ├── KanbanColumn.tsx    # 칸반 컬럼 (droppable)
│   │       ├── TaskCard.tsx        # 일감 카드 (draggable, 인라인 수정)
│   │       ├── CreateTaskModal.tsx  # 일감 생성 모달
│   │       ├── CreateTaskModal.spec.tsx # 모달 컴포넌트 테스트
│   │       ├── ui/                 # 재사용 UI 컴포넌트 ────────
│   │       │   ├── Input.tsx       #   입력 필드 (label, error)
│   │       │   ├── Button.tsx      #   버튼 (primary/secondary, loading)
│   │       │   ├── Modal.tsx       #   모달 오버레이 (ESC 닫기)
│   │       │   └── SearchInput.tsx #   검색 입력 (아이콘 포함)
│   │       └── layout/
│   │           └── AuthLayout.tsx  #   인증 페이지 공통 레이아웃
│   └── tailwind.config.js          # Tailwind 디자인 토큰
└── DOCS.md                         # 상세 기술 문서 (API, 데이터 모델)
```

---

## 3. 기술 스택 및 선택 이유

### 필수 스택 (요구사항 지정)

| 기술 | 용도 |
|------|------|
| TypeScript | 프론트엔드/백엔드 공통 언어 |
| React + Vite | 프론트엔드 UI + 빌드 |
| TanStack Query | 서버 상태 관리 (일감 CRUD 캐싱) |
| Zustand | 클라이언트 상태 관리 (인증 정보) |
| Tailwind CSS | 유틸리티 기반 스타일링 |
| NestJS | 백엔드 프레임워크 |
| MikroORM | 데이터베이스 ORM |
| PostgreSQL | 관계형 데이터베이스 |
| Docker / Docker Compose | 컨테이너 실행 환경 |

### 추가 스택 (선택 이유 명시)

| 기술 | 용도 | 선택 이유 |
|------|------|-----------|
| **Socket.IO** | 실시간 WebSocket 통신 | SSE(단방향)와 달리 양방향 통신 지원, 자동 재연결 및 long polling 폴백 메커니즘 내장 |
| **dnd-kit** | 드래그앤드랍 | 경량(~13KB), React 18+ 호환, 접근성(ARIA) 지원, react-dnd 대비 번들 크기 절약 |
| **Passport + passport-jwt** | JWT 인증 전략 | NestJS 공식 권장 인증 라이브러리, Guard 패턴과 자연스럽게 통합 |
| **bcrypt** | 비밀번호 해싱 | 업계 표준 해싱 알고리즘, salt 자동 생성으로 레인보우 테이블 공격 방지 |
| **class-validator** | DTO 유효성 검증 | NestJS ValidationPipe와 통합, 데코레이터 기반으로 선언적 검증 가능 |

---

## 4. 아키텍처 설계

### 전체 시스템 구성

```
                       ┌─────────────┐
                       │   Nginx     │ :8080
                       │  (Frontend) │
                       └──────┬──────┘
                              │ REST API / WebSocket
                       ┌──────▼──────┐
                       │   NestJS    │ :3000
                       │  (Backend)  │
                       └──────┬──────┘
                              │ MikroORM
                       ┌──────▼──────┐
                       │ PostgreSQL  │ :5432
                       └─────────────┘
```

### 프론트엔드 아키텍처

```
┌─────────────────────────────────────────────────┐
│                   App.tsx (라우터)                │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │LoginPage │  │SignupPage│  │   BoardPage    │ │
│  │          │  │          │  │                │ │
│  │ useAuth  │  │ useAuth  │  │ useTasks       │ │
│  └──────────┘  └──────────┘  │ (TanStack Q)  │ │
│                              │ + WebSocket    │ │
│                              └────────────────┘ │
│                                                 │
│  상태 관리 레이어                                │
│  ┌────────────────┐  ┌────────────────────────┐ │
│  │ Zustand        │  │ TanStack Query         │ │
│  │ (인증 상태)     │  │ (서버 데이터 캐시)      │ │
│  └────────────────┘  └────────────────────────┘ │
│                                                 │
│  UI 컴포넌트 레이어                              │
│  ┌──────┐ ┌──────┐ ┌───────┐ ┌──────────────┐  │
│  │Input │ │Button│ │Modal  │ │ SearchInput  │  │
│  └──────┘ └──────┘ └───────┘ └──────────────┘  │
└─────────────────────────────────────────────────┘
```

### 백엔드 아키텍처 (NestJS 모듈 구조)

```
AppModule
  ├── AuthModule
  │     ├── AuthController  → POST /auth/signup, /auth/login, GET /auth/me
  │     ├── AuthService     → 회원가입/로그인 비즈니스 로직
  │     ├── JwtStrategy     → JWT 토큰 검증 전략 (DIP 적용)
  │     └── JwtAuthGuard    → 인증 가드 (컨트롤러 보호)
  │
  └── TasksModule
        ├── TasksController → GET/POST/PATCH/DELETE /tasks
        ├── TasksService    → CRUD + 낙관적 잠금 동시성 제어
        └── TasksGateway    → WebSocket 이벤트 브로드캐스트
```

### 실시간 동기화 흐름

```
사용자 A가 일감 상태 변경
    │
    ▼
REST API (PATCH /tasks/:id)
    │
    ▼
TasksService.update() → DB 업데이트 + version 증가
    │
    ▼
TasksGateway.broadcastTaskUpdate('task:updated', task)
    │
    ▼ (WebSocket)
모든 연결된 클라이언트가 이벤트 수신
    │
    ▼
useTasks 훅의 socket.on('task:updated') → queryClient.invalidateQueries()
    │
    ▼
TanStack Query가 자동으로 최신 데이터 재조회 → UI 갱신
```

### 동시성 처리: 낙관적 잠금 (Optimistic Locking)

```
사용자 A                    서버 (DB)                   사용자 B
    │                          │                           │
    │── GET /tasks ──────────►│                           │
    │◄── [{id:1, v:1}] ──────│                           │
    │                          │◄── GET /tasks ────────────│
    │                          │── [{id:1, v:1}] ────────►│
    │                          │                           │
    │── PATCH {v:1, DOING} ──►│                           │
    │◄── 200 OK {v:2} ────────│                           │
    │                          │                           │
    │                          │◄── PATCH {v:1, DONE} ─────│
    │                          │── 409 Conflict ──────────►│
    │                          │                           │
    │                          │    사용자 B는 최신 데이터를  │
    │                          │    다시 조회하여 재시도      │
```

---

## 5. 설계 원칙

### SRP (단일 책임 원칙)

각 모듈/컴포넌트는 하나의 명확한 역할만 담당합니다:

| 모듈/컴포넌트 | 단일 책임 |
|--------------|----------|
| `AuthService` | 인증 비즈니스 로직 (회원가입, 로그인, 토큰 발급) |
| `TasksService` | 일감 CRUD 및 동시성 제어 |
| `TasksGateway` | WebSocket 이벤트 브로드캐스트만 담당 |
| `TasksController` | HTTP 요청 라우팅 + 서비스/게이트웨이 조율 |
| `useAuth` 훅 | 인증 관련 뮤테이션 및 사이드 이펙트 |
| `useTasks` 훅 | 일감 서버 상태 관리 + WebSocket 이벤트 구독 |
| `Input`, `Button`, `Modal` | 각각 하나의 UI 요소 렌더링만 담당 |
| `AuthLayout` | 인증 페이지의 공통 레이아웃만 담당 |

### OCP (개방-폐쇄 원칙)

확장에 열려 있고, 수정에 닫혀 있는 구조:

- **`COLUMN_CONFIG`**: 새로운 칸반 상태를 추가할 때 이 객체에만 항목을 추가하면 됨 (KanbanColumn 코드 수정 불필요)
- **`VARIANT_STYLES`**: 새로운 버튼 변형(variant)을 추가할 때 이 매핑에만 추가
- **DTO 패턴**: 새로운 필드 추가 시 DTO에 속성만 추가하면 ValidationPipe가 자동 검증

### DIP (의존성 역전 원칙)

- **Passport Strategy 패턴**: `JwtAuthGuard`는 구체적인 인증 로직을 알지 못하고, `JwtStrategy`라는 추상에 의존. 인증 방식을 변경(예: OAuth)하려면 새로운 Strategy만 교체하면 됨
- **EntityManager 주입**: 서비스는 MikroORM의 `EntityManager`를 생성자 주입받아 사용. 테스트 시 모킹된 EntityManager로 교체하여 DB 의존성 격리
- **훅을 통한 관심사 분리**: 컴포넌트는 API 호출 방식을 알지 못하고, `useTasks`/`useAuth` 훅이 제공하는 인터페이스에만 의존

---

## 6. 설계 리뷰 및 모호한 요구사항

### 6.1 모호한 요구사항 분석

과제 요구사항에서 명확하지 않은 부분과, 각각에 대해 선택한 해석을 정리합니다.

#### Q1. "일감의 상태가 변경되면 다른 사용자에서 화면도 갱신이 되어야 합니다" — 어떤 변경까지 실시간 반영해야 하는가?

| 해석 | 구현 방식 | 장점 | 단점 |
|------|-----------|------|------|
| **상태 변경만** | 드래그앤드랍으로 상태 변경 시만 WebSocket 전송 | 구현 단순 | 제목 변경, 삭제는 새로고침해야 반영 |
| **모든 변경 (채택)** | 생성/수정/삭제 모두 WebSocket으로 브로드캐스트 | UX 일관성 보장 | WebSocket 트래픽 증가 |

**채택 이유**: 칸반 보드는 여러 사람이 동시에 보는 화면이므로, 생성/수정/삭제 모두 실시간으로 반영되어야 사용자 혼란을 방지할 수 있습니다.

#### Q2. "여러 사용자가 동시에 한 일감을 수정했을 때" — 동시성 충돌 시 사용자 경험은 어떻게 해야 하는가?

| 해석 | 구현 방식 | 장점 | 단점 |
|------|-----------|------|------|
| **자동 병합** | 3-way merge로 필드별 자동 병합 | 끊김 없는 UX | 구현 복잡, 의도치 않은 병합 위험 |
| **충돌 알림 + 자동 갱신 (채택)** | 409 반환, alert 표시, 최신 데이터 자동 재조회 | 구현 합리적, 사용자가 인지 가능 | alert이 UX를 방해할 수 있음 |
| **Last-Write-Wins** | 나중 요청이 항상 우선 | 구현 최소 | 데이터 유실 가능성 |

**PO에게 질문할 사항**:
- 충돌 빈도가 높을 것으로 예상되나요? (높다면 자동 병합 고려 필요)
- 충돌 시 사용자에게 "재시도" 버튼을 보여주는 것이 좋을까요, 아니면 자동 갱신으로 충분한가요?

#### Q3. "생성자는 로그인한 사람입니다" — 본인이 만들지 않은 일감도 수정/삭제할 수 있는가?

| 해석 | 구현 방식 | 장점 | 단점 |
|------|-----------|------|------|
| **본인만 수정/삭제** | 서버에서 `task.creator.id === req.user.id` 검사 | 데이터 보호 | 협업 시 불편 |
| **모든 사용자가 수정/삭제 가능 (채택)** | 별도 권한 검사 없음 | 팀 협업에 적합한 칸반 보드 특성 | 실수로 다른 사람의 일감 삭제 가능 |

**채택 이유**: 칸반 보드는 팀 협업 도구이므로, 팀원 누구나 일감 상태를 변경하고 관리할 수 있는 것이 자연스럽습니다. 단, 삭제 시 확인 다이얼로그를 표시하여 실수를 방지합니다.

**PO에게 질문할 사항**:
- 삭제 권한을 생성자에게만 제한하는 것이 필요한가요?
- 관리자 역할(role)이 필요한가요?

#### Q4. Figma 디자인의 정확한 색상/수치

Figma 링크에서 확인한 디자인 가이드라인:
- 보라색 테마 (#7C3AED), 회색 배경 (#F3F3F3)
- 카드형 레이아웃 (16px border-radius)
- 입력 필드 (8px radius), 버튼 (10px radius)

**PO에게 질문할 사항**:
- 모바일 반응형 디자인이 필요한가요? (현재는 데스크탑 3컬럼 고정)
- 다크 모드 지원이 필요한가요?

#### Q5. 검색의 범위와 동작 방식

| 해석 | 구현 방식 | 장점 | 단점 |
|------|-----------|------|------|
| **클라이언트 사이드 필터링** | 전체 데이터를 로드한 후 프론트에서 필터 | 즉각 반응 | 대량 데이터 시 메모리 부담 |
| **서버 사이드 검색 (채택)** | 검색어를 서버에 전송, DB에서 ILIKE 검색 | 대량 데이터 처리 가능 | 네트워크 요청 발생 |

**채택 이유**: task 수가 많아질 경우를 대비하여 서버 사이드 검색을 구현했습니다. TanStack Query가 동일 검색어에 대해 캐싱하므로, 반복 검색 시에는 네트워크 요청이 발생하지 않습니다.

### 6.2 요구사항 충족 현황

| 요구사항 | 상태 | 구현 위치 |
|----------|------|-----------|
| 회원가입/로그인/로그아웃 | ✅ | `AuthService`, `useAuth` |
| JWT 인증 | ✅ | `JwtStrategy`, `JwtAuthGuard` |
| 일감 CRUD (제목, 생성자, 상태) | ✅ | `TasksService`, `TasksController` |
| 드래그앤드랍 상태 변경 | ✅ | `BoardPage` (dnd-kit) |
| 실시간 화면 갱신 | ✅ | `TasksGateway` + `useTasks` WebSocket |
| 동시성 문제 정의 및 해결 | ✅ | 낙관적 잠금 (`version` 필드) |
| Figma 디자인 구현 | ✅ | Tailwind 디자인 토큰, 컴포넌트 |
| `docker compose up` 실행 | ✅ | `docker-compose.yml` |
| 검색 기능 (선택) | ✅ | 서버 사이드 ILIKE 검색 |
| 프론트엔드 테스트 (선택) | ✅ | 9개 테스트 (vitest) |
| 백엔드 테스트 (선택) | ✅ | 18개 테스트 (jest) |
| API 문서 | ✅ | `DOCS.md` |
| 데이터 모델 설계 및 설명 | ✅ | `DOCS.md` |
| AI 사용 내역 | ✅ | 아래 참조 |

---

## 7. 프로덕션 환경을 위한 발전 방향

현재 구현은 과제 요구사항을 충족하는 MVP입니다. 프로덕션 환경으로 발전시키기 위해 고려할 사항들을 정리합니다.

### 보안 강화

| 항목 | 현재 | 개선 방향 |
|------|------|-----------|
| JWT 토큰 저장 | localStorage | httpOnly 쿠키로 변경 (XSS 방지) |
| JWT 만료 | 무기한 | Access Token (15분) + Refresh Token (7일) 도입 |
| 비밀번호 정책 | 6자 이상 | 대소문자/숫자/특수문자 조합 요구, rate limiting |
| CORS | 단일 오리진 | 환경별 오리진 목록 관리 |
| WebSocket 인증 | 미인증 | 연결 시 JWT 토큰 검증 미들웨어 추가 |

### 성능 최적화

| 항목 | 현재 | 개선 방향 |
|------|------|-----------|
| DB 쿼리 | 전체 조회 | 페이지네이션 + 인덱싱 |
| 검색 | ILIKE | Full-text search (pg_trgm 또는 Elasticsearch) |
| 캐싱 | TanStack Query만 | Redis 캐싱 레이어 추가 |
| WebSocket | 전체 브로드캐스트 | Room 기반 (보드/프로젝트별 구독) |

### 기능 확장

- **일감 상세**: 설명, 마감일, 우선순위, 라벨, 첨부파일
- **컬럼 내 순서**: 같은 컬럼 안에서 드래그로 순서 변경 (order 필드 추가)
- **다중 보드**: 프로젝트별 보드 분리
- **권한 관리**: 관리자/멤버 역할 분리
- **알림**: 멘션, 상태 변경 알림 (이메일 또는 인앱)
- **활동 로그**: 일감 변경 이력 추적 (audit log)

### 인프라 개선

- **CI/CD**: GitHub Actions로 테스트/빌드/배포 자동화
- **모니터링**: 로깅 (Winston/Pino), APM (Datadog/Sentry)
- **환경 분리**: 개발/스테이징/프로덕션 환경 설정 분리
- **데이터베이스**: MikroORM 마이그레이션 도입 (updateSchema 대체)
- **모노레포**: npm workspaces 또는 Turborepo로 shared 패키지 분리

---

## 8. 테스트

### 백엔드 테스트 (Jest)

```bash
cd backend && npm test
```

| 테스트 스위트 | 테스트 수 | 설명 |
|--------------|----------|------|
| `AuthService` | 7개 | 회원가입/로그인/사용자 검증 |
| `TasksService` | 11개 | CRUD + 낙관적 잠금 충돌 감지 |

### 프론트엔드 테스트 (Vitest)

```bash
cd frontend && npx vitest run
```

| 테스트 스위트 | 테스트 수 | 설명 |
|--------------|----------|------|
| `CreateTaskModal` | 4개 | 모달 렌더링, 제출, 취소 동작 |
| `authStore` | 5개 | Zustand 스토어 상태 관리 |

### 테스트 작성 규칙

- `describe`/`it`에 한국어 서술형 문구 사용 (예: `'모든 일감을 생성일 기준 오름차순으로 반환한다.'`)
- 단위 테스트: 서비스 로직의 정상/에러 경로를 모두 검증
- 의존성 격리: `jest.fn()`, `vi.fn()`으로 외부 의존성 모킹

---

## 9. AI 사용 내역

이 프로젝트의 **모든 코드는 AI(Claude)가 작성**했습니다.

| 영역 | AI 작성 범위 |
|------|-------------|
| 프로젝트 구조 설계 | 전체 |
| 백엔드 코드 | NestJS 모듈, 엔티티, 서비스, 컨트롤러, WebSocket 게이트웨이 |
| 프론트엔드 코드 | React 컴포넌트, 커스텀 훅, Zustand 스토어, Tailwind 스타일 |
| Docker 설정 | Dockerfile, docker-compose.yml, nginx.conf |
| 테스트 코드 | 백엔드 18개 + 프론트엔드 9개 |
| 문서 | README.md, DOCS.md |

사용자(개발자)가 요구 사항을 정의하고 기술 스택을 지정하면, AI가 이를 기반으로 전체 구현을 수행했습니다.
