"use strict";
var Puppies = (function($) {
  var _$puppyList;
  var _$breedList;
  var _$statusBar;
  var _breeds;
  var _fetchBreeds;
  var _submittedBreed;
  var _promise;
  var _waiting;

  var init = function() {
    _waiting = false;
    _$puppyList = $('#puppy-list');
    _$breedList = $('#breed-list');
    _$statusBar = $('#status-bar');
    _setUpListeners();
    _setUpBreedList();
    _refreshList();
  }

  var _setUpBreedList = function() {
    $.ajax({
      url: "https://ajax-puppies.herokuapp.com/breeds.json",
      type: 'GET',
      dataType: 'json',
      success: function(data) {
        _breeds = data;
        _populateBreedOptions();
      },
    });
  }

  var _populateBreedOptions = function() {
    $.each(_breeds, function(i, breed) {
      _$breedList.append($('<option>').val(breed.id).text(breed.name));
    });
  }

  var _setUpListeners = function() {
    $('#refresh-puppies-list').on('click', function(e) {
      e.preventDefault();
      _refreshList();
    });

    $('#puppy-registration-form').on('submit', _submitAsynchronously);

    _ajaxFeedback();
  }

  var _ajaxFeedback = function() {
    _ajaxStart();
    _ajaxSuccess();
    _ajaxFailure();
  }

  var _ajaxStart = function() {
    _waiting = true;
    $(document).ajaxStart(function() {
      _$statusBar.text('Waiting...').fadeIn();
      window.setTimeout(function waiting() {
        if (_waiting) {
          _$statusBar.text('Sorry this is taking so long...');
        }
      }, 1000);
    });
  }

  var _ajaxSuccess = function() {
    $(document).ajaxSuccess(function() {
      _waiting = false;
      var delay = _$statusBar.text('Finished!').attr('class', 'success').delay(2000).fadeOut(300).promise();
      delay.done(function() {
        _$statusBar.removeClass('success');
      })
    });
  }

  var _ajaxFailure = function() {
    $(document).ajaxError(function(e, jqxhr, settings, error) {
      _waiting = false;
      var delay = _$statusBar.text('Failed. Errors were: ' + JSON.parse(jqxhr.responseText).name[0]).attr('class', 'failure').delay(2000).fadeOut().promise();
      delay.done(function() {
        _$statusBar.removeClass('failure');
      })
    })
  }

  var _displayStatusMessage = function(msg, type) {
    _waiting = false;
    var delay = _$statusBar.text(msg).attr('class', type).fadeIn().delay(2000).fadeOut().promise();
    delay.done(function() {
      _$statusBar.removeClass(type);
    });
  }

  var _submitAsynchronously = function(e) {
    e.preventDefault();
    var $form = $(e.target);
    var formVals = $form.serializeArray();
    if (formVals[0] && formVals[1]) {
      var formData = JSON.stringify({
        name: formVals[0].value,
        breed_id: formVals[1].value
      });
    } else {
      _displayStatusMessage('Missing values in form', 'failure');
      return;
    }

    $.ajax({
      url: $form.attr('action'),
      type: 'POST',
      data: formData,
      dataType: 'json',
      contentType: 'application/json',
      success: function(data) {
        console.log(data);
        _waiting = false;
        _addNewPuppyToPuppyList(data);
      },
      error: function(xhr, status, errorThrown) {
        console.log(errorThrown);
        _waiting = false;
      }
    });
  }

  var _addNewPuppyToPuppyList = function(data) {
    var breed;
    $.each(breed, function(i, val) {
      if (val.id === data.id) {
        breed = val.name;
        return false;
      }
    });
    var $item = _buildPuppyEntry(data.name, breed, data.created_at, data.url);
    _$puppyList.prepend($item);
  }

  var _refreshList = function() {
    $.ajax({
      url: "https://ajax-puppies.herokuapp.com/puppes.json",
      type: 'GET',
      dataType: 'json',
      success: function(data) {
        _repopulatePuppyList(data);
      }
    })
  }

  var _buildPuppyEntry = function(name, breed, date, url) {
    var name = $('<b>').text(name);
    var $link = $('<a>').attr('href', url).text('adopt');
    var details = $('<span>').text(
      ' (' + breed + ') ' + 'created at ' + new Date(date).toDateString() + ' -- ');
    return $('<li>').append(name).append(details).append($link);
  }

  var _repopulatePuppyList = function(data) {
    _$puppyList.html(null);
    $.each(data, function(i, puppy) {
      var $item = _buildPuppyEntry(puppy.name, puppy.breed.name, puppy.created_at, puppy.url);
      _$puppyList.append($item);
    });
  }
  return {
    init: init,
  }
})($);