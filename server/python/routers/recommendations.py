from fastapi import APIRouter
from database import get_db
from bson import ObjectId

router = APIRouter()


@router.get("/{product_id}")
async def get_recommendations(product_id: str, limit: int = 5):
    """특정 상품과 같은 카테고리의 추천 상품 반환"""
    db = get_db()

    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        return {"recommendations": []}

    cursor = db.products.find(
        {
            "category": product["category"],
            "_id": {"$ne": ObjectId(product_id)},
            "isActive": True,
        }
    ).sort("ratings.average", -1).limit(limit)

    recommendations = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        recommendations.append(doc)

    return {"recommendations": recommendations}
