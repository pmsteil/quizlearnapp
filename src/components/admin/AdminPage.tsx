import { PageLayout } from '../shared/PageLayout';
import { DatabaseTables } from './DatabaseTables';

export function AdminPage() {
  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Database Administration</h1>
        <DatabaseTables />
      </div>
    </PageLayout>
  );
}

export default AdminPage;
