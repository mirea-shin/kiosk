# Contributing Guide

## 브랜치 전략

`main` 브랜치에서 직접 작업하지 않고, 기능 브랜치를 만들어 작업 후 머지합니다.

### 브랜치 네이밍

```
{type}/{app}/{설명}
```

| app | 대상 |
|-----|------|
| `kiosk` | apps/kiosk |
| `admin` | apps/admin |
| `server` | server |
| `shared` | packages/shared |
| `root` | 루트 설정 (pnpm, tsconfig 등) |

**예시**
```
feat/kiosk/menu-screen
feat/admin/order-management
feat/server/menu-api
fix/server/order-query-error
chore/shared/order-type-update
chore/root/ci-setup
```

## 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 따릅니다.

```
{type}({scope}): {설명}
```

### type

| type | 사용 시점 |
|------|-----------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `chore` | 빌드/설정/패키지 변경 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `style` | UI/CSS 변경 |
| `docs` | 문서 |

### scope

브랜치의 `{app}`과 동일하게 사용합니다: `kiosk`, `admin`, `server`, `shared`, `root`

**예시**
```
feat(kiosk): 메뉴 목록 화면 추가
fix(server): 주문 조회 시 500 오류 수정
chore(shared): OrderItem 타입에 notes 필드 추가
chore(root): dev:all 스크립트 추가
```

## packages/shared 변경 시 주의

`packages/shared` 타입 변경은 세 앱 모두에 영향을 줍니다.
관련 앱 변경과 커밋을 분리하거나, 한 커밋에 묶을 경우 영향 범위를 메시지에 명시합니다.

```
chore(shared): Menu에 image_url 필드 추가 및 각 앱 반영
```

## 워크플로우

```bash
# 1. 브랜치 생성
git checkout -b feat/server/menu-api

# 2. 작업 후 커밋
git add server/src/routes/menu.ts
git commit -m "feat(server): 메뉴 목록 조회 API 추가"

# 3. main에 머지
git checkout main
git merge feat/server/menu-api
git branch -d feat/server/menu-api
```
