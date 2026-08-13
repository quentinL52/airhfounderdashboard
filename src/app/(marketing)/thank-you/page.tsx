'use client';

import { useTranslations } from 'next-intl';
import { Mail, Linkedin, Twitter, Rocket } from 'lucide-react';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function ThankYouPage() {
  const t = useTranslations('landing');
  const accent = "hsl(11,86%,56%)";

  return (
    <div style={{ background: "hsl(42,24%,88%)", color: "hsl(215,52%,12%)", fontFamily: '"IBM Plex Sans", system-ui, sans-serif', minHeight: '100vh' }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "hsl(42,24%,88%, 0.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid hsl(215,52%,12%, 0.1)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/helmdash-mark-navy-512.png" alt="Helmdash Icon" style={{ width: 26, height: 26 }} />
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, fontSize: 18, letterSpacing: "-0.5px" }}>Helmdash</span>
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            <LanguageSwitcher iconColor="hsl(215,52%,12%)" />
            <Link href="/" className="hover:-translate-y-[1px] hover:shadow-[0_6px_16px_hsla(215,52%,12%,0.22)] transition-all" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, fontWeight: 600, background: "hsl(215,52%,12%)", color: "hsl(42,33%,93%)", padding: "9px 16px", borderRadius: 8 }}>{t('nav.join')}</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "120px 32px" }}>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, letterSpacing: "1.5px", color: accent, fontWeight: 600 }}>THANK YOU</span>
        <h1 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "clamp(32px,4vw,48px)", fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1.1, margin: "10px 0 20px" }}>
          {t('thankYou.title')}
        </h1>
        
        <p style={{ fontSize: 18, lineHeight: 1.6, color: "hsl(214,15%,34%)", marginBottom: 16 }}>
          {t('thankYou.message1')}
          <br />
          <br />
          {t('thankYou.message2')}
        </p>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: "hsl(214,15%,34%)", marginBottom: 40 }}>
          {t('thankYou.impatient')}
        </p>

        <p style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 14, color: "hsl(215,52%,12%)", marginBottom: 16, fontWeight: 500 }}>
          {t('thankYou.followUs')}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <a href="mailto:hello@helmdash.app" className="hover:-translate-y-[2px] transition-all" style={{ display: "flex", alignItems: "center", gap: 16, background: "hsl(42,33%,93%)", padding: "24px", borderRadius: 16, border: "1px solid hsl(215,52%,12%, 0.1)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "hsl(215,52%,12%, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(215,52%,12%)" }}>
              <Mail size={24} />
            </div>
            <div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: "hsl(214,15%,34%)", marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "hsl(215,52%,12%)" }}>hello@helmdash.app</div>
            </div>
          </a>

          <a href="https://www.indiehackers.com/product/helmdash" target="_blank" rel="noreferrer" className="hover:-translate-y-[2px] transition-all" style={{ display: "flex", alignItems: "center", gap: 16, background: "hsl(42,33%,93%)", padding: "24px", borderRadius: 16, border: "1px solid hsl(215,52%,12%, 0.1)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "hsl(215,52%,12%, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(215,52%,12%)" }}>
              <Rocket size={24} />
            </div>
            <div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: "hsl(214,15%,34%)", marginBottom: 4 }}>Indie Hackers</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "hsl(215,52%,12%)" }}>Helmdash</div>
            </div>
          </a>

          <a href="https://www.producthunt.com/products/helmdash" target="_blank" rel="noreferrer" className="hover:-translate-y-[2px] transition-all" style={{ display: "flex", alignItems: "center", gap: 16, background: "hsl(42,33%,93%)", padding: "24px", borderRadius: 16, border: "1px solid hsl(215,52%,12%, 0.1)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "hsl(215,52%,12%, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F28A2E" }}>
              <span style={{ fontSize: 24, fontWeight: 800 }}>P</span>
            </div>
            <div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: "hsl(214,15%,34%)", marginBottom: 4 }}>Product Hunt</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "hsl(215,52%,12%)" }}>Helmdash</div>
            </div>
          </a>

          <a href="https://www.linkedin.com/company/helmdashapp" target="_blank" rel="noreferrer" className="hover:-translate-y-[2px] transition-all" style={{ display: "flex", alignItems: "center", gap: 16, background: "hsl(42,33%,93%)", padding: "24px", borderRadius: 16, border: "1px solid hsl(215,52%,12%, 0.1)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "hsl(215,52%,12%, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(215,52%,12%)" }}>
              <Linkedin size={24} />
            </div>
            <div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: "hsl(214,15%,34%)", marginBottom: 4 }}>LinkedIn</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "hsl(215,52%,12%)" }}>Helmdash App</div>
            </div>
          </a>

          <a href="https://twitter.com/helmdashapp" target="_blank" rel="noreferrer" className="hover:-translate-y-[2px] transition-all" style={{ display: "flex", alignItems: "center", gap: 16, background: "hsl(42,33%,93%)", padding: "24px", borderRadius: 16, border: "1px solid hsl(215,52%,12%, 0.1)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "hsl(215,52%,12%, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(215,52%,12%)" }}>
              <Twitter size={24} />
            </div>
            <div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: "hsl(214,15%,34%)", marginBottom: 4 }}>Twitter</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "hsl(215,52%,12%)" }}>@helmdashapp</div>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}
