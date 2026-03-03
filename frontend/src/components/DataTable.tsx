import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  pageSize?: number;
  isLoading?: boolean;
  // Server-side pagination props
  serverSide?: boolean;
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = "Search...",
  pageSize = 10,
  isLoading = false,
  serverSide = false,
  totalItems = 0,
  currentPage = 1,
  onPageChange,
  onSearchChange
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState("");
  const [localPage, setLocalPage] = useState(0);

  // If serverSide is true, use external state, otherwise use local filtered data
  const search = serverSide ? "" : localSearch;
  const filtered = serverSide ? data : data.filter((item) =>
    Object.values(item).some((v) =>
      String(v).toLowerCase().includes(localSearch.toLowerCase())
    )
  );

  const effectivePage = serverSide ? (currentPage - 1) : localPage;
  const effectiveTotalPages = serverSide
    ? Math.ceil(totalItems / pageSize)
    : Math.ceil(filtered.length / pageSize);

  const paged = serverSide ? data : filtered.slice(localPage * pageSize, (localPage + 1) * pageSize);

  const handleSearchChange = (val: string) => {
    if (serverSide) {
      onSearchChange?.(val);
    } else {
      setLocalSearch(val);
      setLocalPage(0);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (serverSide) {
      onPageChange?.(newPage + 1); // External pages are 1-indexed usually
    } else {
      setLocalPage(newPage);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={serverSide ? undefined : localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {serverSide ? totalItems : filtered.length} records
        </span>
      </div>

      <div className="overflow-x-auto min-h-[400px] relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        )}
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                  No records found
                </td>
              </tr>
            ) : (
              paged.map((item, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {effectiveTotalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border p-4">
          <span className="text-sm text-muted-foreground">
            Page {effectivePage + 1} of {effectiveTotalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(effectivePage - 1)} disabled={effectivePage === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(effectivePage + 1)} disabled={effectivePage >= effectiveTotalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
