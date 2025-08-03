import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

interface MoodEntry {
  date: string;
  mood: string;
  note?: string;
}

interface CalendarDate {
  day: number;
  mood?: string;
  note?: string;
  fullDate?: string;
}

interface WeeklyDataPoint {
  day: string;
  score: number;
  emoji: string;
  color: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('bounce', [
      transition(':enter', [
        animate('600ms ease-in-out', keyframes([
          style({ transform: 'scale(0)', offset: 0 }),
          style({ transform: 'scale(1.2)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  title = 'enhanced-mood-journal';
  selectedMood: string | null = null;
  currentNote: string = '';
  showConfirmation: boolean = false;
  isDarkTheme: boolean = false;
  selectedDate: CalendarDate | null = null;
  isEditMode: boolean = false;
  editingMood: string | null = null;
  editingNote: string = '';

  moods = [
    { key: 'ecstatic', emoji: '🤩', label: 'Ecstatic' },
    { key: 'happy', emoji: '😄', label: 'Happy' },
    { key: 'grateful', emoji: '🙏', label: 'Grateful' },
    { key: 'calm', emoji: '😌', label: 'Calm' },
    { key: 'neutral', emoji: '😐', label: 'Neutral' },
    { key: 'tired', emoji: '😴', label: 'Tired' },
    { key: 'anxious', emoji: '😰', label: 'Anxious' },
    { key: 'sad', emoji: '😢', label: 'Sad' },
    { key: 'angry', emoji: '😠', label: 'Angry' },
    { key: 'stressed', emoji: '😫', label: 'Stressed' }
  ];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  currentMonthName = '';
  currentYear = 0;
  currentMonth = 0;
  calendarDates: CalendarDate[] = [];
  weeklyData: WeeklyDataPoint[] = [];

  ngOnInit(): void {
    this.loadTheme();
    this.generateCalendar();
    this.loadMoodData();
    this.generateWeeklyTrends();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('darkTheme', JSON.stringify(this.isDarkTheme));
    }
    // Apply theme to document body
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  loadTheme(): void {
    if (typeof Storage !== 'undefined') {
      const savedTheme = localStorage.getItem('darkTheme');
      this.isDarkTheme = savedTheme ? JSON.parse(savedTheme) : false;
    }
    // Apply theme to document body on load
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  selectMood(mood: string): void {
    this.selectedMood = mood;
  }

  saveMoodEntry(): void {
    if (!this.selectedMood) return;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const newEntry: MoodEntry = {
      date: todayStr,
      mood: this.selectedMood,
      note: this.currentNote.trim() || undefined
    };

    if (typeof Storage !== 'undefined') {
      const savedData = localStorage.getItem('moodEntries');
      let moodEntries: MoodEntry[] = savedData ? JSON.parse(savedData) : [];

      const index = moodEntries.findIndex(entry => entry.date === todayStr);

      if (index !== -1) {
        moodEntries[index] = newEntry;
      } else {
        moodEntries.push(newEntry);
      }

      localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
    }
    
    this.showConfirmation = true;
    setTimeout(() => {
      this.showConfirmation = false;
    }, 3000);

    this.loadMoodData();
    this.generateWeeklyTrends();
    this.currentNote = '';
    this.selectedMood = null;
  }

  previousMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
    this.loadMoodData();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
    this.loadMoodData();
  }

  generateCalendar(): void {
    const today = new Date();
    const year = this.currentYear || today.getFullYear();
    const month = this.currentMonth !== undefined ? this.currentMonth : today.getMonth();

    this.currentYear = year;
    this.currentMonth = month;
    this.currentMonthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    const firstDayOfMonth = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = firstDayOfMonth.getDay();

    this.calendarDates = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      this.calendarDates.push({ day: 0 });
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      this.calendarDates.push({ day, fullDate });
    }
  }

  loadMoodData(): void {
    if (typeof Storage === 'undefined') return;
    
    const savedData = localStorage.getItem('moodEntries');
    if (!savedData) return;

    const moodEntries: MoodEntry[] = JSON.parse(savedData);
    const moodMap: { [date: string]: MoodEntry } = {};

    moodEntries.forEach(entry => {
      moodMap[entry.date] = entry;
    });

    this.calendarDates = this.calendarDates.map(dateObj => {
      if (dateObj.day === 0 || !dateObj.fullDate) return dateObj;

      const entry = moodMap[dateObj.fullDate];
      return {
        ...dateObj,
        mood: entry?.mood,
        note: entry?.note
      };
    });
  }

  generateWeeklyTrends(): void {
    if (typeof Storage === 'undefined') {
      this.weeklyData = [];
      return;
    }

    const savedData = localStorage.getItem('moodEntries');
    if (!savedData) {
      this.weeklyData = [];
      return;
    }

    const moodEntries: MoodEntry[] = JSON.parse(savedData);
    const today = new Date();
    const weekData: WeeklyDataPoint[] = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en', { weekday: 'short' });

      const entry = moodEntries.find(e => e.date === dateStr);
      const moodScore = this.getMoodScore(entry?.mood);
      
      weekData.push({
        day: dayName,
        score: moodScore,
        emoji: entry?.mood ? this.getEmoji(entry.mood) : '',
        color: this.getMoodColor(entry?.mood)
      });
    }

    this.weeklyData = weekData;
  }

  getMoodScore(mood?: string): number {
    const scores: { [key: string]: number } = {
      'ecstatic': 5, 'happy': 4, 'grateful': 4, 'calm': 3.5,
      'neutral': 3, 'tired': 2.5, 'anxious': 2, 'sad': 1.5,
      'angry': 1, 'stressed': 1
    };
    return mood ? scores[mood] || 3 : 0;
  }

  getMoodColor(mood?: string): string {
    const colors: { [key: string]: string } = {
      'ecstatic': '#ff6b9d', 'happy': '#4ecdc4', 'grateful': '#45b7d1',
      'calm': '#96ceb4', 'neutral': '#bdc3c7', 'tired': '#f4d03f',
      'anxious': '#f39c12', 'sad': '#85c1e9', 'angry': '#e74c3c',
      'stressed': '#8e44ad'
    };
    return mood ? colors[mood] || '#bdc3c7' : '#ecf0f1';
  }

  isToday(date: CalendarDate): boolean {
    if (date.day === 0 || !date.fullDate) return false;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return date.fullDate === todayStr;
  }

  openDateDetails(date: CalendarDate): void {
    if (date.day === 0) return;
    this.selectedDate = date;
    this.isEditMode = false;
    this.editingMood = null;
    this.editingNote = '';
  }

  closeModal(): void {
    this.selectedDate = null;
    this.isEditMode = false;
    this.editingMood = null;
    this.editingNote = '';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getMoodLabel(moodKey: string): string {
    const mood = this.moods.find(m => m.key === moodKey);
    return mood ? mood.label : moodKey;
  }

  // Fixed edit functionality
  editMoodForDate(): void {
    if (!this.selectedDate) return;
    
    this.isEditMode = true;
    this.editingMood = this.selectedDate.mood || null;
    this.editingNote = this.selectedDate.note || '';
  }

  selectEditMood(mood: string): void {
    this.editingMood = mood;
  }

  saveEditedMood(): void {
    if (!this.selectedDate?.fullDate || !this.editingMood) return;

    const newEntry: MoodEntry = {
      date: this.selectedDate.fullDate,
      mood: this.editingMood,
      note: this.editingNote.trim() || undefined
    };

    if (typeof Storage !== 'undefined') {
      const savedData = localStorage.getItem('moodEntries');
      let moodEntries: MoodEntry[] = savedData ? JSON.parse(savedData) : [];

      const index = moodEntries.findIndex(entry => entry.date === this.selectedDate!.fullDate);

      if (index !== -1) {
        moodEntries[index] = newEntry;
      } else {
        moodEntries.push(newEntry);
      }

      localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
    }
    
    this.loadMoodData();
    this.generateWeeklyTrends();
    this.closeModal();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.editingMood = null;
    this.editingNote = '';
  }

  deleteMoodEntry(): void {
    if (!this.selectedDate?.fullDate) return;

    if (!confirm('Are you sure you want to delete this mood entry?')) {
      return;
    }

    if (typeof Storage !== 'undefined') {
      const savedData = localStorage.getItem('moodEntries');
      if (savedData) {
        let moodEntries: MoodEntry[] = JSON.parse(savedData);
        moodEntries = moodEntries.filter(entry => entry.date !== this.selectedDate!.fullDate);
        localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
      }
    }
    
    this.loadMoodData();
    this.generateWeeklyTrends();
    this.closeModal();
  }

  setMoodForDate(mood: string): void {
    if (!this.selectedDate?.fullDate) return;

    const newEntry: MoodEntry = {
      date: this.selectedDate.fullDate,
      mood: mood
    };

    if (typeof Storage !== 'undefined') {
      const savedData = localStorage.getItem('moodEntries');
      let moodEntries: MoodEntry[] = savedData ? JSON.parse(savedData) : [];

      const index = moodEntries.findIndex(entry => entry.date === this.selectedDate!.fullDate);

      if (index !== -1) {
        moodEntries[index] = newEntry;
      } else {
        moodEntries.push(newEntry);
      }

      localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
    }
    
    this.loadMoodData();
    this.generateWeeklyTrends();
    this.closeModal();
  }

  showMoodHistory(): void {
    if (typeof Storage === 'undefined') {
      alert("Local storage not available 🥺");
      return;
    }

    const savedData = localStorage.getItem('moodEntries');
    if (!savedData) {
      alert("No mood history found 🥺");
      return;
    }

    const moodEntries: MoodEntry[] = JSON.parse(savedData);
    let message = '🗓️ Your Mood History:\n\n';

    moodEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .forEach(entry => {
        const emoji = this.getEmoji(entry.mood);
        const label = this.getMoodLabel(entry.mood);
        message += `📅 ${entry.date} — ${emoji} ${label}\n`;
        if (entry.note) {
          message += `   💭 ${entry.note}\n`;
        }
        message += '\n';
      });

    alert(message);
  }

  getEmoji(mood: string): string {
    const moodObj = this.moods.find(m => m.key === mood);
    return moodObj ? moodObj.emoji : '';
  }
}