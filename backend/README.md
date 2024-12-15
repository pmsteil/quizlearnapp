# QuizLearn Backend

## Project Structure

```
backend/
├── data/
│   └── db/              # Database directory
│       └── quizlearn.db # Example database file location
├── src/                 # Source code
└── tests/              # Test files
```

## Database Configuration

- **Database Location**: The SQLite database location **must** be specified by the `LOCAL_DB_PATH` environment variable
  - Example path: `backend/data/db/quizlearn.db`
  - Must be set in `.env` file
  - Application will error if `LOCAL_DB_PATH` is not set
- **Migrations**: Database migrations are located in `src/lib/db/migrations/`
- **Schema**: The database schema is defined in `001_schema.sql`

## Development Setup

1. Install dependencies:
```bash
pipenv install
```

2. Activate virtual environment:
```bash
pipenv shell
```

3. Set up environment:
```bash
cp .env.example .env  # Copy example env file
# Edit .env to set LOCAL_DB_PATH
```

4. Run migrations:
```bash
python src/lib/db/run_migrations.py
```

## Important Notes

- `LOCAL_DB_PATH` environment variable is required
- All database operations should be performed through the database service layer in `src/lib/db/`
