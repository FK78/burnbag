import psycopg2
from app.config import DB_HOST, DB_NAME, DB_USER, DB_PASSWORD

def get_conn():
    return psycopg2.connect(
        host=DB_HOST,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def create_tables():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS files (
            id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            s3_key         TEXT NOT NULL,
            iv             TEXT NOT NULL,
            salt           TEXT,
            mode           TEXT NOT NULL,
            uploader_email TEXT NOT NULL,
            uploaded_at    TIMESTAMPTZ DEFAULT now(),
            expires_at     TIMESTAMPTZ NOT NULL,
            status         TEXT DEFAULT 'active'
        )
    """)
    conn.commit()
    cur.close()
    conn.close()