(function(){

  function dialogCtrl($scope, $mdDialog, $timeout, $q, $rootScope, data){
    $scope.currentUser = $rootScope._userData.user;
    $scope.currentClient = data;
    // list of `state` value/display objects
    $scope.states        = loadAll();
    $scope.selectedItem  = null;
    $scope.searchText    = null;
    $scope.querySearch   = querySearch;

    $scope.global_admin = true;
    $scope.hide = function() {
      $mdDialog.hide();
    }
    $scope.cancel = function() {
      $mdDialog.cancel();
    }
    $scope.answer = function(answer) {
      $mdDialog.hide();
    }

    function querySearch(query) {
      var results = query ? $scope.states.filter( createFilterFor(query) ) : [];
      return results;
    }
    /**
     * Build `states` list of key/value pairs
     */
    function loadAll() {
      var allStates = 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware,\
              Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana,\
              Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana,\
              Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina,\
              North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina,\
              South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia,\
              Wisconsin, Wyoming';
      return allStates.split(/, +/g).map( function (state) {
        return {
          value: state.toLowerCase(),
          display: state
        };
      });
    }

    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(state) {
        return (state.value.indexOf(lowercaseQuery) === 0);
      };
    }
  }

  app.controller("dialogCtrl", dialogCtrl);

}());