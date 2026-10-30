# PassOn setup (Firebase)

PassOn uses Firebase for login and for the data every user shares (items, requests, chat, ratings). The free Spark plan is enough. You do not need to add a card.

## 1. Create the project

1. Open https://console.firebase.google.com and sign in with your Google account.
2. Add project. Name it `passon-g13`. Turn Google Analytics off. Create.

## 2. Turn on login

1. Build, then Authentication, then Get started.
2. Sign-in method tab, choose Email/Password, switch Enable on, Save.
3. Settings tab, then Authorized domains, then Add domain: `swaraj779.github.io`.

## 3. Create the database

1. Build, then Firestore Database, then Create database.
2. Choose a location close to you (for example `asia-south1`, Mumbai) and start in production mode.
3. Open the Rules tab, replace everything with the rules below, then Publish.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }

    match /users/{uid} {
      allow read: if true;
      allow create: if signedIn() && request.auth.uid == uid;
      allow update: if signedIn() && (
        request.auth.uid == uid ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['ratingSum', 'ratingCount'])
      );
    }

    match /items/{id} {
      allow read: if true;
      allow create: if signedIn() && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if signedIn() && resource.data.ownerId == request.auth.uid;
    }

    match /requests/{id} {
      allow read: if signedIn() && (resource.data.requesterId == request.auth.uid || resource.data.ownerId == request.auth.uid);
      allow create: if signedIn() && request.resource.data.requesterId == request.auth.uid;
      allow update: if signedIn() && (
        resource.data.ownerId == request.auth.uid ||
        (resource.data.requesterId == request.auth.uid &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['score']))
      );
    }

    match /threads/{id} {
      allow read: if signedIn() && request.auth.uid in resource.data.participants;
      allow create: if signedIn() && request.auth.uid in request.resource.data.participants;
      allow update: if signedIn() && request.auth.uid in resource.data.participants;

      match /messages/{mid} {
        allow read: if signedIn() &&
          request.auth.uid in get(/databases/$(database)/documents/threads/$(id)).data.participants;
        allow create: if signedIn() &&
          request.resource.data.from == request.auth.uid &&
          request.auth.uid in get(/databases/$(database)/documents/threads/$(id)).data.participants;
      }
    }

    match /ngoOffers/{id} {
      allow create: if signedIn() && request.resource.data.ownerId == request.auth.uid;
      allow read: if signedIn() && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

## 4. Connect the app

1. Project settings (gear icon), General tab, scroll to Your apps, click the web icon `</>`.
2. Register the app with any name. Skip hosting.
3. Copy the values `apiKey`, `authDomain`, `projectId` and `appId` from the config shown.
4. Paste them into `firebase-config.js`, replacing the `PASTE_...` text.

These values identify your project. They are not passwords. The rules above decide who can read and write.

## 5. Put it online

Upload all files to the GitHub repository again (Add file, Upload files). Files with the same name are replaced. `firebase-config.js` and `SETUP.md` are new. Pages updates in about a minute.

## Notes

- Photos are shrunk in the browser and saved inside the item record, so Firebase Storage is not needed.
- The first account you create is a normal user. There is no admin screen.
- NGO offers are only saved. No real organisation is contacted.
