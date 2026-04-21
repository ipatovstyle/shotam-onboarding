"use client";

import { useState, useEffect, useCallback } from "react";

interface EmployeeResult {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  totalAttempts: number;
  hasPassed: boolean;
  passedOnAttempt?: number;
  bestScore: number;
  totalQuestions: number;
  attempts: {
    id: string;
    attempt_number: number;
    score: number;
    total_questions: number;
    passed: boolean;
    time_spent_seconds: number | null;
    completed_at: string;
  }[];
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "passed" | "failed">("all");

  const fetchResults = useCallback(async (pwd: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/results", {
        headers: { "x-admin-password": pwd },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("adminPassword");
    if (saved) {
      setPassword(saved);
      fetchResults(saved);
    }
  }, [fetchResults]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("adminPassword", password);
    fetchResults(password);
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} хв ${s} с`;
  };

  const filteredResults = results.filter((r) => {
    if (filter === "passed") return r.hasPassed;
    if (filter === "failed") return !r.hasPassed;
    return true;
  });

  const stats = {
    total: results.length,
    passed: results.filter((r) => r.hasPassed).length,
    failed: results.filter((r) => !r.hasPassed && r.totalAttempts > 0).length,
    pending: results.filter((r) => r.totalAttempts === 0).length,
  };

  if (!authenticated) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#1a1a2e] mb-3">
              <span className="text-xl font-bold text-[#FFD700]">#Ш</span>
            </div>
            <h1 className="text-xl font-bold text-[#1a1a2e]">Адмін-панель</h1>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль адміністратора"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#FFD700] text-[#1a1a2e]"
          />

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1a1a2e] text-[#FFD700] font-semibold rounded-xl hover:bg-[#16213e] transition-colors disabled:opacity-50"
          >
            {loading ? "Завантаження..." : "Увійти"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">
              Адмін-панель #ШОТАМ
            </h1>
            <p className="text-gray-500 text-sm">Результати онбординг-тесту</p>
          </div>
          <button
            onClick={() => fetchResults(password)}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm"
          >
            Оновити
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-3xl font-bold text-[#1a1a2e]">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500">Всього працівників</div>
          </div>
          <div className="bg-white rounded-xl border border-green-100 p-5">
            <div className="text-3xl font-bold text-green-500">
              {stats.passed}
            </div>
            <div className="text-sm text-gray-500">Склали тест</div>
          </div>
          <div className="bg-white rounded-xl border border-red-100 p-5">
            <div className="text-3xl font-bold text-red-400">
              {stats.failed}
            </div>
            <div className="text-sm text-gray-500">Не склали (ще)</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-3xl font-bold text-gray-400">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-500">Не починали</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(["all", "passed", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#1a1a2e] text-[#FFD700]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "Усі" : f === "passed" ? "Склали" : "Не склали"}
            </button>
          ))}
        </div>

        {/* Results table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">
                    ПІБ
                  </th>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">
                    Email
                  </th>
                  <th className="text-center px-5 py-4 text-sm font-medium text-gray-500">
                    Спроби
                  </th>
                  <th className="text-center px-5 py-4 text-sm font-medium text-gray-500">
                    Найкращий
                  </th>
                  <th className="text-center px-5 py-4 text-sm font-medium text-gray-500">
                    Статус
                  </th>
                  <th className="text-center px-5 py-4 text-sm font-medium text-gray-500">
                    Склав з
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((emp) => (
                  <>
                    <tr
                      key={emp.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() =>
                        setExpandedId(expandedId === emp.id ? null : emp.id)
                      }
                    >
                      <td className="px-5 py-4 font-medium text-[#1a1a2e]">
                        {emp.full_name}
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-sm">
                        {emp.email}
                      </td>
                      <td className="px-5 py-4 text-center text-[#1a1a2e] font-medium">
                        {emp.totalAttempts}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`font-medium ${
                            emp.bestScore === emp.totalQuestions
                              ? "text-green-500"
                              : "text-gray-600"
                          }`}
                        >
                          {emp.totalAttempts > 0
                            ? `${emp.bestScore}/${emp.totalQuestions}`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {emp.totalAttempts === 0 ? (
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                            Очікує
                          </span>
                        ) : emp.hasPassed ? (
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                            Склав(ла)
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600">
                            Не склав(ла)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center text-sm text-gray-600">
                        {emp.passedOnAttempt
                          ? `${emp.passedOnAttempt}-ї спроби`
                          : "—"}
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {expandedId === emp.id && emp.attempts.length > 0 && (
                      <tr key={`${emp.id}-details`}>
                        <td colSpan={6} className="px-5 py-4 bg-gray-50">
                          <div className="text-sm font-medium text-gray-500 mb-3">
                            Історія спроб
                          </div>
                          <div className="space-y-2">
                            {emp.attempts.map((att) => (
                              <div
                                key={att.id}
                                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-100"
                              >
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-medium text-[#1a1a2e]">
                                    Спроба #{att.attempt_number}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(
                                      att.completed_at
                                    ).toLocaleDateString("uk-UA")}{" "}
                                    {new Date(
                                      att.completed_at
                                    ).toLocaleTimeString("uk-UA", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-gray-500">
                                    {formatTime(att.time_spent_seconds)}
                                  </span>
                                  <span
                                    className={`text-sm font-medium ${
                                      att.passed
                                        ? "text-green-500"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {att.score}/{att.total_questions}
                                  </span>
                                  {att.passed ? (
                                    <span className="text-green-500 text-sm">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="text-red-400 text-sm">
                                      ✗
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}

                {filteredResults.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-gray-400"
                    >
                      Поки що немає результатів
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
