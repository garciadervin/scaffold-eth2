"use client";

import { useState } from "react";
import { Address, EtherInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

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

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const {
    data: services,
    isLoading: servicesLoading,
    refetch: refetchServices,
  } = useScaffoldReadContract({
    contractName: "UniversityPayments",
    functionName: "getServices",
  });

  const {
    data: contractBalance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useScaffoldReadContract({
    contractName: "UniversityPayments",
    functionName: "getContractBalance",
  });

  const {
    data: payments,
    isLoading: paymentsLoading,
    refetch: refetchPayments,
  } = useScaffoldReadContract({
    contractName: "UniversityPayments",
    functionName: "getPayments",
  });

  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "UniversityPayments",
  });

  const handlePayment = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet first");
      return;
    }

    if (selectedServiceId === null || !paymentAmount) {
      notification.error("Please select a service and enter an amount");
      return;
    }

    try {
      await writeContractAsync(
        {
          functionName: "payForService",
          args: [BigInt(selectedServiceId)],
          value: BigInt(Math.floor(parseFloat(paymentAmount) * 1e18)),
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("Transaction confirmed:", txnReceipt.blockHash);
            notification.success("Payment successful! 🎉");
            setPaymentAmount("");
            setSelectedServiceId(null);
            // Refetch data
            refetchServices();
            refetchBalance();
            refetchPayments();
          },
        },
      );
    } catch (e: any) {
      console.error("Payment failed:", e);
      const errorMessage = e?.message || "Payment failed";
      if (errorMessage.includes("insufficient funds")) {
        notification.error("Insufficient funds in your wallet");
      } else if (errorMessage.includes("user rejected")) {
        notification.warning("Transaction rejected by user");
      } else {
        notification.error("Payment failed. Please try again.");
      }
    }
  };

  const getServiceName = (id: bigint): string => {
    if (!services) return "Unknown";
    const serviceArray = services as Service[];
    return serviceArray[Number(id)]?.name || "Unknown";
  };

  const servicesArray = (services as Service[]) || [];
  const paymentsArray = (payments as Payment[]) || [];

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-base-content">Payment Dashboard</h2>
            <p className="text-base-content/60 mt-1">Manage your university payments securely</p>
          </div>
          <div className="stats shadow bg-base-100">
            <div className="stat px-6">
              <div className="stat-figure text-primary">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
              <div className="stat-title">Contract Balance</div>
              <div className="stat-value text-primary text-2xl">
                {balanceLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : contractBalance ? (
                  `${formatEther(contractBalance as bigint)} ETH`
                ) : (
                  "0.00 ETH"
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Payment Form */}
            <section className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">Make a Payment</h3>

                {!connectedAddress ? (
                  <div className="alert alert-warning">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current shrink-0 h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span>Please connect your wallet to make a payment</span>
                  </div>
                ) : (
                  <>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Select Service</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={selectedServiceId?.toString() || ""}
                        onChange={e => setSelectedServiceId(Number(e.target.value))}
                        disabled={servicesLoading || isPending}
                      >
                        <option value="" disabled>
                          {servicesLoading ? "Loading services..." : "Choose a service..."}
                        </option>
                        {servicesArray.map((service, index) => (
                          <option key={index} value={index} disabled={!service.active}>
                            {service.name} - {formatEther(service.price)} ETH
                            {!service.active && " (Inactive)"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control mt-4">
                      <label className="label">
                        <span className="label-text font-semibold">Payment Amount</span>
                        {selectedServiceId !== null && servicesArray[selectedServiceId] && (
                          <span className="label-text-alt text-primary font-semibold">
                            Required: {formatEther(servicesArray[selectedServiceId].price)} ETH
                          </span>
                        )}
                      </label>
                      <EtherInput
                        placeholder="Enter amount in ETH"
                        onValueChange={({ valueInEth }) => setPaymentAmount(valueInEth)}
                      />
                    </div>

                    <div className="card-actions justify-end mt-6">
                      <button
                        className="btn btn-primary min-h-[3rem] text-lg px-8"
                        onClick={handlePayment}
                        disabled={isPending || !selectedServiceId || !paymentAmount || servicesLoading}
                      >
                        {isPending ? (
                          <>
                            <span className="loading loading-spinner"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCardIcon className="h-5 w-5 mr-2" />
                            Pay Now
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Services Table */}
            <section className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">Available Services</h3>
                <div className="overflow-x-auto">
                  {servicesLoading ? (
                    <div className="flex justify-center py-8">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  ) : servicesArray.length === 0 ? (
                    <div className="text-center py-8 text-base-content/50">No services available yet.</div>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Price</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servicesArray.map((service, index) => (
                          <tr key={index} className={!service.active ? "opacity-50" : ""}>
                            <td className="font-medium">{service.name}</td>
                            <td>{formatEther(service.price)} ETH</td>
                            <td>
                              {service.active ? (
                                <div className="badge badge-success badge-sm gap-1">
                                  <CheckCircleIcon className="h-3 w-3" />
                                  Active
                                </div>
                              ) : (
                                <div className="badge badge-ghost badge-sm">Inactive</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Payment History Sidebar */}
          <div className="lg:col-span-1">
            <section className="card bg-base-100 shadow-xl border border-base-200 sticky top-8">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Recent Payments
                </h3>
                <div className="overflow-y-auto max-h-[500px]">
                  {paymentsLoading ? (
                    <div className="flex justify-center py-8">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  ) : paymentsArray.length === 0 ? (
                    <div className="text-center text-base-content/50 py-8">No payments recorded yet.</div>
                  ) : (
                    <ul className="timeline timeline-vertical timeline-compact">
                      {paymentsArray
                        .slice()
                        .reverse()
                        .slice(0, 10)
                        .map((payment, index) => (
                          <li key={index}>
                            <div className="timeline-middle">
                              <UserCircleIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="timeline-end timeline-box bg-base-200 border-none p-3 mb-2 ml-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-sm">{getServiceName(payment.serviceId)}</span>
                                <span className="badge badge-sm badge-primary">{formatEther(payment.amount)} ETH</span>
                              </div>
                              <Address address={payment.student} size="xs" />
                              <div className="text-xs text-base-content/50 mt-1">
                                {new Date(Number(payment.timestamp) * 1000).toLocaleDateString()}
                              </div>
                            </div>
                            <hr className="bg-base-200" />
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
