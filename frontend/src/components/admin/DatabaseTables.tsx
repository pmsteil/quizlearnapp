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
        console.log('Starting to load tables...');
        const [users, topics, questions, progress] = await Promise.all([
          db.query('SELECT * FROM users').catch(err => {
            console.error('Error loading users:', err);
            return { data: [] };
          }),
          db.query('SELECT * FROM topics').catch(err => {
            console.error('Error loading topics:', err);
            return { data: [] };
          }),
          db.query('SELECT * FROM questions').catch(err => {
            console.error('Error loading questions:', err);
            return { data: [] };
          }),
          db.query('SELECT * FROM user_progress').catch(err => {
            console.error('Error loading progress:', err);
            return { data: [] };
          })
        ]);

        console.log('Database responses:', {
          users: users?.data,
          topics: topics?.data,
          questions: questions?.data,
          progress: progress?.data
        });

        setTables({
          users: users?.data || [],
          topics: topics?.data || [],
          questions: questions?.data || [],
          user_progress: progress?.data || []
        });
      } catch (error) {
        console.error('Failed to load tables:', error);
        toast({
          title: "Database Error",
          description: error instanceof Error ? error.message : "Failed to load database tables",
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
        <TabsTrigger value="questions">Questions</TabsTrigger>
        <TabsTrigger value="user_progress">Progress</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <TableView
          title="Users"
          data={tables.users || []}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'email', label: 'Email' },
            { key: 'name', label: 'Name' },
            { key: 'roles', label: 'Roles', type: 'json' }
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
            { key: 'lesson_plan', label: 'Lesson Plan', type: 'json' },
            { key: 'created_at', label: 'Created', type: 'datetime' },
            { key: 'updated_at', label: 'Updated', type: 'datetime' }
          ]}
        />
      </TabsContent>

      <TabsContent value="questions">
        <TableView
          title="Questions"
          data={tables.questions || []}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'topic_id', label: 'Topic ID' },
            { key: 'question', label: 'Question' },
            { key: 'answer', label: 'Answer' }
          ]}
        />
      </TabsContent>

      <TabsContent value="user_progress">
        <TableView
          title="User Progress"
          data={tables.user_progress || []}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'user_id', label: 'User ID' },
            { key: 'topic_id', label: 'Topic ID' },
            { key: 'completed_at', label: 'Completed' }
          ]}
        />
      </TabsContent>
    </Tabs>
  );
}
