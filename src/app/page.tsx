"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !fullName.trim()) {
      setError("Будь ласка, заповніть усі поля");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/start-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      sessionStorage.setItem(
        "testSession",
        JSON.stringify({
          employeeId: data.employeeId,
          attemptNumber: data.attemptNumber,
          fullName: data.fullName,
          email,
        })
      );

      router.push("/test");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Щось пішло не так");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#1a1a2e] mb-4">
            <span className="text-3xl font-bold text-[#FFD700]">#Ш</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">
            Онбординг-тест #ШОТАМ
          </h1>
          <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
            Вітаємо на борту єдиного в Україні медіа позитивних новин! Перед тим
            як вирушити в спільне плавання, пройди невеличкий тест.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-[#1a1a2e]">23</div>
            <div className="text-xs text-gray-500 mt-1">питань</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-[#1a1a2e]">30</div>
            <div className="text-xs text-gray-500 mt-1">хвилин</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-[#FFD700]">100%</div>
            <div className="text-xs text-gray-500 mt-1">прохідний</div>
          </div>
        </div>

        <form
          onSubmit={handleStart}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Прізвище, ім&apos;я та по батькові
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Шевченко Тарас Григорович"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all text-[#1a1a2e] placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="taras@shotam.info"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all text-[#1a1a2e] placeholder:text-gray-400"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-[#1a1a2e] text-[#FFD700] font-semibold rounded-xl hover:bg-[#16213e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? "Завантаження..." : "Розпочати тест"}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Нехай попутний вітер буде на твоєму боці!
          </p>
        </form>
      </div>
    </main>
  );
}
