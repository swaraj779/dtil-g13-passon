# PassOn setup (Firebase)

PassOn uses Firebase for login and for the data every user shares (items, requests, chat, seller ratings, NGO directory). The free Spark plan is enough. You do not need to add a card.

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
    // A seller's rating can change only together with a real, unrated, picked-up request
    // of that seller, written by the buyer in the same transaction.
    function rateOk(uid) {
      let rid = request.resource.data.lastReq;
      let before = get(/databases/$(database)/documents/requests/$(rid)).data;
      let after = getAfter(/databases/$(database)/documents/requests/$(rid)).data;
      return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['ratingSum', 'ratingCount', 'lastReq'])
        && before.get('score', 0) == 0
        && after.get('score', 0) is int
        && after.get('score', 0) >= 1 && after.get('score', 0) <= 5
        && after.ownerId == uid
        && after.requesterId == request.auth.uid
        && after.status == 'picked'
        && request.resource.data.ratingSum == resource.data.ratingSum + after.score
        && request.resource.data.ratingCount == resource.data.ratingCount + 1;
    }

    match /admins/{uid} {
      allow read: if signedIn() && request.auth.uid == uid;
      allow write: if false;
    }

    // Old collection that held emails. Closed now. Delete it from the console.
    match /users/{uid} {
      allow read, write: if false;
    }

    // Public seller profile: name and rating only, no email.
    match /profiles/{uid} {
      allow read: if true;
      allow create: if verified() && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['name', 'ratingSum', 'ratingCount', 'createdAt'])
        && request.resource.data.ratingSum == 0
        && request.resource.data.ratingCount == 0;
      allow update: if verified() && (
        (request.auth.uid == uid && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name']))
        || rateOk(uid)
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
      allow create: if verified() && request.resource.data.requesterId == request.auth.uid
        && request.resource.data.ownerId != request.auth.uid;
      allow update: if verified() && (
        (resource.data.ownerId == request.auth.uid &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])) ||
        (resource.data.requesterId == request.auth.uid &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['score']) &&
         resource.data.status == 'picked' &&
         resource.data.get('score', 0) == 0 &&
         request.resource.data.score is int &&
         request.resource.data.score >= 1 && request.resource.data.score <= 5)
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

    // NGO directory. Everyone sees approved NGOs. Owner sees their own. Admin sees all.
    // Document id is the owner's uid, so one application per account.
    match /ngos/{id} {
      allow get: if resource == null || resource.data.status == 'approved'
        || (signedIn() && resource.data.ownerId == request.auth.uid) || isAdmin();
      allow list: if resource.data.status == 'approved'
        || (signedIn() && resource.data.ownerId == request.auth.uid) || isAdmin();
      allow create: if verified() && request.auth.uid == id
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.status == 'pending'
        && existsAfter(/databases/$(database)/documents/ngoProofs/$(id));
      allow update: if isAdmin()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'reviewedAt']);
      allow delete: if verified() && (resource.data.ownerId == request.auth.uid || isAdmin());
    }

    // Proof photo and ID number: only the NGO owner and the admin can read.
    match /ngoProofs/{id} {
      allow read: if signedIn() && (resource.data.ownerId == request.auth.uid || isAdmin());
      allow create: if verified() && request.auth.uid == id
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.proof is string
        && request.resource.data.proof.size() > 100;
      allow delete: if verified() && (resource.data.ownerId == request.auth.uid || isAdmin());
    }

    match /ngoOffers/{id} {
      allow create: if verified() && request.resource.data.ownerId == request.auth.uid
        && get(/databases/$(database)/documents/ngos/$(request.resource.data.ngoOwnerId)).data.status == 'approved';
      allow read: if signedIn() && (resource.data.ownerId == request.auth.uid || resource.data.ngoOwnerId == request.auth.uid);
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

## 7. Seller ratings and NGO list

- Buyers rate a seller from 1 to 5 after pickup. Browse shows best-rated sellers first. Sellers with at least 2 ratings and an average below 3 are moved to the bottom under a divider, and their cards and item pages carry a warning.
- Ranking uses a smoothed score, so one 5 star from a single person does not beat a seller with many good ratings. New sellers sit in the middle.
- The NGO list tab shows only approved NGOs. An NGO registers with its name, area, contact, categories, proof type, ID number and a photo of the certificate. The proof is stored in `ngoProofs`, readable only by that NGO and the admin.
- As admin, open the NGO list tab, tap Review proof on a pending request, compare the document with the name, then Approve or Reject. Checking the number on the Darpan portal is a good habit.
- Delete the old `users` collection in the Firestore console (Data tab, three dots on `users`, Delete collection). It held emails and is now closed by the rules.
- Ratings from the earlier version are not carried over. Every seller needs to open the updated app once (logged in and verified) so their profile exists.

## 8. Install on a phone

- Android Chrome: tap Install app in the banner, or open the browser menu and choose Install app or Add to Home screen.
- iPhone Safari: Share, then Add to Home Screen.

The app opens full screen from the home screen like a normal app.

## Notes

- Photos are shrunk in the browser and saved inside the item record, so Firebase Storage is not needed.
- Email verification uses a link, not a one-time code. Firebase has no free email-code login. SMS codes need a paid Firebase plan.
- NGO proof is checked by a person (the admin), not by a government database. The app cannot confirm that a certificate is genuine on its own.
- Ratings can be gamed by a seller who makes a second account and trades with themselves. The rules stop one person rating twice and stop editing ratings directly, but they cannot detect friends. Admin can remove bad listings.
