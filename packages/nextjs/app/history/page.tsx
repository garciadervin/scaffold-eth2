"use client";

import type { NextPage } from "next";
import { ClockIcon } from "@heroicons/react/24/outline";

const History: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <ClockIcon className="h-8 w-8" />
            Payment History
          </h2>
          <p className="text-base-content/60 mt-1">View all your payment transactions</p>
        </header>

        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <div className="text-center py-16 text-base-content/50">
              <ClockIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Payment history page coming soon...</p>
              <p className="text-sm mt-2">This page will show your complete payment history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
