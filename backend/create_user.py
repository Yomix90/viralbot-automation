import asyncio
import sys
import argparse
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def create_user(email, username, password, full_name, is_admin):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            print(f"Error: User with email {email} already exists.")
            return

        user = User(
            email=email,
            username=username,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            role=UserRole.ADMIN if is_admin else UserRole.EDITOR,
            is_admin=is_admin,
            is_active=True
        )
        session.add(user)
        await session.commit()
        print(f"Success: User {email} created successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new user for ViralBot")
    parser.add_argument("--email", required=True, help="User email")
    parser.add_argument("--username", required=True, help="Username")
    parser.add_argument("--password", required=True, help="User password")
    parser.add_argument("--name", default="Admin", help="Full name")
    parser.add_argument("--admin", action="store_true", help="Set as admin")
    
    args = parser.parse_args()
    asyncio.run(create_user(args.email, args.username, args.password, args.name, args.admin))
