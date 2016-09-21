(function(){
  var app = angular.module("jenovaApp");

  function loginCtrl($scope, $http, $window, $location, $rootScope, authResource, mdToast, $filter){
    if ($window.sessionStorage.token){
      return $location.path('/');  
    }

    var $translate = $filter('translate');

    $scope.login = function(username, password){
      credentials = { username : username, password : password };
      authResource.post({}, credentials, function(data){
        console.log('TOKEN ' + data.response.token);
        $window.sessionStorage.token = data.response.token;
        return $location.path('/');
      }, function(data, status, header, config){
        console.log('Error logging in');
        console.log(data);
        var message = $translate('messages.login_unknown_error');
        if (data.status == 401){
          message = $translate('messages.login_userpass_error');;
        } else {
          message = message + ' - ' + data.status;
        }
        mdToast.show(mdToast.getSimple(message, 5000));
      });      
    }
  }

  app.controller("loginCtrl", loginCtrl);
  
}());