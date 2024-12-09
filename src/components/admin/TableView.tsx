import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'datetime' | 'json';
}

interface TableViewProps {
  title: string;
  data: any[];
  columns: Column[];
}

export function TableView({ title, data, columns }: TableViewProps) {
  const formatValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case 'datetime':
        return new Date(value * 1000).toLocaleString();
      case 'json':
        return <pre className="max-w-xs overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
      default:
        return String(value);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {formatValue(row[column.key], column.type)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}