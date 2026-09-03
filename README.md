# ChronosDo Implementation Plan

Build a complete, responsive single-page web application named "ChronosDo" (a Notion-style Day Tracker & To-Do app). The app uses HTML, Tailwind CSS (via CDN), Lucide Icons (via CDN), and vanilla JavaScript. The application runs entirely in the browser, persisting all user data using `localStorage`.

## User Review Required

> [!IMPORTANT]
> Since everything is contained within a single `index.html` file, the file will be relatively large (HTML, CSS custom classes, and JavaScript all together). Is this single-file constraint strict, or would you prefer a separate `app.js` and `styles.css` if it gets too large?

> [!NOTE]
> Tailwind CSS via CDN is great for development, but for production, it dynamically generates styles on the fly. This might slightly impact initial load times compared to a built stylesheet, but perfectly matches the requirement for a browser-only, zero-build setup.

## Open Questions

> [!WARNING]
> How would you like the "custom daily trackers" to be handled in the Day & Habit Tracker block? Should users be able to dynamically add a new habit name which gets saved and re-rendered each day?

## Proposed Changes

We will create a single `index.html` file in the project directory.

### UI / Layout Layer
- **HTML Structure:** Semantic HTML (header, main, sections, footer) to organize the Notion-like layout.
- **Tailwind CSS Configuration:** We'll embed a script for Tailwind config to set custom colors (e.g., `#FBFBFB` for light mode background, `#191919` for dark slate) and fonts (Inter).
- **Lucide Icons:** Integrated via CDN scripts and initialized after DOM load or dynamic UI updates.
- **Dark Mode Support:** Utilizes Tailwind's `dark:` classes toggled via a class on the `<html>` element based on user preference, saved in localStorage.

### Components

1. **Workspace Header:**
   - App Title and Lucide icon.
   - Editable daily mood/quote (saves on blur).
   - Dynamic real-time clock and formatted current date.
   - Dark/light mode toggle switch.

2. **Progress Overview:**
   - Progress bar calculating `(completed_tasks / total_tasks) * 100`.
   - Stats summary: Total Tasks, Completed Tasks, Active Habits.

3. **To-Do List (Tasks Database):**
   - **Input:** Text field with select dropdowns for Tags (Work, Personal, Urgent) and Priority (High, Med, Low).
   - **List:** Rendered dynamic list. Each item has a checkbox (Notion style), title, tag, priority, and delete/edit buttons.
   - **Filters:** Buttons to filter view by All, Active, Completed, or Tags.

4. **Day & Habit Tracker:**
   - Grid layout of habits.
   - Each habit has a counter or checkbox.
   - Button to "Add Habit".

5. **Daily Notes:**
   - Auto-expanding `textarea`.
   - Debounced save to `localStorage` to emulate auto-saving.

### Data Layer (localStorage)
The app will define a state object that gets serialized to JSON and stored under the `chronosdo_state` key. 
```javascript
{
  theme: 'light' | 'dark',
  moodQuote: '...',
  tasks: [
    { id: 1, title: '...', completed: false, tag: 'Work', priority: 'High' }
  ],
  habits: [
    { id: 1, name: 'Deep Work', type: 'checkbox', completed: true },
    { id: 2, name: 'Hydration', type: 'counter', count: 3 }
  ],
  dailyNotes: '...'
}
```

### [ChronosDo]

#### [NEW] [index.html](file:///d:/Projects/ChronosDo/index.html)

## Verification Plan

### Manual Verification
- Open `index.html` in a web browser.
- Verify light/dark mode toggles and persists.
- Add, edit, complete, and delete tasks. Check progress bar updates.
- Toggle filters.
- Increment habits and add a new habit.
- Type in the daily notes.
- Refresh the page and ensure all data (tasks, habits, notes, theme, quote) persists correctly.
- Resize window to check responsiveness on mobile dimensions.
