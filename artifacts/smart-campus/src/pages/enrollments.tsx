import { useState } from "react";
import { useListEnrollments, useCreateEnrollment, useDeleteEnrollment, useListStudents, useListCourses, getListEnrollmentsQueryKey, getListStudentsQueryKey, getListCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Enrollments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [filterStudent, setFilterStudent] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [selStudent, setSelStudent] = useState("");
  const [selCourse, setSelCourse] = useState("");

  const filterParams = {
    studentId: filterStudent !== "all" ? Number(filterStudent) : undefined,
    courseId: filterCourse !== "all" ? Number(filterCourse) : undefined,
  };

  const { data: enrollments, isLoading } = useListEnrollments(filterParams, { query: { queryKey: getListEnrollmentsQueryKey(filterParams) } });
  const { data: students } = useListStudents({}, { query: { queryKey: getListStudentsQueryKey({}) } });
  const { data: courses } = useListCourses({ query: { queryKey: getListCoursesQueryKey() } });

  const createMutation = useCreateEnrollment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
        setOpen(false);
        setSelStudent("");
        setSelCourse("");
        toast({ title: "Student enrolled successfully" });
      },
      onError: () => toast({ title: "Enrollment failed", description: "Student may already be enrolled", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteEnrollment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
        toast({ title: "Enrollment removed" });
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Course Registrations</h2>
          <p className="text-muted-foreground text-sm mt-1">{enrollments?.length ?? 0} enrollment records</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Enroll Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enroll Student in Course</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Student *</Label>
                <Select value={selStudent} onValueChange={setSelStudent}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.rollNumber})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Course *</Label>
                <Select value={selCourse} onValueChange={setSelCourse}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.code})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!selStudent || !selCourse || createMutation.isPending}
                onClick={() => createMutation.mutate({ data: { studentId: Number(selStudent), courseId: Number(selCourse) } })}
              >
                {createMutation.isPending ? "Enrolling..." : "Enroll"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Filter by course" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {(filterStudent !== "all" || filterCourse !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterStudent("all"); setFilterCourse("all"); }}>Clear Filters</Button>
            )}
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
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enrolled</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={5} className="px-6 py-3"><Skeleton className="h-5 w-full" /></td></tr>)
              ) : !enrollments?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">No enrollments found</p>
                  </td>
                </tr>
              ) : (
                enrollments.map(e => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-3 font-medium">{e.studentName}</td>
                    <td className="px-6 py-3">{e.courseName}</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{e.courseCode}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">{new Date(e.enrolledAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove enrollment?</AlertDialogTitle>
                            <AlertDialogDescription>This will unenroll {e.studentName} from {e.courseName}.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteMutation.mutate({ id: e.id })}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
