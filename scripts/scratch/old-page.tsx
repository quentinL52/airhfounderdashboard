'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CohortBadge } from '@/components/marketing/cohort-badge';
import { PRICING_CONFIG } from '@/lib/billing/pricing-config';

const HelmIcon = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ color }}>
    <circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" strokeWidth="9" />
    <g fill="currentColor">
      <rect x="46" y="8" width="8" height="40" rx="4" />
      <rect x="46" y="8" width="8" height="40" rx="4" transform="rotate(60 50 50)" />
      <rect x="46" y="8" width="8" height="40" rx="4" transform="rotate(120 50 50)" />
      <rect x="46" y="8" width="8" height="40" rx="4" transform="rotate(180 50 50)" />
      <rect x="46" y="8" width="8" height="40" rx="4" transform="rotate(240 50 50)" />
      <rect x="46" y="8" width="8" height="40" rx="4" transform="rotate(300 50 50)" />
    </g>
    <g fill="currentColor">
      <circle cx="50" cy="7" r="5.5" />
      <circle cx="50" cy="7" r="5.5" transform="rotate(60 50 50)" />
      <circle cx="50" cy="7" r="5.5" transform="rotate(120 50 50)" />
      <circle cx="50" cy="7" r="5.5" transform="rotate(180 50 50)" />
      <circle cx="50" cy="7" r="5.5" transform="rotate(240 50 50)" />
      <circle cx="50" cy="7" r="5.5" transform="rotate(300 50 50)" />
    </g>
    <circle cx="50" cy="50" r="13" fill="currentColor" />
  </svg>
);

export default function LandingPage() {
  const t = useTranslations('landing');
  const [period, setPeriod] = useState<'yearly' | 'semi_annual' | 'monthly'>('monthly');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground" style={{ fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
      
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-8 py-3.5 flex items-center gap-5">
          <a href="#top" className="flex items-center gap-2.5">
            <HelmIcon size={26} color="currentColor" />
            <span className="font-semibold text-lg tracking-tight font-mono">Helmdash</span>
          </a>
          <nav className="flex gap-6 ml-6 text-[13px] font-medium text-muted-foreground font-mono">
            <a href="#probleme" className="hover:text-foreground transition-colors">{t('problemSurtitle').split('/')[1].trim()}</a>
            <a href="#solution" className="hover:text-foreground transition-colors">{t('productSurtitle').split('/')[1].trim()}</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">{t('pricingSurtitle').split('/')[1].trim()}</a>
            <a href="#roadmap" className="hover:text-foreground transition-colors">{t('roadmapSurtitle').split('/')[1].trim()}</a>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/auth" className="text-[13px] font-medium text-muted-foreground font-mono">{t('login')}</Link>
            <a href="#pricing" className="text-[13px] font-semibold bg-primary text-primary-foreground text-primary-foreground px-4 py-2 rounded-lg hover:-translate-y-px hover:shadow-lg transition-all font-mono">{t('pricingCtaPrimary')}</a>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section id="top" className="max-w-6xl mx-auto px-8 pt-20 pb-10">
        <div className="inline-flex items-center gap-2 border border-border rounded-full py-1.5 pl-2 pr-3 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(240,82,46,0.18)]" />
          <span className="text-xs font-medium text-foreground tracking-wide font-mono">
            <CohortBadge />
          </span>
        </div>

        <h1 className="text-[clamp(38px,6.4vw,82px)] font-semibold tracking-[-2.5px] leading-[1.02] mb-6 max-w-4xl font-mono">
          {t('heroTitle').split('\\n').map((line, i) => <span key={i}>{line}<br /></span>)}
        </h1>

        <p className="text-[clamp(17px,1.7vw,21px)] leading-relaxed text-foreground max-w-[600px] mb-9">
          {t('heroSubtitle')}
        </p>

        <div className="flex flex-wrap gap-3.5 items-center mb-4">
          <a href="#pricing" className="text-[15px] font-semibold bg-primary text-foreground px-6 py-4 rounded-lg hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 transition-all font-mono">{t('ctaPrimary')}</a>
          <a href="#solution" className="text-[15px] font-semibold text-foreground px-5 py-4 rounded-lg border border-border hover:bg-muted transition-all font-mono">{t('ctaSecondary')}</a>
        </div>
        <p className="text-[12.5px] text-muted-foreground font-mono">{t('noCreditCard')}</p>

        <div className="flex items-center gap-3.5 mt-14 pt-5 border-t border-border">
          <span className="text-[11px] tracking-[1.5px] text-muted-foreground uppercase font-mono">{t('socialProof')}</span>
          <div className="flex-1 h-px bg-muted" />
        </div>
      </section>

      {/* ===== PROBL├êME ===== */}
      <section id="probleme" className="max-w-6xl mx-auto px-8 py-16">
        <span className="text-xs tracking-[1.5px] text-primary font-semibold font-mono">{t('problemSurtitle')}</span>
        <h2 className="text-[clamp(28px,3.6vw,44px)] font-semibold tracking-[-1.5px] leading-[1.1] mt-2 mb-3 max-w-[760px] font-mono">{t('problemTitle')}</h2>
        <p className="text-[17px] text-foreground max-w-[620px] mb-10">{t('problemSubtitle')}</p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-px bg-muted border border-border rounded-2xl overflow-hidden">
          {t.raw('pains').map((p: any) => (
            <div key={p.tag} className="bg-muted p-7 min-h-[210px] flex flex-col hover:bg-muted/80 transition-colors">
              <div className="text-[13px] font-bold text-primary mb-5 font-mono">{p.tag}</div>
              <h3 className="text-[19px] font-semibold tracking-[-0.5px] mb-2.5 leading-tight font-mono">{p.title}</h3>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRODUCT TOUR ===== */}
      <section id="solution" className="bg-primary text-primary-foreground text-primary-foreground py-20">
        <div className="max-w-6xl mx-auto px-8">
          <span className="text-xs tracking-[1.5px] text-primary font-semibold font-mono">{t('productSurtitle')}</span>
          <h2 className="text-[clamp(28px,3.6vw,44px)] font-semibold tracking-[-1.5px] leading-[1.1] mt-2.5 mb-3 max-w-[800px] font-mono">{t('productTitle')}</h2>
          <p className="text-[17px] text-primary-foreground/80 max-w-[640px] mb-10">{t('productSubtitle')}</p>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 mt-10">
            {t.raw('productFeatures').map((f: any, i: number) => (
              <div key={i}>
                <div className="text-xs font-bold text-primary mb-2.5 font-mono">ÔåÆ</div>
                <h3 className="text-[17px] font-semibold text-primary-foreground mb-1.5 tracking-[-0.4px] font-mono">{f.title}</h3>
                <p className="text-sm leading-relaxed text-primary-foreground/70">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRANSPARENCE ===== */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <span className="text-xs tracking-[1.5px] text-primary font-semibold font-mono">{t('transparencySurtitle')}</span>
        <h2 className="text-[clamp(28px,3.6vw,44px)] font-semibold tracking-[-1.5px] leading-[1.1] mt-2 mb-3 max-w-[760px] font-mono">{t('transparencyTitle')}</h2>
        <p className="text-[17px] text-foreground max-w-[620px] mb-10">{t('transparencySubtitle')}</p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
          {t.raw('transparencyItems').map((item: any, i: number) => (
            <div key={i} className="bg-background border border-border p-6 rounded-xl">
              <h3 className="text-base font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="bg-muted border-y border-border py-20">
        <div className="max-w-6xl mx-auto px-8">
          <span className="text-xs tracking-[1.5px] text-primary font-semibold font-mono">{t('pricingSurtitle')}</span>
          <div className="flex flex-wrap items-end justify-between gap-5 mt-2.5 mb-3">
            <h2 className="text-[clamp(28px,3.6vw,44px)] font-semibold tracking-[-1.5px] leading-[1.1] max-w-[620px] font-mono">{t('pricingTitle')}</h2>
          </div>
          <p className="text-base text-muted-foreground max-w-[600px] mb-10">{t('pricingSubtitle')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
            {/* BYOK Core */}
            <div className="bg-background text-foreground border-[1.5px] border-border rounded-2xl p-7 relative">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-base font-semibold tracking-[-0.3px] font-mono">{PRICING_CONFIG.plans.core.name}</h3>
              </div>
              <div className="flex items-baseline gap-1.5 mt-5 mb-1">
                <span className="text-[40px] font-semibold tracking-[-2px] leading-none font-mono">{(PRICING_CONFIG.plans.core.prices.monthly.amount / 100).toFixed(0)} Ôé¼</span>
                <span className="text-sm text-muted-foreground font-mono"> {t('perMonth')}</span>
              </div>
              <div className="text-[11.5px] text-muted-foreground mb-5 font-mono">{PRICING_CONFIG.plans.core.features[0]}</div>
              <a href="/auth" className="mt-8 block text-center text-sm font-semibold py-3 rounded-lg bg-secondary text-foreground transition-opacity hover:opacity-90 font-mono">{t('pricingCtaPrimary')}</a>
            </div>
            
            {/* Complete */}
            <div className="bg-primary text-primary-foreground text-primary-foreground border-[1.5px] border-primary rounded-2xl p-7 relative">
              <div className="absolute top-0 right-8 -translate-y-1/2">
                 <span className="bg-background text-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-border">Founder Deal: {(PRICING_CONFIG.founderDeal.price.amount / 100).toFixed(0)}Ôé¼/mo</span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-base font-semibold tracking-[-0.3px] font-mono">{PRICING_CONFIG.plans.complete.name}</h3>
              </div>
              <div className="flex items-baseline gap-1.5 mt-5 mb-1">
                <span className="text-[40px] font-semibold tracking-[-2px] leading-none font-mono">{(PRICING_CONFIG.plans.complete.prices.monthly.amount / 100).toFixed(0)} Ôé¼</span>
                <span className="text-sm text-muted-foreground font-mono"> {t('perMonth')}</span>
              </div>
              <div className="text-[11.5px] text-primary-foreground/80 mb-5 font-mono">{PRICING_CONFIG.plans.complete.features[0]}</div>
              <a href="/auth" className="mt-8 block text-center text-sm font-semibold py-3 rounded-lg bg-background text-foreground transition-opacity hover:opacity-90 font-mono">{t('pricingCtaPrimary')}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ROADMAP ===== */}
      <section id="roadmap" className="max-w-6xl mx-auto px-8 py-20">
        <span className="text-xs tracking-[1.5px] text-primary font-semibold font-mono">{t('roadmapSurtitle')}</span>
        <h2 className="text-[clamp(28px,3.6vw,44px)] font-semibold tracking-[-1.5px] leading-[1.1] mt-2 mb-3 max-w-[760px] font-mono">{t('roadmapTitle')}</h2>
        <p className="text-[17px] text-foreground max-w-[620px] mb-10">{t('roadmapSubtitle')}</p>

        <div className="bg-muted border border-border rounded-xl p-6">
          <ul className="space-y-4 max-w-xl">
            {t.raw('roadmapItems').map((item: any, i: number) => (
              <li key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="font-medium text-foreground">{item.title}</span>
                <span className="text-[11px] font-semibold px-2 py-1 bg-muted rounded text-muted-foreground uppercase font-mono">{item.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== MAKER NOTE ===== */}
      <section className="bg-primary text-primary-foreground text-primary-foreground py-20">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <span className="text-xs tracking-[1.5px] text-primary font-semibold font-mono">{t('makerSurtitle')}</span>
          <h2 className="text-[clamp(28px,3.6vw,44px)] font-semibold tracking-[-1.5px] leading-[1.1] mt-4 mb-6 font-mono">{t('makerTitle')}</h2>
          <p className="text-xl leading-relaxed text-primary-foreground/80 italic">"{t('makerBody')}"</p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <span className="text-xs tracking-[1.5px] text-primary font-semibold font-mono">{t('faqSurtitle')}</span>
        <h2 className="text-[clamp(28px,3.6vw,44px)] font-semibold tracking-[-1.5px] leading-[1.1] mt-2 mb-10 max-w-[760px] font-mono">{t('faqTitle')}</h2>

        <div className="max-w-2xl space-y-6">
          {t.raw('faqItems').map((faq: any, i: number) => (
            <div key={i} className="bg-muted rounded-xl p-5 border border-border">
              <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
              <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-card text-muted-foreground py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-wrap gap-10 justify-between items-start pb-9 border-b border-border">
            <div className="max-w-[300px]">
              <div className="flex items-center gap-2.5 mb-3.5">
                <HelmIcon size={24} color="currentColor" />
                <span className="font-semibold text-[17px] text-primary-foreground tracking-[-0.5px] font-mono">Helmdash</span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">{t('heroSubtitle')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-between items-center pt-5">
            <div className="text-xs text-muted-foreground font-mono">{t('footerCopyright')}</div>
            <div className="flex gap-5 text-xs text-muted-foreground font-mono">
              <Link href="/legal/privacy" className="hover:text-primary-foreground/70 transition-colors">{t('privacy')}</Link>
              <Link href="/legal/terms" className="hover:text-primary-foreground/70 transition-colors">{t('terms')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
