import { requireSession } from "@/lib/auth";
import AddBookForm from "./AddBookForm";

export default async function AddBookPage() {
  await requireSession();
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-black text-gray-800 mb-6">➕ Add a book</h1>
      <AddBookForm />
    </div>
  );
}
