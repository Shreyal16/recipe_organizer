# Recipe Organizer & Smart Meal Planning Platform

A full-stack MERN (MongoDB, Express, React, Node.js) web application designed to help users discover, organize, customize, plan, and analyze their daily meals and recipes.

---

## 1. Project Purpose

The **Recipe Organizer & Smart Meal Planning Platform** is designed as a comprehensive academic/college capstone project demonstrating modern full-stack development best practices. The application addresses common household meal planning challenges:
- Centralized recipe management, indexing, and multi-parameter discovery.
- Detailed recipe viewing with dynamic scaling and ingredient checklists.
- Drag-and-drop weekly meal scheduling and auto-generating consolidated grocery lists.
- Analytical insights and AI-driven recommendations based on dietary preferences and pantry ingredients.

The initial architecture is built as a single-user demonstration platform, emphasizing robust persistence, clean separation of concerns, and an intuitive user experience.

---

## 2. Technology Stack

### Frontend (`client/`)
- **Runtime & Bundler**: Node.js & Vite
- **UI Framework**: React.js (JavaScript ES Modules)
- **Routing**: React Router DOM (v6)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Data Visualization**: Recharts
- **Drag & Drop**: @dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
- **Icons**: Lucide React
- **Testing**: Vitest, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, jsdom, `@vitest/coverage-v8`

### Backend (`server/`)
- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express.js
- **Database ODM**: Mongoose (connecting to MongoDB Atlas or local MongoDB)
- **Security & Utilities**: Helmet, CORS, Express Rate Limit, Dotenv, Zod (schema validation)
- **Testing**: Vitest, Supertest, `mongodb-memory-server`, `@vitest/coverage-v8`

---

## 3. Project Architecture & Monorepo Workspaces

The project uses an **npm workspaces** monorepo structure separating frontend (`client/`) and backend (`server/`) concerns while enabling unified root-level dependency management and script execution.

```
recipe-organizer/
├── client/          # Vite + React frontend workspace
├── server/          # Node.js + Express backend workspace
├── package.json     # Root monorepo configuration with npm workspaces
├── .gitignore       # Root-level ignore rules for security and build artifacts
├── README.md        # Comprehensive project overview and setup guide
└── PROJECT_STRUCTURE.md # Detailed breakdown of directories and conventions
```

### Architectural Separation
- **Separation of Concerns**: The frontend and backend run as independent services. The frontend never touches the database directly or stores sensitive credentials.
- **Stateless RESTful API**: All data transactions occur via predictable JSON endpoints with standardized response envelopes.
- **Data Persistence**: All core application state (recipes, favorites, meal plans, grocery items, user preferences) is persisted in MongoDB via Mongoose. LocalStorage is not used as the primary database.
- **Application vs Server Decoupling**: `app.js` configures middlewares, validation, and routes, and exports the Express app without listening. `server.js` connects to MongoDB and launches the HTTP listener. This enables isolated testing in Phase 6 without binding ports or requiring live cloud connections.

---

## 4. MongoDB Architecture & Mongoose Schemas

All schemas reside under `server/src/models/`:

### 1. Recipe (`Recipe.js`)
- **Fields**: `title`, `description`, `imageUrl`, `cuisine`, `mealType`, `prepTimeMinutes`, `cookTimeMinutes`, `servings`, `difficulty`, `dietaryTags`, `ingredients` (subdocuments with `name`, `quantity`, `unit`), `instructions` (ordered subdocuments with `step`, `text`), `seasonalTags`, `isFeatured`, `timestamps`.
- **Indexes**: Compound index on `{ cuisine: 1, mealType: 1 }`, `{ prepTimeMinutes: 1, createdAt: -1 }`, and `{ 'ingredients.name': 1 }`.

### 2. Favorite (`Favorite.js`)
- **Fields**: `recipeId` (ObjectId referencing Recipe), `createdAt`.
- **Constraint**: Unique index on `recipeId` preventing duplicate favorites.

### 3. MealPlan (`MealPlan.js`)
- **Fields**: `weekStartDate` (Date normalized to Monday 00:00:00.000 UTC), `days` (array of day plans, each containing `date` and `meals` array with `mealType`, `recipeId` reference, and `servings`).
- **Constraint**: Unique index on `weekStartDate` enforcing one schedule per calendar week.

### 4. GroceryList (`GroceryList.js`)
- **Fields**: `weekStartDate` (Date normalized to Monday UTC), `items` (subdocuments with stable `_id`, `ingredientName`, `quantity`, `unit`, `category`, `isPurchased`), `timestamps`.
- **Constraint**: Unique index on `weekStartDate`. Every grocery item has a permanent, stable MongoDB `_id` used for updates and deletions.

### 5. UserPreference (`UserPreference.js`)
- **Fields**: `profileKey` (default: `"default"`), `preferredCuisines`, `dietaryPreferences`, `pantryIngredients`, `timestamps`.
- **Constraint**: Unique index on `profileKey`. Maintains a single user preference document.

---

## 5. MongoDB Atlas Setup & Configuration

### Application Connection Setup
The application connects to MongoDB using Mongoose. To configure Atlas:

1. **Log in to MongoDB Atlas**: Go to [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. **Create a Cluster**:
   - In your project, click **Create**.
   - Select the **M0 Free** shared tier.
   - Choose your preferred cloud provider and closest region (e.g., AWS / Mumbai or N. Virginia).
3. **Create Database User**:
   - Navigate to **Security** > **Database Access**.
   - Click **Add New Database User**.
   - Choose **Password** authentication.
   - Enter a username (e.g. `recipe_app_user`) and a secure password.
   - Grant role: **Read and write to any database** (`readWriteAnyDatabase`).
4. **Configure Network Access**:
   - Navigate to **Security** > **Network Access**.
   - Click **Add IP Address**.
   - Click **Add Current IP Address** to authorize your development machine's public IP address.
   *(Note: For production or dynamic IP environments, add the specific hosting provider IP or static NAT gateway).*
5. **Obtain Connection String**:
   - Go to **Database** > **Clusters** > Click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the connection string format:
     ```
     mongodb+srv://<username>:<password>@<cluster-url>/recipe_organizer?retryWrites=true&w=majority
     ```
6. **Set Local Environment Variable**:
   - Open `server/.env` (created from `server/.env.example`).
   - Paste the connection string replacing `<username>` and `<password>` with your database user credentials.
   - Example:
     ```env
     PORT=5000
     NODE_ENV=development
     MONGODB_URI=mongodb+srv://recipe_user:SecretPassword123@cluster0.abcde.mongodb.net/recipe_organizer?retryWrites=true&w=majority
     CLIENT_ORIGIN=http://localhost:5173
     ```
   > **Security Note**: Never commit `server/.env`. It is protected by `.gitignore`.

---

## 6. REST API Summary

Full endpoint specifications, request bodies, query parameters, and error envelopes are detailed in [server/API_CONTRACT.md](file:///D:/resume/recipe-organizer/server/API_CONTRACT.md).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service and database connectivity status |
| `GET` | `/api/recipes` | Search & filter recipes (`q`, `ingredients`, `ingredientMatch`, `cuisine`, `mealType`, `sort`, `page`, `limit`) |
| `GET` | `/api/recipes/:id` | Retrieve single recipe details |
| `POST` | `/api/recipes` | Create a new recipe (Zod-validated) |
| `PUT` | `/api/recipes/:id` | Update an existing recipe |
| `DELETE` | `/api/recipes/:id` | Delete recipe and cleanup related favorites |
| `GET` | `/api/favorites` | List all favorited recipes (populated) |
| `POST` | `/api/favorites` | Add recipe to favorites (`{ recipeId }`) |
| `DELETE` | `/api/favorites/:recipeId` | Remove recipe from favorites |
| `GET` | `/api/preferences` | Retrieve user preferences (cuisines, diet, pantry) |
| `PUT` | `/api/preferences` | Update user preferences |
| `GET` | `/api/meal-plans/:weekStart` | Retrieve weekly meal plan (Monday UTC normalized) |
| `POST` | `/api/meal-plans` | Create a weekly meal schedule |
| `PUT` | `/api/meal-plans/:id` | Update scheduled meals |
| `DELETE` | `/api/meal-plans/:id` | Delete weekly meal plan |
| `GET` | `/api/grocery-lists/:weekStart` | Retrieve grocery list for specified week |
| `POST` | `/api/grocery-lists/generate` | Auto-generate grocery list from weekly meal plan |
| `PUT` | `/api/grocery-lists/:id` | Update entire grocery list |
| `POST` | `/api/grocery-lists/:id/items` | Add custom grocery item |
| `PATCH` | `/api/grocery-lists/:id/items/:itemId` | Toggle purchased status or update item |
| `DELETE` | `/api/grocery-lists/:id/items/:itemId` | Remove grocery item by stable subdocument ID |
| `GET` | `/api/insights` | Retrieve analytical metrics and AI pantry recommendations |

---

## 7. Database Seeding Instructions

The seeder script (`server/src/seed/seedRecipes.js`) includes **24 handcrafted, diverse culinary recipes** across Indian, Italian, Mexican, Asian, Mediterranean, and American cuisines.

### Seeding Safety Principles
- **Idempotent**: Uses deterministic upsert by `title`. Running it repeatedly will not create duplicate entries.
- **Non-Destructive**: Never drops databases or deletes existing data.
- **Production Guarded**: Automatically aborts if `NODE_ENV === 'production'`.

### Executing the Seeder
Once `MONGODB_URI` is configured in `server/.env`:
```bash
npm run seed
```
Output reports inserted, updated, and skipped recipe counts.

---

## 8. Available Commands

Run from `recipe-organizer/`:
- `npm run dev`: Runs both backend (nodemon) and frontend (Vite) concurrently.
- `npm run dev:client`: Runs Vite frontend dev server (`http://localhost:5173`).
- `npm run dev:server`: Runs Express backend with nodemon (`http://localhost:5000`).
- `npm run build`: Compiles production frontend bundle.
- `npm run seed`: Executes the database seed runner.
- `npm run test`: Executes both frontend (jsdom) and backend (node) test suites.
- `npm run test:client`: Runs Vitest tests in the client workspace.
- `npm run test:server`: Runs Vitest tests in the server workspace.
- `npm run test:watch`: Runs Vitest in watch mode.
- `npm run test:coverage`: Generates code coverage reports for both workspaces.

---

## 9. Development Phases Progress

1. **Phase 1: Project Foundation, Architecture and Initial Setup** *(Completed)*
   - Workspace setup, directory scaffolding, build/test tooling, environment templates, and documentation.
2. **Phase 2: MongoDB, Mongoose and Node.js Backend Development** *(Completed)*
   - Mongoose models (Recipe, Favorite, MealPlan, GroceryList, UserPreference), Zod validation, decoupled Express architecture, REST APIs, business services, seeder with 24 sample recipes, and `API_CONTRACT.md`.
3. **Phase 3: Backend RESTful API Refinement & Business Logic Optimization** *(Upcoming)*
4. **Phase 4: Frontend Layout, Routing, and Core UI Components** *(Upcoming)*
5. **Phase 5: Feature Implementation (Recipe Explorer, Meal Planner, Insights)** *(Upcoming)*
6. **Phase 6: Testing, Integration, and Polishing** *(Upcoming)*
