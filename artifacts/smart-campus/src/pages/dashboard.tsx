import { useGetDashboardSummary, useGetGradeDistribution, useGetDepartmentStats, useGetTopStudents, useGetFeeSummary, getGetDashboardSummaryQueryKey, getGetGradeDistributionQueryKey, getGetDepartmentStatsQueryKey, getGetTopStudentsQueryKey, getGetFeeSummaryQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, GraduationCap, TrendingUp, DollarSign, Award } from "lucide-react";
import { Link } from "wouter";

const GRADE_COLORS = { A: "#3b5bdb", B: "#37b24d", C: "#f59f00", D: "#f03e3e" };

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <Card className="border border-card-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: grades } = useGetGradeDistribution({ query: { queryKey: getGetGradeDistributionQueryKey() } });
  const { data: depts } = useGetDepartmentStats({ query: { queryKey: getGetDepartmentStatsQueryKey() } });
  const { data: topStudents } = useGetTopStudents({ limit: 5 }, { query: { queryKey: getGetTopStudentsQueryKey({ limit: 5 }) } });
  const { data: feeSummary } = useGetFeeSummary({ query: { queryKey: getGetFeeSummaryQueryKey() } });

  const gradeData = grades?.map(g => ({ ...g, fill: GRADE_COLORS[g.grade as keyof typeof GRADE_COLORS] ?? "#888" })) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Campus Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">Real-time metrics across all modules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sumLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard label="Total Students" value={summary?.totalStudents ?? 0} icon={Users} />
            <StatCard label="Courses" value={summary?.totalCourses ?? 0} icon={BookOpen} />
            <StatCard label="Enrollments" value={summary?.totalEnrollments ?? 0} icon={GraduationCap} />
            <StatCard label="Campus Average" value={`${summary?.averageMarks?.toFixed(1) ?? 0}%`} icon={TrendingUp} sub="Overall performance" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department bar chart */}
        <Card className="lg:col-span-2 border border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Performance by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={depts ?? []} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, "Avg"]}
                />
                <Bar dataKey="averageMarks" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grade pie chart */}
        <Card className="border border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={gradeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count" paddingAngle={2}>
                  {gradeData.map((g, i) => <Cell key={i} fill={g.fill} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2 w-full text-xs">
              {gradeData.map(g => (
                <div key={g.grade} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: g.fill }} />
                  <span className="text-muted-foreground">Grade {g.grade}</span>
                  <span className="ml-auto font-semibold">{g.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top students */}
        <Card className="border border-card-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Performers</CardTitle>
            <Link href="/students" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {!topStudents?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
            ) : (
              <div className="space-y-3">
                {topStudents.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/students/${s.id}`} className="text-sm font-medium hover:text-primary transition-colors truncate block">{s.name}</Link>
                      <p className="text-xs text-muted-foreground">{s.department}</p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono shrink-0">{s.average?.toFixed(1)}%</Badge>
                    <Award className="w-4 h-4 text-primary shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee summary */}
        <Card className="border border-card-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Financial Summary</CardTitle>
            <Link href="/fees" className="text-xs text-primary hover:underline">Manage</Link>
          </CardHeader>
          <CardContent>
            {!feeSummary ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Fees Levied</span>
                  <span className="font-semibold font-mono text-sm">₹{feeSummary.totalFees.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Collected</span>
                  <span className="font-semibold font-mono text-sm text-green-600">₹{feeSummary.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                  <span className="font-semibold font-mono text-sm text-destructive">₹{feeSummary.totalOutstanding.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{feeSummary.paidCount}</div>
                    <div className="text-xs text-muted-foreground">Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">{feeSummary.partialCount}</div>
                    <div className="text-xs text-muted-foreground">Partial</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-destructive">{feeSummary.unpaidCount}</div>
                    <div className="text-xs text-muted-foreground">Unpaid</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
