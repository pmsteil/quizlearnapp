import sqlite3
import sys
import os

def delete_user(email):
    # Get the database path from environment variable or use default
    db_path = os.getenv('DATABASE_PATH', 'quiz.db')
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Delete the user
        cursor.execute('DELETE FROM users WHERE email = ?', (email,))
        if cursor.rowcount > 0:
            print(f"Successfully deleted user: {email}")
        else:
            print(f"No user found with email: {email}")
        conn.commit()
    except Exception as e:
        print(f"Error deleting user: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python delete_user.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    delete_user(email)
