(function(){
  var app = angular.module("jenovaApp");

  function homeCtrl($scope, $mdDialog, $timeout, $q, $log, $window, $rootScope){
    $scope.globalActivity = $rootScope._userData.isAdmin;
    $scope.selected = [];
    $scope.showmenu = null;
    //window.open('http://google.com');
    //window.location.href = 'http://google.com';
    //console.log($scope.tokenPayload.user.permissions[0].scope.name);

    $scope.labels = ["Contas bloqueadas", "Contas ativas"];
    $scope.data = [15, 1500];

    $scope.cards = [
      { size : 2, desc : 'Sessões Ativas' },
      { size : 1554, desc : 'Contas ativas' },
      { size : 14, desc : 'Contas bloqueadas' },
      { size : 123, desc : 'Domínios' },
      { size : 3, desc : 'Serviços' },
      { size : 343, desc : 'Registros DNS' },
    ];

    $scope.collections = [
      {user : 'sandro.mello', history : 'Abriu painel admin do Zimbra'},
      {user : 'fernando.cainelli', history : 'Criou novo registro do tipo A'},
      {user : 'luiz.nascimneto', history : 'Removeu entrada do tipo CNAME'},
      {user : 'leandro.pereira', history : 'Sincronizou serviço hosted'}
    ];

    $scope.maintenance = [
      {service : 'hosted', msg : 'Serviços operando em normalidade', date : '11 de Dezembro de 2015 - 13h10',
        status : {ico : 'done', color : '#00c853'}},
      {service : 'hosted', msg : 'Indisponibilidade temporária nos serviços', 
        status : {ico : 'warning', color : '#ffd600'}, date : '10 de Dezembro de 2015 - 15h21'},
      {service : 'novaquest', msg : 'Indisponibilidade temporária nos serviços', 
        status : {ico : 'warning', color : '#d32f2f'}, date : '09 de Outubro de 2015 - 09h10'},
      {service : 'zema', msg : 'Intermitência no acesso aos serviços', 
        status : {ico : 'warning', color : '#ffd600'}, date : '08 de Outubro de 2015 - 16h00'},
    ];

    var imagePath = '';

    $scope.filter = {
      options: {
        debounce: 500
      }
    };

    $scope.query = {
      filter: '',
      order: 'name',
      limit: 5,
      page: 1
    };

    $scope.domains = [
      { name: 'inova.net', extraScreen: 'Wi-fi menu', icon: 'device:network-wifi', enabled: false },
      { name: 'mstech.com.br', extraScreen: 'Bluetooth menu', icon: 'device:bluetooth', enabled: false },
    ];

    $scope.settings = [
      { name: 'Solicitar usuário admin ao acessar o Zimbra', 
      extraScreen: 'Wi-fi menu', icon: 'device:network-wifi', enabled: false }
    ];

    // TODO: unused, remove
    $scope.navigateTo = function(to, event) {
      $mdDialog.show(
        $mdDialog.alert()
          .title('Navigating')
          .content('Imagine being taken to ' + to)
          .ariaLabel('Navigation demo')
          .ok('Neat!')
          .targetEvent(event)
      );
    };

    $scope.startMenu = function(domain, menuType, event){
      $scope.domainListOff = true;
      if (menuType === 'settings'){
        $scope.settingsMenuOn = true;
      }else if (menuType === 'mxhero'){
        $scope.mxheroMenuOn = true;
      } 
    }
    
    $scope.changeState = function(domain){
      $scope.showmenu = true;
      $scope.selected_domain = domain;
    }

    $scope.removeMenu = function(){
      delete $scope.showmenu;
      delete $scope.selected_domain;
      delete $scope.domainListOff;
      delete $scope.settingsMenuOn;
      delete $scope.mxheroMenuOn;
    }

    /** Permissions Start **/
    $scope.isUserGlobalActivity = function() {
      return appUsers.current.permissions.user_activity.global_activity || appUsers.current.permissions.global_admin ||
        appUsers.current.permissions.admin
    }

    $scope.removeFilter = function () {
      $scope.filter.show = false;
      $scope.query.filter = '';
      
      if($scope.filter.form.$dirty) {
        $scope.filter.form.$setPristine();
      }
    };

  }

  app.controller("homeCtrl", homeCtrl);
  
}());