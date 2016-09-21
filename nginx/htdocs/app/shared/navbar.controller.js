(function(){
  var app = angular.module("jenovaApp");

  // TODO: 403 for views with no permission

  function navbarCtrl($scope, $location, $rootScope, $window, tokenPayload, jwtHelper, $filter){
    userData = tokenPayload.data();
    $rootScope._userData = userData;
    $scope.isAdmin = userData.user.admin || userData.user.global_admin;
    $scope.hasDomainPerm = userData.isAdmin || userData.permissions.domain.read;
    $scope.hasDnsPerm = userData.isAdmin || userData.permissions.dns.read;
    $scope.hasClientPerm = userData.isAdmin || userData.permissions.client.read;
    $scope.hasServicePerm = userData.user.global_admin;
    $scope.domainName = $rootScope.domainName || '';

    var $translate = $filter('translate');

    if ($location.path() === '/'){
      $scope.dom = 'active';
      $scope.title = $translate('menu.domains');
      // $scope.home = 'active';
      // $scope.title = 'Dashboard';
    }else if ($location.path().startsWith('/domain') || $location.path().endsWith('/domains')){
      $scope.dom = 'active';
      $scope.title = $translate('menu.domains');
    }else if ($location.path().startsWith('/service')){
      $scope.service = 'active';
      $scope.title = $translate('menu.services');
    }else if ($location.path().startsWith('/dns')){
      $scope.dns = 'active';
      $scope.title = $translate('menu.dns');
    }else if ($location.path().startsWith('/user')){
      $scope.user = 'active';
      $scope.title = $translate('menu.users');
    }else if ($location.path().startsWith('/client')){
      $scope.client = 'active';
      $scope.title = $translate('menu.clients');
    }else if ($location.path().startsWith('/reseller')){
      $scope.reseller = 'active';
      $scope.title = $translate('menu.resellers');
    }

    $scope.logout = function(){
      delete $window.sessionStorage.token;
    }
  }

  app.controller("navbarCtrl", navbarCtrl);
  
}());