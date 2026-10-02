import pytest


@pytest.mark.asyncio
async def test_register_and_login(client):
    # Register
    res = await client.post("/api/v1/auth/register", json={
        "full_name": "Test User",
        "email": "test@productbajar.com",
        "password": "securepass123",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@productbajar.com"

    # Login
    res2 = await client.post("/api/v1/auth/login", json={
        "email": "test@productbajar.com",
        "password": "securepass123",
    })
    assert res2.status_code == 200
    assert "access_token" in res2.json()


@pytest.mark.asyncio
async def test_duplicate_register(client):
    payload = {"full_name": "Dup User", "email": "dup@productbajar.com", "password": "pass1234"}
    await client.post("/api/v1/auth/register", json=payload)
    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_wrong_password(client):
    await client.post("/api/v1/auth/register", json={
        "full_name": "Wrong Pass", "email": "wrong@productbajar.com", "password": "correct123"
    })
    res = await client.post("/api/v1/auth/login", json={
        "email": "wrong@productbajar.com", "password": "wrongpassword"
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client):
    reg = await client.post("/api/v1/auth/register", json={
        "full_name": "Me User", "email": "me@productbajar.com", "password": "mepass123"
    })
    token = reg.json()["access_token"]
    res = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "me@productbajar.com"


@pytest.mark.asyncio
async def test_become_seller(client):
    reg = await client.post("/api/v1/auth/register", json={
        "full_name": "Seller Guy", "email": "seller@productbajar.com", "password": "seller123"
    })
    token = reg.json()["access_token"]
    res = await client.post(
        "/api/v1/users/me/become-seller",
        json={"business_name": "Seller Shop"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["role"] == "seller"
