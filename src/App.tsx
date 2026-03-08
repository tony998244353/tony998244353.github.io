import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { DragonCurveCanvas } from './components/DragonCurveCanvas';
import contentEn from './content.en.md?raw';
import contentJa from './content.ja.md?raw';
import './App.css';

const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const mdRemarkPlugins = [remarkGfm];
const mdRehypePlugins = [rehypeRaw];
const mdComponents = {
  img: ({ node, ...props }: any) => <img className="avatar" {...props} />,
  a: ({ node, ...props }: any) => <a target="_blank" rel="noreferrer" {...props} />,
};

const LANGS = [
  { code: 'en', label: 'EN', content: contentEn },
  { code: 'ja', label: 'JA', content: contentJa },
] as const;
type Lang = (typeof LANGS)[number]['code'];
const contentMap = Object.fromEntries(
  LANGS.map(l => [l.code, l.content.split(/\n---\n/)])
) as Record<Lang, string[]>;

const Sections = memo(function Sections({ lang, excludeLast }: { lang: Lang; excludeLast?: boolean }) {
  let sections = contentMap[lang];
  if (excludeLast) sections = sections.slice(0, -1);
  return (
    <>
      {sections.map((md, i) => (
        <section className="section" key={i}>
          <div className="card" style={i === 0 ? { textAlign: 'center' } : undefined}>
            <Markdown
              remarkPlugins={mdRemarkPlugins}
              rehypePlugins={mdRehypePlugins}
              components={mdComponents}
            >
              {md.trim()}
            </Markdown>
          </div>
        </section>
      ))}
    </>
  );
});

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find(l => l.code === lang)!;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  return (
    <div className="lang-toggle" ref={ref}>
      <div className="lang-current" onClick={() => setOpen(o => !o)}>
        {current.label}
      </div>
      {open && (
        <div className="lang-menu">
          {LANGS.filter(l => l.code !== lang).map(l => (
            <div
              key={l.code}
              className="lang-menu-item"
              onClick={() => { onChange(l.code); setOpen(false); }}
            >
              {l.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RingIndicator({ progress }: { progress: number }) {
  const size = 72;
  const stroke = 4;
  const pad = 6;
  const r = (size - pad * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcLength = progress * circumference;
  const angle = progress * 2 * Math.PI - Math.PI / 2;
  const dotX = center + r * Math.cos(angle);
  const dotY = center + r * Math.sin(angle);

  return (
    <svg className="ring-indicator" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={center} cy={center} r={r}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke}
      />
      <circle
        cx={center} cy={center} r={r}
        fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - arcLength}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
      <circle cx={dotX} cy={dotY} r={5} fill="#fff" opacity={0.9} />
    </svg>
  );
}

function Divider() {
  return (
    <div className="divider">
      <span className="divider-line" />
      <span className="divider-label">∞</span>
      <span className="divider-line" />
    </div>
  );
}

function DesktopApp({ lang }: { lang: Lang }) {
  const [scrollY, setScrollY] = useState(0);
  const [offset, setOffset] = useState(0);
  const virtualScrollRef = useRef(0);
  const dragonScrollRef = useRef(0);
  const contentHeightRef = useRef(1);
  const measureRef = useRef<HTMLDivElement>(null);

  const update = useCallback(() => {
    const h = contentHeightRef.current;
    const vs = virtualScrollRef.current;
    setScrollY(dragonScrollRef.current);
    setOffset(((vs % h) + h) % h);
  }, []);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const oldH = contentHeightRef.current;
      const newH = el.scrollHeight || 1;
      if (oldH > 1 && newH !== oldH) {
        virtualScrollRef.current = virtualScrollRef.current / oldH * newH;
      }
      contentHeightRef.current = newH;
      update();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      virtualScrollRef.current += e.deltaY;
      dragonScrollRef.current += e.deltaY;
      update();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [update]);

  return (
    <>
      <DragonCurveCanvas scrollY={scrollY} />
      <RingIndicator progress={offset / contentHeightRef.current} />
      <div className="viewport">
        <div
          className="content-track"
          style={{ transform: `translateY(${-offset}px)` }}
        >
          <div ref={measureRef}>
            <Sections lang={lang} />
            <Divider />
          </div>
          <Sections lang={lang} />
          <Divider />
        </div>
      </div>
    </>
  );
}

function MobileApp({ lang }: { lang: Lang }) {
  return (
    <div className="mobile-scroll">
      <Sections lang={lang} excludeLast />
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>('en');

  return (
    <div className="app">
      <LangToggle lang={lang} onChange={setLang} />
      {isDesktop ? <DesktopApp lang={lang} /> : <MobileApp lang={lang} />}
    </div>
  );
}
