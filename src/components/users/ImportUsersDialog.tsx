import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Papa from "papaparse";
import { Upload, FileCheck2, AlertTriangle } from "lucide-react";
interface ImportUsersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (users: any[]) => Promise<void>;
  isImporting: boolean;
}
export function ImportUsersDialog({ isOpen, onClose, onImport, isImporting }: ImportUsersDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data);
          toast.success(`${results.data.length} records found in ${selectedFile.name}.`);
        },
        error: (error) => {
          toast.error(`CSV parsing error: ${error.message}`);
        },
      });
    }
  };
  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.warning("No data to import.");
      return;
    }
    try {
      await onImport(parsedData);
      resetState();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };
  const resetState = () => {
    setFile(null);
    setParsedData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetState(); onClose(); } }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Users via CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: full_name, email, coefficient, role.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
          </div>
          {parsedData.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Data Preview</h4>
              <ScrollArea className="h-64 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(parsedData[0]).map(key => <TableHead key={key}>{key}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value: any, i) => <TableCell key={i}>{value}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <p className="text-sm text-muted-foreground mt-2">
                Showing first 10 of {parsedData.length} records.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={parsedData.length === 0 || isImporting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isImporting ? "Importing..." : "Import Users"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}