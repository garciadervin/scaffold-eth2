"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { ClockIcon, CreditCardIcon, CurrencyDollarIcon, HomeIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Service {
  name: string;
  price: bigint;
  active: boolean;
}

interface Payment {
  student: string;
  serviceId: bigint;
  amount: bigint;
  timestamp: bigint;
}

const Home: NextPage = () => {
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const { data: services } = useScaffoldReadContract({
    contractName: "UniversityPayments",
    functionName: "getServices",
  });

  const { data: contractBalance } = useScaffoldReadContract({
    contractName: "UniversityPayments",
    functionName: "getContractBalance",
  });

  const { data: payments } = useScaffoldReadContract({
    contractName: "UniversityPayments",
    functionName: "getPayments",
  });

  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "UniversityPayments",
  });

  const handlePayment = async () => {
    if (selectedServiceId === null || !paymentAmount) return;

    try {
      await writeContractAsync({
        functionName: "payForService",
        args: [BigInt(selectedServiceId)],
        value: parseEther(paymentAmount),
      });
      setPaymentAmount("");
      setSelectedServiceId(null);
    } catch (e) {
      console.error("Payment failed", e);
    }
  };

  const getServiceName = (id: bigint) => {
    if (!services) return "Unknown";
    return services[Number(id)]?.name || "Unknown";
  };

  const servicesTyped = services as Service[] | undefined;
  const paymentsTyped = payments as Payment[] | undefined;

  return (
    <div className="flex h-screen bg-base-200 font-sans">
      <aside className="w-64 bg-base-100 shadow-xl flex flex-col border-r border-base-300">
        <div className="p-6 border-b border-base-300">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <CurrencyDollarIcon className="h-6 w-6" />
            UniPay
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-content font-medium"
          >
            <HomeIcon className="h-5 w-5" />
            Dashboard
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-200 transition-colors text-base-content/70"
          >
            <CreditCardIcon className="h-5 w-5" />
            Pagos
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-200 transition-colors text-base-content/70"
          >
            <ClockIcon className="h-5 w-5" />
            Historial
          </a>
        </nav>
        <div className="p-4 border-t border-base-300">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-8">
                <span className="text-xs">U</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Usuario</p>
              <p className="text-xs text-base-content/50">Estudiante</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-base-content">Panel de Pagos</h2>
            <p className="text-base-content/60 mt-1">Gestiona tus pagos universitarios de forma segura</p>
          </div>
          <div className="stats shadow bg-base-100">
            <div className="stat px-6">
              <div className="stat-figure text-primary">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
              <div className="stat-title">Balance en Contrato</div>
              <div className="stat-value text-primary text-2xl">
                {contractBalance ? `${formatEther(contractBalance as bigint)} ETH` : "0.00 ETH"}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">Realizar un Pago</h3>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Seleccionar Servicio</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedServiceId?.toString() || ""}
                    onChange={e => setSelectedServiceId(Number(e.target.value))}
                  >
                    <option value="" disabled>
                      Elige un servicio...
                    </option>
                    {servicesTyped?.map((service, index) => (
                      <option key={index} value={index} disabled={!service.active}>
                        {service.name} - {formatEther(service.price)} ETH
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control mt-4">
                  <label className="label">
                    <span className="label-text">Monto a Pagar (ETH)</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="input input-bordered w-full"
                    placeholder="0.0"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                  />
                </div>

                <div className="card-actions justify-end mt-6">
                  <button
                    className="btn btn-primary min-h-[3rem] text-lg px-8"
                    onClick={handlePayment}
                    disabled={isPending || !selectedServiceId || !paymentAmount}
                  >
                    {isPending ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      <CreditCardIcon className="h-5 w-5 mr-2" />
                    )}
                    Pagar Ahora
                  </button>
                </div>
              </div>
            </section>

            <section className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">Servicios Disponibles</h3>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Servicio</th>
                        <th>Precio</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servicesTyped?.map((service, index) => (
                        <tr key={index}>
                          <td>{service.name}</td>
                          <td>{formatEther(service.price)} ETH</td>
                          <td>
                            {service.active ? (
                              <div className="badge badge-success badge-sm">Activo</div>
                            ) : (
                              <div className="badge badge-ghost badge-sm">Inactivo</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <section className="card bg-base-100 shadow-xl border border-base-200 h-full">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Últimos Pagos
                </h3>
                <div className="overflow-y-auto max-h-[400px]">
                  {paymentsTyped && paymentsTyped.length > 0 ? (
                    <ul className="timeline timeline-vertical timeline-compact">
                      {paymentsTyped
                        .slice()
                        .reverse()
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
                              <div className="text-xs text-base-content/50">
                                {payment.student.slice(0, 6)}...{payment.student.slice(-4)}
                              </div>
                            </div>
                            <hr className="bg-base-200" />
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="text-center text-base-content/50 py-8">No hay pagos registrados aún.</div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
