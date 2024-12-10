# Ensure environment variables are available during build
if [ -f .env ]; then
  export $(cat .env | grep VITE_ | xargs)
fi

npm run build
