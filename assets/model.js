"use strict";

var PUPPIES = PUPPIES || {};

PUPPIES.Model = (function() {

  var _breedList;
  var _puppyList;
  var _waiting;

  var init = function() {
    _waiting = false;
  }

  var setPuppyList = function(data) {
    _puppyList = data;
  }

  var setBreedList = function(data) {
    _breedList = data;
  }

  var getBreedList = function(data) {
    return _breedList;
  }


  var getPuppyList = function() {
    return _puppyList;
  }


  var parseCSV = function(contents) {
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


  var loadFile = function(file) {
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


  return {
    init: init,
    setPuppyList: setPuppyList,
    getPuppyList: getPuppyList,
    setBreedList: setBreedList,
    getBreedList: getBreedList,
    parseCSV: parseCSV,
    loadFile: loadFile

  }

})();