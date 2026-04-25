# 혼술스팟 🍶

혼술러가 검증한 혼술 성지 지도 — Next.js 14 + 카카오맵 API

## 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 카카오맵 API 키 설정

1. [카카오 디벨로퍼스](https://developers.kakao.com) 접속 후 앱 생성
2. **플랫폼 → Web** 에 `http://localhost:3000` 등록
3. **앱 키 → JavaScript 키** 복사
4. `.env.local.example` → `.env.local` 로 복사 후 키 입력

```bash
cp .env.local.example .env.local
# .env.local 열어서 키 입력
```

### 3. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000
```

## 프로젝트 구조

```
honsulmap/
├── app/
│   ├── layout.tsx        # 카카오맵 스크립트 로드
│   ├── page.tsx          # 메인 페이지 (필터 + 지도 + 목록)
│   ├── page.module.css
│   └── globals.css
├── components/
│   ├── KakaoMap.tsx      # 카카오맵 컴포넌트
│   ├── BarCard.tsx       # 사이드바 바 카드
│   ├── BarCard.module.css
│   ├── BarDetail.tsx     # 바 상세 패널
│   └── BarDetail.module.css
└── lib/
    └── data.ts           # 바 목업 데이터 + 타입
```

## 다음 단계 (TODO)

- [ ] 실제 DB 연동 (Supabase / PlanetScale)
- [ ] 유저 리뷰/태그 투표 API
- [ ] 바 제보 폼
- [ ] 지역 검색 (카카오맵 Geocoding API)
- [ ] 로그인 (혼술 기록, 즐겨찾기)
- [ ] 관리자 어드민 (바 등록/승인)

## 환경

- Next.js 14 (App Router)
- TypeScript
- CSS Modules
- 카카오맵 JavaScript SDK v2
