meetnotes/
├── app/
│   ├── (auth)/                 # Routes for sign up, login, logout
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   ├── dashboard/               # Dashboard after login
│   │   ├── page.tsx              # Meeting list + upload button
│   ├── meetings/                # Routes related to meetings
│   │   ├── upload/page.tsx       # Upload meeting audio page
│   │   ├── [meetingId]/page.tsx  # View single meeting details (summary, transcript)
│   ├── layout.tsx               # General layout (navbar/sidebar if needed)
│   ├── page.tsx                 # Landing page (optional for beta)
│   ├── globals.css              # Tailwind global styles
│   └── ... (other needed routes)
│
├── components/                  # Reusable UI components (buttons, cards, forms)
│   ├── ui/                      # Shadcn generated UI primitives (Button, Input, etc.)
│   ├── Header.tsx
│   ├── MeetingCard.tsx          # Displays summary preview in dashboard
│   ├── UploadForm.tsx           # Form to upload audio
│
├── features/                    # Business logic grouped by domain (important for SaaS!)
│   ├── auth/                    # Auth helpers (signIn, signOut functions)
│   │   ├── auth-helpers.ts
│   ├── meetings/                # Meeting upload, fetch, summarization logic
│   │   ├── meeting-api.ts        # API calls related to meetings
│
├── lib/                         # Utility functions
│   ├── api.ts                   # Axios or fetch wrapper
│   ├── upload-helpers.ts        # Maybe file conversion utils
│
├── public/                      # Public assets (logo, favicon)
│
├── styles/                      # If you want to keep additional CSS modules
│
├── .env.local                   # Environment variables (API keys, etc.)
├── next.config.js                # Next.js config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Project dependencies
└── README.md                     # Project info
