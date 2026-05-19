from fastapi import APIRouter
from database import get_db

router = APIRouter()


@router.get("/sales-summary")
async def sales_summary():
    """주문 기반 매출 통계"""
    db = get_db()

    pipeline = [
        {"$match": {"status": {"$ne": "cancelled"}}},
        {
            "$group": {
                "_id": None,
                "totalRevenue": {"$sum": "$totalAmount"},
                "totalOrders": {"$count": {}},
                "avgOrderValue": {"$avg": "$totalAmount"},
            }
        },
    ]
    result = await db.orders.aggregate(pipeline).to_list(1)
    summary = result[0] if result else {"totalRevenue": 0, "totalOrders": 0, "avgOrderValue": 0}
    summary.pop("_id", None)
    return summary


@router.get("/top-products")
async def top_products(limit: int = 10):
    """가장 많이 팔린 상품 순위"""
    db = get_db()

    pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product", "totalSold": {"$sum": "$items.quantity"}, "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}}},
        {"$sort": {"totalSold": -1}},
        {"$limit": limit},
        {"$lookup": {"from": "products", "localField": "_id", "foreignField": "_id", "as": "product"}},
        {"$unwind": "$product"},
        {"$project": {"productId": {"$toString": "$_id"}, "name": "$product.name", "totalSold": 1, "revenue": 1, "_id": 0}},
    ]

    results = await db.orders.aggregate(pipeline).to_list(limit)
    return {"topProducts": results}
