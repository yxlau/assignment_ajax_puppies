"use strict";

var PUPPIES = PUPPIES || {};

PUPPIES.View = (function() {

  var _$puppyList;
  var _$breedList;
  var _$statusBar;
  var _$uploadStatus;
  var _$puppyUploadForm;
  var submitAjaxForm;
  var batchCreatePuppies;
  var setWaiting;
  var getWaiting;

  var init = function(callbacks) {
    var updatePuppyList = callbacks.updatePuppyList;
    submitAjaxForm = callbacks.submitAjaxForm;
    batchCreatePuppies = callbacks.batchCreatePuppies;
    setWaiting = callbacks.setWaiting;
    getWaiting = callbacks.getWaiting;
    _$puppyList = $('#puppy-list');
    _$breedList = $('#breed-list');
    _$statusBar = $('#status-bar');
    _$uploadStatus = $('#upload-status');
    _$puppyUploadForm = $('#puppy-upload-form');
    _setUpListeners(updatePuppyList);

  }

  var _setUpListeners = function(updatePuppyList) {
    $('#refresh-puppies-list').on('click', function(e) {
      e.preventDefault();
      updatePuppyList();
    });

    $('#puppy-registration-form').on('submit', _submitAsynchronously);

    _$puppyUploadForm.on('submit', _uploadPuppyList);

    _setUpAjaxListeners();
  }

  var listenForAdoptions = function() {
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

  var _setUpAjaxListeners = function() {
    _ajaxStart();
    _ajaxFail();
    _ajaxSuccess();
  }


  var _uploadPuppyList = function(e) {
    e.preventDefault();
    var file = $(e.target).find('input[name=puppy-list]')[0].files[0];
    batchCreatePuppies(file);
  }

  var repopulatePuppyList = function(data) {
    _$puppyList.html(null);
    $.each(data, function(i, puppy) {
      var $item = _buildPuppyEntry(puppy.name, puppy.breed.name, puppy.created_at, puppy.url);
      _$puppyList.append($item);
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

  var populateBreedOptions = function(breeds) {
    $.each(breeds, function(i, breed) {
      _$breedList.append($('<option>').val(breed.id).text(breed.name));
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
      _updateStatusMessage('Missing values in form', 'failure');
      return;
    }

    submitAjaxForm($form.attr('action'), formData);

  }

  var _updateStatusMessage = function(msg, type) {
    setWaiting(false);
    var delay = _$statusBar.text(msg).attr('class', type).fadeIn().delay(2000).fadeOut().promise();
    delay.done(function() {
      _$statusBar.removeClass(type);
    });
  }

  var addNewPuppyToList = function(data, breeds) {
    var breed;
    $.each(breeds, function(i, val) {
      if (val.id === data.breed_id) {
        breed = val.name;
        return false;
      }
    });
    var url = 'https://ajax-puppies.herokuapp.com/puppies/' + data.id + '.json';
    var $item = _buildPuppyEntry(data.name, breed, data.created_at, url);
    _$puppyList.prepend($item);
  }

  var updateUploadCount = function(count) {
    _$uploadStatus.find($('.count')).text(count);
  }

  var showUploadStatus = function(count) {
    _$uploadStatus.text('Puppies uploaded: ').append($('<span>').addClass('count').text(0)).append('/' + count).fadeIn();
  }

  var showFailedUploadCount = function(count) {
    _$uploadStatus.append('Puppies not uploaded:' + count);
  }

  var _ajaxStart = function() {
    $(document).ajaxStart(function() {
      _$statusBar.text('Waiting...').fadeIn();
      window.setTimeout(function waiting() {
        if (getWaiting()) {
          _$statusBar.text('Sorry this is taking so long...');
        }
      }, 1000);
    });
  }

  var _ajaxSuccess = function() {
    $(document).ajaxSuccess(function() {
      setWaiting(false);
      var delay = _$statusBar.text('Finished!').attr('class', 'success').delay(2000).fadeOut().promise();
      delay.done(function() {
        _$statusBar.removeClass('success');
      })
    });
  }

  var _ajaxFail = function() {
    $(document).ajaxError(function(e, jqxhr, settings, error) {
      setWaiting(false);
      var error = jqxhr.responseText ? JSON.parse(jqxhr.responseText).name[0] : '';
      var delay = _$statusBar.text('Failed. Errors were: ' + error).attr('class', 'failure').delay(2000).fadeOut().promise();
      delay.done(function() {
        _$statusBar.removeClass('failure');
      })
    })
  }

  return {
    init: init,
    repopulatePuppyList: repopulatePuppyList,
    populateBreedOptions: populateBreedOptions,
    listenForAdoptions: listenForAdoptions,
    addNewPuppyToList: addNewPuppyToList,
    updateUploadCount: updateUploadCount,
    showUploadStatus: showUploadStatus,
    showFailedUploadCount: showFailedUploadCount,
  }



})();