import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { questions, PASSING_SCORE } from "@/data/questions";

export async function POST(request: NextRequest) {
  try {
    const { employeeId, answers, timeSpentSeconds } = await request.json();

    if (!employeeId || !answers) {
      return NextResponse.json({ error: "Дані відсутні" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Calculate score
    let correctCount = 0;
    const detailedAnswers = questions.map((q, index) => {
      const selected = answers[index] ?? -1;
      const correct = selected === q.correctAnswer;
      if (correct) correctCount++;
      return {
        questionId: q.id,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        correct,
      };
    });

    const score = correctCount;
    const totalQuestions = questions.length;
    const passed = correctCount / totalQuestions >= PASSING_SCORE;

    // Get attempt number
    const { count } = await supabase
      .from("test_attempts")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employeeId);

    const attemptNumber = (count || 0) + 1;

    // Save attempt
    const { data: attempt, error } = await supabase
      .from("test_attempts")
      .insert({
        employee_id: employeeId,
        attempt_number: attemptNumber,
        score,
        total_questions: totalQuestions,
        passed,
        answers: detailedAnswers,
        time_spent_seconds: timeSpentSeconds || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Save attempt error:", error);
      return NextResponse.json({ error: "Помилка збереження" }, { status: 500 });
    }

    // Get employee info for certificate
    const { data: employee } = await supabase
      .from("employees")
      .select("full_name, email")
      .eq("id", employeeId)
      .single();

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      totalQuestions,
      passed,
      attemptNumber,
      fullName: employee?.full_name,
      detailedAnswers,
    });
  } catch {
    return NextResponse.json({ error: "Серверна помилка" }, { status: 500 });
  }
}
