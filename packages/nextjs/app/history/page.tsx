"use client";

import { useMemo, useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type Service = {
  name: string;
  price: bigint;
  active: boolean;
};

type Payment = {
  student: string;
  serviceId: bigint;
  amount: bigint;
  timestamp: bigint;
};

const History: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [filterMyPayments, setFilterMyPayments] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");

  const { data: services, isLoading: servicesLoading } = useScaffoldReadContract({
    contractName: "UniversityPayments",
    functionName: "getServices",
  });

  const { data: payments, isLoading: paymentsLoading } = useScaffoldReadContract({
    contractName: "UniversityPayments",
    functionName: "getPayments",
  });

  const servicesArray = useMemo(() => (services as Service[]) || [], [services]);
  const paymentsArray = useMemo(() => (payments as Payment[]) || [], [payments]);

  const getServiceName = (id: bigint): string => {
    if (!servicesArray || servicesArray.length === 0) return "Unknown";
    return servicesArray[Number(id)]?.name || "Unknown";
  };

  // Filter payments
  const filteredPayments = paymentsArray.filter(payment => {
    // Filter by connected wallet
    if (filterMyPayments && connectedAddress) {
      if (payment.student.toLowerCase() !== connectedAddress.toLowerCase()) {
        return false;
      }
    }

    // Filter by search address
    if (searchAddress) {
      if (!payment.student.toLowerCase().includes(searchAddress.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  // Calculate statistics
  const totalPayments = filteredPayments.length;
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0n);
  const myPayments = connectedAddress
    ? paymentsArray.filter(p => p.student.toLowerCase() === connectedAddress.toLowerCase())
    : [];
  const myTotalAmount = myPayments.reduce((sum, payment) => sum + payment.amount, 0n);

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <ClockIcon className="h-8 w-8" />
            Payment History
          </h2>
          <p className="text-base-content/60 mt-1">View all payment transactions</p>
        </header>

        {/* Statistics */}
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100 mb-8">
          <div className="stat">
            <div className="stat-figure text-primary">
              <ClockIcon className="h-8 w-8" />
            </div>
            <div className="stat-title">Total Payments</div>
            <div className="stat-value text-primary">{totalPayments}</div>
            <div className="stat-desc">{filterMyPayments || searchAddress ? "Filtered results" : "All time"}</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <div className="stat-title">Total Amount</div>
            <div className="stat-value text-secondary">{formatEther(totalAmount)} ETH</div>
            <div className="stat-desc">{filterMyPayments || searchAddress ? "Filtered total" : "All payments"}</div>
          </div>

          {connectedAddress && (
            <div className="stat">
              <div className="stat-figure text-accent">
                <UserCircleIcon className="h-8 w-8" />
              </div>
              <div className="stat-title">My Payments</div>
              <div className="stat-value text-accent">{myPayments.length}</div>
              <div className="stat-desc">{formatEther(myTotalAmount)} ETH total</div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-xl border border-base-200 mb-8">
          <div className="card-body">
            <h3 className="card-title text-lg mb-4 flex items-center gap-2">
              <FunnelIcon className="h-5 w-5" />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Search by Address</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter wallet address..."
                    className="input input-bordered w-full pr-10"
                    value={searchAddress}
                    onChange={e => setSearchAddress(e.target.value)}
                  />
                  <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-3.5 text-base-content/50" />
                </div>
              </div>

              {connectedAddress && (
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={filterMyPayments}
                      onChange={e => setFilterMyPayments(e.target.checked)}
                    />
                    <span className="label-text font-semibold">Show only my payments</span>
                  </label>
                  {filterMyPayments && (
                    <div className="mt-2 text-sm text-base-content/60">
                      Filtering for: <Address address={connectedAddress} size="xs" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {(filterMyPayments || searchAddress) && (
              <div className="mt-4">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setFilterMyPayments(false);
                    setSearchAddress("");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment History Table */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg mb-4">All Transactions</h3>
            <div className="overflow-x-auto">
              {paymentsLoading || servicesLoading ? (
                <div className="flex justify-center py-16">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-16 text-base-content/50">
                  <ClockIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">
                    {paymentsArray.length === 0 ? "No payments recorded yet" : "No payments match your filters"}
                  </p>
                  {(filterMyPayments || searchAddress) && (
                    <button
                      className="btn btn-sm btn-ghost mt-4"
                      onClick={() => {
                        setFilterMyPayments(false);
                        setSearchAddress("");
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Service</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments
                      .slice()
                      .reverse()
                      .map((payment, index) => {
                        const date = new Date(Number(payment.timestamp) * 1000);
                        const isMyPayment =
                          connectedAddress && payment.student.toLowerCase() === connectedAddress.toLowerCase();

                        return (
                          <tr key={index} className={isMyPayment ? "bg-primary/5" : ""}>
                            <td>{filteredPayments.length - index}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <Address address={payment.student} />
                                {isMyPayment && <div className="badge badge-primary badge-xs">You</div>}
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{getServiceName(payment.serviceId)}</span>
                                <div className="badge badge-ghost badge-sm">ID: {payment.serviceId.toString()}</div>
                              </div>
                            </td>
                            <td>
                              <span className="font-semibold text-primary">{formatEther(payment.amount)} ETH</span>
                            </td>
                            <td>{date.toLocaleDateString()}</td>
                            <td className="text-sm text-base-content/60">{date.toLocaleTimeString()}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
