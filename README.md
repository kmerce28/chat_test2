# AI 채팅 애플리케이션

Gemini API와 Context7 MCP를 활용한 실시간 AI 채팅 애플리케이션입니다.

## 주요 기능

- 🤖 **Gemini API 연동**: Google의 Gemini 2.0 Flash 모델 사용
- 📚 **Context7 MCP 지원**: 최신 문서와 코드 예제 통합
- ⚡ **실시간 스트리밍**: SSE를 통한 실시간 응답
- 💾 **로컬 저장**: localStorage를 통한 세션 저장
- 🎨 **모던 UI**: Tailwind CSS와 shadcn/ui 컴포넌트
- 📱 **반응형 디자인**: 모바일과 데스크톱 지원

## 시작하기

### 1. 환경 설정

```bash
# 의존성 설치
pnpm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 Gemini API 키를 설정하세요:

```env
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.0-flash-001
```

### 3. Context7 MCP 설정 (선택사항)

Context7 MCP를 사용하려면 `.cursor/mcp.json` 파일을 설정하세요:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_CONTEXT7_API_KEY"]
    }
  }
}
```

### 4. 개발 서버 실행

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인하세요.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui
- **AI 모델**: Google Gemini 2.0 Flash
- **MCP**: Context7
- **패키지 매니저**: pnpm

## 프로젝트 구조

```
├── app/
│   ├── api/chat/stream/    # 스트리밍 API 엔드포인트
│   ├── layout.tsx          # 루트 레이아웃
│   └── page.tsx           # 메인 채팅 페이지
├── lib/
│   ├── env.ts             # 환경 변수 관리
│   └── utils.ts           # 유틸리티 함수
└── .cursor/
    └── mcp.json           # MCP 서버 설정
```

## 사용법

1. **기본 채팅**: 텍스트를 입력하고 전송 버튼을 클릭
2. **스트리밍 응답**: AI의 응답이 실시간으로 표시됩니다
3. **세션 저장**: 대화 내용이 자동으로 localStorage에 저장됩니다
4. **중지 기능**: 응답 생성 중 중지 버튼으로 취소 가능

## 배포

Vercel을 통한 배포를 권장합니다:

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

## 보안 주의사항

- API 키는 환경 변수로만 관리하세요
- 공용 PC에서는 민감한 정보 입력을 피하세요
- 프로덕션 환경에서는 HTTPS를 사용하세요

## 라이선스

MIT License
