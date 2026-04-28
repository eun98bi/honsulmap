import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "혼술스팟 — 혼술러가 검증한 혼술 성지 지도",
  description: "오늘 밤 나만의 혼술 장소를 찾아보세요. 고독형·소통형·혼합형 필터로 내 기분에 맞는 바를 찾습니다. 혼술바 지도, 혼술맵.",
  keywords: ["혼술", "혼술 바", "서울 바", "혼술스팟", "혼술 성지", "서울 혼술", "혼술 장소"],
  openGraph: {
    title: "혼술스팟 — 혼술러가 검증한 혼술 성지 지도",
    description: "오늘 밤 나만의 혼술 장소를 찾아보세요. 고독형·소통형·혼합형 필터로 내 기분에 맞는 바를 찾습니다.",
    type: "website",
    locale: "ko_KR",
    siteName: "혼술스팟",
  },
  twitter: {
    card: "summary",
    title: "혼술스팟",
    description: "혼술러가 검증한 혼술바 지도",
  },

  verification: {
    other: {
      'naver-site-verification': '56d92e03706866a3bdc1f0701be36f50f1033879',
      'google-adsense-account': 'ca-pub-9627798603529985',
    },
  },
  
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  return (
    <html lang="ko">
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-P18ZELCWRH"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-P18ZELCWRH');
            `,
          }}
        />
        <script
          type="text/javascript"
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`}
          async
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}