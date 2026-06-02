import { useState } from "react";
import { useListFees, useCreateFee, useUpdateFee, useGetFeeSummary, useListStudents, getListFeesQueryKey, getGetFeeSummaryQueryKey, getListStudentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CreditCard, TrendingDown, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS = { paid: "bg-green-100 text-green-700", partial: "bg-amber-100 text-amber-700", unpaid: "bg-red-100 text-red-700" };

export default function Fees() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStudent, setFilterStudent] = useState("all");
  const [form, setForm] = useState({ studentId: "", tuitionFee: "", labFee: "", examFee: "", paidAmount: "" });
  const [payAmount, setPayAmount] = useState("");

  const filterParams = { studentId: filterStudent !== "all" ? Number(filterStudent) : undefined, status: (filterStatus !== "all" ? filterStatus : undefined) as "paid" | "unpaid" | "partial" | undefined };
  const { data: fees, isLoading } = useListFees(filterParams, { query: { queryKey: getListFeesQueryKey(filterParams) } });
  const { data: feeSummary } = useGetFeeSummary({ query: { queryKey: getGetFeeSummaryQueryKey() } });
  const { data: students } = useListStudents({}, { query: { queryKey: getListStudentsQueryKey({}) } });

  const createMutation = useCreateFee({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFeesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFeeSummaryQueryKey() });
        setOpen(false);
        setForm({ studentId: "", tuitionFee: "", labFee: "", examFee: "", paidAmount: "" });
        toast({ title: "Fee record created" });
      },
    },
  });

  const updateMutation = useUpdateFee({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFeesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFeeSummaryQueryKey() });
        setEditId(null);
        toast({ title: "Fee record updated" });
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Records</h2>
          <p className="text-muted-foreground text-sm mt-1">Fee management across all students</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Add Fee Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Fee Record</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Student *</Label>
                <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["Tuition Fee", "tuitionFee"], ["Lab Fee", "labFee"], ["Exam Fee", "examFee"]].map(([label, key]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
                    <Input type="number" value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder="₹0" />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount Paid</Label>
                <Input type="number" value={form.paidAmount} onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))} placeholder="₹0" />
              </div>
              {form.tuitionFee && form.labFee && form.examFee && (
                <div className="bg-muted/50 rounded-md p-3 text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold font-mono">₹{(Number(form.tuitionFee) + Number(form.labFee) + Number(form.examFee)).toLocaleString()}</span>
                </div>
              )}
              <Button
                className="w-full"
                disabled={!form.studentId || !form.tuitionFee || !form.labFee || !form.examFee || createMutation.isPending}
                onClick={() => createMutation.mutate({ data: { studentId: Number(form.studentId), tuitionFee: Number(form.tuitionFee), labFee: Number(form.labFee), examFee: Number(form.examFee), paidAmount: form.paidAmount ? Number(form.paidAmount) : 0 } })}
              >
                {createMutation.isPending ? "Creating..." : "Create Fee Record"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      {feeSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-card-border">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center"><CreditCard className="w-4 h-4 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Levied</p>
                  <p className="font-bold font-mono">₹{feeSummary.totalFees.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-card-border">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-green-100 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-green-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Collected</p>
                  <p className="font-bold font-mono text-green-600">₹{feeSummary.totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-card-border">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-red-100 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-destructive" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Outstanding</p>
                  <p className="font-bold font-mono text-destructive">₹{feeSummary.totalOutstanding.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border border-card-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <Select value={filterStudent} onValueChange={setFilterStudent}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Filter by student" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            {(filterStudent !== "all" || filterStatus !== "all") && <Button variant="ghost" size="sm" onClick={() => { setFilterStudent("all"); setFilterStatus("all"); }}>Clear</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-card-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-6 py-3"><Skeleton className="h-5 w-full" /></td></tr>)
              ) : !fees?.length ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center"><p className="text-muted-foreground">No fee records found</p></td></tr>
              ) : (
                fees.map(f => (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-3 font-medium">{f.studentName}</td>
                    <td className="px-6 py-3 font-mono text-sm">₹{Number(f.totalFee).toLocaleString()}</td>
                    <td className="px-6 py-3 font-mono text-sm text-green-600">₹{Number(f.paidAmount).toLocaleString()}</td>
                    <td className="px-6 py-3 font-mono text-sm text-destructive">₹{(Number(f.totalFee) - Number(f.paidAmount)).toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[f.status as keyof typeof STATUS_COLORS] ?? ""}`}>
                        {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editId === f.id ? (
                          <div className="flex items-center gap-2">
                            <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Amount" className="h-7 w-28 text-xs" />
                            <Button size="sm" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: f.id, data: { paidAmount: Number(payAmount) } })}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setEditId(f.id); setPayAmount(String(f.paidAmount)); }}>Update Payment</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
