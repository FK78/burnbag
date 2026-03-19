import uuid
import boto3
from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import AWS_REGION, S3_BUCKET
from app.db import create_tables, get_conn

app = FastAPI()


@app.on_event("startup")
def startup():
    create_tables()


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def index():
    return FileResponse("static/index.html")


@app.get("/presigned-url")
def presigned_url(
    filename: str = Query(...),
    type: str = Query(...),
    email: str = Query(...),
    iv: str = Query(...),
    salt: str = Query(""),
    mode: str = Query("auto"),
):
    s3 = boto3.client("s3", region_name=AWS_REGION)
    file_id = str(uuid.uuid4())
    s3_key = f"uploads/{file_id}/{filename}"

    # Store metadata in Postgres
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO files (id, s3_key, iv, salt, mode, uploader_email, expires_at) VALUES (%s, %s, %s, %s, %s, %s, now() + interval '24 hours')""",
        (file_id, s3_key, iv, salt or None, mode, email),
    )
    conn.commit()
    cur.close()
    conn.close()

    url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": S3_BUCKET,
            "Key": s3_key,
            "ContentType": "application/octet-stream",
        },
        ExpiresIn=3600,
    )

    return {"url": url, "file_id": file_id}


@app.get("/download/{file_id}")
def download(file_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT s3_key, iv, mode, status FROM files WHERE id = %s", (file_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return {"error": "File not found"}, 404

    s3_key, iv, mode, status = row

    if status == "expired":
        return {"error": "File has been incinerated"}, 410

    s3 = boto3.client("s3", region_name=AWS_REGION)
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET, "Key": s3_key},
        ExpiresIn=3600,
    )

    return {"url": url, "iv": iv, "mode": mode}
