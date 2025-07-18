<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">KBO Lookalike</h3>

  <p align="center">
    KBO 선수들과 닮은꼴 찾기 AI 서비스
    <br />
    MediaPipe와 Face-API.js를 활용한 얼굴 인식 시스템
  </p>
</div>

<!-- ABOUT THE PROJECT -->

## About The Project

<img width="1748" height="1088" alt="스크린샷 2025-07-18 오전 10 08 27" src="https://github.com/user-attachments/assets/ad0a6a90-1d2f-4085-b494-1331d4804bfb" />

KBO 선수들과 닮은꼴을 찾는 AI 서비스
<br />
모든 AI 모델과 유사도 계산이 클라이언트 사이드에서 실행되어 서버 없이도 완전히 로컬에서 동작하며, 사용자의 개인정보가 외부로 전송되지 않습니다.
MediaPipe와 Face-API.js 두 가지 얼굴 인식 모델을 사용하여 UI와 유사도 분석을 제공합니다.

**🌐 Demo**: [lookalike.naco.kr](https://lookalike.naco.kr/)

### 주요 기능

- **다중 모델 얼굴 인식**: MediaPipe와 Face-API.js를 동시에 활용
- **유사도 기반 매칭**: 코사인 유사도와 유클리드 거리를 활용한 정확한 매칭
- **KBO 선수 데이터베이스**: 17명의 KBO 선수 얼굴 임베딩 데이터
- **임베딩 생성 도구**: 새로운 선수 데이터 추가를 위한 임베딩 생성기
- **반응형 UI**: Chakra UI와 Tailwind CSS를 활용한 인터페이스

### Built With

- [![React][React.js]][React-url]
- [![TypeScript][TypeScript]][TypeScript-url]
- [![Vite][Vite.js]][Vite-url]
- [![Chakra UI][Chakra.css]][Chakra-url]
- [![Tailwind][Tailwind.css]][Tailwind-url]
- [![MediaPipe][MediaPipe.css]][MediaPipe-url]
- [![Face-API.js][FaceAPI.css]][FaceAPI-url]
- [![TensorFlow.js][TensorFlow.css]][TensorFlow-url]

<!-- GETTING STARTED -->

## Getting Started

로컬 환경에서 프로젝트를 설정하는 방법입니다.

### Prerequisites

- Node.js 18.0.0 이상
- npm, yarn, pnpm 또는 bun

### Installation

1. 저장소 클론
   ```sh
   git clone https://github.com/naco0406/kbo-lookalike.git
   ```
2. 프로젝트 디렉토리로 이동
   ```sh
   cd kbo-lookalike
   ```
3. 의존성 설치
   ```sh
   npm install
   ```
4. 개발 서버 실행
   ```sh
   npm run dev
   ```
5. 브라우저에서 [http://localhost:5173](http://localhost:5173) 열기

### Build

```bash
npm run build
npm run preview
```

<!-- PROJECT STRUCTURE -->

## Project Structure

```
src/
├── components/          # React 컴포넌트
│   ├── FaceDetection/  # 얼굴 인식 관련
│   └── EmbeddingGenerator/ # 임베딩 생성 도구
├── services/           # 데이터 서비스
├── utils/              # 유틸리티 함수
├── types/              # TypeScript 타입 정의
└── models/             # AI 모델 초기화
```

## Data Structure

주요 데이터 타입:

- `KBOPlayer`: 선수 정보 (이름, 팀, 이미지, 임베딩)
- `MatchResult`: 매칭 결과 (선수, 유사도 점수)
- `MultiModelDetectionResult`: 다중 모델 처리 결과

<!-- AI MODELS -->

## AI Models

### MediaPipe Face Mesh

- **용도**: 얼굴 랜드마크 감지 및 3D 메시 생성 → UI에 얼굴 인식 표시
- **특징**: 468개의 3D 랜드마크 포인트
- **유사도 계산**: 유클리드 거리 기반

### Face-API.js

- **용도**: 얼굴 감지 및 128차원 임베딩 벡터 생성 → 실제 유사도 검사
- **특징**: SSD MobileNet 기반 얼굴 감지
- **유사도 계산**: 코사인 유사도 기반

### 클라이언트 사이드 AI 처리 전략

#### 모델 로딩 최적화

- **CDN 활용**: MediaPipe 모델을 CDN에서 동적 로딩하여 초기 번들 크기 최소화
- **지연 로딩**: 모델을 필요할 때만 로드하여 초기 로딩 시간 단축
- **모델 캐싱**: 브라우저 캐시를 활용하여 재방문 시 빠른 로딩

#### 성능 최적화

- **WebGL 가속**: TensorFlow.js의 WebGL 백엔드를 활용한 GPU 가속 처리
- **메모리 관리**: 모델 사용 후 적절한 메모리 해제로 브라우저 성능 유지
- **비동기 처리**: 모델 초기화와 추론을 비동기로 처리하여 UI 블로킹 방지

#### 데이터 전략

- **사전 계산된 임베딩**: 선수 이미지의 임베딩을 미리 계산하여 JSON으로 저장
- **압축된 모델**: 모델 파일을 최적화하여 다운로드 크기 최소화
- **프로그레시브 로딩**: 모델과 데이터를 단계적으로 로드하여 사용자 경험 개선

<!-- DEVELOPMENT -->

## Development

### 코드 스타일

- ESLint 설정 사용
- TypeScript 엄격 모드
- Chakra UI + Tailwind CSS 조합

### 주요 유틸리티

- `multiModelUtils.ts`: MediaPipe와 Face-API.js 통합 처리
- `faceUtils.ts`: 얼굴 인식 관련 유틸리티 함수
- `imageUtils.ts`: 이미지 처리 및 변환 유틸리티

### 정적 파일

- `/public/models/`: AI 모델 파일들
- `/public/data/`: 선수 임베딩 데이터
- `/public/images/`: 선수 이미지 파일들

<!-- LICENSE -->

## License

Private

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Vite.js]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev/
[Chakra.css]: https://img.shields.io/badge/Chakra%20UI-319795?style=for-the-badge&logo=chakraui&logoColor=white
[Chakra-url]: https://chakra-ui.com/
[Tailwind.css]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[MediaPipe.css]: https://img.shields.io/badge/MediaPipe-4285F4?style=for-the-badge&logo=google&logoColor=white
[MediaPipe-url]: https://mediapipe.dev/
[FaceAPI.css]: https://img.shields.io/badge/Face--API.js-000000?style=for-the-badge&logo=javascript&logoColor=white
[FaceAPI-url]: https://github.com/justadudewhohacks/face-api.js/
[TensorFlow.css]: https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white
[TensorFlow-url]: https://www.tensorflow.org/
