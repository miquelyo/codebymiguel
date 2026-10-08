'use client';
import './dashboard.css';


import { useEffect, useState } from 'react';

/* =========================
   TYPES
========================= */

type Stat = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  description: string;
  data: number[];
};

type Activity = {
  id: number;
  name: string;
  action: string;
  time: string;
  amount?: string;
  initials: string;
};

type Product = {
  name: string;
  category: string;
  sales: number;
  revenue: string;
  trend: number;
};

/* =========================
   DUMMY DATA
========================= */

const STATS: Stat[] = [
  {
    title: 'Total Revenue',
    value: '$48,295',
    change: '12.5%',
    positive: true,
    description: 'vs. previous month',
    data: [35, 42, 38, 48, 44, 58, 52, 68, 62, 72, 65, 82],
  },
  {
    title: 'Total Users',
    value: '2,847',
    change: '8.2%',
    positive: true,
    description: 'vs. previous month',
    data: [30, 35, 32, 42, 38, 48, 45, 54, 50, 62, 58, 70],
  },
  {
    title: 'Total Orders',
    value: '1,384',
    change: '5.7%',
    positive: true,
    description: 'vs. previous month',
    data: [25, 32, 28, 40, 35, 44, 42, 52, 48, 58, 55, 65],
  },
  {
    title: 'Bounce Rate',
    value: '23.4%',
    change: '2.1%',
    positive: false,
    description: 'vs. previous month',
    data: [65, 60, 64, 55, 58, 52, 48, 50, 44, 42, 40, 38],
  },
];

const REVENUE_DATA = [
  { month: 'Jan', value: 28000 },
  { month: 'Feb', value: 32000 },
  { month: 'Mar', value: 29500 },
  { month: 'Apr', value: 36000 },
  { month: 'May', value: 33500 },
  { month: 'Jun', value: 41000 },
  { month: 'Jul', value: 38500 },
  { month: 'Aug', value: 45000 },
  { month: 'Sep', value: 42000 },
  { month: 'Oct', value: 48000 },
  { month: 'Nov', value: 45500 },
  { month: 'Dec', value: 52000 },
];

const TRAFFIC = [
  {
    name: 'Organic Search',
    value: 51,
  },
  {
    name: 'Direct',
    value: 24,
  },
  {
    name: 'Referral',
    value: 15,
  },
  {
    name: 'Social Media',
    value: 10,
  },
];

const ACTIVITIES: Activity[] = [
  {
    id: 1,
    name: 'Sarah Miller',
    action: 'placed a new order',
    time: '2 minutes ago',
    amount: '$249.00',
    initials: 'SM',
  },
  {
    id: 2,
    name: 'James Wilson',
    action: 'created an account',
    time: '18 minutes ago',
    initials: 'JW',
  },
  {
    id: 3,
    name: 'Emma Davis',
    action: 'completed payment',
    time: '42 minutes ago',
    amount: '$189.00',
    initials: 'ED',
  },
  {
    id: 4,
    name: 'Michael Chen',
    action: 'placed a new order',
    time: '1 hour ago',
    amount: '$420.00',
    initials: 'MC',
  },
  {
    id: 5,
    name: 'Olivia Brown',
    action: 'created an account',
    time: '2 hours ago',
    initials: 'OB',
  },
];

const PRODUCTS: Product[] = [
  {
    name: 'Premium Widget Pro',
    category: 'Software',
    sales: 482,
    revenue: '$18,940',
    trend: 12.5,
  },
  {
    name: 'Starter Pack Basic',
    category: 'Software',
    sales: 365,
    revenue: '$9,125',
    trend: 8.4,
  },
  {
    name: 'Enterprise Suite',
    category: 'Enterprise',
    sales: 218,
    revenue: '$8,720',
    trend: 6.2,
  },
  {
    name: 'Mobile Addon',
    category: 'Add-on',
    sales: 194,
    revenue: '$5,432',
    trend: 4.8,
  },
];

/* =========================
   ICONS
========================= */

function ArrowUpRight() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function ArrowDownRight() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 7l10 10" />
      <path d="M17 7v10H7" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M7 16l4-5 3 3 5-7" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 8H6" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}

/* =========================
   SPARKLINE
========================= */

function Sparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  const width = 110;
  const height = 42;
  const padding = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);

  const points = data
    .map((value, index) => {
      const x =
        padding +
        (index / (data.length - 1)) * (width - padding * 2);

      const normalized =
        max === min ? 0.5 : (value - min) / (max - min);

      const y =
        height -
        padding -
        normalized * (height - padding * 2);

      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`sparkline ${positive ? 'positive' : 'negative'}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  stat,
  index,
}: {
  stat: Stat;
  index: number;
}) {
  const icons = [
    <RevenueIcon key="revenue" />,
    <UsersIcon key="users" />,
    <CartIcon key="cart" />,
    <ActivityIcon key="activity" />,
  ];

  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon stat-icon-${index}`}>
          {icons[index]}
        </div>

        <button className="icon-button" aria-label="More options">
          <MoreIcon />
        </button>
      </div>

      <div className="stat-content">
        <p className="stat-title">{stat.title}</p>

        <div className="stat-value">{stat.value}</div>

        <div className="stat-bottom">
          <div className="stat-change">
            <span
              className={
                stat.positive
                  ? 'change-positive'
                  : 'change-negative'
              }
            >
              {stat.positive ? (
                <ArrowUpRight />
              ) : (
                <ArrowDownRight />
              )}

              {stat.change}
            </span>

            <span className="stat-description">
              {stat.description}
            </span>
          </div>

          <Sparkline
            data={stat.data}
            positive={stat.positive}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================
   REVENUE CHART
========================= */

function RevenueChart() {
  const maxValue = Math.max(
    ...REVENUE_DATA.map((item) => item.value)
  );

  return (
    <div className="chart-card revenue-card">
      <div className="card-header">
        <div>
          <h3>Revenue Overview</h3>
          <p>Monthly revenue performance</p>
        </div>

        <button className="more-button" aria-label="More options">
          <MoreIcon />
        </button>
      </div>

      <div className="revenue-total">
        <span>$48,295</span>
        <div className="revenue-growth">
          <ArrowUpRight />
          12.5%
        </div>
      </div>

      <div className="chart-area">
        <div className="y-axis">
          <span>$60K</span>
          <span>$45K</span>
          <span>$30K</span>
          <span>$15K</span>
          <span>$0</span>
        </div>

        <div className="bars-container">
          <div className="grid-lines">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="bars">
            {REVENUE_DATA.map((item) => {
              const height =
                (item.value / maxValue) * 100;

              return (
                <div
                  className="bar-wrapper"
                  key={item.month}
                >
                  <div
                    className="bar"
                    style={{
                      height: `${height}%`,
                    }}
                    title={`${item.month}: $${item.value.toLocaleString()}`}
                  />

                  <span className="bar-label">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   TRAFFIC CHART
========================= */

function TrafficChart() {
  return (
    <div className="chart-card traffic-card">
      <div className="card-header">
        <div>
          <h3>Traffic Sources</h3>
          <p>Where your visitors come from</p>
        </div>

        <button className="more-button" aria-label="More options">
          <MoreIcon />
        </button>
      </div>

      <div className="traffic-content">
        <div className="donut-wrapper">
          <div className="donut">
            <div className="donut-center">
              <strong>24.8K</strong>
              <span>Visitors</span>
            </div>
          </div>
        </div>

        <div className="traffic-list">
          {TRAFFIC.map((item, index) => (
            <div className="traffic-item" key={item.name}>
              <div className="traffic-item-top">
                <div className="traffic-name">
                  <span
                    className={`traffic-dot traffic-dot-${index}`}
                  />

                  {item.name}
                </div>

                <strong>{item.value}%</strong>
              </div>

              <div className="traffic-progress">
                <div
                  className={`traffic-progress-fill traffic-fill-${index}`}
                  style={{
                    width: `${item.value}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================
   ACTIVITY
========================= */

function RecentActivity() {
  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h3>Recent Activity</h3>
          <p>Latest activity from your users</p>
        </div>

        <button className="view-all-button">
          View all
          <ArrowUpRight />
        </button>
      </div>

      <div className="activity-list">
        {ACTIVITIES.map((activity) => (
          <div
            className="activity-item"
            key={activity.id}
          >
            <div className="activity-avatar">
              {activity.initials}
            </div>

            <div className="activity-info">
              <p>
                <strong>{activity.name}</strong>{' '}
                {activity.action}
              </p>

              <span>{activity.time}</span>
            </div>

            {activity.amount && (
              <div className="activity-amount">
                {activity.amount}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   PRODUCTS
========================= */

function TopProducts() {
  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h3>Top Products</h3>
          <p>Best performing products</p>
        </div>

        <button className="more-button" aria-label="More options">
          <MoreIcon />
        </button>
      </div>

      <div className="products-list">
        {PRODUCTS.map((product, index) => (
          <div
            className="product-item"
            key={product.name}
          >
            <div className="product-number">
              {String(index + 1).padStart(2, '0')}
            </div>

            <div className="product-info">
              <strong>{product.name}</strong>
              <span>{product.category}</span>
            </div>

            <div className="product-sales">
              <strong>{product.sales}</strong>
              <span>sales</span>
            </div>

            <div className="product-revenue">
              <strong>{product.revenue}</strong>

              <span>
                <ArrowUpRight />
                {product.trend}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   MAIN DASHBOARD
========================= */

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [period, setPeriod] = useState<
    'Monthly' | 'Weekly'
  >('Monthly');

  useEffect(() => {
    setReady(true);
  }, []);

  const currentHour = new Date().getHours();

  let greeting = 'Good evening';

  if (currentHour < 12) {
    greeting = 'Good morning';
  } else if (currentHour < 18) {
    greeting = 'Good afternoon';
  }

  const today = new Date().toLocaleDateString(
    'id-ID',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  if (!ready) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <main className="dashboard-page">
      {/* =========================
          PAGE HEADER
      ========================= */}

      <section className="dashboard-header">
        <div>
          <div className="header-eyebrow">
            Dashboard
          </div>

          <h1>
            {greeting}, Miquel <span>👋</span>
          </h1>

          <p>
            Here&apos;s what&apos;s happening with your
            workspace today.
          </p>
        </div>

        <div className="header-actions">
          <div className="date-badge">
            <CalendarIcon />
            <span>{today}</span>
          </div>
        </div>
      </section>

      {/* =========================
          STATS
      ========================= */}

      <section className="stats-grid">
        {STATS.map((stat, index) => (
          <StatCard
            key={stat.title}
            stat={stat}
            index={index}
          />
        ))}
      </section>

      {/* =========================
          CHARTS
      ========================= */}

      <section className="charts-grid">
        <RevenueChart />

        <TrafficChart />
      </section>

      {/* =========================
          LOWER CONTENT HEADER
      ========================= */}

      <section className="section-heading">
        <div>
          <h2>Performance</h2>
          <p>
            Keep track of your latest activities and
            performance.
          </p>
        </div>

        <div className="period-switcher">
          <button
            className={
              period === 'Weekly'
                ? 'period-active'
                : ''
            }
            onClick={() => setPeriod('Weekly')}
          >
            Weekly
          </button>

          <button
            className={
              period === 'Monthly'
                ? 'period-active'
                : ''
            }
            onClick={() => setPeriod('Monthly')}
          >
            Monthly
          </button>
        </div>
      </section>

      {/* =========================
          ACTIVITY + PRODUCTS
      ========================= */}

      <section className="bottom-grid">
        <RecentActivity />

        <TopProducts />
      </section>

          </main>
  );
}