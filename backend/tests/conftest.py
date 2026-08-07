import os
from pathlib import Path

import pymysql
import pytest
import requests
from dotenv import dotenv_values

FRONTEND_ENV = dotenv_values("/app/frontend/.env")
BACKEND_ENV = dotenv_values("/app/backend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or FRONTEND_ENV.get("REACT_APP_BACKEND_URL", "")).rstrip("/")
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")


@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    yield session
    session.close()


@pytest.fixture(scope="session")
def db_connection():
    connection = pymysql.connect(
        host=BACKEND_ENV["MYSQL_HOST"],
        port=int(BACKEND_ENV["MYSQL_PORT"]),
        user=BACKEND_ENV["MYSQL_USER"],
        password=BACKEND_ENV["MYSQL_PASSWORD"],
        database=BACKEND_ENV["MYSQL_DATABASE"],
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )
    yield connection
    connection.close()


@pytest.fixture(scope="session")
def admin_credentials():
    credentials_path = Path("/app/memory/test_credentials.md")
    if not credentials_path.exists():
        pytest.skip("Missing /app/memory/test_credentials.md")
    content = credentials_path.read_text(encoding="utf-8")
    if "support.knitcult@gmail.com" not in content or "Supreme_Ganja6769" not in content:
        pytest.skip("Admin credentials are missing from test_credentials.md")
    return {"email": "support.knitcult@gmail.com", "password": "Supreme_Ganja6769"}


@pytest.fixture(scope="session")
def admin_auth(api_client, admin_credentials):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=admin_credentials, timeout=30)
    if response.status_code != 200:
        pytest.fail(f"Admin authentication failed: {response.status_code} {response.text[:500]}")
    data = response.json()
    token = data.get("access_token")
    if not token:
        pytest.fail("Admin login response did not contain access_token")
    return {"token": token, "headers": {"Authorization": f"Bearer {token}"}, "user": data["user"]}



@pytest.fixture(scope="session", autouse=True)
def preserve_seeded_coupon_usage(db_connection):
    """Restore seeded coupon counters changed by successful order tests."""
    with db_connection.cursor() as cursor:
        cursor.execute("SELECT code, used_count FROM coupons WHERE code IN ('FIRST10', 'COLLECTOR25', 'FLAT50')")
        original_counts = {row["code"]: row["used_count"] for row in cursor.fetchall()}
    yield
    with db_connection.cursor() as cursor:
        for code, used_count in original_counts.items():
            cursor.execute("UPDATE coupons SET used_count=%s WHERE code=%s", (used_count, code))
