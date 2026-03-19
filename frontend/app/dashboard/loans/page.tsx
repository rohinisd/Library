import { requireSession } from "@/lib/auth";
import LoansClient from "./LoansClient";

export default async function LoansPage() {
  await requireSession();
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-black text-gray-800 mb-6">📖 My Loans</h1>
      <LoansClient />
    </div>
  );
}
