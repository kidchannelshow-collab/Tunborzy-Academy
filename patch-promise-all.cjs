const fs = require('fs');

function patchFile(filename, target, replacement) {
  let content = fs.readFileSync(filename, 'utf8');
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filename, content);
    console.log(filename + ' patched with Promise.all');
  }
}

const targetPO = `        const { data: cbtAttempts } = await supabase
          .from('cbt_attempts')
          .select('score, total_questions')
          .eq('student_id', profile.id)
          .not('score', 'is', null);

        let cbtCount = 0;
        let cbtAvg = 0;

        if (cbtAttempts && cbtAttempts.length > 0) {
          cbtCount = cbtAttempts.length;
          let sum = 0;
          cbtAttempts.forEach(a => {
             if(a.total_questions > 0) {
                 sum += (a.score / a.total_questions) * 100;
             }
          });
          cbtAvg = Math.round(sum / cbtCount);
        }

        const { count: enrolledCount } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', profile.id);`;

const replacementPO = `        const [cbtRes, enrRes] = await Promise.all([
          supabase
            .from('cbt_attempts')
            .select('score, total_questions')
            .eq('student_id', profile.id)
            .not('score', 'is', null),
          supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', profile.id)
        ]);

        const cbtAttempts = cbtRes.data;
        const enrolledCount = enrRes.count;

        let cbtCount = 0;
        let cbtAvg = 0;

        if (cbtAttempts && cbtAttempts.length > 0) {
          cbtCount = cbtAttempts.length;
          let sum = 0;
          cbtAttempts.forEach(a => {
             if(a.total_questions > 0) {
                 sum += (a.score / a.total_questions) * 100;
             }
          });
          cbtAvg = Math.round(sum / cbtCount);
        }`;

patchFile('src/components/dashboard/ProgressOverview.tsx', targetPO, replacementPO);

const targetAA = `    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('target_role', profile.role)
          .order('created_at', { ascending: false })
          .limit(3);
        if (data) setAnnouncements(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('cbt_attempts')
          .select('*, cbt_exams(title)')
          .eq('student_id', profile.id)
          .order('started_at', { ascending: false })
          .limit(3);
          
        if (data) {
          const formatted = data.map(attempt => ({
             type: 'cbt',
             title: \`Attempted CBT: \${attempt.cbt_exams?.title || 'Unknown Exam'}\`,
             time: new Date(attempt.started_at).toLocaleDateString(),
             icon: PenTool,
             color: 'text-emerald-500',
             bg: 'bg-emerald-500/10'
          }));
          setActivities(formatted);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchAnnouncements();
    fetchActivities();`;
    
const replacementAA = `    const fetchData = async () => {
      try {
        const [annRes, actRes] = await Promise.all([
          supabase
            .from('announcements')
            .select('*')
            .eq('target_role', profile.role)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('cbt_attempts')
            .select('*, cbt_exams(title)')
            .eq('student_id', profile.id)
            .order('started_at', { ascending: false })
            .limit(3)
        ]);
        
        if (annRes.data) setAnnouncements(annRes.data);
        if (actRes.data) {
          const formatted = actRes.data.map(attempt => ({
             type: 'cbt',
             title: \`Attempted CBT: \${attempt.cbt_exams?.title || 'Unknown Exam'}\`,
             time: new Date(attempt.started_at).toLocaleDateString(),
             icon: PenTool,
             color: 'text-emerald-500',
             bg: 'bg-emerald-500/10'
          }));
          setActivities(formatted);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchData();`;

patchFile('src/components/dashboard/ActivityAndAnnouncements.tsx', targetAA, replacementAA);

