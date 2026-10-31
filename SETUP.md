# PassOn setup (Firebase)

PassOn uses Firebase for login and for the data every user shares (items, requests, chat, ratings). The free Spark plan is enough. You do not need to add a card.

## 1. Create the project

1. Open https://console.firebase.google.com and sign in with your Google account.
2. Add project. Name it `passon-g13`. Turn Google Analytics off. Create.

## 2. Turn on login

1. Build, then Authentication, then Get started.
2. Sign-in method tab, choose Email/Password, switch Enable on, Save. Leave "Email link" off.
3. Settings tab, then Authorized domains, then Add domain: `swaraj779.github.io`.

New accounts must open the verification link that Firebase emails them before they can post, request or chat. This stops fake email addresses.

## 3. Create the database and rules

1. Build, then Firestore Database, then Create database.
2. Choose a location close to you (for example `asia-south1`, Mumbai) and start in production mode.
3. Open the Rules tab, replace everything with the rules below, then Publish.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function verified() { return signedIn() && request.auth.token.email_verified == true; }
    function isAdmin() {
      return verified() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /admins/{uid} {
      allow read: if signedIn() && request.auth.uid == uid;
      allow write: if false;
    }

    match /users/{uid} {
      allow read: if true;
      allow create: if verified() && request.auth.uid == uid;
      allow update: if verified() && (
        request.auth.uid == uid ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['ratingSum', 'ratingCount'])
      );
    }

    match /items/{id} {
      allow read: if true;
      allow create: if verified() && request.resource.data.ownerId == request.auth.uid;
      allow update: if verified() && resource.data.ownerId == request.auth.uid;
      allow delete: if verified() && (resource.data.ownerId == request.auth.uid || isAdmin());
    }

    match /requests/{id} {
      allow read: if signedIn() && (resource.data.requesterId == request.auth.uid || resource.data.ownerId == request.auth.uid);
      allow create: if verified() && request.resource.data.requesterId == request.auth.uid;
      allow update: if verified() && (
        resource.data.ownerId == request.auth.uid ||
        (resource.data.requesterId == request.auth.uid &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['score']))
      );
    }

    match /threads/{id} {
      allow read: if signedIn() && request.auth.uid in resource.data.participants;
      allow create: if verified() && request.auth.uid in request.resource.data.participants;
      allow update: if verified() && request.auth.uid in resource.data.participants;

      match /messages/{mid} {
        allow read: if signedIn() &&
          request.auth.uid in get(/databases/$(database)/documents/threads/$(id)).data.participants;
        allow create: if verified() &&
          request.resource.data.from == request.auth.uid &&
          request.auth.uid in get(/databases/$(database)/documents/threads/$(id)).data.participants;
      }
    }

    match /ngoOffers/{id} {
      allow create: if verified() && request.resource.data.ownerId == request.auth.uid;
      allow read: if signedIn() && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

## 4. Connect the app

1. Project settings (gear icon), General tab, scroll to Your apps, click the web icon `</>`.
2. Register the app with any name. Skip hosting.
3. Copy `apiKey`, `authDomain`, `projectId` and `appId` into `firebase-config.js`.

These values identify your project. They are not passwords. The rules above decide who can read and write.

## 5. Make yourself admin

An admin can remove any listing. There is no master password in the code, because anyone can read the code of a public website. Admin status is a record in the database that only you can create.

1. On the site, sign up with your own email and open the verification link.
2. Firebase console, Authentication, Users tab. Copy the User UID on your row.
3. Firestore Database, Data tab, Start collection. Collection ID: `admins`.
4. Document ID: paste your UID. Add one field: name `role`, type string, value `admin`. Save.
5. Reload the site. You see an Admin tag at the top. Open any item and tap "Remove listing (admin)".

To add another admin, create one more document in `admins` with that person's UID. To remove an admin, delete their document. As project owner you can also delete anything directly in the Firebase console.

## 6. Put it online

Upload all files to the GitHub repository (Add file, Upload files). Files with the same name are replaced. Pages updates in about a minute.

## 7. Install on a phone

- Android Chrome: tap Install app in the banner, or open the browser menu and choose Install app or Add to Home screen.
- iPhone Safari: Share, then Add to Home Screen.

The app opens full screen from the home screen like a normal app.

## Notes

- Photos are shrunk in the browser and saved inside the item record, so Firebase Storage is not needed.
- Email verification uses a link, not a one-time code. Firebase has no free email-code login. SMS codes need a paid Firebase plan.
- NGO offers are only saved. No real organisation is contacted.
