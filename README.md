# QuizLearn App

## Local Development Setup

### Database Setup

The application uses Turso for the database. For local development, we maintain a local SQLite database that can be synchronized with the remote Turso database.

#### Initial Setup

1. Create the local database directories:
```bash
mkdir -p backend/data/db backend/data/backups
```

2. Create a backup of the remote database:
```bash
turso db shell quizlearn '.dump' > backend/data/backups/quizlearn_backup_$(date +%Y%m%d_%H%M%S).sql
```

3. Initialize the local database:
```bash
sqlite3 backend/data/db/quizlearn.db ".read backend/data/backups/[your-backup-file].sql"
```

4. Start the local database server:
```bash
turso dev --db-file backend/data/db/quizlearn.db
```

5. Update your `.env` file to use the local database:
```bash
VITE_LIBSQL_DB_URL=http://127.0.0.1:8080
```

#### Daily Development

1. Start the local database server:
```bash
./start_db.sh
```

2. The server will be available at `http://127.0.0.1:8080`

#### Switching Between Local and Remote

The `.env` file contains both local and remote database URLs. Comment/uncomment as needed:
```bash
VITE_LIBSQL_DB_URL=http://127.0.0.1:8080
# VITE_LIBSQL_DB_URL=https://dbname.turso.io
```

#### Backing Up Changes

To backup your local changes:
```bash
turso db shell quizlearn '.dump' > backend/data/backups/quizlearn_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Directory Structure

```
quizlearnapp/
├── backend/
│   └── data/
│       ├── db/           # Local SQLite database
│       └── backups/      # Database backups
└── .env                  # Environment configuration
```

Note: The `backend/data` directory is git-ignored to prevent database files from being committed.
