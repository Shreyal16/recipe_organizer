# API Contract & Backend Specification

This document serves as the authoritative API specification for the **Recipe Organizer & Smart Meal Planning Platform** backend. All frontend calls (Phase 4 & 5) must adhere strictly to the contracts outlined herein.

---

## 1. Global Architectural Conventions

### Base URL
All API routes are prefixed with `/api`.
Default local development endpoint: `http://localhost:5000/api`

### Content Type
All request bodies and response payloads use `application/json; charset=utf-8`.

### Standard Response Envelopes

#### 1. Success Response (Standard)
```json
{
  "success": true,
  "data": {},
  "meta": null
}
```

#### 2. Success Response (Paginated Collection)
```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4
  }
}
```

#### 3. Error Response
```json
{
  "success": false,
  "error": {
    "message": "Human-readable description of error",
    "details": null
  }
}
```
When validation fails, `details` contains an array of specific field error objects:
```json
{
  "success": false,
  "error": {
    "message": "Request validation failed",
    "details": [
      {
        "field": "prepTimeMinutes",
        "message": "Prep time cannot be negative"
      }
    ]
  }
}
```

### Standard HTTP Status Codes
- `200 OK`: Successful resource retrieval, update, or deletion.
- `201 Created`: Successful resource creation.
- `400 Bad Request`: Validation failure or malformed identifier.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Duplicate entry or conflicting unique index (e.g., duplicate weekly meal plan or favorite).
- `429 Too Many Requests`: Rate limit threshold exceeded.
- `500 Internal Server Error`: Unhandled server exception (internal details and credentials are never leaked).

---

## 2. Recipe Endpoints (`/api/recipes`)

### Data Model Schema
```typescript
interface Ingredient {
  _id?: string;
  name: string;        // required, trimmed
  quantity: number | null; // min: 0
  unit: string;        // e.g. "g", "ml", "cup", "tbsp"
}

interface Instruction {
  step: number;        // required, min: 1
  text: string;        // required
}

interface Recipe {
  _id: string;
  title: string;       // required, max 200 chars
  description: string; // required, max 2000 chars
  imageUrl: string;
  cuisine: string;     // e.g. "Indian", "Italian", "Mexican", "Asian"
  mealType: string;    // e.g. "Breakfast", "Lunch", "Dinner", "Snack", "Dessert"
  prepTimeMinutes: number; // required, min: 0
  cookTimeMinutes: number; // default: 0
  servings: number;    // required, min: 1
  difficulty: "Easy" | "Medium" | "Hard"; // default: "Medium"
  dietaryTags: string[]; // e.g. ["Vegetarian", "Gluten-Free"]
  ingredients: Ingredient[];
  instructions: Instruction[];
  seasonalTags: string[];
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

### A. List and Filter Recipes
- **Method**: `GET`
- **Path**: `/api/recipes`
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `q` | string | `""` | Search title using case-insensitive regex (escaped). |
  | `ingredients` | string | `""` | Comma-separated ingredient names (e.g. `onion,tomato`). |
  | `ingredientMatch` | `"any"` \| `"all"` | `"any"` | Matching strategy: `any` (OR matching) or `all` (AND matching). |
  | `cuisine` | string | `""` | Filter by cuisine (e.g. `Indian`). |
  | `mealType` | string | `""` | Filter by meal type (e.g. `Dinner`). |
  | `maxPrepTime` | number | `null` | Maximum preparation time in minutes (`<=`). |
  | `dietaryTags` | string | `""` | Comma-separated dietary tags (ANY matching). |
  | `sort` | string | `"newest"` | Sorting option: `"newest"`, `"prepTime"`, `"title"`, or `"popularity"`. |
  | `page` | number | `1` | Page number (min: 1). |
  | `limit` | number | `12` | Items per page (min: 1, max: 50). |

- **Sorting Behavior**:
  - `newest`: Sorted by `createdAt` descending.
  - `prepTime`: Shortest `prepTimeMinutes` ascending.
  - `title`: Alphabetical by `title` ascending.
  - `popularity`: Dynamically computed from the `Favorite` collection count descending.
  - Secondary sort: All sorts include `_id` for deterministic pagination.

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "673f8a000000000000000001",
      "title": "Creamy Paneer Butter Masala",
      "description": "Succulent cubes of fresh paneer simmered in a velvety, spiced tomato sauce.",
      "imageUrl": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
      "cuisine": "Indian",
      "mealType": "Dinner",
      "prepTimeMinutes": 20,
      "cookTimeMinutes": 25,
      "servings": 4,
      "difficulty": "Medium",
      "dietaryTags": ["Vegetarian", "Gluten-Free"],
      "ingredients": [
        { "name": "Paneer", "quantity": 300, "unit": "g" },
        { "name": "Tomato", "quantity": 4, "unit": "piece" }
      ],
      "instructions": [
        { "step": 1, "text": "Boil tomatoes and puree." },
        { "step": 2, text: "Fold in paneer and simmer." }
      ],
      "seasonalTags": ["All-Season"],
      "isFeatured": true,
      "createdAt": "2026-11-21T18:00:00.000Z",
      "updatedAt": "2026-11-21T18:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### B. Get Single Recipe
- **Method**: `GET`
- **Path**: `/api/recipes/:id`
- **URL Parameter**: `id` (24-character hexadecimal MongoDB ObjectId).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "_id": "673f8a000000000000000001",
    "title": "Creamy Paneer Butter Masala",
    "description": "...",
    "cuisine": "Indian",
    "mealType": "Dinner",
    "prepTimeMinutes": 20,
    "cookTimeMinutes": 25,
    "servings": 4,
    "difficulty": "Medium",
    "dietaryTags": ["Vegetarian"],
    "ingredients": [...],
    "instructions": [...],
    "isFeatured": true
  },
  "meta": null
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid ObjectId format.
  - `404 Not Found`: Recipe not found.

---

### C. Create Recipe
- **Method**: `POST`
- **Path**: `/api/recipes`
- **Request Body**:
```json
{
  "title": "Vegetable Pulao",
  "description": "Fragrant basmati rice cooked with fresh seasonal vegetables and aromatic whole spices.",
  "cuisine": "Indian",
  "mealType": "Lunch",
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 20,
  "servings": 4,
  "difficulty": "Easy",
  "dietaryTags": ["Vegetarian", "Gluten-Free"],
  "ingredients": [
    { "name": "Basmati Rice", "quantity": 250, "unit": "g" },
    { "name": "Carrot", "quantity": 1, "unit": "piece" },
    { "name": "Green Peas", "quantity": 80, "unit": "g" }
  ],
  "instructions": [
    { "step": 1, "text": "Wash basmati rice and soak for 15 minutes." },
    { "step": 2, "text": "Saute whole spices and vegetables, add water and rice, simmer until done." }
  ],
  "seasonalTags": ["All-Season"],
  "isFeatured": false
}
```
- **Success Response (201 Created)**: Returns created recipe object in `data`.
- **Error Responses**:
  - `400 Bad Request`: Zod validation error.

---

### D. Update Recipe
- **Method**: `PUT`
- **Path**: `/api/recipes/:id`
- **URL Parameter**: `id` (24-character hexadecimal MongoDB ObjectId).
- **Request Body**: Complete or partial updated fields matching the Recipe schema.
- **Success Response (200 OK)**: Returns updated recipe in `data`.
- **Error Responses**:
  - `400 Bad Request`: Validation failure.
  - `404 Not Found`: Recipe with given ID does not exist.

---

### E. Delete Recipe
- **Method**: `DELETE`
- **Path**: `/api/recipes/:id`
- **URL Parameter**: `id` (24-character hexadecimal MongoDB ObjectId).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Recipe deleted successfully",
    "deletedId": "673f8a000000000000000001"
  },
  "meta": null
}
```
*(Automatically cleans up any associated entry in the Favorites collection).*

---

## 3. Favorite Endpoints (`/api/favorites`)

### A. List Favorites
- **Method**: `GET`
- **Path**: `/api/favorites`
- **Success Response (200 OK)**: Returns array of favorite documents with populated `recipeId`:
```json
{
  "success": true,
  "data": [
    {
      "_id": "673f8b000000000000000001",
      "rawRecipeId": "673f8a000000000000000001",
      "recipeId": {
        "_id": "673f8a000000000000000001",
        "title": "Creamy Paneer Butter Masala",
        "cuisine": "Indian",
        "imageUrl": "...",
        "prepTimeMinutes": 20
      },
      "createdAt": "2026-11-21T18:30:00.000Z"
    }
  ],
  "meta": null
}
```
*(If a favorited recipe was deleted, `recipeId` will be `null` while `rawRecipeId` remains preserved, allowing the frontend to render an unavailable placeholder and still delete the favorite).*

---

### B. Add to Favorites
- **Method**: `POST`
- **Path**: `/api/favorites`
- **Request Body**:
```json
{
  "recipeId": "673f8a000000000000000001"
}
```
- **Success Response (201 Created)**: Returns populated favorite document.
- **Error Responses**:
  - `400 Bad Request`: Invalid ObjectId.
  - `404 Not Found`: Target recipe does not exist.
  - `409 Conflict`: Recipe is already in favorites.

---

### C. Remove from Favorites
- **Method**: `DELETE`
- **Path**: `/api/favorites/:recipeId`
- **URL Parameter**: `recipeId` (24-character hex ObjectId of the recipe).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Recipe removed from favorites successfully",
    "recipeId": "673f8a000000000000000001"
  },
  "meta": null
}
```
- **Error Responses**:
  - `404 Not Found`: Recipe is not currently in favorites.

---

## 4. User Preference Endpoints (`/api/preferences`)

### A. Get Current Preferences
- **Method**: `GET`
- **Path**: `/api/preferences`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "_id": "673f8c000000000000000001",
    "profileKey": "default",
    "preferredCuisines": ["Indian", "Italian", "Asian"],
    "dietaryPreferences": ["Vegetarian"],
    "pantryIngredients": ["onion", "tomato", "garlic", "ginger", "olive oil", "salt"],
    "createdAt": "2026-11-21T18:00:00.000Z",
    "updatedAt": "2026-11-21T18:00:00.000Z"
  },
  "meta": null
}
```

---

### B. Update Preferences
- **Method**: `PUT`
- **Path**: `/api/preferences`
- **Request Body**:
```json
{
  "preferredCuisines": ["Indian", "Mexican"],
  "dietaryPreferences": ["Vegetarian", "Gluten-Free"],
  "pantryIngredients": ["black beans", "corn", "tortillas", "avocado", "lime"]
}
```
- **Success Response (200 OK)**: Returns updated preferences document.

---

## 5. Meal Planner Endpoints (`/api/meal-plans`)

### Date Normalization Rule
All weekly meal plans are keyed by `weekStartDate` normalized to **Monday 00:00:00.000 UTC**. Regardless of which day within a week is supplied as `weekStart`, the service normalizes the date to that week's Monday in UTC.

---

### A. Get Meal Plan by Week
- **Method**: `GET`
- **Path**: `/api/meal-plans/:weekStart`
- **URL Parameter**: `weekStart` (ISO date or `YYYY-MM-DD`, e.g. `2026-11-23`).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "_id": "673f8d000000000000000001",
    "weekStartDate": "2026-11-23T00:00:00.000Z",
    "days": [
      {
        "_id": "673f8d000000000000000002",
        "date": "2026-11-23T00:00:00.000Z",
        "meals": [
          {
            "_id": "673f8d000000000000000003",
            "mealType": "Dinner",
            "recipeId": {
              "_id": "673f8a000000000000000001",
              "title": "Creamy Paneer Butter Masala",
              "servings": 4,
              "imageUrl": "..."
            },
            "servings": 2
          }
        ]
      }
    ],
    "createdAt": "2026-11-21T18:00:00.000Z",
    "updatedAt": "2026-11-21T18:00:00.000Z"
  },
  "meta": null
}
```
*(If no plan exists yet for the week, `data` returns `null`).*

---

### B. Create Weekly Meal Plan
- **Method**: `POST`
- **Path**: `/api/meal-plans`
- **Request Body**:
```json
{
  "weekStartDate": "2026-11-23",
  "days": [
    {
      "date": "2026-11-23",
      "meals": [
        {
          "mealType": "Dinner",
          "recipeId": "673f8a000000000000000001",
          "servings": 2
        }
      ]
    }
  ]
}
```
- **Success Response (201 Created)**: Returns populated weekly meal plan.
- **Error Responses**:
  - `400 Bad Request`: Referenced recipe does not exist or invalid meal type.
  - `409 Conflict`: A meal plan already exists for this week.

---

### C. Update Weekly Meal Plan
- **Method**: `PUT`
- **Path**: `/api/meal-plans/:id`
- **URL Parameter**: `id` (24-character hexadecimal MongoDB ObjectId).
- **Request Body**: Updated `days` array or `weekStartDate`.
- **Success Response (200 OK)**: Returns updated meal plan.

---

### D. Delete Weekly Meal Plan
- **Method**: `DELETE`
- **Path**: `/api/meal-plans/:id`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Meal plan deleted successfully",
    "deletedId": "673f8d000000000000000001"
  },
  "meta": null
}
```

---

## 6. Grocery List Endpoints (`/api/grocery-lists`)

### Stable Subdocument IDs
Every grocery item contains a permanent, stable MongoDB `_id` (`ObjectId`). Array indices are never used as identifiers. All item modifications (toggle purchased, edit, delete) reference this `_id`.

---

### A. Get Grocery List by Week
- **Method**: `GET`
- **Path**: `/api/grocery-lists/:weekStart`
- **URL Parameter**: `weekStart` (ISO date or `YYYY-MM-DD`, normalized to Monday UTC).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "_id": "673f8e000000000000000001",
    "weekStartDate": "2026-11-23T00:00:00.000Z",
    "items": [
      {
        "_id": "673f8e000000000000000002",
        "ingredientName": "Paneer",
        "quantity": 150,
        "unit": "g",
        "category": "Dairy & Eggs",
        "isPurchased": false
      },
      {
        "_id": "673f8e000000000000000003",
        "ingredientName": "Tomato",
        "quantity": 2,
        "unit": "piece",
        "category": "Produce",
        "isPurchased": true
      }
    ],
    "createdAt": "2026-11-21T18:00:00.000Z",
    "updatedAt": "2026-11-21T18:00:00.000Z"
  },
  "meta": null
}
```

---

### B. Generate Grocery List from Meal Plan
- **Method**: `POST`
- **Path**: `/api/grocery-lists/generate`
- **Request Body**:
```json
{
  "weekStartDate": "2026-11-23"
}
```
- **Behavior**:
  - Finds the meal plan for the normalized Monday.
  - Scales ingredient quantities based on planned servings vs recipe base servings (`plannedServings / baseServings`).
  - Aggregates quantities when units are identical or normalized.
  - Retains existing `isPurchased` checkboxes if regenerating a list.
  - Assigns categories (`Produce`, `Dairy & Eggs`, `Meat & Seafood`, `Bakery`, `Pantry & Spices`, `Pantry & General`).
- **Success Response (201 Created)**: Returns updated/created GroceryList document.
- **Error Responses**:
  - `404 Not Found`: No meal plan exists for the requested week.

---

### C. Add Custom Grocery Item
- **Method**: `POST`
- **Path**: `/api/grocery-lists/:id/items`
- **URL Parameter**: `id` (Grocery list ObjectId).
- **Request Body**:
```json
{
  "ingredientName": "Almond Milk",
  "quantity": 1,
  "unit": "l",
  "category": "Dairy & Eggs",
  "isPurchased": false
}
```
- **Success Response (201 Created)**: Returns updated GroceryList document with new item having a stable `_id`.

---

### D. Update Item (Toggle Purchased or Edit)
- **Method**: `PATCH`
- **Path**: `/api/grocery-lists/:id/items/:itemId`
- **URL Parameters**:
  - `id`: Grocery list ObjectId.
  - `itemId`: Specific grocery item subdocument ObjectId.
- **Request Body**:
```json
{
  "isPurchased": true
}
```
*(Also supports updating `quantity`, `unit`, `ingredientName`, and `category`).*
- **Success Response (200 OK)**: Returns updated GroceryList document.

---

### E. Delete Grocery Item
- **Method**: `DELETE`
- **Path**: `/api/grocery-lists/:id/items/:itemId`
- **URL Parameters**:
  - `id`: Grocery list ObjectId.
  - `itemId`: Specific grocery item subdocument ObjectId.
- **Success Response (200 OK)**: Returns updated GroceryList document without the deleted item.

---

## 7. AI Insights Endpoint (`/api/insights`)

- **Method**: `GET`
- **Path**: `/api/insights`
- **Description**: Computes rule-based analytical insights and smart recommendations based on actual MongoDB data (preferences, favorites, pantry items, and recipe database).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "preferredCuisines": [
      { "cuisine": "Indian", "count": 12 },
      { "cuisine": "Italian", "count": 6 }
    ],
    "frequentlySavedRecipes": [
      {
        "_id": "673f8a000000000000000001",
        "title": "Creamy Paneer Butter Masala",
        "cuisine": "Indian",
        "imageUrl": "https://images.unsplash.com/...",
        "prepTimeMinutes": 20,
        "savedCount": 3
      }
    ],
    "commonIngredients": [
      { "ingredient": "tomato", "count": 14 },
      { "ingredient": "onion", "count": 12 },
      { "ingredient": "garlic", "count": 10 }
    ],
    "popularMealTypes": [
      { "mealType": "Dinner", "count": 10 },
      { "mealType": "Breakfast", "count": 6 },
      { "mealType": "Lunch", "count": 5 }
    ],
    "recommendations": [
      {
        "recipe": {
          "_id": "673f8a000000000000000001",
          "title": "Creamy Paneer Butter Masala",
          "cuisine": "Indian",
          "prepTimeMinutes": 20
        },
        "matchPercentage": 85,
        "matchedIngredients": ["Tomato", "Onion", "Ginger", "Garlic", "Butter"],
        "missingIngredients": ["Paneer", "Heavy Cream", "Kasuri Methi"],
        "reason": "Matches 5 pantry ingredient(s) and aligns with your Indian cuisine preference."
      }
    ]
  },
  "meta": null
}
```

---

## 8. Health Check Endpoint (`/api/health`)

- **Method**: `GET`
- **Path**: `/api/health` (also accessible via `/health`)
- **Description**: Informs the client of backend and database connection state without leaking internal connection credentials.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "recipe-organizer-server",
    "timestamp": "2026-11-21T18:00:00.000Z",
    "database": {
      "connected": true,
      "state": "connected"
    }
  },
  "meta": null
}
```
