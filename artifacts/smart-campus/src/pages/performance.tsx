import { useState } from "react";
import { useListPerformance, useCreatePerformance, useDeletePerformance, useListStudents, getListPerformanceQueryKey, getListStudentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, LineChart as LineChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function Performance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [filterStudent, setFilterStudent] = useState("all");
  const [form, setForm] = useState({ studentId: "", subject: "", marks: "", maxMarks: "100" });

  const filterParams = { studentId: filterStudent !== "all" ? Number(filterStudent) : undefined };
  const { data: performance, isLoading } = useListPerformance(filterParams, { query: { queryKey: getListPerformanceQueryKey(filterParams) } });
  const { data: students } = useListStudents({}, { query: { queryKey: getListStudentsQueryKey({}) } });

  const createMutation = useCreatePerformance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPerformanceQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        setOpen(false);
        setForm({ studentId: "", subject: "", marks: "", maxMarks: "100" });
        toast({ title: "Performance record added" });
      },
    },
  });

  const deleteMutation = useDeletePerformance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPerformanceQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        toast({ title: "Record deleted" });
      },
    },
  });

  // Chart data for selected student
  const chartData = performance?.map(p => ({
    subject: p.subject.split(" ").slice(0, 2).join(" "),
    percentage: Number(p.percentage) || 0,
  })) ?? [];

  // Average
  const avg = performance?.length
    ? performance.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0) / performance.length
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Academic Performance</h2>
          <p className="text-muted-foreground text-sm mt-1">{performance?.length ?? 0} performance records</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Add Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Performance Record</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Student *</Label>
                <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Subject *</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Data Structures" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Marks Scored *</Label>
                  <Input type="number" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: e.target.value }))} placeholder="e.g. 85" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Maximum Marks *</Label>
                  <Input type="number" value={form.maxMarks} onChange={e => setForm(f => ({ ...f, maxMarks: e.target.value }))} />
                </div>
              </div>
              {form.marks && form.maxMarks && Number(form.maxMarks) > 0 && (
                <div className="bg-muted/50 rounded-md p-3 text-sm">
                  <span className="text-muted-foreground">Percentage: </span>
                  <span className="font-bold font-mono">{((Number(form.marks) / Number(form.maxMarks)) * 100).toFixed(1)}%</span>
                </div>
              )}
              <Button
                className="w-full"
                disabled={!form.studentId || !form.subject || !form.marks || !form.maxMarks || createMutation.isPending}
                onClick={() => createMutation.mutate({ data: { studentId: Number(form.studentId), subject: form.subject, marks: Number(form.marks), maxMarks: Number(form.maxMarks) } })}
              >
                {createMutation.isPending ? "Adding..." : "Add Record"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card className="border border-card-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={filterStudent} onValueChange={setFilterStudent}>
              <SelectTrigger className="w-52"><SelectValue placeholder="All Students" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {filterStudent !== "all" && avg !== null && (
              <div className="text-sm ml-2">
                <span className="text-muted-foreground">Average: </span>
                <span className="font-bold font-mono">{avg.toFixed(1)}%</span>
              </div>
            )}
            {filterStudent !== "all" && <Button variant="ghost" size="sm" onClick={() => setFilterStudent("all")}>Clear</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Chart (when filtered by student) */}
      {filterStudent !== "all" && chartData.length > 0 && (
        <Card className="border border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <LineChartIcon className="w-4 h-4" />Subject Performance Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, "Score"]}
                />
                <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border border-card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marks</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Percentage</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={5} className="px-6 py-3"><Skeleton className="h-5 w-full" /></td></tr>)
              ) : !performance?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <LineChartIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">No performance records yet</p>
                  </td>
                </tr>
              ) : (
                performance.map(p => {
                  const pct = Number(p.percentage) || 0;
                  const color = pct >= 90 ? "text-blue-600" : pct >= 75 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-red-600";
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-3 font-medium">{p.studentName}</td>
                      <td className="px-6 py-3">{p.subject}</td>
                      <td className="px-6 py-3 font-mono text-sm">{p.marks}/{p.maxMarks}</td>
                      <td className="px-6 py-3">
                        <span className={`font-bold font-mono text-sm ${color}`}>{pct.toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete record?</AlertDialogTitle>
                              <AlertDialogDescription>This will remove the {p.subject} record for {p.studentName}. The student's average will be recalculated.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteMutation.mutate({ id: p.id })}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
