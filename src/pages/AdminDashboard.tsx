import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Plus,
  FileSpreadsheet,
  BarChart3,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserRole } from '@/types';

interface UserRecord {
  id: string;
  user_id: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  role: UserRole;
}

interface CourseRecord {
  id: number;
  course_code: string;
  course_name: string;
  department: string;
  semester: number;
  credits: number;
  is_lab: boolean;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Course creation form
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    course_name: '',
    department: 'Artificial Intelligence & Data Science',
    semester: '1',
    credits: '3',
    is_lab: false,
  });

  // Role change confirmation dialog state
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('student');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch roles
      const { data: roles } = await supabase.from('user_roles').select('*');

      // 3. Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('semester', { ascending: true });

      const roleMap = new Map<string, UserRole>();
      (roles || []).forEach((r) => {
        roleMap.set(r.user_id, r.role as UserRole);
      });

      const userRecords: UserRecord[] = (profiles || []).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        email: p.email,
        department: p.department,
        semester: p.semester,
        role: roleMap.get(p.user_id) || 'student',
      }));

      setUsers(userRecords);
      setCourses(coursesData || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('courses').insert([
        {
          course_code: newCourse.course_code.toUpperCase(),
          course_name: newCourse.course_name,
          department: newCourse.department,
          semester: parseInt(newCourse.semester, 10),
          credits: parseInt(newCourse.credits, 10),
          is_lab: newCourse.is_lab,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Course Registered',
        description: `Successfully added ${newCourse.course_code} - ${newCourse.course_name}.`,
      });

      setNewCourse({
        course_code: '',
        course_name: '',
        department: 'Artificial Intelligence & Data Science',
        semester: '1',
        credits: '3',
        is_lab: false,
      });

      fetchAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inserting course.';
      toast({
        title: 'Failed to add course',
        description: msg,
        variant: 'destructive',
      });
    }
  };

  const confirmRoleChange = (targetUser: UserRecord, newRole: UserRole) => {
    setSelectedUser(targetUser);
    setTargetRole(newRole);
    setIsRoleDialogOpen(true);
  };

  const executeRoleChange = async () => {
    if (!selectedUser) return;

    try {
      // Upsert into user_roles
      const { error } = await supabase.from('user_roles').upsert(
        [
          {
            user_id: selectedUser.user_id,
            role: targetRole,
          },
        ],
        { onConflict: 'user_id,role' }
      );

      if (error) throw error;

      // Log action into audit_logs
      if (user?.id) {
        await supabase.from('audit_logs').insert([
          {
            user_id: user.id,
            action: 'USER_ROLE_CHANGE',
            entity: 'user_roles',
            entity_id: selectedUser.user_id,
            details: {
              target_user: selectedUser.email,
              new_role: targetRole,
            },
          },
        ]);
      }

      toast({
        title: 'Permissions Updated',
        description: `Assigned role "${targetRole}" to ${selectedUser.name}.`,
      });

      setIsRoleDialogOpen(false);
      fetchAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user role.';
      toast({
        title: 'Error updating role',
        description: msg,
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout pageTitle="Administrator Control Center">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Institution access management, curriculum registration, and operational datasets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/datasets">
              <Button variant="outline" size="sm" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Dataset Manager
              </Button>
            </Link>
            <Link to="/analytics">
              <Button size="sm" className="gap-2 bg-primary">
                <BarChart3 className="w-4 h-4" />
                Institution Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* 3 Overview KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Accounts</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Students, Faculty & Staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Registered Courses</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Security Status</CardTitle>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Enforced</div>
              <p className="text-xs text-muted-foreground mt-1">Row Level Security active</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: User Management vs Course Curriculum vs Add Course */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Access & Roles</TabsTrigger>
            <TabsTrigger value="courses">Curriculum Courses ({courses.length})</TabsTrigger>
            <TabsTrigger value="add-course">Register New Course</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">User Directory & Role Authorization</CardTitle>
                    <CardDescription className="text-xs">
                      Control permissions for Student, Faculty, and Administrator roles
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search accounts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead className="text-right">Assign Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div className="font-semibold text-sm">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </TableCell>
                        <TableCell className="text-xs">{u.department}</TableCell>
                        <TableCell className="text-xs">{u.semester}</TableCell>
                        <TableCell>
                          {u.role === 'admin' ? (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 text-[11px]">
                              <ShieldCheck className="w-3 h-3" />
                              Admin
                            </Badge>
                          ) : u.role === 'faculty' ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 text-[11px]">
                              <UserCheck className="w-3 h-3" />
                              Faculty
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-[11px]">
                              <GraduationCap className="w-3 h-3" />
                              Student
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => confirmRoleChange(u, 'student')}
                            disabled={u.role === 'student'}
                          >
                            Student
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-blue-600 hover:text-blue-700"
                            onClick={() => confirmRoleChange(u, 'faculty')}
                            disabled={u.role === 'faculty'}
                          >
                            Faculty
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-purple-600 hover:text-purple-700"
                            onClick={() => confirmRoleChange(u, 'admin')}
                            disabled={u.role === 'admin'}
                          >
                            Admin
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curriculum Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Institutional Curriculum Registry</CardTitle>
                <CardDescription className="text-xs">
                  Active courses and laboratory requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-bold text-xs">{c.course_code}</TableCell>
                        <TableCell className="font-medium text-sm">{c.course_name}</TableCell>
                        <TableCell className="text-xs">{c.department}</TableCell>
                        <TableCell className="text-xs">Semester {c.semester}</TableCell>
                        <TableCell>{c.credits}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {c.is_lab ? 'Lab Session' : 'Theory Course'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Course Tab */}
          <TabsContent value="add-course">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Add Course to Catalog
                </CardTitle>
                <CardDescription className="text-xs">
                  Register a syllabus subject for attendance and CGPA calculation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCourse} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="code">Course Code</Label>
                      <Input
                        id="code"
                        placeholder="e.g. AI401"
                        value={newCourse.course_code}
                        onChange={(e) => setNewCourse({ ...newCourse, course_code: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="name">Course Title</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Machine Learning"
                        value={newCourse.course_name}
                        onChange={(e) => setNewCourse({ ...newCourse, course_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cDept">Department</Label>
                      <Select
                        value={newCourse.department}
                        onValueChange={(v) => setNewCourse({ ...newCourse, department: v })}
                      >
                        <SelectTrigger id="cDept">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Artificial Intelligence & Data Science">AI & DS</SelectItem>
                          <SelectItem value="Computer Science & Engineering">CSE</SelectItem>
                          <SelectItem value="Information Technology">IT</SelectItem>
                          <SelectItem value="Mechanical Engineering">Mechanical</SelectItem>
                          <SelectItem value="Civil Engineering">Civil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cSem">Semester</Label>
                      <Select
                        value={newCourse.semester}
                        onValueChange={(v) => setNewCourse({ ...newCourse, semester: v })}
                      >
                        <SelectTrigger id="cSem">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <SelectItem key={s} value={s.toString()}>
                              Semester {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="credits">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        min="1"
                        max="8"
                        value={newCourse.credits}
                        onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cType">Course Type</Label>
                      <Select
                        value={newCourse.is_lab ? 'lab' : 'theory'}
                        onValueChange={(v) => setNewCourse({ ...newCourse, is_lab: v === 'lab' })}
                      >
                        <SelectTrigger id="cType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="theory">Theory Course</SelectItem>
                          <SelectItem value="lab">Laboratory Session</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Register Course
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog for Role Modification */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Role Assignment</DialogTitle>
              <DialogDescription>
                Are you sure you want to change the role for{' '}
                <strong className="text-foreground">{selectedUser?.name}</strong> ({selectedUser?.email}) to{' '}
                <strong className="text-primary capitalize">{targetRole}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={executeRoleChange} className="bg-primary">
                Confirm & Apply Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
