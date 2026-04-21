-- =============================================
-- #ШОТАМ Onboarding Test — Supabase Schema
-- =============================================

-- Таблиця працівників, які проходять тест
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email)
);

-- Таблиця спроб проходження тесту
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL, -- кількість правильних відповідей
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '[]', -- масив відповідей [{questionId, selectedAnswer, correct}]
  time_spent_seconds INTEGER, -- скільки часу витратив
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Таблиця адмінів (emails, які мають доступ до адмін-панелі)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Вставимо першого адміна (замінити на реальний email)
INSERT INTO admin_users (email) VALUES ('ipatovstyle@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Індекси для швидкості
CREATE INDEX IF NOT EXISTS idx_test_attempts_employee ON test_attempts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- RLS (Row Level Security) — вимкнено для серверних API routes
-- Якщо потрібно — увімкнути та налаштувати policies

-- View для адмін-панелі
CREATE OR REPLACE VIEW admin_results_view AS
SELECT
  e.id as employee_id,
  e.email,
  e.full_name,
  e.created_at as registered_at,
  COUNT(ta.id) as total_attempts,
  MAX(CASE WHEN ta.passed THEN 1 ELSE 0 END)::boolean as has_passed,
  MAX(ta.score) as best_score,
  MAX(ta.total_questions) as total_questions,
  MIN(CASE WHEN ta.passed THEN ta.attempt_number END) as passed_on_attempt,
  MAX(ta.completed_at) as last_attempt_at
FROM employees e
LEFT JOIN test_attempts ta ON ta.employee_id = e.id
GROUP BY e.id, e.email, e.full_name, e.created_at;
