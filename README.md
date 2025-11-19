# Mapnefit

<div align="center">
  <img src="public/images/icon.png" width="200" height="auto" />
  <br>

<b>mapnefit</b>

</div>

## 🧑‍🏫 프로젝트 소개

<div align="center">
<h2>통신사 멤버십 할인 정보를 한눈에 보여주는 위치 기반 서비스</h2>
</div>
통신사 혜택을 잘 몰라서 놓치는 사용자를 위해, 주변의 할인 매장을 빠르게 찾고
즐겨찾기로 나만의 혜택을 관리할 수 있습니다.


## Getting Started
```
npm install
npm run dev
```




## 주요 기능

1) 지도 기반 할인 매장 탐색
2) ai 챗봇 상담
3) 멤버십(쿠폰) 관리
4) 즐겨찾기 기반 개인 맞춤 서비스

## 기대 효과

- 복잡한 멤버십 혜택을 한 화면에서 비교 가능
- 위치 기반으로 근처의 혜택을 실시간 탐색
- 쿠폰 및 멤버십 등록을 통한 혜택 소비 효율 증가

<div align="center"><a href="https://mapnefit.vercel.app"><b>배포 링크</b></a></div>

## 🙋🏻‍♀️ Our Teams

<div align="center">
  <table>
    <tr>
      <td align="center">이승규</td>
      <td align="center">오다현</td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/tmdrb0130">:link: Github</a></td>
      <td align="center"><a href="https://github.com/dahyuniiiiii">:link: Github</a></td>
    </tr>
  </table>
</div>

## 🧑‍💻 Tech Stacks

<div align="center">
<h3>[ Frontend ]</h3>
<img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=React&logoColor=black">
<img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=Next.js&logoColor=white">
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=TypeScript&logoColor=white">
<img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=TailwindCSS&logoColor=white">
<img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white">
<img src="https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white">
<img src="https://img.shields.io/badge/Kakao_Map_API-FFCD00?style=flat&logo=kakaotalk&logoColor=000000">
<img src="https://img.shields.io/badge/Kakao_Login-FFCD00?style=flat&logo=kakaotalk&logoColor=black">
<img src="https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white">
</div>

## 📁 프로젝트 구조

```
mapnefit/
├── public/
│   └── images/
│       ├── button_Icon/             # 즐겨찾기/네비게이션 버튼 아이콘
│       ├── category_icon/           # 카테고리(카페·편의점·문화 등) 아이콘
│       └── MapMarker/               # 지도 마커 이미지
├── src/
│   ├── app/                         # Next.js App Router 엔트리
│   │   │  favicon.ico
│   │   │  globals.css
│   │   │  layout.tsx                # 루트 레이아웃
│   │   │  manifest.ts
│   │   │  page.tsx                  # 랜딩 페이지
│   │   │
│   │   ├── (auth)/signup/           # 회원가입 플로우
│   │   │   ├── page.tsx             # 통신사/등급 선택 화면
│   │   │   ├── SelectClient.tsx
│   │   │   ├── complete/            # 회원가입 완료 화면
│   │   │   └── grade/               # 멤버십 등급 선택 화면
│   │   │
│   │   ├── (main)/                  # 서비스 메인 레이아웃
│   │   │   ├── layout.tsx
│   │   │   ├── map/                 # 지도·혜택 탐색 화면
│   │   │   │   ├── KakaoMap.tsx     # react-kakao-maps-sdk를 사용해 실제 지도를 렌더링하고
│   │   │   │   │                    # 중심 좌표/줌/이벤트(드래그, 클릭 등)를 직접 제어하는 Low-level 컴포넌트
│   │   │   │   │   
│   │   │   │   ├── MapContainer.tsx # 지도 화면의 상위 컨테이너
│   │   │   │   │                    # 서버에서 매장/즐겨찾기 데이터를 불러오고
│   │   │   │   │                    # 카테고리 필터, 선택된 매장, 바텀시트 오픈 상태 등을 관리하며
│   │   │   │   │                    # KakaoMap + 오버레이 + BottomSheet를 조합하는 화면 단위 컴포넌트
│   │   │   │   │   
│   │   │   │   ├── BottomSheet/     # 매장 상세/추천 바텀시트
│   │   │   │   ├── overlays/        # 카테고리 칩, 내 위치 버튼, 반경 표시 등 지도 위 UI
│   │   │   │   └── search/          # 매장 검색 및 결과 페이지
│   │   │   ├── chatbot/             # 통신사 혜택 AI 챗봇
│   │   │   ├── membership/          # 멤버십/쿠폰 등록 및 관리
│   │   │   └── mypage/              # 마이페이지(프로필, 즐겨찾기, 문의 등)
│   │   │
│   │   └── api/                     # Next.js API Routes (BFF & 프록시)
│   │       ├── auth/                # 카카오 로그인·회원 정보·탈퇴
│   │       │   ├── kakao/callback
│   │       │   ├── kakao/quit
│   │       │   ├── logout
│   │       │   ├── me
│   │       │   └── signup/complete
│   │       ├── chatbot/chat         # AI 챗봇 백엔드 연동
│   │       ├── contact              # 문의 등록 API
│   │       ├── membership/          # 멤버십 카드번호 등록/수정
│   │       ├── proxy                # Spring 서버 프록시 엔드포인트
│   │       └── user/update          # 유저 정보 수정
│   │
│   ├── components/                  # 공통 UI 컴포넌트
│   │   ├── button/
│   │   ├── common/
│   │   ├── modal/
│   │   └── selectmenu/
│   ├── contexts/                    # AuthContext 등 전역 컨텍스트
│   ├── lib/                         # 공통 유틸·SDK 래퍼
│   ├── services/                    # 즐겨찾기, 매장, 멤버십 등 API 클라이언트
│   └── types/                       # 전역 타입 정의 (User, Place, Membership 등)
├── eslint.config.mjs
├── next.config.ts
├── tsconfig.json
└── README.md
```
