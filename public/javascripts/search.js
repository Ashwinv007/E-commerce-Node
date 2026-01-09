$(document).ready(function() {
    $('#searchInput').on('keyup', function() {
        let searchTerm = $(this).val();
        if (searchTerm.length > 0) {
            $.ajax({
                url: '/search',
                method: 'POST',
                data: { searchTerm: searchTerm },
                success: function(response) {
                    $('#product-list-container').html(response);
                }
            });
        } else {
            // Optional: clear results or show all products if search is cleared
            // You might want to load the default full list of products here
            $('#product-list-container').html('');
        }
    });
});