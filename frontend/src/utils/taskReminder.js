// Task Update Reminder Utility
import { toast } from 'react-toastify';

export const scheduleTaskReminder = (tasks) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Check if it's 5:30 PM (17:30)
  if (currentHour === 17 && currentMinute >= 30 && currentMinute < 35) {
    const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS');
    
    if (inProgressTasks.length > 0) {
      const tasksNeedingUpdate = inProgressTasks.filter(task => {
        if (!task.dailyUpdates || task.dailyUpdates.length === 0) return true;
        const lastUpdate = new Date(task.dailyUpdates[task.dailyUpdates.length - 1].date);
        const today = new Date();
        // Check if last update was today
        return lastUpdate.toDateString() !== today.toDateString();
      });
      
      if (tasksNeedingUpdate.length > 0) {
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Daily Task Update Reminder', {
            body: `You have ${tasksNeedingUpdate.length} task${tasksNeedingUpdate.length > 1 ? 's' : ''} pending update today!`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'task-reminder',
            requireInteraction: true
          });
        }
        
        // Show toast notification
        toast.warning(
          `⏰ Daily Update Reminder: Please update ${tasksNeedingUpdate.length} task${tasksNeedingUpdate.length > 1 ? 's' : ''} before end of day!`,
          {
            position: 'top-center',
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            closeButton: true
          }
        );
        
        return true;
      }
    }
  }
  
  return false;
};

export const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};

export const checkDailyReminder = () => {
  const lastReminderDate = localStorage.getItem('lastTaskReminder');
  const today = new Date().toDateString();
  
  if (lastReminderDate !== today) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Show reminder at 5:30 PM or after (until 11 PM)
    if ((currentHour === 17 && currentMinute >= 30) || (currentHour > 17 && currentHour < 23)) {
      localStorage.setItem('lastTaskReminder', today);
      return true;
    }
  }
  
  return false;
};

export const isWorkingDay = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // 0 = Sunday, 6 = Saturday
  return dayOfWeek !== 0 && dayOfWeek !== 6;
};
