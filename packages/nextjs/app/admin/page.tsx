"use client";

import type { NextPage } from "next";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

const Admin: NextPage = () => {
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

        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <div className="text-center py-16 text-base-content/50">
              <Cog6ToothIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Admin panel coming soon...</p>
              <p className="text-sm mt-2">This page will allow contract owners to manage services</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
