import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetStudent, useUpdateStudent, useListEnrollments, useListFees, useListPerformance, getGetStudentQueryKey, getListEnrollmentsQueryKey, getListFeesQueryKey, getListPerformanceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit2, Mail, Phone, BookOpen, CreditCard, LineChart } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const GRADE_COLORS = { A: "bg-blue-100 text-blue-700 border-blue-200", B: "bg-green-100 text-green-700 border-green-200", C: "bg-amber-100 text-amber-700 border-amber-200", D: "bg-red-100 text-red-700 border-red-200" };
const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Chemical", "Mathematics"];

export default function StudentDetail() {
  const [, params] = useRoute("/students/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", department: "", email: "", phone: "" });

  const { data: student, isLoading } = useGetStudent(id, { query: { queryKey: getGetStudentQueryKey(id) } });
  const { data: enrollments } = useListEnrollments({ studentId: id }, { query: { queryKey: getListEnrollmentsQueryKey({ studentId: id }) } });
  const { data: fees } = useListFees({ studentId: id }, { query: { queryKey: getListFeesQueryKey({ studentId: id }) } });
  const { data: performance } = useListPerformance({ studentId: id }, { query: { queryKey: getListPerformanceQueryKey({ studentId: id }) } });

  const updateMutation = useUpdateStudent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(id) });
        setEditOpen(false);
        toast({ title: "Student record updated" });
      },
    },
  });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40" />
    </div>
  );

  if (!student) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Student not found</p>
      <Link href="/students"><Button variant="outline" className="mt-4 gap-2"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
    </div>
  );

  const perfChartData = performance?.map(p => ({
    subject: p.subject.split(" ").slice(0, 2).join(" "),
    percentage: Number(p.percentage) || 0,
    marks: p.marks,
    maxMarks: p.maxMarks,
  })) ?? [];

  const feeRecord = fees?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" />Directory</Button>
        </Link>
      </div>

      {/* Profile card */}
      <Card className="border border-card-border">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl font-mono">
                {student.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{student.name}</h2>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-muted-foreground text-sm">{student.department}</span>
                  <span className="text-muted-foreground font-mono text-xs">{student.rollNumber}</span>
                  {student.grade && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${GRADE_COLORS[student.grade as keyof typeof GRADE_COLORS] ?? ""}`}>
                      Grade {student.grade}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {student.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{student.email}</span>}
                  {student.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{student.phone}</span>}
                </div>
              </div>
            </div>
            <Dialog open={editOpen} onOpenChange={v => { setEditOpen(v); if (v) setForm({ name: student.name, department: student.department, email: student.email ?? "", phone: student.phone ?? "" }); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2"><Edit2 className="w-3.5 h-3.5" />Edit Record</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Update Student Record</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Department</Label>
                    <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <Button className="w-full" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ id, data: { name: form.name, department: form.department, email: form.email || undefined, phone: form.phone || undefined } })}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {student.average !== null && (
            <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Overall Average</p>
                <p className="text-2xl font-bold mt-1 font-mono">{Number(student.average).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Subjects Taken</p>
                <p className="text-2xl font-bold mt-1">{performance?.length ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Courses Enrolled</p>
                <p className="text-2xl font-bold mt-1">{enrollments?.length ?? 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance chart */}
        <Card className="border border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><LineChart className="w-4 h-4" />Academic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {!perfChartData.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No performance data recorded yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={perfChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
            )}
          </CardContent>
        </Card>

        {/* Enrollments */}
        <Card className="border border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><BookOpen className="w-4 h-4" />Course Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            {!enrollments?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">Not enrolled in any courses</p>
            ) : (
              <div className="space-y-2">
                {enrollments.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{e.courseName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{e.courseCode}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(e.enrolledAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee record */}
        {feeRecord && (
          <Card className="border border-card-border lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><CreditCard className="w-4 h-4" />Fee Record</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">Tuition</p>
                  <p className="font-semibold font-mono mt-0.5">₹{Number(feeRecord.tuitionFee).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">Lab</p>
                  <p className="font-semibold font-mono mt-0.5">₹{Number(feeRecord.labFee).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">Exam</p>
                  <p className="font-semibold font-mono mt-0.5">₹{Number(feeRecord.examFee).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold font-mono mt-0.5">₹{Number(feeRecord.totalFee).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Amount Paid</p>
                  <p className="text-lg font-bold text-green-600 font-mono">₹{Number(feeRecord.paidAmount).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-bold text-destructive font-mono">₹{(Number(feeRecord.totalFee) - Number(feeRecord.paidAmount)).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${feeRecord.status === "paid" ? "bg-green-100 text-green-700" : feeRecord.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {feeRecord.status.charAt(0).toUpperCase() + feeRecord.status.slice(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
