"""External-ingress regression tests for KnitCult backend APIs."""
import re
import time
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from conftest import BASE_URL


@pytest.fixture(scope="session")
def qa_identity(api_client, db_connection):
    """Register, exercise OTP failures, inject a known OTP, verify, and clean up."""
    marker = uuid.uuid4().hex[:10]
    identity = {
        "email": f"TEST_knitcult_{marker}@example.com",
        "password": "TEST_StrongPass9!",
        "name": "TEST KnitCult Buyer",
        "phone": "+15550123456",
    }
    created = api_client.post(f"{BASE_URL}/api/auth/register", json=identity, timeout=45)
    assert created.status_code == 200, created.text
    user = created.json()
    assert user["email"] == identity["email"]
    assert user["role"] == "user"
    assert user["is_verified"] is False
    assert isinstance(user["id"], str) and user["id"]
    identity["user_id"] = user["id"]

    try:
        unverified_login = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": identity["email"], "password": identity["password"]},
            timeout=45,
        )
        assert unverified_login.status_code == 403, unverified_login.text
        assert "not verified" in unverified_login.json()["detail"].lower()

        with db_connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, attempts FROM otp_codes WHERE email=%s AND used=0 ORDER BY created_at DESC LIMIT 1",
                (identity["email"],),
            )
            active_otp = cursor.fetchone()
        assert active_otp is not None
        attempts_before = active_otp["attempts"]

        wrong = api_client.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": identity["email"], "code": "000000"},
            timeout=30,
        )
        assert wrong.status_code == 400, wrong.text
        assert "invalid code" in wrong.json()["detail"].lower()
        with db_connection.cursor() as cursor:
            cursor.execute("SELECT attempts FROM otp_codes WHERE id=%s", (active_otp["id"],))
            assert cursor.fetchone()["attempts"] == attempts_before + 1
            cursor.execute(
                "UPDATE otp_codes SET code_hash=SHA2(%s, 256), attempts=0, used=0, expires_at=DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id=%s",
                ("123456", active_otp["id"]),
            )

        verified = api_client.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"email": identity["email"], "code": "123456"},
            timeout=30,
        )
        assert verified.status_code == 200, verified.text
        verified_data = verified.json()
        assert verified_data["token_type"] == "bearer"
        assert verified_data["user"]["email"] == identity["email"]
        assert verified_data["user"]["is_verified"] is True
        identity["token"] = verified_data["access_token"]
        identity["headers"] = {"Authorization": f"Bearer {identity['token']}"}
        yield identity
    finally:
        # Remove all test-created dependent data without touching seeded data.
        with db_connection.cursor() as cursor:
            cursor.execute("SELECT id FROM orders WHERE user_id=%s", (identity.get("user_id"),))
            order_ids = [row["id"] for row in cursor.fetchall()]
            if order_ids:
                placeholders = ",".join(["%s"] * len(order_ids))
                cursor.execute(f"DELETE FROM order_items WHERE order_id IN ({placeholders})", order_ids)
                cursor.execute(f"DELETE FROM orders WHERE id IN ({placeholders})", order_ids)
            cursor.execute("DELETE FROM otp_codes WHERE email=%s", (identity["email"],))
            cursor.execute("DELETE FROM users WHERE email=%s", (identity["email"],))


class TestHealthAndCatalog:
    """Health, seeded catalog, pagination, filters, detail, and recommendations."""

    def test_health(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/health", timeout=20)
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_seeded_products_and_pagination(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/products", params={"page": 1, "limit": 3}, timeout=20)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total"] == 8
        assert data["page"] == 1 and data["limit"] == 3
        assert len(data["items"]) == 3 and data["has_more"] is True
        assert all(isinstance(item["price"], (int, float)) for item in data["items"])

        page2 = api_client.get(f"{BASE_URL}/api/products", params={"page": 2, "limit": 5}, timeout=20).json()
        assert len(page2["items"]) == 3 and page2["has_more"] is False

    @pytest.mark.parametrize(
        "params, expected_field, expected_value",
        [
            ({"club": "Arsenal"}, "club", "Arsenal"),
            ({"league": "Serie A"}, "league", "Serie A"),
            ({"era": "1990s"}, "era", "1990s"),
            ({"trending": "true"}, "is_trending", True),
        ],
    )
    def test_product_filters(self, api_client, params, expected_field, expected_value):
        response = api_client.get(f"{BASE_URL}/api/products", params=params, timeout=20)
        assert response.status_code == 200
        items = response.json()["items"]
        assert items
        assert all(item[expected_field] == expected_value for item in items)

    def test_product_search_detail_and_recommendations(self, api_client):
        search = api_client.get(f"{BASE_URL}/api/products", params={"q": "Henry"}, timeout=20)
        assert search.status_code == 200
        items = search.json()["items"]
        assert len(items) == 1
        product_id = items[0]["id"]

        detail = api_client.get(f"{BASE_URL}/api/products/{product_id}", timeout=20)
        assert detail.status_code == 200
        product = detail.json()
        assert product["id"] == product_id
        assert isinstance(product["historical_campaign"], dict)
        assert product["historical_campaign"]["title"] == "The Invincibles"

        recommendations = api_client.get(f"{BASE_URL}/api/recommendations/{product_id}", timeout=20)
        assert recommendations.status_code == 200
        rec_items = recommendations.json()["items"]
        assert rec_items
        scores = [item["score"] for item in rec_items]
        assert all(score > 0 for score in scores)
        assert scores == sorted(scores, reverse=True)
        assert all(item["id"] != product_id for item in rec_items)


class TestAuthentication:
    """Admin login, user registration/OTP flow, token identity, and invalid token handling."""

    def test_admin_login_shape(self, admin_auth):
        assert admin_auth["user"]["email"] == "support.knitcult@gmail.com"
        assert admin_auth["user"]["role"] == "admin"
        assert admin_auth["user"]["is_verified"] is True
        assert isinstance(admin_auth["token"], str) and len(admin_auth["token"]) > 20

    def test_registered_user_otp_flow_and_me(self, api_client, qa_identity):
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers=qa_identity["headers"], timeout=20)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == qa_identity["user_id"]
        assert data["email"] == qa_identity["email"]
        assert data["is_verified"] is True

    def test_me_rejects_invalid_token(self, api_client):
        response = api_client.get(
            f"{BASE_URL}/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"}, timeout=20
        )
        assert response.status_code == 401
        assert "invalid token" in response.json()["detail"].lower()


class TestCoupons:
    """Public seeded coupon validation rules."""

    @pytest.mark.parametrize(
        "payload, expected_valid, expected_discount, message_fragment",
        [
            ({"code": "FIRST10", "subtotal": 200}, True, 20.0, "applied"),
            ({"code": "COLLECTOR25", "subtotal": 100}, False, 0.0, "minimum"),
            ({"code": "INVALID", "subtotal": 500}, False, 0.0, "not found"),
        ],
    )
    def test_coupon_validation(self, api_client, payload, expected_valid, expected_discount, message_fragment):
        response = api_client.post(f"{BASE_URL}/api/coupons/validate", json=payload, timeout=20)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is expected_valid
        assert data["discount_amount"] == expected_discount
        assert message_fragment in data["message"].lower()


class TestCartOrderPayment:
    """Redis cart CRUD followed by order, mock payment, listing, phone update, and admin status update."""

    def test_cart_crud(self, api_client, qa_identity):
        headers = qa_identity["headers"]
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers=headers, timeout=20)
        products = api_client.get(f"{BASE_URL}/api/products", params={"limit": 2}, timeout=20).json()["items"]
        first, second = products

        added = api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers=headers,
            json={"product_id": first["id"], "size": "M", "qty": 2},
            timeout=20,
        )
        assert added.status_code == 200
        assert added.json()["items"][0]["qty"] == 2
        assert added.json()["subtotal"] == round(first["price"] * 2, 2)

        api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers=headers,
            json={"product_id": second["id"], "size": "L", "qty": 1},
            timeout=20,
        )
        fetched = api_client.get(f"{BASE_URL}/api/cart", headers=headers, timeout=20)
        assert fetched.status_code == 200 and len(fetched.json()["items"]) == 2

        updated = api_client.put(
            f"{BASE_URL}/api/cart/update",
            headers=headers,
            json={"product_id": first["id"], "size": "M", "qty": 3},
            timeout=20,
        )
        assert next(item for item in updated.json()["items"] if item["product_id"] == first["id"])["qty"] == 3

        removed = api_client.delete(
            f"{BASE_URL}/api/cart/remove",
            headers=headers,
            params={"product_id": second["id"], "size": "L"},
            timeout=20,
        )
        assert removed.status_code == 200 and len(removed.json()["items"]) == 1

        cleared = api_client.delete(f"{BASE_URL}/api/cart/clear", headers=headers, timeout=20)
        assert cleared.status_code == 200 and cleared.json() == {"items": [], "subtotal": 0.0}

    def test_order_payment_and_updates(self, api_client, qa_identity, admin_auth):
        headers = qa_identity["headers"]
        product = api_client.get(f"{BASE_URL}/api/products", params={"club": "Arsenal"}, timeout=20).json()["items"][0]
        added = api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers=headers,
            json={"product_id": product["id"], "size": "M", "qty": 1},
            timeout=20,
        )
        assert added.status_code == 200 and len(added.json()["items"]) == 1

        order_response = api_client.post(
            f"{BASE_URL}/api/orders",
            headers=headers,
            json={
                "items": [{"product_id": product["id"], "size": "M", "qty": 1}],
                "phone": "+15550123456",
                "shipping_address": {
                    "name": "TEST Buyer",
                    "line1": "1 Test Street",
                    "city": "Testville",
                    "state": "CA",
                    "zip": "90001",
                    "country": "US",
                },
                "coupon_code": "FIRST10",
            },
            timeout=60,
        )
        assert order_response.status_code == 200, order_response.text
        order = order_response.json()
        assert re.fullmatch(r"KC-[A-Z0-9]{10}", order["tracking_id"])
        assert order["status"] == "pending" and order["payment_status"] == "pending"
        assert order["subtotal"] == product["price"]
        assert order["discount"] == round(product["price"] * 0.10, 2)
        assert len(order["items"]) == 1
        order_id = order["id"]

        cart = api_client.get(f"{BASE_URL}/api/cart", headers=headers, timeout=20).json()
        assert cart == {"items": [], "subtotal": 0.0}

        payment = api_client.post(
            f"{BASE_URL}/api/payments/create", headers=headers, json={"order_id": order_id}, timeout=20
        )
        assert payment.status_code == 200
        payment_data = payment.json()
        assert payment_data["mocked"] is True and payment_data["status"] == "paid"
        assert payment_data["payment_id"].startswith("MOCK_")

        status = api_client.get(f"{BASE_URL}/api/payments/status/{order_id}", headers=headers, timeout=20)
        assert status.status_code == 200
        assert status.json()["payment_status"] == "paid" and status.json()["status"] == "processing"

        orders = api_client.get(f"{BASE_URL}/api/orders", headers=headers, timeout=20)
        assert orders.status_code == 200
        persisted = next(item for item in orders.json() if item["id"] == order_id)
        assert persisted["payment_status"] == "paid" and persisted["payment_id"] == payment_data["payment_id"]

        phone = api_client.put(
            f"{BASE_URL}/api/orders/{order_id}/phone",
            headers=headers,
            json={"phone": "+15550999999"},
            timeout=20,
        )
        assert phone.status_code == 200 and phone.json()["phone"] == "+15550999999"
        fetched = api_client.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers, timeout=20)
        assert fetched.json()["phone"] == "+15550999999"

        patched = api_client.patch(
            f"{BASE_URL}/api/admin/orders/{order_id}/status",
            headers=admin_auth["headers"],
            json={"status": "in_transit"},
            timeout=20,
        )
        assert patched.status_code == 200 and patched.json()["status"] == "in_transit"
        assert api_client.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers, timeout=20).json()["status"] == "in_transit"


class TestAdmin:
    """Admin product/coupon lifecycle, recommendation cache refresh, and role enforcement."""

    def test_product_create_update_soft_delete_and_cache(self, api_client, admin_auth, db_connection):
        marker = uuid.uuid4().hex[:8]
        name = f"TEST Cache Jersey {marker}"
        payload = {
            "name": name,
            "price": 99.0,
            "description": "TEST product",
            "club": "Test Club",
            "league": "Test League",
            "era": "2020s",
            "year": "2026",
            "tags": "category:jersey,club:test,color:test",
            "stock": {"M": 5},
            "historical_campaign": {"title": "TEST campaign"},
        }
        product_id = None
        try:
            created = api_client.post(
                f"{BASE_URL}/api/admin/products", headers=admin_auth["headers"], json=payload, timeout=30
            )
            assert created.status_code == 200, created.text
            product = created.json()
            product_id = product["id"]
            assert product["name"] == name
            assert product["tags"] == "category:jersey,club:test,color:test"

            seeded = api_client.get(f"{BASE_URL}/api/products", params={"club": "Arsenal"}, timeout=20).json()["items"][0]
            recs = api_client.get(f"{BASE_URL}/api/recommendations/{seeded['id']}", params={"limit": 20}, timeout=20)
            assert recs.status_code == 200
            assert any(item["id"] == product_id and item["score"] > 0 for item in recs.json()["items"])

            payload["name"] = f"{name} Updated"
            payload["price"] = 109.0
            payload["tags"] = "category:jersey,club:arsenal,color:test"
            updated = api_client.put(
                f"{BASE_URL}/api/admin/products/{product_id}",
                headers=admin_auth["headers"],
                json=payload,
                timeout=30,
            )
            assert updated.status_code == 200
            assert updated.json()["name"].endswith("Updated") and updated.json()["price"] == 109.0
            public = api_client.get(f"{BASE_URL}/api/products/{product_id}", timeout=20)
            assert public.status_code == 200 and public.json()["price"] == 109.0

            deleted = api_client.delete(
                f"{BASE_URL}/api/admin/products/{product_id}", headers=admin_auth["headers"], timeout=30
            )
            assert deleted.status_code == 200 and deleted.json()["status"] == "deleted"
            assert api_client.get(f"{BASE_URL}/api/products/{product_id}", timeout=20).status_code == 404
            recs_after = api_client.get(
                f"{BASE_URL}/api/recommendations/{seeded['id']}", params={"limit": 20}, timeout=20
            ).json()["items"]
            assert all(item["id"] != product_id for item in recs_after)
        finally:
            if product_id:
                with db_connection.cursor() as cursor:
                    cursor.execute("DELETE FROM products WHERE id=%s AND name LIKE 'TEST%%'", (product_id,))

    def test_count_and_time_coupon_create_delete(self, api_client, admin_auth, db_connection):
        marker = uuid.uuid4().hex[:8].upper()
        future = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        payloads = [
            {
                "code": f"TESTCOUNT{marker}",
                "discount_type": "percent",
                "discount_value": 12,
                "expiry_type": "count",
                "max_uses": 5,
                "min_order_value": 0,
            },
            {
                "code": f"TESTTIME{marker}",
                "discount_type": "flat",
                "discount_value": 15,
                "expiry_type": "time",
                "valid_until": future,
                "min_order_value": 20,
            },
        ]
        created_ids = []
        try:
            for payload in payloads:
                created = api_client.post(
                    f"{BASE_URL}/api/admin/coupons", headers=admin_auth["headers"], json=payload, timeout=20
                )
                assert created.status_code == 200, created.text
                coupon = created.json()
                created_ids.append(coupon["id"])
                assert coupon["code"] == payload["code"]
                assert coupon["expiry_type"] == payload["expiry_type"]
                if payload["expiry_type"] == "count":
                    assert coupon["max_uses"] == 5
                else:
                    assert coupon["valid_until"] is not None

                valid = api_client.post(
                    f"{BASE_URL}/api/coupons/validate",
                    json={"code": payload["code"], "subtotal": 100},
                    timeout=20,
                )
                assert valid.status_code == 200 and valid.json()["valid"] is True

            for coupon_id in list(created_ids):
                deleted = api_client.delete(
                    f"{BASE_URL}/api/admin/coupons/{coupon_id}", headers=admin_auth["headers"], timeout=20
                )
                assert deleted.status_code == 200 and deleted.json()["id"] == coupon_id
                created_ids.remove(coupon_id)
        finally:
            if created_ids:
                with db_connection.cursor() as cursor:
                    placeholders = ",".join(["%s"] * len(created_ids))
                    cursor.execute(f"DELETE FROM coupons WHERE id IN ({placeholders})", created_ids)

    @pytest.mark.parametrize(
        "method,path,json_body",
        [
            ("get", "/api/admin/products", None),
            ("get", "/api/admin/coupons", None),
            ("get", "/api/admin/orders", None),
            ("post", "/api/admin/cache/refresh", None),
        ],
    )
    def test_non_admin_forbidden(self, api_client, qa_identity, method, path, json_body):
        response = api_client.request(
            method, f"{BASE_URL}{path}", headers=qa_identity["headers"], json=json_body, timeout=20
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "Admin only"


class TestInputValidation:
    """Safety checks for invalid commerce values that must not create bad state."""

    @pytest.mark.parametrize("qty", [0, -1])
    def test_order_rejects_non_positive_quantity(self, api_client, qa_identity, qty):
        product = api_client.get(f"{BASE_URL}/api/products", params={"club": "Arsenal"}, timeout=20).json()["items"][0]
        response = api_client.post(
            f"{BASE_URL}/api/orders",
            headers=qa_identity["headers"],
            json={
                "items": [{"product_id": product["id"], "size": "M", "qty": qty}],
                "phone": "+15550123456",
                "shipping_address": {"name": "TEST Invalid Quantity"},
            },
            timeout=60,
        )
        assert response.status_code in (400, 422), response.text

    def test_cart_rejects_quantity_above_stock(self, api_client, qa_identity):
        product = api_client.get(f"{BASE_URL}/api/products", params={"club": "Arsenal"}, timeout=20).json()["items"][0]
        try:
            response = api_client.post(
                f"{BASE_URL}/api/cart/add",
                headers=qa_identity["headers"],
                json={"product_id": product["id"], "size": "M", "qty": product["stock"]["M"] + 1},
                timeout=20,
            )
            assert response.status_code in (400, 422), response.text
        finally:
            api_client.delete(f"{BASE_URL}/api/cart/clear", headers=qa_identity["headers"], timeout=20)

    def test_admin_rejects_negative_product_price(self, api_client, admin_auth, db_connection):
        name = f"TEST Negative Price {uuid.uuid4().hex[:8]}"
        product_id = None
        try:
            response = api_client.post(
                f"{BASE_URL}/api/admin/products",
                headers=admin_auth["headers"],
                json={
                    "name": name,
                    "price": -10,
                    "tags": "category:jersey,club:test,color:test",
                    "stock": {"M": 1},
                },
                timeout=30,
            )
            if response.status_code == 200:
                product_id = response.json()["id"]
            assert response.status_code in (400, 422), response.text
        finally:
            if product_id:
                with db_connection.cursor() as cursor:
                    cursor.execute("DELETE FROM products WHERE id=%s", (product_id,))

    def test_admin_rejects_count_coupon_without_max_uses(self, api_client, admin_auth, db_connection):
        code = f"TESTNOMAX{uuid.uuid4().hex[:8].upper()}"
        coupon_id = None
        try:
            response = api_client.post(
                f"{BASE_URL}/api/admin/coupons",
                headers=admin_auth["headers"],
                json={
                    "code": code,
                    "discount_type": "percent",
                    "discount_value": 10,
                    "expiry_type": "count",
                    "min_order_value": 0,
                },
                timeout=20,
            )
            if response.status_code == 200:
                coupon_id = response.json()["id"]
            assert response.status_code in (400, 422), response.text
        finally:
            if coupon_id:
                with db_connection.cursor() as cursor:
                    cursor.execute("DELETE FROM coupons WHERE id=%s", (coupon_id,))

    def test_admin_rejects_percent_discount_over_100(self, api_client, admin_auth, db_connection):
        code = f"TESTOVER{uuid.uuid4().hex[:8].upper()}"
        coupon_id = None
        try:
            response = api_client.post(
                f"{BASE_URL}/api/admin/coupons",
                headers=admin_auth["headers"],
                json={
                    "code": code,
                    "discount_type": "percent",
                    "discount_value": 150,
                    "expiry_type": "count",
                    "max_uses": 5,
                    "min_order_value": 0,
                },
                timeout=20,
            )
            if response.status_code == 200:
                coupon_id = response.json()["id"]
            assert response.status_code in (400, 422), response.text
        finally:
            if coupon_id:
                with db_connection.cursor() as cursor:
                    cursor.execute("DELETE FROM coupons WHERE id=%s", (coupon_id,))
