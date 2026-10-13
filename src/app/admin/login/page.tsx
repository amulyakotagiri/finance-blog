"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Incorrect password");
        setLoading(false);
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#1e4d3a] flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e2dc] shadow-sm p-8">
          <h1 className="text-xl font-semibold tracking-tight text-[#1a1a1a] mb-1">
            Admin login
          </h1>
          <p className="text-sm text-[#6b6b6b] mb-6">
            Enter your password to access the admin panel.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#e5e2dc] bg-[#f8f7f5] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/40 focus:border-[#1e4d3a] transition-colors"
                autoComplete="current-password"
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1e4d3a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#163829] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6b6b6b] mt-4">
          Money Sense Admin · Access restricted
        </p>
      </div>
    </div>
  );
}
