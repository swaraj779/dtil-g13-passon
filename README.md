# PassOn

Campus give, swap and sell app for DTIL, Team G13 (SDG 12). Login and shared data run on Firebase.

Students and hostel residents can give away or swap usable old items (books, clothes, furniture, electronics, utensils) inside campus.

## What the prototype shows

- Sign up and log in with email and password
- Browse and search items by category, mode (free, exchange or for sale) and campus pickup point
- Post an item with photo, condition, mode and a "cleaned" tick for hygiene
- Item details, real chat between owner and requester, and a request button
- Owners accept or decline requests and mark items as given
- NGO connect for items nobody claims within 7 days
- My activity with listings, requests, pickup confirmation and owner rating

## Setup

Follow `SETUP.md` to create the Firebase project and fill in `firebase-config.js`. Until that is done the site opens but shows a setup banner.

## Put it online with GitHub Pages

1. Push these files to a public GitHub repository.
2. Repository Settings, then Pages.
3. Under Build and deployment, choose "Deploy from a branch", branch `main`, folder `/ (root)`, then Save.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

## Files

- `index.html` page structure
- `styles.css` look and layout, light and dark themes
- `app.js` all behaviour
- `firebase-config.js` your Firebase project settings
- `SETUP.md` Firebase setup steps and security rules
