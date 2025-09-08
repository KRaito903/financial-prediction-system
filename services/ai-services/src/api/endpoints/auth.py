from fastapi import APIRouter, HTTPException
from ...models.schemas import LoginRequest, LoginResponse
from ...utils.auth import simple_auth

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login endpoint to get JWT token"""
    token = simple_auth(request.username, request.password)
    if token:
        return LoginResponse(
            success=True,
            token=token,
            message="Login successful"
        )
    else:
        return LoginResponse(
            success=False,
            message="Invalid credentials"
        )

@router.post("/verify")
async def verify_token(authorization: str = None):
    """Verify JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        return {"valid": False}
    
    try:
        from ...utils.auth import verify_token as verify_jwt
        token = authorization.split(" ")[1]
        user = verify_jwt(token)
        return {
            "valid": True,
            "user": {
                "id": user.get("sub"),
                "username": user.get("username")
            }
        }
    except Exception:
        return {"valid": False}