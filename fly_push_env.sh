
appname=quizlearnapp
flyctl secrets delete VITE_DATABASE_URL
flyctl secrets delete VITE_DATABASE_TOKEN
flyctl secrets set VITE_LIBSQL_DB_URL=$(grep VITE_LIBSQL_DB_URL .env | cut -d '=' -f2) VITE_LIBSQL_DB_AUTH_TOKEN=$(grep VITE_LIBSQL_DB_AUTH_TOKEN .env | cut -d '=' -f2) --app $appname
