# Goal Tracker

<p align="center">
  <img src="assets/images/icon.png" alt="Goal Tracker app icon" width="160" />
</p>

Minimal, offline-first goal and habit tracker for Android and iOS. Create recurring goals, log progress in a few taps, and use streaks and statistics to stay consistent.

[Report a bug](https://github.com/toprakpt1/scopus/issues/new) · [Request a feature](https://github.com/toprakpt1/scopus/issues/new)

## Table of Contents

- [About the Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Privacy](#privacy)
- [License](#license)
- [Contact](#contact)

## About the Project

Goal Tracker is a calm, focused mobile app for turning intentions into repeatable routines. It helps you build consistency by making your goals visible, measurable, and easy to complete every day.

Create trackers for the things you want to improve, such as reading, exercise, water intake, or learning a new skill. Each tracker can contain check-based or numeric goals with daily, weekly, monthly, or yearly targets. Log progress from the Today screen, follow your current and best streaks, and use Stats to understand how consistently you are moving forward.

Goal Tracker is designed for people who want a simple productivity tool without unnecessary distractions. There are no accounts or subscription walls: your goals, logs, settings, and statistics stay on your device using SQLite. The app works offline, and reminders are optional so you stay in control of your routine and notifications.

### Built With

- [Expo](https://expo.dev) SDK 58
- [React Native](https://reactnative.dev) 0.88
- [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation
- [TypeScript](https://www.typescriptlang.org/)
- [Expo SQLite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/) for local persistence
- [Zustand](https://zustand.docs.pmnd.rs/) for lightweight state management
- [Lucide React Native](https://lucide.dev/) and Expo vector icons

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm
- An Android emulator, iOS simulator, physical device, or [Expo Go](https://expo.dev/go)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/toprakpt1/scopus.git
   cd scopus
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npx expo start
   ```

4. Open the app in Expo Go, an Android emulator, an iOS simulator, or a development build.

For local native builds, use the Expo workflow for your platform. Native `ios/` and `android/` directories are generated as needed and are not maintained manually in this repository.

## Features

- Goal dashboard with daily momentum and completion progress
- Custom trackers with names, units, icons, colors, and default increments
- Check-based goals and numeric goals
- Daily, weekly, monthly, and yearly targets
- Scoped goals with start and end dates
- Quick logging with undo support
- Streak tracking with current and best streaks
- Statistics for tracked goals and completed periods
- Optional reminders and notification scheduling
- Configurable week start and appearance preferences
- Fully offline local data storage with SQLite
- Turkish and English interface strings

## Usage

1. Open the **Goals** tab and create a tracker or choose an existing one.
2. Add a check-based or numeric goal and select its target period.
3. Use the **Today** tab to mark a check goal complete or quickly add numeric progress.
4. Open a goal to review its progress and logging history.
5. Visit **Stats** to see completion totals, current streaks, and best streaks.
6. Configure week start, reminders, and other preferences in **Settings**.

## Project Structure

```text
src/
├── app/          # Expo Router screens and layouts
├── components/   # Reusable mobile UI components
├── db/           # SQLite schema, migrations, queries, and repositories
├── domain/       # Goal periods, progress, and streak calculations
├── hooks/        # Data and settings hooks
├── lib/          # Notifications, formatting, and app utilities
├── store/        # Local application state
└── theme/        # Colors, typography, spacing, and theme helpers
```

## Testing

Run the test suite:

```bash
npm test
```

Run the quality checks used during development:

```bash
npm run lint
npm run typecheck
```

The test suite includes domain logic for progress, streaks, periods, scoped goals, and daylight-saving-time boundaries.

## Roadmap

- [x] Goal and tracker management
- [x] Daily, weekly, monthly, and yearly goals
- [x] Quick progress logging and undo
- [x] Streak and statistics views
- [x] Local notifications and reminders
- [x] Offline-first SQLite storage
- [ ] Data export and import
- [ ] Home-screen widgets
- [ ] More customization options

Suggestions and known issues are welcome in [GitHub Issues](https://github.com/toprakpt1/scopus/issues).

## Contributing

Contributions are welcome. To propose a change:

1. Fork the project.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push the branch (`git push origin feature/AmazingFeature`).
5. Open a pull request.

Please run `npm run lint` and `npm run typecheck` before submitting a pull request.

## Privacy

Goal Tracker is designed to keep your data on your device:

- Goal data, logs, settings, and statistics are stored locally.
- Core functionality does not require an internet connection.
- Notifications are optional and can be disabled in Settings.
- The project does not include analytics, advertising, or tracking services.

## License

This project is distributed under the [GNU General Public License v3.0](LICENSE).

## Contact

Toprak Talha Karcılar — [@toprakpt1](https://github.com/toprakpt1)

Project link: [https://github.com/toprakpt1/scopus](https://github.com/toprakpt1/scopus)
