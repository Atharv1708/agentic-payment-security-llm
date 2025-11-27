import requests
import sys
import json
import time
from datetime import datetime

class FraudDetectionAPITester:
    def __init__(self, base_url="https://aiguard-payments.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def test_api_health(self):
        """Test API health endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json() if success else response.text}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, f"Error: {str(e)}")
            return False

    def test_create_transaction(self):
        """Test transaction creation with manual data"""
        try:
            transaction_data = {
                "amount": 150.75,
                "currency": "USD",
                "merchant": "Test Store",
                "card_last4": "1234",
                "card_type": "Visa",
                "customer_id": "test_customer_123",
                "customer_email": "test@example.com",
                "ip_address": "192.168.1.100",
                "country": "US",
                "device_id": "test_device_456",
                "device_type": "Desktop"
            }
            
            response = requests.post(f"{self.api_url}/transactions", json=transaction_data, timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_required_fields = all(field in data for field in ['id', 'risk_score', 'fraud_analysis', 'status'])
                success = success and has_required_fields
                details = f"Status: {response.status_code}, Risk Score: {data.get('risk_score', 'N/A')}, Status: {data.get('status', 'N/A')}"
                if data.get('fraud_analysis'):
                    analysis = data['fraud_analysis']
                    details += f", Recommendation: {analysis.get('recommendation', 'N/A')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Create Transaction with AI Analysis", success, details)
            return data if success else None
            
        except Exception as e:
            self.log_test("Create Transaction with AI Analysis", False, f"Error: {str(e)}")
            return None

    def test_get_transactions(self):
        """Test getting all transactions"""
        try:
            response = requests.get(f"{self.api_url}/transactions", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = isinstance(data, list)
                details = f"Status: {response.status_code}, Count: {len(data) if isinstance(data, list) else 'Invalid'}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Get All Transactions", success, details)
            return data if success else []
            
        except Exception as e:
            self.log_test("Get All Transactions", False, f"Error: {str(e)}")
            return []

    def test_get_transaction_by_id(self, transaction_id):
        """Test getting specific transaction"""
        try:
            response = requests.get(f"{self.api_url}/transactions/{transaction_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_analysis = 'fraud_analysis' in data and data['fraud_analysis'] is not None
                details = f"Status: {response.status_code}, Has Analysis: {has_analysis}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Get Transaction by ID", success, details)
            return data if success else None
            
        except Exception as e:
            self.log_test("Get Transaction by ID", False, f"Error: {str(e)}")
            return None

    def test_simulation(self):
        """Test transaction simulation"""
        simulation_types = ["normal", "suspicious", "attack"]
        all_success = True
        
        for sim_type in simulation_types:
            try:
                response = requests.post(f"{self.api_url}/simulate", 
                                       json={"transaction_type": sim_type, "count": 1}, 
                                       timeout=30)
                success = response.status_code == 200
                
                if success:
                    data = response.json()
                    has_transactions = 'transactions' in data and len(data['transactions']) > 0
                    success = success and has_transactions
                    details = f"Status: {response.status_code}, Generated: {len(data.get('transactions', []))}"
                else:
                    details = f"Status: {response.status_code}, Error: {response.text}"
                
                self.log_test(f"Simulate {sim_type.title()} Transaction", success, details)
                all_success = all_success and success
                
            except Exception as e:
                self.log_test(f"Simulate {sim_type.title()} Transaction", False, f"Error: {str(e)}")
                all_success = False
        
        return all_success

    def test_analytics(self):
        """Test analytics endpoint"""
        try:
            response = requests.get(f"{self.api_url}/analytics", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ['total_transactions', 'blocked_count', 'challenged_count', 'approved_count', 'average_risk_score']
                has_required = all(field in data for field in required_fields)
                success = success and has_required
                details = f"Status: {response.status_code}, Total: {data.get('total_transactions', 'N/A')}, Avg Risk: {data.get('average_risk_score', 'N/A')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Get Analytics", success, details)
            return data if success else None
            
        except Exception as e:
            self.log_test("Get Analytics", False, f"Error: {str(e)}")
            return None

    def test_alerts(self):
        """Test alerts endpoint"""
        try:
            response = requests.get(f"{self.api_url}/alerts", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = isinstance(data, list)
                details = f"Status: {response.status_code}, Alert Count: {len(data) if isinstance(data, list) else 'Invalid'}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Get Alerts", success, details)
            return data if success else []
            
        except Exception as e:
            self.log_test("Get Alerts", False, f"Error: {str(e)}")
            return []

    def test_transaction_filtering(self):
        """Test transaction filtering by status"""
        statuses = ["approved", "challenged", "blocked"]
        all_success = True
        
        for status in statuses:
            try:
                response = requests.get(f"{self.api_url}/transactions?status={status}", timeout=10)
                success = response.status_code == 200
                
                if success:
                    data = response.json()
                    success = isinstance(data, list)
                    # Check if all returned transactions have the correct status
                    if success and data:
                        correct_status = all(tx.get('status') == status for tx in data)
                        success = success and correct_status
                    details = f"Status: {response.status_code}, Count: {len(data) if isinstance(data, list) else 'Invalid'}"
                else:
                    details = f"Status: {response.status_code}, Error: {response.text}"
                
                self.log_test(f"Filter Transactions by {status.title()}", success, details)
                all_success = all_success and success
                
            except Exception as e:
                self.log_test(f"Filter Transactions by {status.title()}", False, f"Error: {str(e)}")
                all_success = False
        
        return all_success

    def test_clear_transactions(self):
        """Test clearing all transactions"""
        try:
            response = requests.delete(f"{self.api_url}/transactions/clear", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Status: {response.status_code}, Message: {data.get('message', 'N/A')}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_test("Clear All Transactions", success, details)
            return success
            
        except Exception as e:
            self.log_test("Clear All Transactions", False, f"Error: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🚀 Starting Fraud Detection API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test API health first
        if not self.test_api_health():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Test core functionality
        print("\n📊 Testing Core API Endpoints...")
        
        # Test transaction creation (this tests AI integration)
        transaction = self.test_create_transaction()
        
        # Test getting transactions
        transactions = self.test_get_transactions()
        
        # Test getting specific transaction if we have one
        if transaction and 'id' in transaction:
            self.test_get_transaction_by_id(transaction['id'])
        
        # Test analytics
        self.test_analytics()
        
        # Test alerts
        self.test_alerts()
        
        # Test filtering
        self.test_transaction_filtering()
        
        print("\n🎯 Testing Simulation Features...")
        
        # Test simulation
        self.test_simulation()
        
        print("\n🧹 Testing Cleanup Features...")
        
        # Test clear functionality (do this last)
        self.test_clear_transactions()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📈 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = FraudDetectionAPITester()
    success = tester.run_comprehensive_test()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat()
            },
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())