# Kiosk System

> 카페 · 식당을 위한 셀프 주문 키오스크 풀스택 시스템

고객용 키오스크 앱, 점주용 어드민 대시보드, REST API 서버로 구성된 모노레포 프로젝트입니다.

<br>

## 체험하기 

  | 구분 | 링크 |                                                                                                
  | :--- | :--- |
  | **어드민 대시보드** | [kiosk-admin-three.vercel.app](https://kiosk-admin-three.vercel.app) |               
  | **키오스크 앱** | [📥 최신 버전 다운로드 (GitHub Releases)](https://github.com/mireashin/kiosk/releases/latest) |

  어드민 대시보드를 자유롭게 수정해보세요.
  사이드바 하단 **초기화** 버튼으로 메뉴 · 스크린세이버 · 브랜드 설정을 기본값으로 되돌릴 수 있습니다.

  ### 키오스크 앱 설치

  Releases 페이지에서 운영체제에 맞는 파일을 받으세요.

  - macOS: `.dmg`
  - Windows: `.exe`
  - Linux: `.AppImage`

  > **macOS** — "손상되었거나 열 수 없음" 메시지가 뜨면 터미널에서 아래 명령어 실행 후 다시 여세요.
  > ```bash
  > xattr -cr /Applications/Kiosk.app
  > ```

  > **Windows** — "Windows가 PC를 보호했습니다" 창이 뜨면 **추가 정보 → 실행**을 클릭하세요.

  > 키오스크 앱은 배포된 서버에 연결된 빌드 기준입니다. 로컬 개발은 [시작하기](#시작하기)를 참고하세요.

<br>

## 화면 구성

### 키오스크 (고객용)

| 스크린세이버 | 메뉴 선택 | 장바구니 | 주문 완료 |
|:-----------:|:--------:|:-------:|:--------:|
| <img width="216" height="384" alt="screensaver" src="https://github.com/user-attachments/assets/87b291c6-4136-4d18-9625-cef6ab7c95f0" /> | <img width="216" height="384" alt="menu" src="https://github.com/user-attachments/assets/e34348a3-2ab3-4420-a33b-743a4b360949" />|<img width="216" height="384" alt="cart" src="https://github.com/user-attachments/assets/ec8b0bf9-4cfd-4fd0-8fb0-f57a47c1c3ac" />|<img width="216" height="384" alt="complete" src="https://github.com/user-attachments/assets/6b519eff-c151-4614-a0f4-0ebf0100dd00" />|

### 어드민 대시보드 (점주용)

| **주문 관리** | **메뉴 관리** |
| :---: | :---: |
|<img width="3420" height="1724" alt="admin_order" src="https://github.com/user-attachments/assets/e80289b5-8cf4-4b27-9334-404545da61f3" />|<img width="3420" height="1724" alt="admin_menu" src="https://github.com/user-attachments/assets/23de96b8-fe78-49ca-b39f-3a30f96f6f26" />|
| **스크린세이버 설정** | **브랜딩** |
|<img width="3420" height="1724" alt="admin_screensaver" src="https://github.com/user-attachments/assets/b1e76b97-c56c-4731-9c50-87c8a5ea57a9" />| <img width="3420" height="1724" alt="admin_brand" src="https://github.com/user-attachments/assets/b667f122-5eb1-4ad6-af7a-5abee210f1ce" />|
<br>

## 주요 기능

**키오스크 앱**
- 스크린세이버 → 메뉴 선택 → 옵션 선택 → 장바구니 → 주문 완료 플로우
- 일정 시간 미입력 시 스크린세이버 자동 전환 (idle timeout)
- 메뉴 옵션(사이즈, 추가 토핑 등) 선택 모달

**어드민 대시보드**
- 실시간 주문 수신 및 상태 관리 (대기 → 접수 → 준비중 → 완료)
- 실시간 메뉴 · 카테고리 CRUD 및 드래그 앤 드롭 정렬
- 스크린세이버 미디어(이미지/영상) 업로드 · 순서 변경 · 게시
- 브랜드 컬러 설정

**공통**
- WebSocket 기반 실시간 동기화 (주문 발생 즉시 어드민에 반영, 메뉴 변경 즉시 키오스크에 반영)
    - 🔄 주문 상태 동기화
    - ![order_sync](https://github.com/user-attachments/assets/2c48047d-6ca3-4f4f-a275-baffa59a099a)

    - 🍔 메뉴 변경 실시간 반영
    - ![menu_sync](https://github.com/user-attachments/assets/16564f82-cd1f-49f5-b428-52cf83cdcac0)
 
    - 🎨 브랜딩 / 테마 변경
    - ![branding_sync](https://github.com/user-attachments/assets/08cb5b81-a2f8-41e5-8c24-0c28c6b22196)


- Railway를 통한 서버 배포

<br>

## 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|----------|
| **키오스크** | Electron 34 + React 19 + Vite | 웹 기술로 데스크톱 앱 구현 |
| **어드민** | Next.js 15 (App Router) | 파일 기반 라우팅, SSR · 정적 최적화 |
| **서버** | Hono + better-sqlite3 | 경량 고성능 API 프레임워크, 단일 파일 DB로 배포 단순화 |
| **상태 관리** | Zustand + TanStack Query | 클라이언트 UI 상태(Zustand)와 서버 데이터(Query) 책임 분리 |
| **스타일** | Tailwind CSS v4 | 최신 CSS-first 구성, 별도 설정 파일 불필요 |
| **모노레포** | pnpm workspace | 패키지 간 타입 공유, 의존성 중복 설치 방지 |
| **실시간** | WebSocket (`@hono/node-ws`) | 상태 변경 즉시 화면 갱신 |

<br>

## 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    pnpm monorepo                     │
│                                                      │
│  ┌──────────────────┐     ┌──────────────────────┐  │
│  │   apps/kiosk     │     │     apps/admin       │  │
│  │  Electron + React│     │      Next.js 15      │  │
│  │  (1080 × 1920px) │     │  (어드민 대시보드)    │  │
│  └────────┬─────────┘     └──────────┬───────────┘  │
│           │  REST API + WebSocket     │              │
│           └──────────────┬───────────┘              │
│                          │                           │
│              ┌───────────▼──────────┐               │
│              │       server/        │               │
│              │  Hono + SQLite       │               │
│              │  (REST API + WS)     │               │
│              └──────────────────────┘               │
│                                                      │
│              ┌──────────────────────┐               │
│              │   packages/shared    │               │
│              │  TypeScript 타입 공유 │               │
│              └──────────────────────┘               │
└─────────────────────────────────────────────────────┘
```




<br>

## 기술적 구현 포인트

### 1. 모노레포 타입 공유

`packages/shared`에 도메인 타입(`Menu`, `Order`, `OrderStatus` 등)을 정의하고, 세 앱이 빌드 단계 없이 직접 소스를 참조합니다. 각 앱은 `tsconfig paths`, Vite alias, `transpilePackages` 세 레이어를 통해 일관되게 해석합니다.

### 2. WebSocket 실시간 동기화

주문 생성 API 응답 후 `wsManager.broadcast()`로 모든 연결 클라이언트에 즉시 이벤트를 전파합니다. 어드민은 WebSocket 메시지를 수신하면 TanStack Query 캐시를 무효화하여 주문 목록을 자동 갱신합니다.

### 3. 스크린세이버 게시 워크플로우

미디어 업로드 · 순서 변경 · 설정 수정은 `changelog` 테이블에 임시 기록되고, 점주가 명시적으로 "게시"를 누를 때 키오스크에 반영됩니다. 미적용 변경사항을 구분하여 실수로 반영되는 것을 방지합니다.

<br>

## 시작하기 <a id="start"></a>

### 요구사항

- Node.js 20+
- pnpm 9+

### 설치 및 실행

```bash
git clone https://github.com/your-username/kiosk.git
cd kiosk
pnpm install
```

```bash
# 서버 실행 (port 3001)
pnpm server:dev

# 어드민 대시보드 실행 (port 3000)
pnpm admin:dev

# 키오스크 앱 실행 (Electron)
pnpm kiosk:dev
```


<br>

## 프로젝트 구조

```
kiosk/
├── apps/
│   ├── kiosk/               # Electron 키오스크 앱
│   │   ├── electron/        # Main process (IPC, 창 관리)
│   │   └── src/
│   │       ├── screens/     # 스크린세이버, 메뉴, 장바구니, 주문완료
│   │       ├── stores/      # Zustand 장바구니 상태
│   │       └── components/  # 공통 UI 컴포넌트
│   └── admin/               # Next.js 어드민 대시보드
│       └── src/app/
│           ├── orders/      # 주문 관리
│           ├── menu/        # 메뉴 관리
│           ├── screensaver/ # 스크린세이버 설정
│           └── branding/    # 브랜드 컬러
├── server/
│   └── src/
│       ├── routes/          # API 라우트
│       ├── ws-manager.ts    # WebSocket 브로드캐스트
│       └── db.ts            # SQLite 스키마 및 쿼리
└── packages/
    └── shared/              # 공유 TypeScript 타입
```
