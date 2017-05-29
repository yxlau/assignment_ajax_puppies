"use strict";
var Puppies = (function($) {
  var _$puppyList;
  var _$breedList;
  var _$statusBar;
  var _breeds;
  var _fetchBreeds;
  var _submittedBreed;
  var _waiting;

  var init = function() {
    _waiting = false;
    _$puppyList = $('#puppy-list');
    _$breedList = $('#breed-list');
    _$statusBar = $('#status-bar');
    _setUpListeners();
    // _setUpBreedList();
    // _getPuppyList();
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
      _getPuppyList();
    });

    $('#puppy-registration-form').on('submit', _submitAsynchronously);
    $('#puppy-upload-form').on('submit', _uploadPuppyList);

    _ajaxFeedback();
  }

  var _ajaxFeedback = function() {
    _ajaxStart();
    _ajaxSuccess();
    _ajaxFailure();
  }

  var _uploadPuppyList = function(e) {
    e.preventDefault();
    var $form = $(e.target);
    var file = $form.find('input[name=puppy-list]')[0].files[0];

    var promise = _loadFile(file);
    promise.then(_batchCreatePuppies);

  }

  var _loadFile = function(file) {
    var reader = new FileReader();
    var deferred = $.Deferred();

    // to read the user's uploade file, we will use FileReader()'s readAsText method.
    // because it is an asynchronous method, we add a listener, `onload` for when the file has finished its upload, 
    // with instructions on what to do with its contents in the callback.
    reader.onload = function(e) {
      deferred.resolve(e.target.result);
    };

    reader.readAsText(file);
    return deferred.promise();
  }

  var _batchCreatePuppies = function(content) {
    var data = _parseCSV(content);
    var url = $('#puppy-upload-form').attr('action');
    var promises = [];
    $.each(data, function(i, pup) {
      promises.push(_performAjaxFormSubmission(url,
        JSON.stringify({
          name: pup.name,
          breed_id: pup.breed_id
        })
      ));
    });
    $.when.apply(null, promises);
  }

  var _parseCSV = function(contents) {
    //  ["Pupper1,119,", "Pupper2,119,", "Pupper3,119,", ""]
    // --> {name: val[0], breed_id: val[1]}
    var lines = contents.split(/\n/);
    lines = lines.filter(function(n) {
      return n !== "";
    });
    var data = [];
    $.each(lines, function(i, val) {
      var entry = val.split(',');
      data.push({
        name: entry[0],
        breed_id: entry[1]
      });
    });
    return data;
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
      var delay = _$statusBar.text('Finished!').attr('class', 'success').delay(2000).fadeOut().promise();
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

    _performAjaxFormSubmission($form.attr('action'), formData);

  }

  var _performAjaxFormSubmission = function(url, data) {
    return $.ajax({
      url: url,
      type: 'POST',
      data: data,
      dataType: 'json',
      contentType: 'application/json',
      success: function(data) {
        _waiting = false;
        _addNewPuppyToPuppyList(data);
      },
      error: function(xhr, status, errorThrown) {
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

  var _getPuppyList = function() {
    $.ajax({
      url: "https://ajax-puppies.herokuapp.com/puppies.json",
      type: 'GET',
      dataType: 'json',
      success: function(data) {
        _repopulatePuppyList(data);
        _listenForAdoptions();
      }
    });
  }

  var _listenForAdoptions = function() {
    $('.adopt').on('click', function(e) {
      e.preventDefault();
      var $item = $(e.target);
      var url = $item.attr('href');

      $.ajax({
        type: 'DELETE',
        url: url,
        success: function(data) {
          $item.parent('li').remove();
        },
      })
    });
  }

  var _buildPuppyEntry = function(name, breed, date, url) {
    var name = $('<b>').text(name);
    var $link = $('<a>').attr({
      href: url,
      class: 'adopt'
    }).text('adopt');
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