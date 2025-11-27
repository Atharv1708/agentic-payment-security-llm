import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, TrendingUp, Globe, Smartphone, RefreshCw, Plus, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Manual transaction form
  const [manualTx, setManualTx] = useState({
    amount: "",
    merchant: "",
    card_last4: "",
    card_type: "Visa",
    customer_email: "",
    ip_address: "",
    country: "US",
    device_type: "Desktop"
  });

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    try {
      const [txRes, analyticsRes, alertsRes] = await Promise.all([
        axios.get(`${API}/transactions${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`),
        axios.get(`${API}/analytics`),
        axios.get(`${API}/alerts?resolved=false`)
      ]);
      
      setTransactions(txRes.data);
      setAnalytics(analyticsRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const handleSimulate = async (type) => {
    setLoading(true);
    try {
      await axios.post(`${API}/simulate`, {
        transaction_type: type,
        count: 1
      });
      toast.success(`Generated ${type} transaction`);
      await loadData();
    } catch (error) {
      toast.error("Simulation failed");
    }
    setLoading(false);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/transactions`, {
        ...manualTx,
        amount: parseFloat(manualTx.amount),
        customer_id: `cust_${Date.now()}`,
        device_id: `dev_${Math.random().toString(36).substr(2, 12)}`
      });
      toast.success("Transaction submitted for analysis");
      setManualTx({
        amount: "",
        merchant: "",
        card_last4: "",
        card_type: "Visa",
        customer_email: "",
        ip_address: "",
        country: "US",
        device_type: "Desktop"
      });
      await loadData();
    } catch (error) {
      toast.error("Failed to submit transaction");
    }
    setLoading(false);
  };

  const handleClearAll = async () => {
    if (window.confirm("Clear all transactions and alerts?")) {
      try {
        await axios.delete(`${API}/transactions/clear`);
        toast.success("All data cleared");
        await loadData();
      } catch (error) {
        toast.error("Failed to clear data");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "challenged": return "bg-amber-100 text-amber-700 border-amber-200";
      case "blocked": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return "text-red-600 font-bold";
    if (score >= 60) return "text-orange-600 font-semibold";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk'}}>AIGuard Payments</h1>
                <p className="text-sm text-gray-500">Intelligent Fraud Detection</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadData} variant="outline" size="sm" data-testid="refresh-btn">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleClearAll} variant="outline" size="sm" className="text-red-600" data-testid="clear-all-btn">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow" data-testid="total-transactions-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{analytics.total_transactions}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow" data-testid="approved-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{analytics.approved_count}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow" data-testid="challenged-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Challenged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{analytics.challenged_count}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow" data-testid="blocked-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Blocked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{analytics.blocked_count}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8" data-testid="alerts-section">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Active Security Alerts
            </h2>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <Alert key={alert.id} className={`${alert.severity === 'critical' ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50'}`} data-testid={`alert-${alert.id}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="font-semibold">
                    {alert.alert_type} - {alert.severity.toUpperCase()}
                  </AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm" data-testid="main-tabs">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
            <TabsTrigger value="simulate" data-testid="tab-simulate">Simulation</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Score Overview */}
              <Card className="shadow-lg" data-testid="risk-score-card">
                <CardHeader>
                  <CardTitle>Average Risk Score</CardTitle>
                  <CardDescription>System-wide fraud risk assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-center py-8" style={{color: analytics ? (analytics.average_risk_score >= 60 ? '#dc2626' : analytics.average_risk_score >= 40 ? '#f59e0b' : '#10b981') : '#6b7280'}}>
                    {analytics ? analytics.average_risk_score : 0}
                  </div>
                  <div className="flex justify-between text-sm mt-4">
                    <span className="text-green-600">Low (0-40)</span>
                    <span className="text-amber-600">Medium (40-60)</span>
                    <span className="text-red-600">High (60-100)</span>
                  </div>
                </CardContent>
              </Card>

              {/* High Risk Countries */}
              <Card className="shadow-lg" data-testid="high-risk-countries-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    High Risk Countries
                  </CardTitle>
                  <CardDescription>Countries with elevated fraud patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics && analytics.high_risk_countries.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.high_risk_countries.map((country, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-testid={`country-${country.country}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                              {country.country}
                            </div>
                            <div>
                              <div className="font-semibold">{country.country}</div>
                              <div className="text-sm text-gray-500">{country.count} transactions</div>
                            </div>
                          </div>
                          <Badge variant="destructive" data-testid={`country-risk-${country.country}`}>{country.avg_risk} risk</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No high-risk countries detected</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="shadow-lg" data-testid="recent-transactions-card">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest payment activity</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/transaction/${tx.id}`)} data-testid={`recent-tx-${tx.id}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${tx.status === 'approved' ? 'bg-emerald-500' : tx.status === 'challenged' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                          <div>
                            <div className="font-semibold">${tx.amount} - {tx.merchant}</div>
                            <div className="text-sm text-gray-500">{tx.customer_email} • {tx.country}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${getRiskColor(tx.risk_score)}`}>{tx.risk_score}</span>
                          <Badge className={getStatusColor(tx.status)} data-testid={`tx-status-${tx.id}`}>{tx.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No transactions yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center justify-between">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48" data-testid="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="challenged">Challenged</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="shadow-lg" data-testid="transactions-table-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Merchant</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Customer</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Location</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Risk</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors" data-testid={`tx-row-${tx.id}`}>
                          <td className="px-6 py-4 font-semibold">${tx.amount}</td>
                          <td className="px-6 py-4">{tx.merchant}</td>
                          <td className="px-6 py-4 text-sm">{tx.customer_email}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-gray-400" />
                              {tx.country}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-lg font-bold ${getRiskColor(tx.risk_score)}`}>{tx.risk_score}</span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={getStatusColor(tx.status)} data-testid={`status-badge-${tx.id}`}>{tx.status}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/transaction/${tx.id}`)} data-testid={`view-details-${tx.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {transactions.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No transactions found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Simulate Tab */}
          <TabsContent value="simulate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Simulation */}
              <Card className="shadow-lg" data-testid="quick-simulation-card">
                <CardHeader>
                  <CardTitle>Quick Simulation</CardTitle>
                  <CardDescription>Generate test transactions instantly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={() => handleSimulate("normal")} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="simulate-normal-btn">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Generate Normal Transaction
                  </Button>
                  <Button onClick={() => handleSimulate("suspicious")} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700" data-testid="simulate-suspicious-btn">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Generate Suspicious Transaction
                  </Button>
                  <Button onClick={() => handleSimulate("attack")} disabled={loading} className="w-full bg-red-600 hover:bg-red-700" data-testid="simulate-attack-btn">
                    <XCircle className="w-4 h-4 mr-2" />
                    Generate Attack Pattern
                  </Button>
                </CardContent>
              </Card>

              {/* Manual Transaction */}
              <Card className="shadow-lg" data-testid="manual-transaction-card">
                <CardHeader>
                  <CardTitle>Manual Transaction</CardTitle>
                  <CardDescription>Submit custom transaction for analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="100.00"
                          value={manualTx.amount}
                          onChange={(e) => setManualTx({...manualTx, amount: e.target.value})}
                          required
                          data-testid="manual-amount-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="merchant">Merchant</Label>
                        <Input
                          id="merchant"
                          placeholder="Amazon"
                          value={manualTx.merchant}
                          onChange={(e) => setManualTx({...manualTx, merchant: e.target.value})}
                          required
                          data-testid="manual-merchant-input"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="card_last4">Card Last 4</Label>
                        <Input
                          id="card_last4"
                          placeholder="1234"
                          maxLength={4}
                          value={manualTx.card_last4}
                          onChange={(e) => setManualTx({...manualTx, card_last4: e.target.value})}
                          required
                          data-testid="manual-card-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card_type">Card Type</Label>
                        <Select value={manualTx.card_type} onValueChange={(val) => setManualTx({...manualTx, card_type: val})}>
                          <SelectTrigger data-testid="manual-card-type-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Visa">Visa</SelectItem>
                            <SelectItem value="Mastercard">Mastercard</SelectItem>
                            <SelectItem value="Amex">Amex</SelectItem>
                            <SelectItem value="Discover">Discover</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Customer Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="customer@example.com"
                        value={manualTx.customer_email}
                        onChange={(e) => setManualTx({...manualTx, customer_email: e.target.value})}
                        required
                        data-testid="manual-email-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ip">IP Address</Label>
                        <Input
                          id="ip"
                          placeholder="192.168.1.1"
                          value={manualTx.ip_address}
                          onChange={(e) => setManualTx({...manualTx, ip_address: e.target.value})}
                          required
                          data-testid="manual-ip-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          placeholder="US"
                          maxLength={2}
                          value={manualTx.country}
                          onChange={(e) => setManualTx({...manualTx, country: e.target.value.toUpperCase()})}
                          required
                          data-testid="manual-country-input"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700" data-testid="manual-submit-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Submit for Analysis
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="shadow-lg" data-testid="fraud-patterns-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Fraud Patterns Detected
                </CardTitle>
                <CardDescription>Common fraud categories identified</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics && analytics.fraud_patterns.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.fraud_patterns.map((pattern, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`pattern-${idx}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <div className="font-semibold">{pattern.pattern}</div>
                            <div className="text-sm text-gray-500">Fraud category</div>
                          </div>
                        </div>
                        <Badge variant="destructive" data-testid={`pattern-count-${idx}`}>{pattern.count} incidents</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No fraud patterns detected yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;