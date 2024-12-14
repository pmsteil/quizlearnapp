import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';
import { DatabaseTables } from './DatabaseTables';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <DatabaseTables />
      </main>
      <Footer />
    </div>
  );
}
