# Firestore Database Design

This document outlines the Firestore database schema for the Run-Development web application. The design is user-centric, scalable, and includes security rules to protect user data.

### High-Level Structure

```
/users/{userId}
  /activities/{activityId}
  /progress/{progressId}

/plans/{planId}

/events/{eventId}
  /attendees/{userId}
```

---

### 1. Users Collection

This is the main collection to store user profile data. The document ID for each user should be their `uid` from Firebase Authentication for easy and secure lookups.

**Collection:** `users`

**Document ID:** `{userId}` (Corresponds to Firebase Auth UID)

**Sample Document:**
```json
{
  "email": "user@example.com",
  "displayName": "Alex Doe",
  "photoURL": "https://example.com/profile.jpg",
  "dateOfBirth": "1990-05-15",
  "height": 180,
  "weight": 75,
  "runningGoals": ["Run a half-marathon", "Improve 5k time"],
  "currentPlanId": "plan_beginner_5k",
  "createdAt": "2024-09-15T10:00:00Z"
}
```

---

### 2. Activities Subcollection

A subcollection within each user document to store their individual workouts (runs, walks, etc.). This one-to-many relationship allows for efficient querying of a user's activity history.

**Collection:** `users/{userId}/activities`

**Document ID:** `{activityId}` (Auto-generated)

**Sample Document:**
```json
{
  "date": "2024-09-14T18:30:00Z",
  "type": "run",
  "distance": 5.2,
  "duration": 1800,
  "caloriesBurned": 450,
  "notes": "Felt great today, steady pace."
}
```

---

### 3. Progress Subcollection

A subcollection to store periodic (e.g., weekly, monthly) fitness summaries. This is useful for efficiently visualizing trends on a dashboard without needing to re-aggregate data from the entire `activities` collection every time.

**Collection:** `users/{userId}/progress`

**Document ID:** `{progressId}` (e.g., `2024-week-37`)

**Sample Document:**
```json
{
  "startDate": "2024-09-09T00:00:00Z",
  "endDate": "2024-09-15T23:59:59Z",
  "totalDistance": 25.5,
  "totalDuration": 7200,
  "avgPace": 282
}
```

---

### 4. Plans Collection

A top-level collection for the various running plans the app offers. This allows plans to be added or updated without a new code deployment.

**Collection:** `plans`

**Document ID:** `{planId}` (e.g., `plan_beginner_5k`)

**Sample Document:**
```json
{
  "name": "Beginner's 5k Plan",
  "description": "A 6-week plan to get you ready for your first 5k race.",
  "durationWeeks": 6,
  "level": "beginner"
}
```

---

### Firestore Security Rules

The following security rules should be placed in your `firestore.rules` file to protect the database.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read and write their own profile data.
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }

    // Users can only manage their own subcollection data (activities, progress).
    match /users/{userId}/{subcollection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // All authenticated users can read plans and events.
    match /plans/{planId} {
      allow read: if request.auth != null;
    }

    match /events/{eventId} {
        allow read: if request.auth != null;
    }

    // Users can register for an event by creating a document with their own UID.
    match /events/{eventId}/attendees/{userId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```