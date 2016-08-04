(function(){
  var app = angular.module("jenovaApp");

  function loginCtrl($scope, $http, $window, $location, $rootScope, authResource){
    if ($window.sessionStorage.token){
      return $location.path('/');  
    }

    $scope.login = function(username, password){
      credentials = { username : username, password : password };
      authResource.post({}, credentials, function(data){
        console.log('TOKEN ' + data.response.token);
        $window.sessionStorage.token = data.response.token;
        return $location.path('/');
      }, function(data, status, header, config){
        console.log('Error logging in');
        console.log(data);
        var message = 'Erro desconhecido.'
        if (status == 401){
          message = 'Login/Senha incorretos.';
        }
      });      
    }
  }

  app.controller("loginCtrl", loginCtrl);
  
}());