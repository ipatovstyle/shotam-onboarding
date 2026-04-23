"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { questions, TEST_DURATION_MINUTES } from "@/data/questions";

export default function TestPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [locked, setLocked] = useState<boolean[]>(
    new Array(questions.length).fill(false)
  );
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_MINUTES * 60);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<{
    employeeId: string;
    attemptNumber: number;
    fullName: string;
  } | null>(null);

  // Load session
  useEffect(() => {
    const stored = sessionStorage.getItem("testSession");
    if (!stored) {
      router.push("/");
      return;
    }
    setSession(JSON.parse(stored));
  }, [router]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-submit when time runs out
  const handleSubmit = useCallback(async () => {
    if (submitting || !session) return;
    setSubmitting(true);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const res = await fetch("/api/submit-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: session.employeeId,
          answers: answers.map((a) => (a !== null ? a : -1)),
          timeSpentSeconds: timeSpent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      sessionStorage.setItem("testResult", JSON.stringify(data));
      router.push("/results");
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Помилка при відправці тесту"
      );
      setSubmitting(false);
    }
  }, [submitting, session, answers, startTime, router]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft, handleSubmit]);

  const selectAnswer = (optionIndex: number) => {
    if (locked[currentQuestion]) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
    const newLocked = [...locked];
    newLocked[currentQuestion] = true;
    setLocked(newLocked);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = answers.filter((a) => a !== null).length;
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isTimeWarning = timeLeft < 120; // less than 2 min

  if (!session) return null;

  const q = questions[currentQuestion];

  return (
    <main className="flex-1 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              Питання {currentQuestion + 1} з {questions.length}
            </span>
            <div
              className={`text-lg font-mono font-bold ${
                isTimeWarning ? "timer-warning text-red-500" : "text-[#1a1a2e]"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-[#FFD700] h-1.5 rounded-full progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="animate-fade-in" key={currentQuestion}>
          <h2 className="text-xl font-semibold text-[#1a1a2e] mb-6 leading-relaxed">
            {q.question}
          </h2>

          <div className="space-y-3">
            {q.options.map((option, index) => {
              const isLocked = locked[currentQuestion];
              const isSelected = answers[currentQuestion] === index;
              const isCorrectOption = q.correctAnswer === index;
              const wasWrongChoice = isLocked && isSelected && !isCorrectOption;
              const showAsCorrect = isLocked && isCorrectOption;

              let cardClass = "option-card ";
              if (showAsCorrect) {
                cardClass += "!border-green-400 !bg-green-50";
              } else if (wasWrongChoice) {
                cardClass += "!border-red-300 !bg-red-50";
              } else if (isSelected) {
                cardClass += "selected";
              }
              if (isLocked) {
                cardClass += " cursor-default";
              }

              let dotClass =
                "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ";
              if (showAsCorrect) {
                dotClass += "border-green-500 bg-green-500";
              } else if (wasWrongChoice) {
                dotClass += "border-red-400 bg-red-400";
              } else if (isSelected) {
                dotClass += "border-[#FFD700] bg-[#FFD700]";
              } else {
                dotClass += "border-gray-300";
              }

              return (
                <div
                  key={index}
                  onClick={() => selectAnswer(index)}
                  className={cardClass}
                >
                  <div className="flex items-start gap-3">
                    <div className={dotClass}>
                      {showAsCorrect && (
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {wasWrongChoice && (
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isSelected && !isLocked && (
                        <svg className="w-3.5 h-3.5 text-[#1a1a2e]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`leading-relaxed ${wasWrongChoice ? "text-red-600 line-through" : showAsCorrect ? "text-green-700 font-medium" : "text-[#1a1a2e]"}`}>
                      {option}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Пояснення після неправильної відповіді */}
          {locked[currentQuestion] && answers[currentQuestion] !== q.correctAnswer && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 text-lg flex-shrink-0">💡</span>
                <p className="text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
              </div>
            </div>
          )}

          {/* Підтвердження правильної відповіді */}
          {locked[currentQuestion] && answers[currentQuestion] === q.correctAnswer && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg flex-shrink-0">✓</span>
                <p className="text-sm text-green-700 font-medium">Правильно!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Question dots */}
          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                  i === currentQuestion
                    ? "bg-[#1a1a2e] text-[#FFD700]"
                    : answers[i] !== null
                    ? "bg-[#FFD700] text-[#1a1a2e]"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-5 py-2.5 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Назад
            </button>

            <span className="text-sm text-gray-400">
              {answeredCount}/{questions.length} відповідей
            </span>

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentQuestion(
                    Math.min(questions.length - 1, currentQuestion + 1)
                  )
                }
                className="px-5 py-2.5 bg-[#1a1a2e] text-[#FFD700] rounded-xl hover:bg-[#16213e] transition-colors font-medium"
              >
                Далі
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || answeredCount < questions.length}
                className="px-5 py-2.5 bg-[#FFD700] text-[#1a1a2e] rounded-xl hover:bg-[#f0c800] transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed pulse-glow"
              >
                {submitting ? "Відправка..." : "Завершити тест"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
