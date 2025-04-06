meetnotes-backend/
│
├── src/                   # All source code lives here
│   ├── app.ts              # Main Express app (register middlewares, routes)
│   ├── server.ts           # Server entry point (start listening on port)
│
│   ├── config/             # Configuration setup (Supabase, AWS S3, OpenAI, env vars)
│   │   ├── supabase.ts
│   │   ├── s3.ts
│   │   ├── openai.ts
│   │   └── env.ts          # Centralized dotenv loading
│
│   ├── routes/             # API route definitions
│   │   ├── authRoutes.ts   # /auth/*
│   │   ├── meetingRoutes.ts # /meetings/*
│
│   ├── controllers/        # Business logic for each route
│   │   ├── authController.ts
│   │   ├── meetingController.ts
│
│   ├── services/           # External services interaction (Supabase, OpenAI, S3)
│   │   ├── authService.ts
│   │   ├── meetingService.ts
│   │   ├── openaiService.ts
│   │   ├── s3Service.ts
│
│   ├── middlewares/        # Express middlewares (auth checks, error handling)
│   │   ├── authMiddleware.ts
│   │   ├── errorMiddleware.ts
│
│   ├── utils/              # Utility functions (formatting, helpers, etc.)
│   │   ├── logger.ts        # (uses morgan)
│   │   ├── validateRequest.ts # (optional: input validation)
│
│   ├── types/              # Custom TypeScript types and interfaces
│   │   ├── authTypes.ts
│   │   ├── meetingTypes.ts
│
│   └── constants/          # Constants like bucket names, max upload size
│       └── appConstants.ts
│
├── .env                    # Environment variables
├── package.json
├── tsconfig.json           # If using TypeScript (recommended)
├── README.md
