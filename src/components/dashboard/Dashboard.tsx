import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';
import TopicsList from '../topics/TopicsList';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto p-6 flex-1">
        <TopicsList />
      </main>
      <Footer />
    </div>
  );
}