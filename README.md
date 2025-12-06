
# TrackR FrontEnd (React Native)

A mobile app for managing movie and series playlists, built with React Native (Expo) and connected to the TrackR Django REST API backend.

## 📱 Features
- User authentication (sign up, sign in, change password)
- Create, edit, and delete playlists
- Add/remove movies and series to playlists
- Change movie/series status (To Watch, Watched, Favorites, etc.)
- System lists for quick status management
- Custom feedback and toast notifications
- Bulk selection and actions
- Modern, scrollable UI

## 🛠 Tech Stack
- **React Native** (Expo managed workflow)
- **React Navigation**
- **Axios** (API calls)
- **AsyncStorage** (local persistence)
- **Custom hooks** for auth, toast, etc.

## 📁 Project Structure
```
Trackr_FrontEnd/
├── App.js
├── index.js
├── package.json
├── src/
│   ├── components/      # UI components
│   ├── hooks/           # Custom hooks (useAuth, useToast)
│   ├── screens/         # App screens (Home, Playlist, MovieDetail, etc.)
│   ├── services/        # API and business logic
│   ├── styles/          # Global styles
│   └── utils/           # Utility functions
└── assets/              # Images, icons, etc.
```

## 🚀 Getting Started
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the Expo development server:
   ```sh
   npx expo start
   ```
3. Make sure the TrackR backend is running (see backend README for setup and API endpoints).

## 🔗 API Integration
- All API calls are made to the Django backend (see `/src/services/api.js`).
- Update the `BASE_URL` in `api.js` if your backend runs on a different address.

## 📝 Notes
- For password change, only a toast notification is shown after success (no loading overlay).
- System lists guarantee only one instance of a movie/series per status.
- UI is optimized for mobile experience.

## 🏃 Local Development Reference
- See the backend README for virtual environment setup, dependency installation, and API endpoint documentation.

## 📄 License
This project is for educational purposes (C-PEITEL1 Final Project).