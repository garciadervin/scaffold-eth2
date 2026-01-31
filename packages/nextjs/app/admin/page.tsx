"use client";

import { useEffect, useState } from "react";
import { Address, EtherInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import {
  BanknotesIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  PencilIcon,
  PlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type Service = {
  name: string;
  price: bigint;
  active: boolean;
};

const Admin: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);

  // Form states
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceActive, setServiceActive] = useState(true);

  // Read contract data
  const { data: owner } = useScaffoldReadContract({
    contractName: "UniversityPayments",
    functionName: "owner",
  });

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

  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "UniversityPayments",
  });

  const servicesArray = (services as Service[]) || [];
  const isOwner = connectedAddress && owner && connectedAddress.toLowerCase() === owner.toLowerCase();

  // Reset form
  const resetForm = () => {
    setServiceName("");
    setServicePrice("");
    setServiceActive(true);
    setEditingServiceId(null);
    setShowCreateForm(false);
  };

  // Load service data when editing
  useEffect(() => {
    if (editingServiceId !== null && servicesArray[editingServiceId]) {
      const service = servicesArray[editingServiceId];
      setServiceName(service.name);
      setServicePrice(formatEther(service.price));
      setServiceActive(service.active);
      setShowCreateForm(true);
    }
  }, [editingServiceId, servicesArray]);

  // Create service
  const handleCreateService = async () => {
    if (!serviceName || !servicePrice) {
      notification.error("Please fill in all fields");
      return;
    }

    try {
      await writeContractAsync(
        {
          functionName: "createService",
          args: [serviceName, parseEther(servicePrice)],
        },
        {
          onBlockConfirmation: () => {
            notification.success("Service created successfully! 🎉");
            resetForm();
            refetchServices();
          },
        },
      );
    } catch (e: any) {
      console.error("Create service failed:", e);
      notification.error("Failed to create service");
    }
  };

  // Update service
  const handleUpdateService = async () => {
    if (editingServiceId === null || !serviceName || !servicePrice) {
      notification.error("Please fill in all fields");
      return;
    }

    try {
      await writeContractAsync(
        {
          functionName: "updateService",
          args: [BigInt(editingServiceId), serviceName, parseEther(servicePrice), serviceActive],
        },
        {
          onBlockConfirmation: () => {
            notification.success("Service updated successfully! ✅");
            resetForm();
            refetchServices();
          },
        },
      );
    } catch (e: any) {
      console.error("Update service failed:", e);
      notification.error("Failed to update service");
    }
  };

  // Withdraw funds
  const handleWithdrawFunds = async () => {
    try {
      await writeContractAsync(
        {
          functionName: "withdrawFunds",
        },
        {
          onBlockConfirmation: () => {
            notification.success("Funds withdrawn successfully! 💰");
            refetchBalance();
          },
        },
      );
    } catch (e: any) {
      console.error("Withdraw failed:", e);
      const errorMessage = e?.message || "";
      if (errorMessage.includes("No funds")) {
        notification.error("No funds to withdraw");
      } else {
        notification.error("Failed to withdraw funds");
      }
    }
  };

  // Start editing a service
  const startEdit = (index: number) => {
    setEditingServiceId(index);
  };

  if (!connectedAddress) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <div className="container mx-auto px-4 py-8">
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
            <span>Please connect your wallet to access the admin panel</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <div className="container mx-auto px-4 py-8">
          <div className="alert alert-error">
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
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Access Denied</h3>
              <p className="text-sm">Only the contract owner can access this panel</p>
              <div className="text-xs mt-1">
                Owner: <Address address={owner} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-base-content flex items-center gap-3">
            <Cog6ToothIcon className="h-8 w-8" />
            Admin Panel
          </h2>
          <p className="text-base-content/60 mt-1">Manage services and contract settings</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="lg:col-span-3">
            <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <CurrencyDollarIcon className="h-8 w-8" />
                </div>
                <div className="stat-title">Contract Balance</div>
                <div className="stat-value text-primary">
                  {balanceLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : contractBalance ? (
                    `${formatEther(contractBalance as bigint)} ETH`
                  ) : (
                    "0.00 ETH"
                  )}
                </div>
                <div className="stat-actions">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={handleWithdrawFunds}
                    disabled={isPending || !contractBalance || contractBalance === 0n}
                  >
                    <BanknotesIcon className="h-4 w-4" />
                    Withdraw Funds
                  </button>
                </div>
              </div>

              <div className="stat">
                <div className="stat-figure text-secondary">
                  <Cog6ToothIcon className="h-8 w-8" />
                </div>
                <div className="stat-title">Total Services</div>
                <div className="stat-value text-secondary">{servicesArray.length}</div>
                <div className="stat-desc">
                  {servicesArray.filter(s => s.active).length} active, {servicesArray.filter(s => !s.active).length}{" "}
                  inactive
                </div>
              </div>

              <div className="stat">
                <div className="stat-title">Contract Owner</div>
                <div className="stat-value text-sm">
                  <Address address={owner} />
                </div>
                <div className="stat-desc">You are the owner</div>
              </div>
            </div>
          </div>

          {/* Service Form */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="card-title text-lg">
                    {editingServiceId !== null ? "Edit Service" : "Create New Service"}
                  </h3>
                  {showCreateForm && (
                    <button className="btn btn-ghost btn-sm" onClick={resetForm}>
                      Cancel
                    </button>
                  )}
                </div>

                {!showCreateForm ? (
                  <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                    <PlusIcon className="h-5 w-5" />
                    Create New Service
                  </button>
                ) : (
                  <>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Service Name</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Annual Tuition"
                        className="input input-bordered w-full"
                        value={serviceName}
                        onChange={e => setServiceName(e.target.value)}
                        disabled={isPending}
                      />
                    </div>

                    <div className="form-control mt-4">
                      <label className="label">
                        <span className="label-text font-semibold">Price (ETH)</span>
                      </label>
                      <EtherInput
                        placeholder="Enter price in ETH"
                        onValueChange={({ valueInEth }) => setServicePrice(valueInEth)}
                      />
                    </div>

                    <div className="form-control mt-4">
                      <label className="label cursor-pointer">
                        <span className="label-text font-semibold">Active</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={serviceActive}
                          onChange={e => setServiceActive(e.target.checked)}
                          disabled={isPending}
                        />
                      </label>
                    </div>

                    <div className="card-actions justify-end mt-6">
                      <button
                        className="btn btn-primary"
                        onClick={editingServiceId !== null ? handleUpdateService : handleCreateService}
                        disabled={isPending || !serviceName || !servicePrice}
                      >
                        {isPending ? (
                          <>
                            <span className="loading loading-spinner"></span>
                            Processing...
                          </>
                        ) : editingServiceId !== null ? (
                          <>
                            <CheckCircleIcon className="h-5 w-5" />
                            Update Service
                          </>
                        ) : (
                          <>
                            <PlusIcon className="h-5 w-5" />
                            Create Service
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="lg:col-span-3">
            <div className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">All Services</h3>
                <div className="overflow-x-auto">
                  {servicesLoading ? (
                    <div className="flex justify-center py-8">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  ) : servicesArray.length === 0 ? (
                    <div className="text-center py-8 text-base-content/50">
                      No services created yet. Create your first service above.
                    </div>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Service Name</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servicesArray.map((service, index) => (
                          <tr key={index}>
                            <td>{index}</td>
                            <td className="font-medium">{service.name}</td>
                            <td>{formatEther(service.price)} ETH</td>
                            <td>
                              {service.active ? (
                                <div className="badge badge-success badge-sm gap-1">
                                  <CheckCircleIcon className="h-3 w-3" />
                                  Active
                                </div>
                              ) : (
                                <div className="badge badge-ghost badge-sm gap-1">
                                  <XCircleIcon className="h-3 w-3" />
                                  Inactive
                                </div>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => startEdit(index)}
                                disabled={isPending}
                              >
                                <PencilIcon className="h-4 w-4" />
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
