"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { questions } from "@/data/questions";

interface TestResult {
  score: number;
  totalQuestions: number;
  passed: boolean;
  attemptNumber: number;
  fullName: string;
  detailedAnswers: {
    questionId: number;
    selectedAnswer: number;
    correctAnswer: number;
    correct: boolean;
  }[];
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("testResult");
    if (!stored) {
      router.push("/");
      return;
    }
    setResult(JSON.parse(stored));
  }, [router]);

  const downloadCertificate = async () => {
    if (!certRef.current || !result) return;

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(certRef.current, {
      scale: 2,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`certificate-shotam-${result.fullName.replace(/\s+/g, "-")}.pdf`);
  };

  if (!result) return null;

  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  const today = new Date().toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        {/* Result card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-6">
          {/* Icon */}
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              result.passed ? "bg-green-100" : "bg-red-50"
            }`}
          >
            {result.passed ? (
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">
            {result.passed
              ? "Вітаємо! Ти в команді!"
              : "Ще трішки зусиль!"}
          </h1>

          <p className="text-gray-600 mb-6">
            {result.passed
              ? "Ти успішно пройшов(ла) онбординг-тест #ШОТАМ. Попутного вітру!"
              : "На жаль, не всі відповіді правильні. Переглянь пояснення та спробуй знову."}
          </p>

          {/* Score */}
          <div className="inline-flex items-center gap-6 bg-gray-50 rounded-2xl px-8 py-5 mb-6">
            <div>
              <div className="text-4xl font-bold text-[#1a1a2e]">
                {result.score}/{result.totalQuestions}
              </div>
              <div className="text-sm text-gray-500">правильних</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div>
              <div
                className={`text-4xl font-bold ${
                  result.passed ? "text-green-500" : "text-red-400"
                }`}
              >
                {percentage}%
              </div>
              <div className="text-sm text-gray-500">результат</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div>
              <div className="text-4xl font-bold text-[#1a1a2e]">
                {result.attemptNumber}
              </div>
              <div className="text-sm text-gray-500">спроба</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {result.passed && (
              <button
                onClick={downloadCertificate}
                className="px-6 py-3 bg-[#FFD700] text-[#1a1a2e] rounded-xl font-bold hover:bg-[#f0c800] transition-colors"
              >
                Завантажити сертифікат (PDF)
              </button>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {showDetails ? "Сховати деталі" : "Переглянути відповіді"}
            </button>

            {!result.passed && (
              <button
                onClick={() => {
                  sessionStorage.removeItem("testResult");
                  router.push("/");
                }}
                className="px-6 py-3 bg-[#1a1a2e] text-[#FFD700] rounded-xl font-bold hover:bg-[#16213e] transition-colors"
              >
                Спробувати знову
              </button>
            )}
          </div>
        </div>

        {/* Detailed answers */}
        {showDetails && (
          <div className="space-y-4 animate-fade-in mb-8">
            {questions.map((q, index) => {
              const answer = result.detailedAnswers[index];
              const isCorrect = answer?.correct;
              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-xl border-2 p-5 ${
                    isCorrect ? "border-green-200" : "border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-medium text-[#1a1a2e] leading-relaxed">
                      {q.question}
                    </h3>
                  </div>

                  <div className="ml-10 space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answer?.selectedAnswer === optIdx;
                      const isCorrectOption = q.correctAnswer === optIdx;
                      let className = "text-sm px-3 py-2 rounded-lg ";
                      if (isCorrectOption) {
                        className += "bg-green-50 text-green-700 font-medium";
                      } else if (isSelected && !isCorrect) {
                        className += "bg-red-50 text-red-600 line-through";
                      } else {
                        className += "text-gray-500";
                      }
                      return (
                        <div key={optIdx} className={className}>
                          {isCorrectOption && "✓ "}
                          {isSelected && !isCorrectOption && "✗ "}
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  {!isCorrect && (
                    <div className="ml-10 mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Certificate (hidden, for PDF generation) */}
        {result.passed && (
          <div className="fixed -left-[9999px] top-0">
            <div
              ref={certRef}
              className="w-[1120px] h-[790px] certificate-bg relative overflow-hidden flex flex-col items-center justify-center text-white"
              style={{ padding: "60px" }}
            >
              {/* Decorative elements */}
              <div
                className="absolute top-0 left-0 w-full h-2"
                style={{ background: "#FFD700" }}
              />
              <div
                className="absolute bottom-0 left-0 w-full h-2"
                style={{ background: "#FFD700" }}
              />
              <div
                className="absolute top-0 left-0 w-2 h-full"
                style={{ background: "#FFD700" }}
              />
              <div
                className="absolute top-0 right-0 w-2 h-full"
                style={{ background: "#FFD700" }}
              />

              {/* Corner decorations */}
              <div
                className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2"
                style={{ borderColor: "#FFD700" }}
              />
              <div
                className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2"
                style={{ borderColor: "#FFD700" }}
              />
              <div
                className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2"
                style={{ borderColor: "#FFD700" }}
              />
              <div
                className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2"
                style={{ borderColor: "#FFD700" }}
              />

              <div
                className="text-sm tracking-[0.3em] uppercase mb-4"
                style={{ color: "#FFD700" }}
              >
                Сертифікат
              </div>

              <h2
                className="text-5xl font-bold mb-2"
                style={{ color: "#FFD700" }}
              >
                #ШОТАМ
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Медіа позитивних новин
              </p>

              <p className="text-gray-400 text-base mb-2">
                Цим засвідчується, що
              </p>
              <h3
                className="text-3xl font-bold mb-2"
                style={{
                  color: "#FFD700",
                  borderBottom: "2px solid rgba(255,215,0,0.3)",
                  paddingBottom: "8px",
                }}
              >
                {result.fullName}
              </h3>
              <p className="text-gray-400 text-base mb-8">
                успішно пройшов(ла) онбординг-тест
              </p>

              <div className="flex gap-12 mb-8">
                <div className="text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: "#FFD700" }}
                  >
                    {result.score}/{result.totalQuestions}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    правильних відповідей
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: "#FFD700" }}
                  >
                    {result.attemptNumber}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    спроба
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-400">{today}</p>
              <p className="text-xs text-gray-500 mt-2">
                Попутного вітру в спільному плаванні!
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
