
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { BookOpen, Plus, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [students, setStudents] = useState<Tables<'profiles'>[]>([]);
  const [courses, setCourses] = useState<Tables<'courses'>[]>([]);

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    avgCGPA: 0,
  });

  const [newCourse, setNewCourse] = useState({
    semester: '1',
    department: 'AI & DS',
    course_code: '',
    course_name: '',
    credits: '3',
    is_lab: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch students
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setStudents(studentsData || []);

    // Fetch courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .order('semester', { ascending: true });

    setCourses(coursesData || []);

    // Calculate statistics
    const { data: predictions } = await supabase
      .from('predictions')
      .select('predicted_cgpa');

    const avgCGPA =
      predictions && predictions.length > 0
        ? predictions.reduce(
            (sum, prediction) =>
              sum + (prediction.predicted_cgpa || 0),
            0
          ) / predictions.length
        : 0;

    setStats({
      totalStudents: studentsData?.length || 0,
      totalCourses: coursesData?.length || 0,
      avgCGPA,
    });
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('courses').insert([
      {
        semester: parseInt(newCourse.semester),
        department: newCourse.department,
        course_code: newCourse.course_code,
        course_name: newCourse.course_name,
        credits: parseInt(newCourse.credits),
        is_lab: newCourse.is_lab,
      },
    ]);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Course added successfully!',
      });

      setNewCourse({
        semester: '1',
        department: 'AI & DS',
        course_code: '',
        course_name: '',
        credits: '3',
        is_lab: false,
      });

      fetchData();
    }
  };

  const makeAdmin = async (userId: string) => {
    const { error } = await supabase.from('user_roles').insert([
      {
        user_id: userId,
        role: 'admin',
      },
    ]);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Admin role granted!',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />

      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold gradient-text mb-8">
          Admin Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalStudents}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Courses
              </CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalCourses}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Average CGPA
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgCGPA.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="add-course">Add Course</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>All Students</CardTitle>
                <CardDescription>
                  Manage student accounts and permissions
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.department}</TableCell>
                        <TableCell>{student.semester}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => makeAdmin(student.user_id)}
                          >
                            Make Admin
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>All Courses</CardTitle>
                <CardDescription>
                  View all courses across departments
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-mono">
                          {course.course_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {course.course_name}
                        </TableCell>
                        <TableCell>{course.department}</TableCell>
                        <TableCell>{course.semester}</TableCell>
                        <TableCell>{course.credits}</TableCell>
                        <TableCell>
                          {course.is_lab ? 'Lab' : 'Theory'}
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
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Course
                </CardTitle>
                <CardDescription>
                  Register a new course in the system
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>

                      <Select
                        value={newCourse.semester}
                        onValueChange={(v) =>
                          setNewCourse({ ...newCourse, semester: v })
                        }
                      >
                        <SelectTrigger id="semester">
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

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>

                      <Select
                        value={newCourse.department}
                        onValueChange={(v) =>
                          setNewCourse({ ...newCourse, department: v })
                        }
                      >
                        <SelectTrigger id="department">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="AI & DS">AI & DS</SelectItem>
                          <SelectItem value="Information Technology">
                            Information Technology
                          </SelectItem>
                          <SelectItem value="Automobile Engineering">
                            Automobile Engineering
                          </SelectItem>
                          <SelectItem value="Civil Engineering">
                            Civil Engineering
                          </SelectItem>
                          <SelectItem value="Mechanical Engineering">
                            Mechanical Engineering
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course_code">Course Code</Label>
                    <Input
                      id="course_code"
                      value={newCourse.course_code}
                      onChange={(e) =>
                        setNewCourse({
                          ...newCourse,
                          course_code: e.target.value,
                        })
                      }
                      placeholder="e.g., CS101"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course_name">Course Name</Label>
                    <Input
                      id="course_name"
                      value={newCourse.course_name}
                      onChange={(e) =>
                        setNewCourse({
                          ...newCourse,
                          course_name: e.target.value,
                        })
                      }
                      placeholder="e.g., Data Structures"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="credits">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        min="1"
                        max="10"
                        value={newCourse.credits}
                        onChange={(e) =>
                          setNewCourse({
                            ...newCourse,
                            credits: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>

                      <Select
                        value={newCourse.is_lab ? 'lab' : 'theory'}
                        onValueChange={(v) =>
                          setNewCourse({
                            ...newCourse,
                            is_lab: v === 'lab',
                          })
                        }
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="theory">Theory</SelectItem>
                          <SelectItem value="lab">Lab</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
