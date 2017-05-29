$(document).ready(function() {

  $(document).on('ajaxStart', function(e) {

    var myPromise = $('#status-bar').text('Blah').fadeIn();

  });



  $('#refresh-puppies-list').click(function() {
    var _then;
    $.ajax({
      url: "https://reqres.in/api/users",
      type: "GET",
      success: function(response) {
        console.log(response);
      }
    })
  });
});