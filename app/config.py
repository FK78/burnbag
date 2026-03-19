from dotenv import load_dotenv
import os

load_dotenv()

AWS_REGION      = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID     = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET       = os.getenv("S3_BUCKET")
SES_SENDER      = os.getenv("SES_SENDER")
DB_HOST         = os.getenv("DB_HOST")
DB_NAME         = os.getenv("DB_NAME")
DB_USER         = os.getenv("DB_USER")
DB_PASSWORD     = os.getenv("DB_PASSWORD")