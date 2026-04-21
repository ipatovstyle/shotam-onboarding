import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json();

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Email та ПІБ обов'язкові" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    // Upsert employee
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .upsert({ email: email.toLowerCase().trim(), full_name: fullName.trim() }, { onConflict: "email" })
      .select()
      .single();

    if (empError) {
      console.error("Employee upsert error:", empError);
      return NextResponse.json({ error: "Помилка збереження даних" }, { status: 500 });
    }

    // Count previous attempts
    const { count } = await supabase
      .from("test_attempts")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employee.id);

    const attemptNumber = (count || 0) + 1;

    return NextResponse.json({
      employeeId: employee.id,
      attemptNumber,
      fullName: employee.full_name,
    });
  } catch {
    return NextResponse.json({ error: "Серверна помилка" }, { status: 500 });
  }
}
