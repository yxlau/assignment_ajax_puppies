"use strict";
var Puppies = (function($) {
  var _$puppyList;
  var _$breedList;
  var _$statusBar;
  var _$uploadStatus;
  var _breeds;
  var _fetchBreeds;
  var _waiting;
  var _uploadCount;
  var _$puppyUploadForm;

  var init = function() {
    _waiting = false;
    _uploadCount = 0;
    _$puppyList = $('#puppy-list');
    _$breedList = $('#breed-list');
    _$statusBar = $('#status-bar');
    _$uploadStatus = $('#upload-status');
    _$puppyUploadForm = $('#puppy-upload-form');
    _setUpListeners();
    _setUpBreedList();
    _getPuppyList();
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
    _$puppyUploadForm.on('submit', _uploadPuppyList);

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
    // to read the user's uploade file, we will use FileReader()'s readAsText method.
    // because it is an asynchronous method, we add a listener, `onload` for when the file has finished its upload, 
    // with instructions on what to do with its contents in the callback.

    var reader = new FileReader();
    var deferred = $.Deferred();
    reader.onload = function(e) {
      deferred.resolve(e.target.result);
    };
    reader.readAsText(file);
    return deferred.promise();
  }

  var _batchCreatePuppies = function(content) {
    var data = _parseCSV(content);
    _showUploadStatus(data.length);
    var url = _$puppyUploadForm.attr('action');
    var promises = [];
    $.each(data, function(i, pup) {
      promises.push(_performAjaxFormSubmission(url,
        JSON.stringify({
          name: pup.name,
          breed_id: pup.breed_id
        })
      ));
    });
    $.when.apply(null, promises).done(
      function() {
        if (_uploadCount < data.length) {
          _$uploadStatus.append('Puppies not uploaded:' + (data.length - _uploadCount));
        }
        _uploadCount = 0;
      });
  }

  var _showUploadStatus = function(count) {
    _$uploadStatus.text('Puppies uploaded: ').append($('<span>').addClass('count').text(0)).append('/' + count).fadeIn();
  }

  var _parseCSV = function(contents) {
    //  contents = ["Pupper1,119,", "Pupper2,119,", "Pupper3,119,", ""]
    // turn it into --> {name: val[0], breed_id: val[1]}
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
        console.log('creation done');
        _waiting = false;
        _addNewPuppyToPuppyList(data);
        _uploadCount++;
        _$uploadStatus.find($('.count')).text(_uploadCount);
      },
      error: function(xhr, status, errorThrown) {
        _waiting = false;
      }
    });
  }

  var _addNewPuppyToPuppyList = function(data) {
    var breed;
    $.each(_breeds, function(i, val) {
      if (val.id === data.breed_id) {
        breed = val.name;
        return false;
      }
    });
    var url = 'https://ajax-puppies.herokuapp.com/puppies/' + data.id + '.json';
    var $item = _buildPuppyEntry(data.name, breed, data.created_at, url);
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