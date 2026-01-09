I have implemented the search functionality. Here's a summary of the changes:

1.  **Backend:** The `findProducts` function in `helpers/user-helpers.js` now uses an efficient database query to search for products by `productName` using a case-insensitive regular expression. This improves performance by offloading the filtering to the database.
2.  **Frontend:**
    *   The search bar in `views/partials/user-header.hbs` now has `id="search-input"` for easier JavaScript interaction.
    *   The `public/javascripts/script.js` file has been updated with JavaScript code to handle the search input:
        *   It uses a `debounce` function to limit how often the search is triggered as the user types, improving performance and user experience.
        *   On `keyup` events (with a 300ms debounce), it redirects the user to the `/find-product/<search-term>` route, where `<search-term>` is the encoded value from the search input.
        *   Pressing `Enter` in the search bar also immediately triggers the search.

Please test the search functionality and let me know if you have any feedback.