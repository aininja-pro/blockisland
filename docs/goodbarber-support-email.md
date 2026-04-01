**Subject:** Custom Map Feed — Sort by Date not applied in native app (works in backend API)

Hi GoodBarber Support,

We're using a Custom Map Feed for our app (The Block Island App, app ID 1476990) and we've found that the sort order from our feed is not being applied in the native app or the compiled app preview.

**The issue:**

Our custom feed returns items with `date` fields that should control the sort order (most recent first). When we inspect the network requests in the admin panel, we can see that your internal API (`api.goodbarber.net/front/get_items/1476990/23071214`) returns items in the correct date-descending order. However, the compiled app preview and native app always display items in alphabetical order instead.

**What we've confirmed:**

1. Our feed returns items with dates spaced 1 day apart (e.g., Feb 15, Feb 14, Feb 13, Feb 12)
2. Your `front/get_items` API correctly returns items in our date order
3. The admin edit-mode preview briefly shows the correct order when it fetches live data
4. But the compiled app preview and native app always override this with alphabetical sorting

**What we need:**

CMS Map sections have a "Sort by writing date" option inside the category settings (Section categories → Main category → Order). This option is not available for Custom Map Feed sections. Could this sort option be made available for custom feeds as well? Our backend API response already proves the date-based ordering works — it just needs to be applied in the compiled app.

**Section details:**
- App ID: 1476990
- Section ID: 23071214 (Ferries)
- Feed URL: https://blockisland.onrender.com/api/feed/maps?section=Ferries

This is critical for our app — we need to promote featured/premium listings to the top of each section, which we control through the date field in our feed.

Thank you for your help.

Best regards,
The Block Island App Team
