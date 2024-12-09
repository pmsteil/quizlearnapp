import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableView } from './TableView';
import { db } from '@/lib/db/client';
import { useToast } from '@/hooks/use-toast';

export function DatabaseTables() {
  const [tables, setTables] = useState<{ [key: string]: any[] }>({});
  const [activeTable, setActiveTable] = useState<string>('users');
  const { toast } = useToast();

  useEffect(() => {
    const loadTables = async () => {
      try {
        const users = await db.execute('SELECT * FROM users');
        const topics = await db.execute('SELECT * FROM topics');

        setTables({
          users: users.rows || [],
          topics: topics.rows || []
        });
      } catch (error) {
        console.error('Failed to load tables:', error);
        toast({
          title: "Error",
          description: "Failed to load database tables",
          variant: "destructive"
        });
      }
    };

    loadTables();
  }, [toast]);

  return (
    <Tabs value={activeTable} onValueChange={setActiveTable}>
      <TabsList className="mb-4">
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="topics">Topics</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <TableView
          title="Users"
          data={tables.users || []}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'created_at', label: 'Created At', type: 'datetime' },
            { key: 'updated_at', label: 'Updated At', type: 'datetime' }
          ]}
        />
      </TabsContent>

      <TabsContent value="topics">
        <TableView
          title="Topics"
          data={tables.topics || []}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'user_id', label: 'User ID' },
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description' },
            { key: 'progress', label: 'Progress' },
            { key: 'created_at', label: 'Created At', type: 'datetime' },
            { key: 'updated_at', label: 'Updated At', type: 'datetime' }
          ]}
        />
      </TabsContent>
    </Tabs>
  );
}