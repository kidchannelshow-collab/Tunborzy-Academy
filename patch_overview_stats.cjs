const fs = require('fs');

let content = fs.readFileSync('src/components/admin/Overview.tsx', 'utf8');

// Update STATS logic
content = content.replace(
  `const STATS = [
    { title: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Total Students', value: stats.students.toString(), icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { title: 'Total Lecturers', value: stats.lecturers.toString(), icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Total Admins', value: stats.admins.toString(), icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Total Courses', value: stats.courses.toString(), icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { title: 'Total Subjects', value: stats.subjects.toString(), icon: BookOpen, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
    { title: 'Total Departments', value: stats.departments.toString(), icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { title: 'Active Users', value: stats.active.toString(), icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];`,
  `const STATS = [
    { title: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Total Students', value: stats.students.toString(), icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { title: 'Total Lecturers', value: stats.lecturers.toString(), icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Total Admins', value: stats.admins.toString(), icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Active Users', value: stats.active.toString(), icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Inactive Users', value: stats.inactive.toString(), icon: UserX, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { title: 'Total Courses', value: stats.courses.toString(), icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { title: 'Total Subjects', value: stats.subjects.toString(), icon: BookOpen, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
    { title: 'Total Faculties', value: stats.faculties.toString(), icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { title: 'Total Departments', value: stats.departments.toString(), icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];`
);

content = content.replace(
  `  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    lecturers: 0,
    admins: 0,
    active: 0,
    inactive: 0,
    courses: 0,
    subjects: 0,
    departments: 0
  });`,
  `  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    lecturers: 0,
    admins: 0,
    active: 0,
    inactive: 0,
    courses: 0,
    subjects: 0,
    faculties: 0,
    departments: 0
  });`
);

content = content.replace(
  `      const [
        { count: totalUsers },
        { count: students },
        { count: lecturers },
        { count: admins },
        { count: active },
        { count: inactive },
        { count: courses },
        { data: allProfiles }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Lecturer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['Admin', 'Super Admin']),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('status', ['Inactive', 'Suspended', 'Disabled']),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('department, course')
      ]);
      
      let uniqueDepartments = 0;
      let uniqueSubjects = 0;
      if (allProfiles) {
        uniqueDepartments = new Set(allProfiles.map(p => p.department).filter(Boolean)).size;
        uniqueSubjects = new Set(allProfiles.map(p => p.course).filter(Boolean)).size;
      }

      setStats({
        totalUsers: totalUsers || 0,
        students: students || 0,
        lecturers: lecturers || 0,
        admins: admins || 0,
        active: active || 0,
        inactive: inactive || 0,
        courses: courses || 0,
        departments: uniqueDepartments,
        subjects: uniqueSubjects
      });`,
  `      const [
        { count: totalUsers },
        { count: students },
        { count: lecturers },
        { count: admins },
        { count: active },
        { count: inactive },
        { count: courses },
        { count: subjects },
        { count: faculties },
        { count: departments }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Lecturer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['Admin', 'Super Admin']),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('status', ['Inactive', 'Suspended', 'Disabled']),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }).catch(() => ({count: 0})),
        supabase.from('faculties').select('*', { count: 'exact', head: true }).catch(() => ({count: 0})),
        supabase.from('departments').select('*', { count: 'exact', head: true }).catch(() => ({count: 0}))
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        students: students || 0,
        lecturers: lecturers || 0,
        admins: admins || 0,
        active: active || 0,
        inactive: inactive || 0,
        courses: courses || 0,
        subjects: subjects || 0,
        faculties: faculties || 0,
        departments: departments || 0
      });`
);

fs.writeFileSync('src/components/admin/Overview.tsx', content);
