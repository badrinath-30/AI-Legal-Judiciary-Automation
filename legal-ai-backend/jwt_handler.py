from datetime import datetime, timedelta
from jose import JWTError, jwt

# Change this to a long random string before deployment
SECRET_KEY = "f569a7d42d3ffd86ddc44fa726913fb34e025a2c7c1596905ca0b40d3a517e1c"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str):
    try:
        print("Received Token:", token)

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print("Decoded Payload:", payload)

        return payload

    except JWTError as e:
        print("JWT ERROR:", str(e))
        return None