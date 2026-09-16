import sqlalchemy
from database import engine

def add_column_if_not_exists(conn, table, column, col_type):
    is_sqlite = engine.name == "sqlite"
    if is_sqlite:
        try:
            conn.execute(sqlalchemy.text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type};"))
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "exists" in str(e).lower():
                pass
            else:
                print(f"Note on {table}.{column}: {e}")
    else:
        conn.execute(sqlalchemy.text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type};"))

def migrate():
    print("Running database schema migration...")
    with engine.connect() as conn:
        # User table
        add_column_if_not_exists(conn, "users", "role", "VARCHAR DEFAULT 'User'")
        add_column_if_not_exists(conn, "users", "police_station", "VARCHAR")
        add_column_if_not_exists(conn, "users", "bar_council_id", "VARCHAR")
        add_column_if_not_exists(conn, "users", "court_id", "VARCHAR")
        add_column_if_not_exists(conn, "users", "is_verified", "BOOLEAN DEFAULT TRUE")
        
        # FIR table
        add_column_if_not_exists(conn, "firs", "complainant_id", "INTEGER")
        add_column_if_not_exists(conn, "firs", "complainant_phone", "VARCHAR")
        add_column_if_not_exists(conn, "firs", "complainant_name", "VARCHAR")
        add_column_if_not_exists(conn, "firs", "investigation_status", "VARCHAR DEFAULT 'Under Investigation'")
        
        # Case table
        add_column_if_not_exists(conn, "cases", "petitioner_id", "INTEGER")
        add_column_if_not_exists(conn, "cases", "respondent_id", "INTEGER")
        add_column_if_not_exists(conn, "cases", "advocate_id", "INTEGER")
        
        # Appointment table
        add_column_if_not_exists(conn, "appointments", "user_id", "INTEGER")
        add_column_if_not_exists(conn, "appointments", "advocate_id", "INTEGER")

        # Document table
        add_column_if_not_exists(conn, "documents", "owner_id", "INTEGER")

        conn.commit()
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
