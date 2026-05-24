export interface BuildLogEntry {
  id: string;
  week: number;
  date: string;
  title: string;
  content: string;
  tags: string[];
}

export interface TimelineItem {
  id: string;
  period: string;
  title: string;
  description: string;
  status: 'done' | 'current' | 'future';
}

export interface CoFounderRequirement {
  id: string;
  title: string;
  desc: string;
}

export const INITIAL_BUILD_LOGS: BuildLogEntry[] = [];

export const JOURNEY_TIMELINE: TimelineItem[] = [
  {
    id: 'time-1',
    period: 'May 2026',
    title: 'The Problem Identified',
    description: 'Identified the problem and actively reaching out to founders facing the issue to validate that FiBrainAI will work as a solution.',
    status: 'current'
  },
  {
    id: 'time-2',
    period: 'Early June 2026',
    title: 'Private MVP Launch',
    description: 'Coming soon - our first functional transaction parsing and on-demand CFO digest pipeline.',
    status: 'future'
  }
];

export const COFOUNDER_REQUIREMENTS: CoFounderRequirement[] = [
  {
    id: 'req-1',
    title: 'Deep Backend & AI expertise',
    desc: 'You should be comfortable building secure parser microservices, writing vector pipelines, and working with multi-agent orchestration. Node/TS or Python is fine.'
  },
  {
    id: 'req-2',
    title: 'Relentless Builder Mentality',
    desc: 'We are building in public. We ship daily. You must be obsessed with pristine clean code, UX details, and high speed-to-market. Zero corporate politics.'
  },
  {
    id: 'req-3',
    title: 'Pune Based / Open for Anyone',
    desc: 'I am based in Pune but open for anyone who can coordinate. I would prefer if you are from Pune to share whiteboards, but what matters is that we can build rapidly together.'
  },
  {
    id: 'req-4',
    title: 'Financial Curiosity',
    desc: 'You don’t need a finance degree, but you must be excited to master startup unit economics, multi-tenant security, accounting frameworks, and ledger APIs.'
  }
];

export const CONVERSATION_DEMOS = [
  {
    prompt: "Show me our current burn rate and runway breakdown.",
    response: {
      summary: "This month’s burn is ₹4.2 Lakhs. Your live runway is 15.4 months based on current liquid balances. Your burn rate decreased by 8% from last month, mostly due to lower server optimizations.",
      metrics: [
        { label: "Monthly Burn", value: "₹4,20,000", change: "-8%" },
        { label: "Cash Balance", value: "₹64,70,000", change: "Live" },
        { label: "Runway", value: "15.4 Months", change: "+0.8m" }
      ],
      insight: "💡 FiBrainAI Alert: You have ₹1.8L in AWS Promotional Credits expiring on June 15th. We have factored this into next month's projection, which will prevent a ₹1.5L cash outflow."
    }
  },
  {
    prompt: "Where did we spend the most cash this month compared to last?",
    response: {
      summary: "SaaS subscriptions and contractor fees represent 78% of your overall cash outflows. We flag two key cost increases: GitHub and external API calls.",
      metrics: [
        { label: "Engineering contractors", value: "₹2,40,000", change: "+4%" },
        { label: "SaaS & Infrastructure", value: "₹88,000", change: "+24%" },
        { label: "Ad spend / Marketing", value: "₹35,000", change: "-12%" }
      ],
      insight: "💡 Saving Tip: We identified duplicate Notion seats and an unused Vercel Team subscription that are costing you ₹8,200 per month (approx. ₹1L annually). One-click to remove them?"
    }
  },
  {
    prompt: "Draft a concise runway summary we can copy-paste for our current Angel Investors.",
    response: {
      summary: "Investor Update Draft generated based on May ledger:",
      draft: `Hi Investors,

Quick update on the financial health of our startup:
- **Cash in Bank:** ₹64.7 Lakhs
- **Current Net Burn:** ₹4.2 Lakhs / month (down 8% MoM)
- **Runway:** 15.4 Months (takes us to September 2027)
- **Top Outflows:** R&D engineering (57%), AWS cloud (21%), SaaS tooling (11%)
- **Efficiency Core:** Reduced SaaS creep by ₹8,200/mo and optimizing AWS credit usage ahead of June expiry.

Let me know if you would like me to unpack any of these figures in our weekly sync.`,
      insight: "💡 Investor Relations: This draft matches standard formats preferred by Sequoia/Accel early-stage checks."
    }
  }
];
