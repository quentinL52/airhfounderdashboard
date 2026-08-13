'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { WaitlistForm } from '@/components/waitlist-form';
import { Check, ChevronDown } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LandingPage() {
  const [period, setPeriod] = useState<'year' | 'month'>('month');
  const [showCompare, setShowCompare] = useState(false);
  const t = useTranslations('landing');
  const seoT = useTranslations('seo');
  const accent = "#F0522E";

  const PRICING_PLANS = [
    {
      name: t('pricing.plans.0.name'),
      featured: true,
      tagline: t('pricing.plans.0.tagline'),
      price: t('pricing.plans.0.price'), per: t('pricing.plans.0.per'),
      note: t('pricing.plans.0.note'),
      features: [
        t('pricing.plans.0.features.0'),
        t('pricing.plans.0.features.1'),
        t('pricing.plans.0.features.2'),
        t('pricing.plans.0.features.3'),
      ],
      cta: t('pricing.plans.0.cta'),
      bg: "#0E1B2E", fg: "#EAE6DC", sub: "#8a95a6", featColor: "#c2c8d2",
      border: accent, ctaBg: accent, ctaFg: "#0E1B2E", ctaBorder: accent
    },
    {
      name: t('pricing.plans.1.name'),
      featured: false,
      tagline: t('pricing.plans.1.tagline'),
      price: t('pricing.plans.1.price'), per: t('pricing.plans.1.per'),
      note: t('pricing.plans.1.note'),
      features: [
        t('pricing.plans.1.features.0'),
        t('pricing.plans.1.features.1'),
        t('pricing.plans.1.features.2'),
        t('pricing.plans.1.features.3'),
      ],
      cta: t('pricing.plans.1.cta'),
      bg: "#F5F1E8", fg: "#0E1B2E", sub: "#7a7666", featColor: "#2a3646",
      border: "rgba(14,27,46,.16)", ctaBg: "transparent", ctaFg: "#0E1B2E", ctaBorder: "#0E1B2E"
    },
    {
      name: t('pricing.plans.2.name'),
      featured: false,
      tagline: t('pricing.plans.2.tagline'),
      price: t('pricing.plans.2.price'), per: t('pricing.plans.2.per'),
      note: t('pricing.plans.2.note'),
      features: [
        t('pricing.plans.2.features.0'),
        t('pricing.plans.2.features.1'),
        t('pricing.plans.2.features.2'),
        t('pricing.plans.2.features.3'),
      ],
      cta: t('pricing.plans.2.cta'),
      bg: "#F5F1E8", fg: "#0E1B2E", sub: "#7a7666", featColor: "#2a3646",
      border: "rgba(14,27,46,.16)", ctaBg: "transparent", ctaFg: "#0E1B2E", ctaBorder: "#0E1B2E"
    },
  ];

  const PAINS = [
    { tag: t('problem.cards.0.tag'), title: t('problem.cards.0.title'), body: t('problem.cards.0.body') },
    { tag: t('problem.cards.1.tag'), title: t('problem.cards.1.title'), body: t('problem.cards.1.body') },
    { tag: t('problem.cards.2.tag'), title: t('problem.cards.2.title'), body: t('problem.cards.2.body') },
    { tag: t('problem.cards.3.tag'), title: t('problem.cards.3.title'), body: t('problem.cards.3.body') },
  ];

  const COMPARISON_ROWS = [
    { label: t('comparison.rows.0.label'), notion: t('comparison.rows.0.notion'), cowork: t('comparison.rows.0.cowork'), helm: t('comparison.rows.0.helm') },
    { label: t('comparison.rows.1.label'), notion: t('comparison.rows.1.notion'), cowork: t('comparison.rows.1.cowork'), helm: t('comparison.rows.1.helm') },
    { label: t('comparison.rows.2.label'), notion: t('comparison.rows.2.notion'), cowork: t('comparison.rows.2.cowork'), helm: t('comparison.rows.2.helm') },
    { label: t('comparison.rows.3.label'), notion: t('comparison.rows.3.notion'), cowork: t('comparison.rows.3.cowork'), helm: t('comparison.rows.3.helm') },
    { label: t('comparison.rows.4.label'), notion: t('comparison.rows.4.notion'), cowork: t('comparison.rows.4.cowork'), helm: t('comparison.rows.4.helm') },
  ];

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Helmdash',
    description: seoT('description'),
    image: `${process.env.NEXT_PUBLIC_APP_URL}/icon.png`,
    brand: {
      '@type': 'Brand',
      name: 'Helmdash'
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      priceCurrency: 'EUR',
      price: '19',
      availability: 'https://schema.org/InStock'
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: seoT('faq.q1'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: seoT('faq.a1')
        }
      },
      {
        '@type': 'Question',
        name: seoT('faq.q2'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: seoT('faq.a2')
        }
      },
      {
        '@type': 'Question',
        name: seoT('faq.q3'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: seoT('faq.a3')
        }
      },
      {
        '@type': 'Question',
        name: seoT('faq.q4'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: seoT('faq.a4')
        }
      },
      {
        '@type': 'Question',
        name: seoT('faq.q5'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: seoT('faq.a5')
        }
      },
      {
        '@type': 'Question',
        name: seoT('faq.q6'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: seoT('faq.a6')
        }
      },
      {
        '@type': 'Question',
        name: seoT('faq.q7'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: seoT('faq.a7')
        }
      }
    ]
  };

  return (
    <div style={{ background: "#E9E4D8", color: "#0E1B2E", fontFamily: '"IBM Plex Sans", system-ui, sans-serif', minHeight: '100vh', overflow: "hidden" }}>
      <JsonLd data={productSchema} />
      <JsonLd data={faqSchema} />
      
      {/* ===== HEADER ===== */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(233,228,216,.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(14,27,46,.1)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", gap: 20 }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/helmdash-mark-navy-512.png" alt="Helmdash Icon" width={26} height={26} />
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, fontSize: 18, letterSpacing: "-0.5px" }}>Helmdash</span>
          </a>
          <nav style={{ fontFamily: '"IBM Plex Mono", monospace', display: "flex", gap: 26, marginLeft: 24, fontSize: 13, color: "#4a5666", fontWeight: 500 }}>
            <a href="#problem" className="hover:text-[#0E1B2E] transition-colors">{t('nav.problem')}</a>
            <a href="#solution" className="hover:text-[#0E1B2E] transition-colors">{t('nav.solution')}</a>
            <a href="#comparison" className="hover:text-[#0E1B2E] transition-colors">{t('nav.comparison')}</a>
            <a href="#pricing" className="hover:text-[#0E1B2E] transition-colors">{t('nav.pricing')}</a>
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            <LanguageSwitcher iconColor="#0E1B2E" />
            {/* <Link href="/auth" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, fontWeight: 500, color: "#4a5666" }}>{t('nav.login')}</Link> */}
            <a href="#top" className="hover:-translate-y-[1px] hover:shadow-[0_6px_16px_rgba(14,27,46,0.22)] transition-all" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, fontWeight: 600, background: "#0E1B2E", color: "#F5F1E8", padding: "9px 16px", borderRadius: 8 }}>{t('nav.join')}</a>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section id="top" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px 40px", position: "relative" }}>
        {/* <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(14,27,46,.18)", borderRadius: 100, padding: "5px 12px 5px 8px", marginBottom: 32 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, boxShadow: "0 0 0 3px rgba(240,82,46,.18)" }}></span>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, fontWeight: 500, letterSpacing: ".2px", color: "#3a4656" }}>{t('hero.badge')}</span>
        </div> */}

        <h1 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "clamp(38px,6.4vw,82px)", fontWeight: 600, letterSpacing: "-2.5px", lineHeight: 1.02, margin: "0 0 26px", maxWidth: 960 }}>
          {t('hero.title1')}<br />{t('hero.title2')}<br /><span style={{ color: "#8a8474" }}>{t('hero.title3')}</span>
        </h1>

        <p style={{ fontSize: "clamp(17px,1.7vw,21px)", lineHeight: 1.55, color: "#3a4656", maxWidth: 600, margin: "0 0 38px" }}>
          {t('hero.desc')}
        </p>

        <div style={{ marginBottom: 16 }}><WaitlistForm /></div>
        <p style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12.5, color: "#8a8474", margin: 0 }}>{t('hero.disclaimer')}</p>

        {/* <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 56, paddingTop: 22, borderTop: "1px solid rgba(14,27,46,.12)" }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: "1.5px", color: "#8a8474", textTransform: "uppercase" }}>{t('hero.social')}</span>
          <div style={{ flex: 1, height: 1, background: "rgba(14,27,46,.08)" }}></div>
          <div style={{ fontFamily: '"IBM Plex Mono", monospace', display: "flex", gap: 22, fontSize: 13, fontWeight: 600, color: "#3a4656", flexWrap: "wrap" }}>
            <span>{t('hero.audiences.0')}</span><span>·</span>
            <span>{t('hero.audiences.1')}</span><span>·</span>
            <span>{t('hero.audiences.2')}</span><span>·</span>
            <span>{t('hero.audiences.3')}</span>
          </div>
        </div> */}
      </section>

      {/* ===== PROBLÈME ===== */}
      <section id="problem" style={{ maxWidth: 1200, margin: "0 auto", padding: "70px 32px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, letterSpacing: "1.5px", color: accent, fontWeight: 600 }}>{t('problem.section')}</span>
        </div>
        <h2 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "clamp(28px,3.6vw,44px)", fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1.1, margin: "0 0 14px", maxWidth: 760 }}>{t('problem.title')}</h2>
        <p style={{ fontSize: 17, color: "#3a4656", maxWidth: 620, margin: "0 0 44px" }}>{t('problem.desc')}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 1, background: "rgba(14,27,46,.12)", border: "1px solid rgba(14,27,46,.12)", borderRadius: 14, overflow: "hidden" }}>
          {PAINS.map((p) => (
            <div key={p.tag} className="hover:bg-[#FBF8F1] transition-colors" style={{ background: "#F5F1E8", padding: "30px 26px", minHeight: 210, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, fontWeight: 700, color: accent, marginBottom: 20 }}>{p.tag}</div>
              <h3 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 19, fontWeight: 600, letterSpacing: "-0.5px", margin: "0 0 10px", lineHeight: 1.2 }}>{p.title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "#4a5666", margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>



      {/* ===== SOLUTION ===== */}
      <section id="solution" style={{ background: "#0E1B2E", color: "#EAE6DC", padding: "76px 0", position: "relative" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, letterSpacing: "1.5px", color: accent, fontWeight: 600 }}>{t('solution.section')}</span>
          <h2 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "clamp(28px,3.6vw,44px)", fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1.1, margin: "10px 0 14px", maxWidth: 800 }}>{t('solution.title')}</h2>
          <p style={{ fontSize: 17, color: "#a9b2c0", maxWidth: 640, margin: "0 0 44px" }}>{t('solution.desc')}</p>

          <div style={{ border: "1px solid rgba(234,230,220,.16)", borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 90px -30px rgba(0,0,0,.6)", background: "#0B1524" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#111F33", borderBottom: "1px solid rgba(234,230,220,.1)" }}>
              <div style={{ display: "flex", gap: 7 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: "#33415A" }}></span><span style={{ width: 11, height: 11, borderRadius: "50%", background: "#33415A" }}></span><span style={{ width: 11, height: 11, borderRadius: "50%", background: "#33415A" }}></span></div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', marginLeft: 8, fontSize: 12, color: "#6e7b90", display: "flex", alignItems: "center", gap: 7 }}>
                <Image src="/helmdash-mark-coral-512.png" width={13} height={13} alt="Helmdash logo" />{t('solution.mock.url')}
              </div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', marginLeft: "auto", fontSize: 11, color: "#4a5666" }}>⌘K</div>
            </div>

            <div className="flex flex-col md:grid" style={{ gridTemplateColumns: "186px 1fr 316px", minHeight: 520 }}>
              <aside style={{ background: "#0C1728", borderRight: "1px solid rgba(234,230,220,.08)", padding: "18px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: "1.2px", color: "#4a5666", padding: "6px 10px 8px" }}>{t('solution.mock.sidebar.title')}</div>
                {[
                  { label: t('solution.mock.sidebar.overview'), color: "#EAE6DC", bg: "rgba(240,82,46,.14)", weight: "600", dot: accent, badge: "" },
                  { label: t('solution.mock.sidebar.finance'), color: "#a9b2c0", bg: "transparent", weight: "500", dot: "#33415A", badge: "" },
                  { label: t('solution.mock.sidebar.hypotheses'), color: "#a9b2c0", bg: "transparent", weight: "500", dot: "#33415A", badge: "2" },
                  { label: t('solution.mock.sidebar.roadmap'), color: "#a9b2c0", bg: "transparent", weight: "500", dot: "#33415A", badge: "" },
                  { label: t('solution.mock.sidebar.crm'), color: "#a9b2c0", bg: "transparent", weight: "500", dot: "#33415A", badge: "8" },
                  { label: t('solution.mock.sidebar.veille'), color: "#a9b2c0", bg: "transparent", weight: "500", dot: "#33415A", badge: "3" }
                ].map((n) => (
                  <div key={n.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "8px 10px", borderRadius: 7, color: n.color, background: n.bg, fontWeight: n.weight as any, fontFamily: '"IBM Plex Mono", monospace' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: n.dot }}></span>{n.label}
                    {n.badge && <span style={{ fontFamily: '"IBM Plex Mono", monospace', marginLeft: "auto", fontSize: 10, color: "#4a5666" }}>{n.badge}</span>}
                  </div>
                ))}
                <div style={{ marginTop: "auto", borderTop: "1px solid rgba(234,230,220,.08)", paddingTop: 12, display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#233247,#14263D)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: '"IBM Plex Mono", monospace' }}>JM</div>
                  <div><div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: "#c9cfd9", fontWeight: 500 }}>Jonas M.</div><div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#5a6678" }}>{t('solution.mock.sidebar.role')}</div></div>
                </div>
              </aside>

              <main style={{ padding: "22px 24px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
                  <h3 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 16, fontWeight: 600, color: "#EAE6DC", margin: 0 }}>{t('solution.mock.main.title')}</h3>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: "#6e7b90" }}>{t('solution.mock.main.updated')}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: t('solution.mock.main.mrr'), value: t('solution.mock.main.mrr_val'), trend: t('solution.mock.main.mrr_trend'), trendColor: "#3FB27F" },
                    { label: t('solution.mock.main.runway'), value: t('solution.mock.main.runway_val'), trend: t('solution.mock.main.runway_trend'), trendColor: "#E0A54A" },
                    { label: t('solution.mock.main.burn'), value: t('solution.mock.main.burn_val'), trend: t('solution.mock.main.burn_trend'), trendColor: "#8a95a6" }
                  ].map((k) => (
                    <div key={k.label} style={{ background: "#111F33", border: "1px solid rgba(234,230,220,.09)", borderRadius: 11, padding: 14 }}>
                      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: ".5px", color: "#6e7b90", marginBottom: 8 }}>{k.label}</div>
                      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 24, fontWeight: 600, color: "#EAE6DC", letterSpacing: "-1px", lineHeight: 1 }}>{k.value}</div>
                      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, fontWeight: 600, color: k.trendColor, marginTop: 7 }}>{k.trend}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#111F33", border: "1px solid rgba(234,230,220,.09)", borderRadius: 11, padding: "16px 16px 10px", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: "#c9cfd9", fontWeight: 500 }}>{t('solution.mock.main.chart_title')}</div>
                    <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: accent, fontWeight: 600 }}>+38%</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 96 }}>
                    {[
                      { m: t('solution.mock.main.months.0'), h: "38%", fill: "#25405F" },
                      { m: t('solution.mock.main.months.1'), h: "46%", fill: "#25405F" },
                      { m: t('solution.mock.main.months.2'), h: "52%", fill: "#25405F" },
                      { m: t('solution.mock.main.months.3'), h: "68%", fill: "#2B4A6E" },
                      { m: t('solution.mock.main.months.4'), h: "82%", fill: "#2B4A6E" },
                      { m: t('solution.mock.main.months.5'), h: "100%", fill: accent }
                    ].map((b, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, height: "100%", justifyContent: "flex-end" }}>
                        <div style={{ width: "100%", borderRadius: "4px 4px 2px 2px", background: b.fill, height: b.h }}></div>
                        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: "#5a6678" }}>{b.m}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "#111F33", border: "1px solid rgba(234,230,220,.09)", borderRadius: 11, padding: "14px 16px" }}>
                  <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: "#c9cfd9", fontWeight: 500, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>{t('solution.mock.main.hyp_title')} <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#6e7b90", fontWeight: 400 }}>{t('solution.mock.main.hyp_sub')}</span></div>
                  {[
                    { status: t('solution.mock.main.hyp_status1'), sColor: "#0E1B2E", sBg: "#3FB27F", text: t('solution.mock.main.hyp_text1'), conf: t('solution.mock.main.hyp_conf1') },
                    { status: t('solution.mock.main.hyp_status2'), sColor: "#0E1B2E", sBg: "#E0A54A", text: t('solution.mock.main.hyp_text2'), conf: t('solution.mock.main.hyp_conf2') },
                    { status: t('solution.mock.main.hyp_status3'), sColor: "#F5F1E8", sBg: "#7A3A2A", text: t('solution.mock.main.hyp_text3'), conf: t('solution.mock.main.hyp_conf3') }
                  ].map((h, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid rgba(234,230,220,.06)" }}>
                      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, fontWeight: 700, color: h.sColor, background: h.sBg, padding: "3px 7px", borderRadius: 5, whiteSpace: "nowrap" }}>{h.status}</span>
                      <span style={{ fontSize: 13, color: "#c2c8d2", flex: 1 }}>{h.text}</span>
                      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: "#6e7b90", whiteSpace: "nowrap" }}>{h.conf}</span>
                    </div>
                  ))}
                </div>
              </main>

              <aside style={{ background: "#0C1728", borderLeft: "1px solid rgba(234,230,220,.08)", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "15px 16px", borderBottom: "1px solid rgba(234,230,220,.08)", display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}><Image src="/helmdash-mark-navy-512.png" width={16} height={16} alt="Helmdash icon" /></div>
                  <div><div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: "#EAE6DC", fontWeight: 600 }}>{t('solution.mock.agent.name')}</div><div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#6e7b90" }}>{t('solution.mock.agent.role')}</div></div>
                  <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#3FB27F", boxShadow: "0 0 0 3px rgba(63,178,127,.2)" }}></span>
                </div>
                <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
                  <div style={{ alignSelf: "flex-end", maxWidth: "88%", background: "#1B2A40", border: "1px solid rgba(234,230,220,.08)", borderRadius: "12px 12px 3px 12px", padding: "10px 12px", fontSize: 12.5, color: "#d5dae2" }}>{t('solution.mock.agent.q1')}</div>
                  <div style={{ maxWidth: "94%", background: "#101E31", border: "1px solid rgba(234,230,220,.09)", borderRadius: "12px 12px 12px 3px", padding: "12px 13px" }}>
                    <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#6e7b90", marginBottom: 9, letterSpacing: ".3px" }}>{t('solution.mock.agent.sub')}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 11 }}>
                      {[
                        { name: t('solution.mock.agent.sub1'), icon: "€", bg: "#2B4A6E", note: t('solution.mock.agent.sub1_note') },
                        { name: t('solution.mock.agent.sub2'), icon: "↗", bg: "#7A3A2A", note: t('solution.mock.agent.sub2_note') }
                      ].map((s) => (
                        <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 15, height: 15, borderRadius: 4, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontFamily: '"IBM Plex Mono", monospace' }}>{s.icon}</span>
                          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: "#b3bac6", fontWeight: 500 }}>{s.name}</span>
                          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#6e7b90", marginLeft: "auto" }}>{s.note}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "#d5dae2", margin: "0 0 8px" }}>{t('solution.mock.agent.ans1')}<strong style={{ color: "#EAE6DC" }}>3 100 €</strong>{t('solution.mock.agent.ans2')}<strong style={{ color: "#EAE6DC" }}>8,2</strong>{t('solution.mock.agent.ans3')}<strong style={{ color: "#EAE6DC" }}>5,4 mois</strong>.</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, color: "#0E1B2E", background: accent, padding: "4px 9px", borderRadius: 6, fontWeight: 600 }}>{t('solution.mock.agent.btn1')}</span>
                      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, color: "#b3bac6", border: "1px solid rgba(234,230,220,.16)", padding: "4px 9px", borderRadius: 6 }}>{t('solution.mock.agent.btn2')}</span>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(234,230,220,.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#111F33", border: "1px solid rgba(234,230,220,.12)", borderRadius: 9, padding: "9px 12px" }}>
                    <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12.5, color: "#6e7b90", flex: 1 }}>{t('solution.mock.agent.input')}</span>
                    <span style={{ width: 2, height: 15, background: accent }} className="animate-pulse"></span>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 26, marginTop: 44 }}>
            {[
              { no: "→", title: t('solution.features.0.title'), body: t('solution.features.0.body') },
              { no: "→", title: t('solution.features.1.title'), body: t('solution.features.1.body') },
              { no: "→", title: t('solution.features.2.title'), body: t('solution.features.2.body') }
            ].map((f, i) => (
              <div key={i}>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, fontWeight: 700, color: accent, marginBottom: 10 }}>{f.no}</div>
                <h3 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 17, fontWeight: 600, color: "#EAE6DC", margin: "0 0 7px", letterSpacing: "-0.4px" }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "#9aa4b3", margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "76px 32px" }}>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, letterSpacing: "1.5px", color: accent, fontWeight: 600 }}>{t('how_it_works.section')}</span>
        <h2 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "clamp(28px,3.6vw,44px)", fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1.1, margin: "10px 0 46px", maxWidth: 680 }}>{t('how_it_works.title')}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 0 }}>
          {[
            { n: "1", title: t('how_it_works.steps.0.title'), body: t('how_it_works.steps.0.body'), meta: t('how_it_works.steps.0.meta') },
            { n: "2", title: t('how_it_works.steps.1.title'), body: t('how_it_works.steps.1.body'), meta: t('how_it_works.steps.1.meta') },
            { n: "3", title: t('how_it_works.steps.2.title'), body: t('how_it_works.steps.2.body'), meta: t('how_it_works.steps.2.meta') }
          ].map((s) => (
            <div key={s.n} style={{ padding: "0 28px 0 0", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 15, fontWeight: 700, color: "#0E1B2E", width: 40, height: 40, border: "1.5px solid #0E1B2E", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.n}</span>
                <div style={{ flex: 1, height: 1, background: "repeating-linear-gradient(90deg,rgba(14,27,46,.3) 0 5px,transparent 5px 10px)" }}></div>
              </div>
              <h3 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 20, fontWeight: 600, letterSpacing: "-0.5px", margin: "0 0 10px" }}>{s.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "#4a5666", margin: "0 0 14px" }}>{s.body}</p>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: "#8a8474", background: "rgba(14,27,46,.05)", borderRadius: 7, padding: "8px 11px", display: "inline-block" }}>{s.meta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== COMPARATIF ===== */}
      <section id="comparison" style={{ background: "#F5F1E8", borderTop: "1px solid rgba(14,27,46,.1)", borderBottom: "1px solid rgba(14,27,46,.1)", padding: "76px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, letterSpacing: "1.5px", color: accent, fontWeight: 600 }}>{t('comparison.section')}</span>
          <h2 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "clamp(28px,3.6vw,44px)", fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1.1, margin: "10px 0 12px", maxWidth: 720 }}>{t('comparison.title')}</h2>
          <p style={{ fontSize: 16, color: "#4a5666", maxWidth: 600, margin: "0 0 40px" }}>{t('comparison.desc')}</p>

          {/* DESKTOP COMPARISON */}
          <div className="hidden md:block mt-8">
            <div className="grid grid-cols-4 gap-4">
              {/* Col 1: Labels */}
              <div className="flex flex-col pt-14 gap-2">
                {COMPARISON_ROWS.map(r => (
                  <div key={r.label} className="h-[52px] flex items-center text-[14px] text-[#8a95a6] font-medium font-mono pr-2">
                    {r.label}
                  </div>
                ))}
              </div>
              {/* Col 2: Notion */}
              <div className="flex flex-col gap-2">
                <div className="h-12 flex items-center justify-center font-mono text-[13px] font-bold text-[#3a4656]">Notion</div>
                {COMPARISON_ROWS.map(r => (
                  <div key={r.label} className="h-[52px] flex items-center justify-center text-center text-[13px] text-[#8a95a6] font-mono bg-[#EFEADD]/40 rounded-md px-2 leading-tight">
                    {r.notion}
                  </div>
                ))}
              </div>
              {/* Col 3: Claude / Cowork */}
              <div className="flex flex-col gap-2">
                <div className="h-12 flex items-center justify-center font-mono text-[13px] font-bold text-[#3a4656]">Claude / Cowork</div>
                {COMPARISON_ROWS.map(r => (
                  <div key={r.label} className="h-[52px] flex items-center justify-center text-center text-[13px] text-[#8a95a6] font-mono bg-[#EFEADD]/40 rounded-md px-2 leading-tight">
                    {r.cowork}
                  </div>
                ))}
              </div>
              {/* Col 4: Helmdash */}
              <div className="flex flex-col gap-2 bg-[#F0522E]/5 border border-[#F0522E]/40 rounded-xl p-2">
                <div className="h-10 flex items-center justify-center font-mono text-[13px] font-bold text-[#0E1B2E] bg-white rounded-lg shadow-sm gap-2">
                  <Image src="/helmdash-mark-coral-512.png" width={14} height={14} alt="Helmdash check" />
                  Helmdash
                </div>
                {COMPARISON_ROWS.map(r => (
                  <div key={r.label} className="h-[52px] flex items-center justify-start px-3 text-[13px] font-semibold text-[#0E1B2E] font-mono gap-2 leading-tight">
                    <Check size={16} className="text-[#F0522E] shrink-0" />
                    {r.helm}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MOBILE COMPARISON */}
          <div className="block md:hidden mt-6">
            <div className="bg-[#F0522E]/5 border border-[#F0522E]/40 rounded-xl p-5 mb-4">
              <div className="flex items-center gap-2 mb-4 font-mono font-bold text-[#0E1B2E] text-lg">
                <Image src="/helmdash-mark-coral-512.png" width={20} height={20} alt="Helmdash list bullet" />
                Helmdash
              </div>
              <div className="flex flex-col gap-3">
                {COMPARISON_ROWS.map(r => (
                  <div key={r.label} className="flex items-start gap-3">
                    <Check size={18} className="text-[#F0522E] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-mono text-[#8a95a6] uppercase tracking-wider mb-0.5">{r.label}</div>
                      <div className="text-[14px] font-medium text-[#0E1B2E]">{r.helm}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setShowCompare(!showCompare)}
              className="w-full flex items-center justify-between p-4 bg-white border border-[rgba(14,27,46,.1)] rounded-xl font-mono text-[13px] font-semibold text-[#3a4656]"
            >
              {t('comparison.toggle')}
              <ChevronDown size={16} className={`transition-transform ${showCompare ? 'rotate-180' : ''}`} />
            </button>

            {showCompare && (
              <div className="mt-2 space-y-2">
                <div className="bg-white border border-[rgba(14,27,46,.1)] rounded-xl p-5">
                  <div className="font-mono font-bold text-[#3a4656] mb-4">Notion</div>
                  <div className="flex flex-col gap-3">
                    {COMPARISON_ROWS.map(r => (
                      <div key={r.label}>
                        <div className="text-[11px] font-mono text-[#8a95a6] uppercase tracking-wider mb-0.5">{r.label}</div>
                        <div className="text-[13px] font-mono text-[#4a5666]">{r.notion}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-[rgba(14,27,46,.1)] rounded-xl p-5">
                  <div className="font-mono font-bold text-[#3a4656] mb-4">Claude / Cowork</div>
                  <div className="flex flex-col gap-3">
                    {COMPARISON_ROWS.map(r => (
                      <div key={r.label}>
                        <div className="text-[11px] font-mono text-[#8a95a6] uppercase tracking-wider mb-0.5">{r.label}</div>
                        <div className="text-[13px] font-mono text-[#4a5666]">{r.cowork}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <p style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: "#8a8474", margin: "24px 0 0", textAlign: "center" }}>{t('comparison.footer')}</p>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" style={{ maxWidth: 1200, margin: "0 auto", padding: "76px 32px" }}>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, letterSpacing: "1.5px", color: accent, fontWeight: 600 }}>{t('pricing.section')}</span>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, margin: "10px 0 12px" }}>
          <h2 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "clamp(28px,3.6vw,44px)", fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0, maxWidth: 620 }}>{t('pricing.title')}</h2>
        </div>
        <p style={{ fontSize: 16, color: "#4a5666", maxWidth: 600, margin: "0 0 40px" }}>{t('pricing.desc')}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {PRICING_PLANS.map((pl) => (
            <div key={pl.name} className="hover:-translate-y-[3px] hover:shadow-[0_18px_40px_-18px_rgba(14,27,46,.4)] transition-all" style={{ background: pl.bg, color: pl.fg, border: `1.5px solid ${pl.border}`, borderRadius: 16, padding: 28, position: "relative", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
                <h3 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: "-0.3px" }}>{pl.name}</h3>
                {pl.featured && <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, fontWeight: 700, background: accent, color: "#0E1B2E", padding: "3px 8px", borderRadius: 5 }}>{t('pricing.popular')}</span>}
              </div>
              <p style={{ fontSize: 13.5, color: pl.sub, margin: "0 0 20px", lineHeight: 1.45, minHeight: 38 }}>{pl.tagline}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 40, fontWeight: 600, letterSpacing: "-2px", lineHeight: 1 }}>{pl.price}</span>
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 14, color: pl.sub }}>{pl.per}</span>
              </div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11.5, color: pl.sub, marginBottom: 22 }}>{pl.note}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 26 }}>
                {pl.features.map((feat) => (
                  <div key={feat} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.4 }}><span style={{ color: accent, fontWeight: 700 }}>✓</span><span style={{ color: pl.featColor }}>{feat}</span></div>
                ))}
              </div>
              <a href="#top" className="hover:opacity-90 transition-opacity" style={{ fontFamily: '"IBM Plex Mono", monospace', marginTop: "auto", textAlign: "center", fontSize: 14, fontWeight: 600, padding: 13, borderRadius: 10, background: pl.ctaBg, color: pl.ctaFg, border: `1px solid ${pl.ctaBorder}` }}>{pl.cta}</a>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section style={{ background: "#0E1B2E", color: "#EAE6DC", padding: "84px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -90, top: "50%", transform: "translateY(-50%)", opacity: 0.09 }}><Image src="/helmdash-mark-coral-512.png" width={420} height={420} alt="Helmdash background logo" /></div>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", position: "relative" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 24 }}><Image src="/helmdash-mark-coral-512.png" width={44} height={44} alt="Helmdash logo" /></div>
            <h2 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "clamp(30px,4vw,52px)", fontWeight: 600, letterSpacing: "-2px", lineHeight: 1.05, margin: "0 0 20px" }}>{t('cta_final.title')}</h2>
            <p style={{ fontSize: 18, color: "#a9b2c0", margin: "0 0 34px" }}>{t('cta_final.desc')}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <a href="#top" className="hover:-translate-y-[2px] hover:shadow-[0_12px_30px_rgba(240,82,46,.35)] transition-all" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 15, fontWeight: 600, background: accent, color: "#0E1B2E", padding: "15px 28px", borderRadius: 10 }}>{t('cta_final.btn_primary')}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" style={{ background: "#E9E4D8", padding: "70px 32px 100px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, letterSpacing: "1.5px", color: accent, fontWeight: 600 }}>FAQ</span>
          <h2 style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "clamp(28px,3.6vw,44px)", fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1.1, margin: "10px 0 40px" }}>Questions fréquentes</h2>
          
          <Accordion type="single" collapsible className="w-full">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <AccordionItem key={i} value={`item-${i}`} style={{ borderBottom: "1px solid hsla(215, 52%, 12%, 0.1)" }}>
              <AccordionTrigger className="hover:no-underline text-left" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 16, fontWeight: 600, color: "hsl(215, 52%, 12%)", padding: "20px 0" }}>
                {seoT(`faq.q${i}` as any)}
              </AccordionTrigger>
              <AccordionContent style={{ fontSize: 15, color: "#4a5666", lineHeight: 1.6, paddingBottom: 20 }}>
                {seoT(`faq.a${i}` as any)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: "#0B1524", color: "#8a95a6", padding: "52px 0 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 36, borderBottom: "1px solid rgba(234,230,220,.08)" }}>
            <div style={{ maxWidth: 300 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Image src="/helmdash-mark-cream-512.png" alt="Helmdash Icon" width={24} height={24} />
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, fontSize: 17, color: "#EAE6DC", letterSpacing: "-0.5px" }}>Helmdash</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0, color: "#6e7b90" }}>{t('footer.desc')}</p>
            </div>
            <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: "1px", color: "#4a5666", marginBottom: 14 }}>{t('footer.cols.0.head')}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <a href="#solution" className="hover:text-[#EAE6DC] transition-colors" style={{ fontSize: 13.5, color: "#9aa4b3" }}>{t('footer.cols.0.links.0')}</a>
                  <a href="#solution" className="hover:text-[#EAE6DC] transition-colors" style={{ fontSize: 13.5, color: "#9aa4b3" }}>{t('footer.cols.0.links.1')}</a>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: "1px", color: "#4a5666", marginBottom: 14 }}>{t('footer.cols.2.head')}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <a href="#pricing" className="hover:text-[#EAE6DC] transition-colors" style={{ fontSize: 13.5, color: "#9aa4b3" }}>{t('footer.cols.2.links.0')}</a>
                  <a href="/contact" className="hover:text-[#EAE6DC] transition-colors" style={{ fontSize: 13.5, color: "#9aa4b3" }}>{t('footer.cols.2.links.2')}</a>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", paddingTop: 22 }}>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: "#5a6678" }}>{t('footer.copyright')}</div>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', display: "flex", gap: 20, fontSize: 12, color: "#5a6678" }}>
              <a href="/legal/privacy" className="hover:text-[#9aa4b3] transition-colors">{t('footer.legal.0')}</a>
              <a href="/legal/terms" className="hover:text-[#9aa4b3] transition-colors">{t('footer.legal.1')}</a>
              <a href="/legal/status" className="hover:text-[#9aa4b3] transition-colors">{t('footer.legal.2')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
