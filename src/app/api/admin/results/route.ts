import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const password = request.headers.get("x-admin-password");

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Невірний пароль" }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Get all employees with their attempts
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (empError) {
      return NextResponse.json({ error: "Помилка отримання даних" }, { status: 500 });
    }

    // Get all attempts
    const { data: attempts, error: attError } = await supabase
      .from("test_attempts")
      .select("*")
      .order("completed_at", { ascending: false });

    if (attError) {
      return NextResponse.json({ error: "Помилка отримання спроб" }, { status: 500 });
    }

    // Combine data
    const results = employees?.map((emp) => {
      const empAttempts = attempts?.filter((a) => a.employee_id === emp.id) || [];
      const hasPassed = empAttempts.some((a) => a.passed);
      const passedOnAttempt = empAttempts.find((a) => a.passed)?.attempt_number;
      const bestScore = Math.max(...empAttempts.map((a) => a.score), 0);

      return {
        ...emp,
        attempts: empAttempts,
        totalAttempts: empAttempts.length,
        hasPassed,
        passedOnAttempt,
        bestScore,
        totalQuestions: empAttempts[0]?.total_questions || 23,
      };
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Серверна помилка" }, { status: 500 });
  }
}
