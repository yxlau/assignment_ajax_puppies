"use strict";

var PUPPIES = PUPPIES || {};

PUPPIES.Controller = (function(Model, View) {
  var _waiting;
  var _uploadCount;

  var init = function() {
    _waiting = false;
    _uploadCount = 0;
    Model.init();
    View.init({
      updatePuppyList: _updatePuppyList,
      submitAjaxForm: _submitAjaxForm,
      batchCreatePuppies: _batchCreatePuppies,
      setWaiting: _setWaiting,
      getWaiting: _getWaiting,
    });
    _updatePuppyList();
    _setUpBreedOptions();
  }

  var _updatePuppyList = function() {
    $.ajax({
      url: "https://ajax-puppies.herokuapp.com/puppies.json",
      type: 'GET',
      dataType: 'json',
      success: function(data) {
        Model.setPuppyList(data);
        View.repopulatePuppyList(data);
        View.listenForAdoptions();
      }
    });
  }

  var _getWaiting = function() {
    return _waiting;
  }

  var _setWaiting = function(status) {
    _waiting = status;
  }

  var _batchCreatePuppies = function(file) {
    var promise = Model.loadFile(file);
    promise.then(_registerPuppiesInBulk);
  }

  var _registerPuppiesInBulk = function(content) {
    var data = Model.parseCSV(content);
    View.showUploadStatus(data.length);
    var url = 'https://ajax-puppies.herokuapp.com/puppies.json';
    var promises = [];
    $.each(data, function(i, pup) {
      promises.push(_submitAjaxForm(url,
        JSON.stringify({
          name: pup.name,
          breed_id: pup.breed_id
        })
      ));
    });
    $.when.apply(null, promises).done(
      function() {
        if (_uploadCount < data.length) {
          View.showFailedUploadCount(data.length - _uploadCount);
        }
        View.listenForAdoptions();
        _uploadCount = 0;
      })
  }

  var _submitAjaxForm = function(url, data) {
    return $.ajax({
      url: url,
      type: 'POST',
      data: data,
      dataType: 'json',
      contentType: 'application/json',
      success: function(data) {
        console.log('creation done');
        _waiting = false;
        _uploadCount++;
        View.addNewPuppyToList(data, Model.getBreedList());
        View.updateUploadCount(_uploadCount);
        View.listenForAdoptions();
      },
      error: function(xhr, status, errorThrown) {
        _waiting = false;
      }
    });
  }

  var _setUpBreedOptions = function() {
    $.ajax({
      url: "https://ajax-puppies.herokuapp.com/breeds.json",
      type: 'GET',
      dataType: 'json',
      success: function(data) {
        Model.setBreedList(data);
        View.populateBreedOptions(data);
      },
    });
  }



  return {
    init: init,
  }

})(PUPPIES.Model, PUPPIES.View);