# Example Requests

Test these endpoints with curl or Postman.

## User Endpoints

Get profile:
```bash
curl "http://localhost:3000/api/profile?userId=1"
```

Get all users (admin):
```bash
curl "http://localhost:3000/api/users?userId=3"
```

Update profile:
```bash
curl -X PUT "http://localhost:3000/api/profile?userId=1" \
  -H "Content-Type: application/json" \
  -d '{"username": "john_updated", "email": "john.new@example.com"}'
```

Change user status (admin):
```bash
curl -X PATCH "http://localhost:3000/api/users/1/status?userId=3" \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

## Record Endpoints

Get your records:
```bash
curl "http://localhost:3000/api/records?userId=1"
```

Get all records (admin):
```bash
curl "http://localhost:3000/api/admin/records?userId=3"
```

Create record (analyst):
```bash
curl -X POST "http://localhost:3000/api/records?userId=2" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "type": "expense",
    "category": "groceries",
    "description": "Weekly shopping",
    "date": "2024-12-21"
  }'
```

Update record:
```bash
curl -X PUT "http://localhost:3000/api/records/1?userId=2" \
  -H "Content-Type: application/json" \
  -d '{"amount": 600, "description": "Updated"}'
```

Delete record:
```bash
curl -X DELETE "http://localhost:3000/api/records/1?userId=2"
```

Filter by type:
```bash
curl "http://localhost:3000/api/records?userId=1&type=income"
```

Filter by category:
```bash
curl "http://localhost:3000/api/records?userId=1&category=groceries"
```

Filter by date range:
```bash
curl "http://localhost:3000/api/records?userId=1&startDate=2024-12-01&endDate=2024-12-31"
```

## Dashboard Endpoints

Get summary (totals):
```bash
curl "http://localhost:3000/api/dashboard/summary?userId=1"
```

Get categories (analyst+):
```bash
curl "http://localhost:3000/api/dashboard/categories?userId=2"
```

Get recent records:
```bash
curl "http://localhost:3000/api/dashboard/recent?userId=1&limit=5"
```

Get monthly trends (analyst+):
```bash
curl "http://localhost:3000/api/dashboard/trends?userId=2"
```

## Error Examples

Viewer tries to create (will fail):
```bash
curl -X POST "http://localhost:3000/api/records?userId=1" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "type": "income", "category": "test", "date": "2024-12-20"}'
```

Expected error: 403 Access denied

Bad amount (negative):
```bash
curl -X POST "http://localhost:3000/api/records?userId=2" \
  -H "Content-Type: application/json" \
  -d '{"amount": -100, "type": "income", "category": "test", "date": "2024-12-20"}'
```

Expected error: amount must be positive

Missing fields:
```bash
curl -X POST "http://localhost:3000/api/records?userId=2" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "type": "income"}'
```

Expected error: required fields missing

Invalid user:
```bash
curl "http://localhost:3000/api/profile?userId=999"
```

Expected error: user not found
