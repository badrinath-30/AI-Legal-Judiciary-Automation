import sqlalchemy
from database import engine

def migrate():
    print("Running database schema migration...")
    with engine.connect() as conn:
        # User table
        conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'User';"))
        conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS police_station VARCHAR;"))
        conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bar_council_id VARCHAR;"))
        conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS court_id VARCHAR;"))
        conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;"))
        
        # FIR table
        conn.execute(sqlalchemy.text("ALTER TABLE firs ADD COLUMN IF NOT EXISTS complainant_id INTEGER;"))
        conn.execute(sqlalchemy.text("ALTER TABLE firs ADD COLUMN IF NOT EXISTS complainant_phone VARCHAR;"))
        conn.execute(sqlalchemy.text("ALTER TABLE firs ADD COLUMN IF NOT EXISTS complainant_name VARCHAR;"))
        conn.execute(sqlalchemy.text("ALTER TABLE firs ADD COLUMN IF NOT EXISTS investigation_status VARCHAR DEFAULT 'Under Investigation';"))
        
        # Case table
        conn.execute(sqlalchemy.text("ALTER TABLE cases ADD COLUMN IF NOT EXISTS petitioner_id INTEGER;"))
        conn.execute(sqlalchemy.text("ALTER TABLE cases ADD COLUMN IF NOT EXISTS respondent_id INTEGER;"))
        conn.execute(sqlalchemy.text("ALTER TABLE cases ADD COLUMN IF NOT EXISTS advocate_id INTEGER;"))
        
        # Appointment table
        conn.execute(sqlalchemy.text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id INTEGER;"))
        conn.execute(sqlalchemy.text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS advocate_id INTEGER;"))

        # Document table
        conn.execute(sqlalchemy.text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_id INTEGER;"))

        conn.commit()
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
