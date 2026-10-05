'use client';

import { useState, useEffect } from 'react';

/* ─────────────── Chart: Sparkline ─────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const H = 36, W = 100;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${H} ${pts} ${W},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id={`g${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#g${color.slice(1)})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────── Chart: Bar ────────────────── */
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-[5px] h-36">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end" style={{ height: '112px' }}>
            <div
              className="w-full rounded-t-sm animate-bar"
              style={{
                height: `${(d.value / max) * 100}%`,
                backgroundColor: `#4f63d2`,
                opacity: 0.25 + (i / data.length) * 0.55,
                animationDelay: `${i * 0.04}s`,
              }}
            />
          </div>
          <span className="text-[9.5px] text-muted/50 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Chart: Donut ──────────────── */
function DonutChart({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const R = 38, C = 2 * Math.PI * R;
  let cum = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* track */}
          <circle cx="50" cy="50" r={R} fill="none" stroke="#f0f2f5" strokeWidth={9} />
          {items.map((item, i) => {
            const len = (item.value / total) * C;
            const off = cum;
            cum += len;
            return (
              <circle key={i} cx="50" cy="50" r={R} fill="none"
                stroke={item.color} strokeWidth={9}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-off}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[15px] font-semibold text-foreground">{total.toLocaleString()}</span>
          <span className="text-[9px] text-muted/50 mt-0.5">Total</span>
        </div>
      </div>

      <ul className="space-y-2 min-w-0 flex-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[12px] text-muted truncate">{item.label}</span>
            <span className="ml-auto text-[12px] font-medium text-foreground/70 tabular-nums shrink-0">
              {item.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────── Static data ───────────────── */
const STATS = [
  {
    title: 'Total Revenue',
    value: '$48,295',
    sub: 'vs last month',
    change: '+12.5%',
    up: true,
    data: [30,38,34,50,46,60,68,63,74,79,83,76],
    color: '#4f63d2',
  },
  {
    title: 'Total Users',
    value: '2,847',
    sub: 'active accounts',
    change: '+8.2%',
    up: true,
    data: [18,24,21,29,27,34,31,37,41,39,47,51],
    color: '#5b8ca8',
  },
  {
    title: 'Total Orders',
    value: '1,384',
    sub: 'this month',
    change: '+4.1%',
    up: true,
    data: [14,17,19,18,24,27,29,26,31,34,32,37],
    color: '#3d8b68',
  },
  {
    title: 'Bounce Rate',
    value: '23.4%',
    sub: 'page visits',
    change: '-2.8%',
    up: false,
    data: [44,41,39,37,34,32,29,27,24,26,23,22],
    color: '#b97a2c',
  },
];

const BAR_DATA = [
  { label: 'Jan', value: 4500 },
  { label: 'Feb', value: 5200 },
  { label: 'Mar', value: 4800 },
  { label: 'Apr', value: 6100 },
  { label: 'May', value: 5800 },
  { label: 'Jun', value: 7200 },
  { label: 'Jul', value: 6900 },
  { label: 'Aug', value: 7800 },
  { label: 'Sep', value: 8200 },
  { label: 'Oct', value: 7500 },
  { label: 'Nov', value: 8800 },
  { label: 'Dec', value: 9200 },
];

const TRAFFIC = [
  { label: 'Organic Search', value: 4520, color: '#4f63d2' },
  { label: 'Direct',         value: 2150, color: '#5b8ca8' },
  { label: 'Referral',       value: 1340, color: '#3d8b68' },
  { label: 'Social Media',   value:  890, color: '#b97a2c' },
];

const ACTIVITY = [
  { id:1, name:'Sarah Miller',  act:'placed a new order',       amt:'$235.00',    time:'2m ago',  initials:'SM' },
  { id:2, name:'James Wilson',  act:'updated their profile',    amt:null,         time:'8m ago',  initials:'JW' },
  { id:3, name:'Emma Davis',    act:'completed payment',        amt:'$1,420.00',  time:'15m ago', initials:'ED' },
  { id:4, name:'Michael Chen',  act:'submitted support ticket', amt:null,         time:'32m ago', initials:'MC' },
  { id:5, name:'Olivia Brown',  act:'subscribed to Pro plan',   amt:'$49.99/mo',  time:'1h ago',  initials:'OB' },
  { id:6, name:'Liam Johnson',  act:'cancelled subscription',   amt:null,         time:'2h ago',  initials:'LJ' },
];

const PRODUCTS = [
  { name:'Premium Widget Pro', sales:2840, revenue:'$42,600', trend:'+18%' },
  { name:'Starter Pack Basic', sales:1920, revenue:'$19,200', trend:'+12%' },
  { name:'Enterprise Suite',   sales:1150, revenue:'$57,500', trend:'+24%' },
  { name:'Mobile Addon',       sales: 980, revenue:' $9,800', trend: '+6%' },
  { name:'API Access Key',     sales: 740, revenue:'$14,800', trend: '+9%' },
];

/* ─────────────── Page ──────────────────────── */
export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) return null;

  const now   = new Date();
  const h     = now.getHours();
  const greet = h < 12 ? 'Selamat Pagi' : h < 17 ? 'Selamat Siang' : 'Selamat Malam';
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">{greet} 👋</h1>
          <p className="text-[13px] text-muted mt-0.5">
            Berikut ringkasan bisnis Anda hari ini.
          </p>
        </div>
        <span className="self-start sm:self-auto text-[12px] text-muted/60 bg-white border border-border
                         rounded-lg px-3 py-1.5 whitespace-nowrap">
          {dateStr}
        </span>
      </div>

      {/* ── Stat cards ──────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <div
            key={i}
            className={`bg-white border border-border rounded-xl p-4
                        hover:shadow-sm transition-shadow duration-200 group
                        animate-fade-up s${i + 1}`}
            style={{ opacity: 0 }}
          >
            {/* top row */}
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ backgroundColor: `${s.color}14` }}>
                <StatIcon color={s.color} />
              </div>
              <span
                className="text-[11px] font-medium rounded-md px-1.5 py-0.5"
                style={{
                  color: s.up ? '#3d8b68' : '#b84040',
                  backgroundColor: s.up ? '#3d8b6810' : '#b8404010',
                }}
              >
                {s.change}
              </span>
            </div>

            {/* value */}
            <p className="text-[20px] font-semibold text-foreground leading-none mb-0.5">
              {s.value}
            </p>
            <p className="text-[11.5px] text-muted/60">{s.title}</p>

            {/* sparkline */}
            <div className="mt-3 opacity-40 group-hover:opacity-70 transition-opacity duration-300">
              <Sparkline data={s.data} color={s.color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">

        {/* Revenue bar */}
        <div className="bg-white border border-border rounded-xl p-5 animate-fade-up s5" style={{ opacity: 0 }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[13px] font-semibold text-foreground">Revenue Overview</h2>
              <p className="text-[11px] text-muted/50 mt-0.5">Total pendapatan per bulan · 2026</p>
            </div>
            {/* toggle pill */}
            <div className="flex items-center gap-px bg-background border border-border rounded-md p-0.5">
              {['Bulanan','Mingguan'].map((t, i) => (
                <button key={t}
                  className={`text-[11px] px-2.5 py-1 rounded transition-colors duration-100
                    ${i === 0
                      ? 'bg-white text-foreground/80 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-border/40'
                      : 'text-muted hover:text-foreground'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <BarChart data={BAR_DATA} />
          {/* Y-axis hint */}
          <div className="flex justify-between mt-1 px-0.5">
            {['$0','$3k','$6k','$9k'].map(l => (
              <span key={l} className="text-[9px] text-muted/35 font-medium">{l}</span>
            ))}
          </div>
        </div>

        {/* Traffic donut */}
        <div className="bg-white border border-border rounded-xl p-5 animate-fade-up s6" style={{ opacity: 0 }}>
          <h2 className="text-[13px] font-semibold text-foreground mb-1">Sumber Traffic</h2>
          <p className="text-[11px] text-muted/50 mb-5">Asal pengunjung Anda</p>
          <DonutChart items={TRAFFIC} />
        </div>
      </div>

      {/* ── Bottom row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Recent activity */}
        <div className="bg-white border border-border rounded-xl p-5 animate-fade-up s5" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-foreground">Aktivitas Terkini</h2>
            <button className="text-[11px] text-primary hover:text-primary-hover font-medium transition-colors">
              Lihat semua
            </button>
          </div>

          <ul>
            {ACTIVITY.map(a => (
              <li key={a.id}
                  className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
                {/* avatar */}
                <div className="w-7 h-7 rounded-md bg-primary/6 flex items-center justify-center
                                text-[10px] font-semibold text-primary/60 shrink-0">
                  {a.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-snug">
                    <span className="font-medium text-foreground">{a.name}</span>
                    {' '}
                    <span className="text-muted">{a.act}</span>
                  </p>
                  <p className="text-[11px] text-muted/45 mt-0.5">{a.time}</p>
                </div>
                {a.amt && (
                  <span className="text-[13px] font-medium text-foreground/65 tabular-nums shrink-0">
                    {a.amt}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Top products */}
        <div className="bg-white border border-border rounded-xl p-5 animate-fade-up s6" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-foreground">Produk Terlaris</h2>
            <button className="text-[11px] text-primary hover:text-primary-hover font-medium transition-colors">
              Lihat semua
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60">
                {['Produk','Terjual','Pendapatan','Tren'].map((h, i) => (
                  <th key={h}
                    className={`pb-2 text-[11px] font-medium text-muted/55
                                ${i === 0 ? 'text-left' : 'text-right'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p, i) => (
                <tr key={i} className="border-b border-border/20 last:border-0
                                      hover:bg-surface-hover/60 transition-colors">
                  <td className="py-2.5 text-[13px] font-medium text-foreground pr-2">{p.name}</td>
                  <td className="py-2.5 text-[12px] text-right text-muted tabular-nums">
                    {p.sales.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-[13px] text-right text-foreground/70 tabular-nums font-medium">
                    {p.revenue}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded
                                     text-success bg-success/8">
                      {p.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* ─── Small stat icon (single shape, adapts color) ─── */
function StatIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
