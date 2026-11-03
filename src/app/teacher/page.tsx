import Link from "next/link";
import TeacherApp from "@/components/teacher/TeacherApp";

export default function TeacherPage() {
  return (
    <main className="container">
      <header className="topbar">
        <span className="topbar-name">교사 화면</span>
        <Link href="/" className="button small">
          첫 화면으로
        </Link>
      </header>

      <TeacherApp />
    </main>
  );
}
