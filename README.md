# Finance Dashboard Backend API

A simple backend for tracking income and expenses with user accounts and different permission levels.

## Project Structure

```
backend_assignment/
├── server.js              # Starts the Express server
├── database.js            # SQLite database and queries
├── middleware.js          # User authentication and permissions
├── routes.js              # API endpoint definitions
├── controllers.js         # Endpoint logic and validation
├── package.json           # Dependencies
├── database.sqlite        # Database (auto-created)
└── README.md              # Documentation
```

The code is organized simply - each file handles one task. Routes handle URLs, middleware handles permissions, controllers have the logic, and database.js runs the queries.

## Getting Started

To run the backend:

```bash
cd backend_assignment
npm install
npm start
```

The server starts on http://localhost:3000/api

Demo data is set up automatically - 3 test users and some sample income/expense records.

## User Roles

There are three types of users:

| | Viewer | Analyst | Admin |
|---|--------|---------|-------|
| See own records | Yes | Yes | Yes |
| Add records | No | Yes | Yes |
| Edit records | No | Yes | Yes |
| Delete records | No | Yes | Yes |
| View all records | No | No | Yes |
| See dashboard | Yes | Yes | Yes |
| Advanced analytics | No | Yes | Yes |
| Manage users | No | No | Yes |

## API Documentation

### Authentication

Every request needs a user ID. Pass it as a query parameter:

```bash
GET /api/records?userId=1
```

The demo accounts are:
- userId=1 (john_viewer, viewer role)
- userId=2 (sarah_analyst, analyst role)
- userId=3 (admin_user, admin role)

### User Endpoints

Get all users (admin only):
```
GET /api/users?userId=3
```

Get my profile:
```
GET /api/profile?userId=1
```

Update my profile:
```
PUT /api/profile?userId=1
Content-Type: application/json

{
  "username": "new_name",
  "email": "newemail@example.com"
}
```

Change user status (admin only):
```
PATCH /api/users/1/status?userId=3
Content-Type: application/json

{"status": "inactive"}
```

### Financial Records Endpoints

Get my records:
```
GET /api/records?userId=1
```

You can filter by type, category, or date:
```
GET /api/records?userId=1&type=income&category=salary
GET /api/records?userId=1&startDate=2024-12-01&endDate=2024-12-31
```

Get all records (admin only):
```
GET /api/admin/records?userId=3
```

Create a record (analyst or admin):
```
POST /api/records?userId=2
Content-Type: application/json

{
  "amount": 500,
  "type": "expense",
  "category": "groceries",
  "description": "Weekly shopping",
  "date": "2024-12-20"
}
```

Required fields: amount, type, category, date

Update a record:
```
PUT /api/records/1?userId=2
Content-Type: application/json

{
  "amount": 600,
  "description": "Updated"
}
```

Delete a record:
```
DELETE /api/records/1?userId=2
```

### Dashboard Endpoints

Get summary (total income, expense, balance):
```
GET /api/dashboard/summary?userId=1
```

Get breakdown by category (analyst or admin):
```
GET /api/dashboard/categories?userId=2
```

Get recent activity:
```
GET /api/dashboard/recent?userId=1&limit=5
```

Get monthly trends (analyst or admin):
```
GET /api/dashboard/trends?userId=2
```

## Database Schema

Users table:
- id (unique identifier)
- username (unique)
- email (unique)
- role (viewer, analyst, or admin)
- status (active or inactive)
- createdAt (when created)

Records table:
- id (unique identifier)
- userId (links to user)
- amount (positive number)
- type (income or expense)
- category (text)
- description (optional notes)
- date (when the transaction happened)
- createdAt (when added to system)

---

##  Key Features

### 1. Role-Based Access Control
- **Middleware-based** - checks user role and permissions on every request
- **Clear rules** - each endpoint specifies which roles can access it
- **Record ownership** - users can only modify their own records (except admins)

### 2. Comprehensive Validation
- Input type validation (amount must be positive, type must be income/expense)
- Date format validation (YYYY-MM-DD)
- Email format validation
- Email/username uniqueness checks

### 3. Error Handling
- Proper HTTP status codes (400, 403, 404, 409, 500)
- Clear error messages
- Validation on both input and database operations

### 4. Dashboard Analytics
- Summary totals (income, expense, balance)
- Category-wise breakdown
- Recent activity tracking
- Monthly trends

---

##  Testing Examples

### Test as Viewer (can only view)
```bash
# This works - viewers can see dashboard summary
curl "http://localhost:3000/api/dashboard/summary?userId=1"

# This fails - viewers cannot create records
curl -X POST http://localhost:3000/api/records?userId=1 \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "type": "income", "category": "test", "date": "2024-12-20"}'
```

### Test as Analyst (can create/edit records)
```bash
# This works - analysts can create records
curl -X POST http://localhost:3000/api/records?userId=2 \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "type": "expense", "category": "food", "date": "2024-12-20"}'

# This works - analysts can view categories
curl "http://localhost:3000/api/dashboard/categories?userId=2"

# This fails - analysts cannot manage users
curl "http://localhost:3000/api/users?userId=2"
```

### Test as Admin (full access)
```bash
# This works - admins can do everything
curl "http://localhost:3000/api/users?userId=3"
curl "http://localhost:3000/api/admin/records?userId=3"
curl "http://localhost:3000/api/dashboard/trends?userId=3"
```

---

##  Design Decisions

### Why SQLite?
- No external database needed
- Perfect for learning and demos
- File-based, portable
- Easy to inspect and backup

### Why simple file structure?
- **Beginner friendly** - clear where to find things
- **Minimal complexity** - only 5 main files (server, db, auth, routes, controllers)
- **Easy to extend** - can split into folders later if needed

### Authentication approach
- Using simple query parameter/header (not production-level JWT)
- Focuses on demonstrating access control logic
- Easy to swap with real JWT authentication later

### No external auth library
- Shows understanding of authentication flow
- Simpler to follow for learning
- Can easily add JWT/sessions later

---

##  Assumptions Made

1. **Simple Authentication** - Using userId in query/header (not production-ready)
2. **No Session Management** - Each request is stateless
3. **No Password Verification** - Assuming userId represents authenticated user
4. **SQLite** - Easy setup, file-based storage
5. **Local Development** - Assuming local environment, CORS open to all

---

##  Data Flow Example

### Creating a Financial Record

1. **Request**: POST `/api/records?userId=2`
   - Middleware checks if user exists and role is analyst/admin
   
2. **Controller** (`createRecord`):
   - Validates input (amount > 0, valid date format, etc.)
   - Checks permissions (analyst can only create their own)
   
3. **Database** (`database.js`):
   - Inserts record into SQLite
   - Returns new record ID
   
4. **Response**: 201 Created with recordId

If any step fails (invalid data, permission denied), user gets clear error message.

---

##  Extension Ideas

### Easy to Add:
- [ ] **Pagination** - Add limit/offset to record queries
- [ ] **Search** - Filter records by description text
- [ ] **Soft Delete** - Mark records as deleted instead of removing
- [ ] **JWT Tokens** - Real authentication tokens instead of userId
- [ ] **Rate Limiting** - Prevent abuse
- [ ] **Unit Tests** - Jest or Mocha tests
- [ ] **API Documentation** - Swagger/OpenAPI

### Going Further:
- [ ] Add budget management
- [ ] Recurring transactions
- [ ] Tags/Labels for records
- [ ] Export to CSV
- [ ] Multi-currency support

---

##  File Purposes

| File | Purpose |
|------|---------|
| **server.js** | Starts Express app, initializes database, listens on port 3000 |
| **database.js** | All SQLite queries and database initialization |
| **middleware.js** | Authentication, role checking, ownership verification |
| **routes.js** | URL endpoints and which middleware/controller to use |
| **controllers.js** | Business logic, validation, response formatting |
| **package.json** | Node dependencies (express, sqlite3, body-parser) |

---

##  Important Notes

- **Database resets on first run** - Creates schema and demo data
- **No authentication library** - Uses simple userId verification (not production-ready)
- **Timestamps in UTC** - SQLite stores in UTC
- **All dates in YYYY-MM-DD** - ISO format for consistency

---

##  API Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Description of what went wrong",
  "status": 400
}
```

---

##  Summary

This backend demonstrates:
-  Clean, minimal project structure
-  Role-based access control
-  Proper HTTP status codes and error handling
-  Input validation
-  Business logic (summaries, trends)
-  Data modeling (users, records)
-  Clear documentation
-  Easy to understand and extend

**Total Code**: ~600 lines across 5 files
**Setup Time**: < 2 minutes (just `npm install && npm start`)

---
