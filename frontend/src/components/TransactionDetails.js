import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle, CreditCard, User, Globe, Smartphone, Clock, DollarSign, Brain } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TransactionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    try {
      const response = await axios.get(`${API}/transactions/${id}`);
      setTransaction(response.data);
    } catch (error) {
      console.error("Error loading transaction:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Transaction Not Found</h2>
          <Button onClick={() => navigate("/")} data-testid="back-to-dashboard-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-6 h-6 text-emerald-600" />;
      case "challenged": return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case "blocked": return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <Shield className="w-6 h-6 text-gray-600" />;
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
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const analysis = transaction.fraud_analysis || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button onClick={() => navigate("/")} variant="ghost" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Transaction Status Header */}
        <Card className="mb-8 shadow-lg border-l-4" style={{borderLeftColor: transaction.status === 'approved' ? '#10b981' : transaction.status === 'challenged' ? '#f59e0b' : '#ef4444'}} data-testid="transaction-status-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(transaction.status)}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk'}}>Transaction Details</h1>
                  <p className="text-gray-500">ID: {transaction.id}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={`text-lg px-4 py-2 ${getStatusColor(transaction.status)}`} data-testid="transaction-status-badge">
                  {transaction.status.toUpperCase()}
                </Badge>
                <div className={`text-4xl font-bold mt-2 ${getRiskColor(transaction.risk_score)}`} data-testid="transaction-risk-score">
                  {transaction.risk_score}
                </div>
                <div className="text-sm text-gray-500">Risk Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction Information */}
          <div className="space-y-6">
            <Card className="shadow-lg" data-testid="transaction-info-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Transaction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-bold text-lg">${transaction.amount} {transaction.currency}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Merchant</span>
                  <span className="font-semibold">{transaction.merchant}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Timestamp</span>
                  <span className="font-mono text-sm">{new Date(transaction.timestamp).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="payment-details-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Card Type</span>
                  <span className="font-semibold">{transaction.card_type}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Card Number</span>
                  <span className="font-mono">**** **** **** {transaction.card_last4}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="customer-details-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer ID</span>
                  <span className="font-mono text-sm">{transaction.customer_id}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="text-sm">{transaction.customer_email}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="location-device-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Location & Device
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">IP Address</span>
                  <span className="font-mono text-sm">{transaction.ip_address}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Country</span>
                  <span className="font-semibold">{transaction.country}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Device Type</span>
                  <span className="font-semibold flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    {transaction.device_type}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Device ID</span>
                  <span className="font-mono text-xs">{transaction.device_id}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Fraud Analysis */}
          <div className="space-y-6">
            <Card className="shadow-lg border-l-4 border-l-purple-500" data-testid="ai-analysis-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Fraud Analysis
                </CardTitle>
                <CardDescription>Intelligent risk assessment and reasoning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recommendation */}
                <Alert className={analysis.recommendation === 'ALLOW' ? 'border-emerald-500 bg-emerald-50' : analysis.recommendation === 'CHALLENGE' ? 'border-amber-500 bg-amber-50' : 'border-red-500 bg-red-50'} data-testid="ai-recommendation-alert">
                  <Shield className="h-4 w-4" />
                  <AlertTitle className="font-bold">Recommendation</AlertTitle>
                  <AlertDescription className="text-lg font-semibold">{analysis.recommendation}</AlertDescription>
                </Alert>

                {/* Threat Category */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Threat Category
                  </h3>
                  <Badge variant="outline" className="text-base" data-testid="threat-category-badge">{analysis.threat_category}</Badge>
                </div>

                <Separator />

                {/* Reasoning */}
                <div>
                  <h3 className="font-semibold mb-3">What the AI Detected</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg" data-testid="ai-reasoning-text">
                    {analysis.reasoning}
                  </p>
                </div>

                <Separator />

                {/* Detection Flags */}
                {analysis.detection_flags && analysis.detection_flags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Detection Flags</h3>
                    <div className="flex flex-wrap gap-2" data-testid="detection-flags">
                      {analysis.detection_flags.map((flag, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-red-100 text-red-700" data-testid={`flag-${idx}`}>
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Detailed Analysis */}
                {analysis.detailed_analysis && (
                  <div>
                    <h3 className="font-semibold mb-3">Detailed Analysis</h3>
                    <div className="space-y-3">
                      {Object.entries(analysis.detailed_analysis).map(([key, value], idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg" data-testid={`analysis-${key}`}>
                          <div className="font-semibold text-sm text-gray-600 mb-1 capitalize">{key}</div>
                          <div className="text-sm text-gray-700">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;