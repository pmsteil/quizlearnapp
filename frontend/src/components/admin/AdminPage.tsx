import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';
import { DatabaseTables } from './DatabaseTables';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconsTest } from './IconsTest';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <Tabs defaultValue="database" className="w-full">
          <TabsList>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="icons">Icons Test</TabsTrigger>
          </TabsList>
          <TabsContent value="database">
            <DatabaseTables />
          </TabsContent>
          <TabsContent value="icons">
            <IconsTest />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
