from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import random
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    amount: float
    currency: str = "USD"
    merchant: str
    card_last4: str
    card_type: str
    customer_id: str
    customer_email: str
    ip_address: str
    country: str
    device_id: str
    device_type: str
    status: str = "pending"  # pending, approved, challenged, blocked
    risk_score: Optional[int] = None
    fraud_analysis: Optional[Dict[str, Any]] = None

class TransactionCreate(BaseModel):
    amount: float
    currency: str = "USD"
    merchant: str
    card_last4: str
    card_type: str
    customer_id: str
    customer_email: str
    ip_address: str
    country: str
    device_id: str
    device_type: str

class FraudAnalysisResponse(BaseModel):
    risk_score: int
    recommendation: str  # ALLOW, CHALLENGE, BLOCK
    threat_category: str
    reasoning: str
    detection_flags: List[str]
    detailed_analysis: Dict[str, Any]

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    severity: str  # critical, high, medium, low
    alert_type: str
    description: str
    transaction_id: Optional[str] = None
    resolved: bool = False

class SimulationRequest(BaseModel):
    transaction_type: str  # normal, suspicious, attack
    count: int = 1

class AnalyticsResponse(BaseModel):
    total_transactions: int
    blocked_count: int
    challenged_count: int
    approved_count: int
    average_risk_score: float
    high_risk_countries: List[Dict[str, Any]]
    fraud_patterns: List[Dict[str, Any]]
    hourly_trends: List[Dict[str, Any]]

# AI Fraud Detection
async def analyze_transaction_with_ai(transaction: Transaction) -> FraudAnalysisResponse:
    """Use OpenAI GPT-5.1 to analyze transaction for fraud"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"fraud-analysis-{transaction.id}",
            system_message="""You are an expert fraud detection AI system. Analyze payment transactions and provide:
1. Risk score (0-100)
2. Recommendation (ALLOW, CHALLENGE, or BLOCK)
3. Threat category
4. Human-readable reasoning
5. Detection flags
6. Detailed analysis

Consider patterns like:
- Abnormal spending behavior
- Card testing attacks
- Account takeover attempts
- Bot-generated activity
- Repeated failed attempts
- Velocity abuse
- Mismatched IP-country signals
- Suspicious devices
- Identity inconsistencies

Respond ONLY with valid JSON in this format:
{
  "risk_score": 0-100,
  "recommendation": "ALLOW|CHALLENGE|BLOCK",
  "threat_category": "category name",
  "reasoning": "clear explanation",
  "detection_flags": ["flag1", "flag2"],
  "detailed_analysis": {
    "behavioral": "analysis",
    "geolocation": "analysis",
    "device": "analysis",
    "velocity": "analysis",
    "pattern": "analysis"
  }
}"""
        ).with_model("openai", "gpt-5.1")
        
        transaction_data = f"""Transaction Details:
- Amount: ${transaction.amount} {transaction.currency}
- Merchant: {transaction.merchant}
- Card: {transaction.card_type} ending in {transaction.card_last4}
- Customer: {transaction.customer_email} (ID: {transaction.customer_id})
- IP: {transaction.ip_address}
- Country: {transaction.country}
- Device: {transaction.device_type} (ID: {transaction.device_id})
- Timestamp: {transaction.timestamp}"""
        
        user_message = UserMessage(text=f"Analyze this transaction for fraud:\n\n{transaction_data}")
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        response_text = response.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        analysis_data = json.loads(response_text)
        
        return FraudAnalysisResponse(**analysis_data)
    except Exception as e:
        logger.error(f"AI analysis error: {str(e)}")
        # Fallback analysis
        return FraudAnalysisResponse(
            risk_score=50,
            recommendation="CHALLENGE",
            threat_category="Unknown",
            reasoning=f"AI analysis unavailable. Manual review recommended. Error: {str(e)}",
            detection_flags=["ai_analysis_failed"],
            detailed_analysis={
                "error": str(e),
                "fallback": "manual_review_needed"
            }
        )

# Generate sample transactions
def generate_sample_transaction(transaction_type: str = "normal") -> TransactionCreate:
    merchants = ["Amazon", "Netflix", "Starbucks", "Uber", "Apple Store", "Best Buy", "Target", "Walmart"]
    countries = ["US", "UK", "CA", "DE", "FR", "AU", "JP", "BR", "IN", "CN"]
    card_types = ["Visa", "Mastercard", "Amex", "Discover"]
    device_types = ["iPhone", "Android", "Desktop", "Tablet"]
    
    if transaction_type == "normal":
        amount = round(random.uniform(10, 500), 2)
        country = random.choice(["US", "UK", "CA"])
        ip_parts = [str(random.randint(1, 255)) for _ in range(4)]
    elif transaction_type == "suspicious":
        amount = round(random.uniform(800, 2000), 2)
        country = random.choice(["CN", "RU", "NG"])
        ip_parts = [str(random.randint(1, 255)) for _ in range(4)]
    else:  # attack
        amount = round(random.uniform(0.01, 5), 2)
        country = random.choice(["XX", "ZZ"])
        ip_parts = ["192", "168", str(random.randint(1, 255)), str(random.randint(1, 255))]
    
    return TransactionCreate(
        amount=amount,
        merchant=random.choice(merchants),
        card_last4=str(random.randint(1000, 9999)),
        card_type=random.choice(card_types),
        customer_id=f"cust_{random.randint(10000, 99999)}",
        customer_email=f"user{random.randint(100, 999)}@example.com",
        ip_address=".".join(ip_parts),
        country=country,
        device_id=f"dev_{uuid.uuid4().hex[:12]}",
        device_type=random.choice(device_types)
    )

# Routes
@api_router.get("/")
async def root():
    return {"message": "Payment Security & Fraud Detection API", "status": "operational"}

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    """Submit a new transaction for fraud analysis"""
    transaction = Transaction(**input.model_dump())
    
    # Analyze with AI
    analysis = await analyze_transaction_with_ai(transaction)
    
    # Update transaction with analysis
    transaction.risk_score = analysis.risk_score
    transaction.fraud_analysis = analysis.model_dump()
    
    # Set status based on recommendation
    if analysis.recommendation == "ALLOW":
        transaction.status = "approved"
    elif analysis.recommendation == "CHALLENGE":
        transaction.status = "challenged"
    else:
        transaction.status = "blocked"
    
    # Save to database
    doc = transaction.model_dump()
    await db.transactions.insert_one(doc)
    
    # Create alert if high risk
    if analysis.risk_score >= 70:
        alert = Alert(
            severity="critical" if analysis.risk_score >= 90 else "high",
            alert_type=analysis.threat_category,
            description=analysis.reasoning,
            transaction_id=transaction.id
        )
        await db.alerts.insert_one(alert.model_dump())
    
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(status: Optional[str] = None, limit: int = 100):
    """Get all transactions with optional filtering"""
    query = {}
    if status:
        query["status"] = status
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return transactions

@api_router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    """Get single transaction details"""
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@api_router.post("/simulate")
async def simulate_transactions(request: SimulationRequest):
    """Generate test transactions for simulation"""
    created_transactions = []
    
    for _ in range(request.count):
        sample = generate_sample_transaction(request.transaction_type)
        transaction = await create_transaction(sample)
        created_transactions.append(transaction)
    
    return {
        "message": f"Generated {request.count} {request.transaction_type} transaction(s)",
        "transactions": created_transactions
    }

@api_router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics():
    """Get dashboard analytics"""
    total = await db.transactions.count_documents({})
    blocked = await db.transactions.count_documents({"status": "blocked"})
    challenged = await db.transactions.count_documents({"status": "challenged"})
    approved = await db.transactions.count_documents({"status": "approved"})
    
    # Calculate average risk score
    pipeline = [
        {"$group": {"_id": None, "avg_risk": {"$avg": "$risk_score"}}}
    ]
    avg_result = await db.transactions.aggregate(pipeline).to_list(1)
    avg_risk = avg_result[0]["avg_risk"] if avg_result else 0.0
    
    # High risk countries
    country_pipeline = [
        {"$match": {"risk_score": {"$gte": 60}}},
        {"$group": {"_id": "$country", "count": {"$sum": 1}, "avg_risk": {"$avg": "$risk_score"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    high_risk_countries = await db.transactions.aggregate(country_pipeline).to_list(5)
    high_risk_countries = [{"country": item["_id"], "count": item["count"], "avg_risk": round(item["avg_risk"], 1)} for item in high_risk_countries]
    
    # Fraud patterns from alerts
    alert_pipeline = [
        {"$group": {"_id": "$alert_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    fraud_patterns = await db.alerts.aggregate(alert_pipeline).to_list(5)
    fraud_patterns = [{"pattern": item["_id"], "count": item["count"]} for item in fraud_patterns]
    
    return AnalyticsResponse(
        total_transactions=total,
        blocked_count=blocked,
        challenged_count=challenged,
        approved_count=approved,
        average_risk_score=round(avg_risk, 1),
        high_risk_countries=high_risk_countries,
        fraud_patterns=fraud_patterns,
        hourly_trends=[]
    )

@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(resolved: Optional[bool] = None):
    """Get security alerts"""
    query = {}
    if resolved is not None:
        query["resolved"] = resolved
    
    alerts = await db.alerts.find(query, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)
    return alerts

@api_router.patch("/alerts/{alert_id}")
async def resolve_alert(alert_id: str):
    """Mark alert as resolved"""
    result = await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {"resolved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert resolved"}

@api_router.delete("/transactions/clear")
async def clear_transactions():
    """Clear all transactions (for testing)"""
    await db.transactions.delete_many({})
    await db.alerts.delete_many({})
    return {"message": "All data cleared"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()