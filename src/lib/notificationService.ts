import { supabase } from '../supabaseClient';

export interface NotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'assignment' | 'course' | 'announcement' | 'result' | 'cbt' | 'ai' | 'chat' | 'system' | 'admin' | 'lecturer' | 'student';
  link?: string;
}

export const notificationService = {
  async notifyUser(params: NotificationParams) {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link || null
      });
      if (error) console.error('Error inserting notification:', error);
    } catch (err) {
      console.error('Notification error:', err);
    }
  },

  async notifyRole(role: string, title: string, message: string, type: NotificationParams['type'], link?: string) {
    try {
      // Get all users with the role
      const { data: users } = await supabase.from('profiles').select('id').eq('role', role);
      if (users && users.length > 0) {
        const notifications = users.map(u => ({
          user_id: u.id,
          title,
          message,
          type,
          link: link || null
        }));
        await supabase.from('notifications').insert(notifications);
      }
    } catch (err) {
      console.error('Role notification error:', err);
    }
  },

  async notifyCourseStudents(courseId: string, title: string, message: string, type: NotificationParams['type'], link?: string) {
    try {
      const { data: enrollments } = await supabase.from('course_enrollments').select('student_id').eq('course_id', courseId);
      if (enrollments && enrollments.length > 0) {
        const notifications = enrollments.map(e => ({
          user_id: e.student_id,
          title,
          message,
          type,
          link: link || null
        }));
        await supabase.from('notifications').insert(notifications);
      }
    } catch (err) {
      console.error('Course notification error:', err);
    }
  }
};
