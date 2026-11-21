# Project Structure

This document outlines the directory structure, modular architectural patterns, and file organization rules for the **Recipe Organizer & Smart Meal Planning Platform**.

---

## Workspace Layout

```
recipe-organizer/
├── .gitignore                      # Git ignore rules protecting .env and build files
├── package.json                    # Root npm workspace manifest & unified scripts
├── README.md                       # High-level overview, setup guide, and phase plan
├── PROJECT_STRUCTURE.md            # Detailed structural documentation
│
├── client/                         # Frontend application workspace (Vite + React)
│   ├── public/                     # Static assets served directly by Vite
│   ├── src/
│   │   ├── assets/                 # Images, SVGs, icons, and static styles
│   │   ├── components/             # Reusable UI component modules
│   │   │   ├── common/             # Generic primitives (Button, Modal, Input, Badge, Card)
│   │   │   ├── layout/             # App shell, Navbar, Sidebar, Footer, PageWrapper
│   │   │   ├── recipes/            # RecipeCard, RecipeGrid, RecipeFilters, RecipeForm
│   │   │   ├── planner/            # WeeklyGrid, MealSlot, DroppableDay, DragHandle
│   │   │   └── insights/           # NutritionChart, MacroDistribution, RecipeStats
│   │   ├── pages/                  # Page-level components corresponding to routes
│   │   │   ├── Home.jsx            # Landing / Dashboard overview
│   │   │   ├── RecipesPage.jsx     # Recipe Explorer
│   │   │   ├── RecipeDetailPage.jsx# Detailed recipe view and editor
│   │   │   ├── MealPlannerPage.jsx # Weekly meal scheduling and grocery list
│   │   │   └── InsightsPage.jsx    # Nutrition and AI insights
│   │   ├── hooks/                  # Custom React hooks (useRecipes, useMealPlan, etc.)
│   │   ├── context/                # React Context providers for global UI state
│   │   ├── services/               # API clients and HTTP service calls (Axios instances)
│   │   ├── utils/                  # Formatting helpers, nutrition math, date helpers
│   │   ├── test/                   # Client-side testing fixtures and test setup
│   │   │   ├── fixtures/           # Mock data and test fixtures
│   │   │   ├── setup.js            # Vitest testing setup (imports @testing-library/jest-dom)
│   │   │   └── App.test.jsx        # Smoke test verifying React environment
│   │   ├── App.jsx                 # Main application component with route declarations
│   │   ├── main.jsx                # Application entry point mounting to DOM
│   │   └── index.css               # Tailwind CSS entry directives and global styling
│   ├── .env.example                # Example client environment variables
│   ├── index.html                  # HTML template for Vite
│   ├── package.json                # Frontend dependencies and npm scripts
│   ├── postcss.config.js           # PostCSS configuration for Tailwind CSS
│   ├── tailwind.config.js          # Tailwind CSS design system configuration
│   └── vite.config.js              # Vite bundler & Vitest test configuration
│
└── server/                         # Backend API workspace (Node.js + Express + Mongoose)
    ├── API_CONTRACT.md             # Authoritative REST API specification & schemas
    ├── src/
    │   ├── config/
    │   │   └── db.js               # Mongoose connection manager with credential masking
    │   ├── models/
    │   │   ├── Recipe.js           # Mongoose model for recipes, ingredients & instructions
    │   │   ├── Favorite.js         # Mongoose model for single-user favorited recipes
    │   │   ├── MealPlan.js         # Mongoose model for nested Monday-UTC weekly meal plans
    │   │   ├── GroceryList.js      # Mongoose model with stable subdocument item IDs
    │   │   └── UserPreference.js   # Mongoose model for default profile preferences
    │   ├── controllers/
    │   │   ├── recipeController.js      # Recipe HTTP handlers (search, CRUD)
    │   │   ├── favoriteController.js    # Favorite HTTP handlers
    │   │   ├── mealPlanController.js    # Weekly meal plan HTTP handlers
    │   │   ├── groceryListController.js # Grocery list & item HTTP handlers
    │   │   ├── preferenceController.js  # User preference HTTP handlers
    │   │   └── insightsController.js    # Analytical insights & recommendation handler
    │   ├── routes/
    │   │   ├── recipeRoutes.js          # Express router for /api/recipes
    │   │   ├── favoriteRoutes.js        # Express router for /api/favorites
    │   │   ├── mealPlanRoutes.js        # Express router for /api/meal-plans
    │   │   ├── groceryListRoutes.js     # Express router for /api/grocery-lists
    │   │   ├── preferenceRoutes.js      # Express router for /api/preferences
    │   │   └── insightsRoutes.js        # Express router for /api/insights
    │   ├── services/
    │   │   ├── recipeService.js         # Recipe search, ANY/ALL ingredient filter & sort
    │   │   ├── favoriteService.js       # Favorite persistence & duplicate check
    │   │   ├── mealPlanService.js       # Weekly date normalization & recipe validation
    │   │   ├── groceryListService.js    # Scaling & deterministic aggregation service
    │   │   ├── preferenceService.js     # User preference profile management
    │   │   └── insightsService.js       # Rule-based AI insights & recommendation engine
    │   ├── middleware/
    │   │   ├── errorHandler.js          # Centralized error handler (no secret leakage)
    │   │   ├── notFound.js              # 404 endpoint catch-all handler
    │   │   ├── rateLimiter.js           # Express rate limiting middleware
    │   │   ├── validate.js              # Zod schema request validation middleware
    │   │   └── validateObjectId.js      # Mongoose ObjectId parameter validation
    │   ├── utils/
    │   │   ├── apiResponse.js           # Standard success and error response envelopes
    │   │   ├── asyncHandler.js          # Async controller wrapper catching rejections
    │   │   ├── dateUtils.js             # Monday UTC normalization & ISO date helpers
    │   │   ├── ingredientAggregator.js  # Deterministic unit-safe aggregation logic
    │   │   ├── sanitize.js              # Regex escaping & query sanitization
    │   │   └── validationSchemas.js     # Comprehensive Zod validation schemas
    │   ├── seed/
    │   │   ├── seedRecipes.js           # 24 realistic multi-cuisine sample recipes
    │   │   └── index.js                 # Idempotent database seeder entry script
    │   ├── app.js                       # Express app configuration & middleware registry
    │   └── server.js                    # HTTP listener & database connection lifecycle
    ├── tests/
    │   ├── fixtures/                    # Test documents and sample database payloads
    │   ├── setup.js                     # Vitest backend setup hooks
    │   └── server.test.js               # Server initialization test
    ├── .env.example                     # Example backend environment variables
    ├── package.json                     # Backend dependencies and npm scripts
    └── vitest.config.js                 # Vitest configuration for Node.js environment
```

---

## Architectural Principles

1. **Independent Execution & Decoupling**
   - The frontend (`client/`) runs as an independent Single Page Application (SPA).
   - The backend (`server/`) is a standalone stateless Express server exposing JSON REST endpoints.
   - `app.js` is isolated from network socket listener (`server.js`), allowing testing without port binding.

2. **Security & Configuration Isolation**
   - Backend environment variables (`MONGODB_URI`, `PORT`, `CLIENT_ORIGIN`) are restricted to `server/.env`.
   - Logging utilities strictly mask database credentials (e.g. `mongodb+srv://user:***@cluster...`).
   - `.env` files are strictly excluded from version control via root `.gitignore`.

3. **Layered Backend Architecture**
   - **Routes**: Define URL endpoints, wire parameter validation, and delegate to controllers.
   - **Controllers**: Handle HTTP request extraction, call services, and return standard API responses.
   - **Services**: Contain pure business logic (ingredient aggregation, pagination, rule-based AI recommendations).
   - **Models**: Define data structures, field validations, and Mongoose indexes.

4. **Deterministic Data Integrity**
   - Dates are standardized to Monday 00:00:00.000 UTC for weekly scheduling.
   - Grocery items maintain permanent, stable MongoDB `_id` values.
   - Database seeder uses idempotent upsert logic to prevent duplicate sample data.
