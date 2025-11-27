import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "@/components/Dashboard";
import TransactionDetails from "@/components/TransactionDetails";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transaction/:id" element={<TransactionDetails />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;