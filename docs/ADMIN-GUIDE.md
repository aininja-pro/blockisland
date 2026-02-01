# Block Island Directory Admin Guide

This guide helps Chamber staff manage business listings and premium memberships through the admin interface.

## Getting Started

### Logging In

1. Go to the admin URL (provided by your administrator)
2. Enter your email and password
3. Click **Sign In**

Your login is managed through Supabase authentication. If you forget your password, contact your system administrator.

### Dashboard Overview

After logging in, you'll see the Dashboard with four key stats:

| Stat | What It Means |
|------|---------------|
| **Total Listings** | Number of businesses in the directory |
| **Premium Members** | Businesses paying for premium placement |
| **Categories** | Number of business categories (Restaurants, Hotels, etc.) |
| **Last Rotation** | When premium listings last rotated positions |

The Dashboard also shows:
- **Quick Actions** - Shortcuts to common tasks
- **Recent Activity** - The 5 most recently updated listings

---

## Managing Listings

### Viewing All Listings

1. Click **Listings** in the sidebar
2. You'll see a table of all businesses with columns for:
   - Business name
   - Category
   - Premium status
   - Date added

**Tip:** Use the search box to find specific businesses. Click column headers to sort.

### Adding a New Listing

1. Go to **Listings**
2. Click **Add Listing** button (top right)
3. Fill in the required fields:
   - **Name** - Business name
   - **Category** - Select from dropdown
   - **Address** - Street address on Block Island
   - **Latitude/Longitude** - Map coordinates (for map pins)
4. Fill in optional fields as available:
   - Phone number
   - Email
   - Website
   - Description
   - Image URL
5. Click **Save**

**Important:** Latitude and longitude are required for the business to appear on the map in the app.

### Editing a Listing

1. Go to **Listings**
2. Find the business and click the **Edit** button (pencil icon)
3. Make your changes
4. Click **Save**

### Deleting a Listing

1. Go to **Listings**
2. Find the business and click the **Delete** button (trash icon)
3. Confirm the deletion

**Warning:** Deletion is permanent. The listing will be removed from the app.

---

## Premium Member Management

Premium members pay for enhanced visibility. Their listings appear **at the top** of their category in the app.

### What Premium Means

- Premium listings appear **before** regular listings in each category
- Premium listings **rotate daily** so everyone gets fair visibility
- Position 1 = top of the category today

### Making a Business Premium

**From the Listings page:**
1. Find the business in the table
2. Click the star icon in the Premium column to toggle premium on

**From the Premium page:**
1. Click **Premium** in the sidebar
2. Click **Add Premium Member**
3. Select the business from the dropdown
4. Click **Add**

### Removing Premium Status

1. Go to **Premium** in the sidebar
2. Find the business in the list
3. Click the **Remove** button

The business will move back to the regular listings (sorted alphabetically within its category).

### Viewing Rotation Order

1. Go to **Premium** in the sidebar
2. The list shows all premium members grouped by category
3. **Position number** shows today's order (1 = top)
4. Position 1 has special gold highlighting

**Note:** Rotation happens automatically once per day. You don't need to do anything.

---

## Understanding Rotation

### How It Works

Every day, premium listings rotate within their category:
- The listing at position 1 moves to the bottom
- All other positions move up by one
- This ensures every premium member gets equal time at the top

### Example

If you have 3 premium restaurants:
- **Day 1:** Joe's Pizza (1), Sam's Seafood (2), Beach Bistro (3)
- **Day 2:** Sam's Seafood (1), Beach Bistro (2), Joe's Pizza (3)
- **Day 3:** Beach Bistro (1), Joe's Pizza (2), Sam's Seafood (3)

### When Does Rotation Happen?

Rotation triggers automatically when the app requests data (first request of each day). You don't need to manually trigger it.

---

## Categories

Categories are determined by the listings themselves. There's no separate category management needed.

### Viewing Categories

1. Click **Categories** in the sidebar
2. You'll see all categories with:
   - Total listings in each category
   - Number of premium members per category

### Adding a New Category

Categories are created automatically when you add a listing with a new category name. Just type the new category when creating or editing a listing.

---

## Common Tasks

### "A business wants to become a premium member"

1. Go to **Listings**
2. Find the business
3. Click the star icon to make them premium
4. They'll be added to the end of the rotation for their category

### "A premium member didn't renew"

1. Go to **Premium**
2. Find the business
3. Click **Remove**
4. They'll return to regular listings

### "A business changed their phone number"

1. Go to **Listings**
2. Find and click **Edit**
3. Update the phone number
4. Click **Save**

### "A business closed permanently"

1. Go to **Listings**
2. Find the business
3. Click **Delete**
4. Confirm deletion

### "I need to check who's premium in Restaurants"

1. Go to **Categories**
2. Find "Restaurants" - it shows the premium count
3. Or go to **Premium** and look at the Restaurants section

---

## Tips

- **Changes are instant** - Once you save, the app will show updated information
- **No app restart needed** - GoodBarber pulls fresh data from our system
- **Rotation is automatic** - You never need to manually reorder premium members
- **Categories are automatic** - They're derived from your listings

---

## Getting Help

If you encounter issues:
1. Try refreshing the page
2. Try logging out and back in
3. Contact your system administrator

For technical issues, contact: [Your IT contact here]
