(function(){
  var app = angular.module("jenovaApp");

  function resellerCtrl($scope, $location, $rootScope, $state, Dialog, resource, mdToast){
    //$scope.currentReseller = { company : 'Carregando revendedores...' };
    $scope.resellers = [];
    $scope.currentUser = $rootScope._userData.user;
    $scope.resellerBodyMenu = false;
    $scope.isMainMenu = false;
    $scope.hasResellerViewPerms = false;
    
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

    // Global Admin
    resource.clients.resellers.get({resellerName : ''}, function(data){
      console.log('Get resellers sucessfully');
      for (ridx in data.response.resellers){
        $scope.resellers.push(data.response.resellers[ridx]);
      }
      $scope.resellers.$resolved = data.$resolved;
      if (data.$resolved){
        $scope.resellerBodyMenu = true;
      }
    }, function(data){
      console.log('Error getting resellers. See response below...');
      console.log(data);
      $scope.resellers.$resolved = true;
      var msg = ' - Não foi possível obter lista de revendedores';
      mdToast.show(mdToast.getSimple(data.status + msg, 5000));
    });

    $scope.showMainMenu = function(reseller){
      $scope.currentReseller = reseller;
      $scope.removeFilter();
      $scope.isMainMenu = true;
      $scope.resellerBodyMenu = true;
    }

    $scope.removeFilter = function () {
      $scope.filter.show = false;
      $scope.query.filter = '';
      
      if($scope.filter.form.$dirty) {
        $scope.filter.form.$setPristine();
      }
    }

    $scope.removeMainMenu = function(){
      $scope.isMainMenu = false;
      $scope.currentReseller = null;
    }

    $scope.focusSearch = function(){
      $scope.focusOn = true;
      return $scope.focusOn;
    }

    $scope.openDialog = function(template_url, data) {
      //var url = 'app/components/client/client-diag.tmpl.html',
      Dialog.open(template_url, 'resellerDialogCtrl', data);
    }

    $scope.disableReseller = function(reseller){
      $scope.resellers.$resolved = false;
      resource.clients.resellers.update({ resellerName : reseller.name}, { 'enabled' : !(reseller.enabled) }, function(data){
        console.log('enable/disable sucessfully');
        $scope.resellers.$resolved = data.$resolved;
        reseller.enabled = !(reseller.enabled);
      }, function(data){
        console.log('Error disabling reseller. See response below...');
        console.log(data);
        $scope.resellers.$resolved = true;
        var msg = ' - Não foi possível habilitar ou desabilitar a revenda';
        mdToast.show(mdToast.getSimple(data.status + msg, 5000));
      });      
    }
    
    $scope.deleteReseller = function (resellerName){
      $scope.resellers.$resolved = false;
      resource.clients.resellers.delete({ resellerName : resellerName}, function(data){
        console.log('Reseller deleted sucessfully');
        $scope.resellers.$resolved = data.$resolved;
        $state.reload();
      }, function(data){
        console.log('Error deleting reseller. See response below...');
        console.log(data);
        $scope.resellers.$resolved = true;
        var msg = ' - Não foi possível excluir o revendedor.';
        if (data.status == 409){
          msg = ' - Ainda há clientes associados ao revendedor!';
        }
        mdToast.show(mdToast.getSimple(data.status + msg, 5000));
      });      
    }

    $scope.goToDomain = function(reseller){
      return $location.path('/reseller/' + reseller.name + '/domains');
    }
  }
  /** 
  * DIALOG CONTROLLER 
  **/
  function resellerDialogCtrl($scope, $mdDialog, $rootScope, $q, $state, data, resource, mdToast){
    // All perms off on new user creation
    $scope.newReseller = { restrictAccess : true , services : []}
    $scope.currentUser = $rootScope._userData.user;
    // Create client does not have any data
    $scope.currentReseller = {};
    if (data){
      $scope.currentReseller = JSON.parse(JSON.stringify(data));
      //$scope.trueClient = data;
      $scope.currentReseller.$resolved = false;
    }
    $scope.services = [];
    // $scope.transformChip = transformChip;

    // getting services  
    resource.services.get({serviceName : 'all'}, function(data){
      console.log('Loaded services sucessfully.');
      for ( index in data.response){
        var service = data.response[index];
        service.created_at = Date(service.created_at);
        $scope.services.push(service);
      };
      $scope.services.$resolved = data.$resolved;
      $scope.searchText = null;
      $scope.servicesSearch = loadServices();
      $scope.querySearch = querySearch;
    }, function(data){
      console.log('Error getting services. See response below...');
      console.log(data);
      $scope.services.$resolved = true;
      mdToast.show(mdToast.getSimple(data.status + ' - Não foi possível carregar os serviços', 5000));
    });
  
    $scope.closeDialog = function() {
      $mdDialog.hide();
    }

    $scope.saveCreateDialog = function(){
      $scope.newReseller.$resolved = true;
      var service_names = [];
      for (idx in $scope.newReseller.services){
        var service = $scope.newReseller.services[idx];
        service_names.push(service.name);
      }

      var updateData = {
        login : $scope.newReseller.login,
        login_name : $scope.newReseller.login_name,
        email : $scope.newReseller.email,
        password : $scope.newReseller.password1,
        company : $scope.newReseller.company,
        services : service_names
      }

      if ($scope.newReseller.phone){
        updateData['phone'] = $scope.newReseller.phone;
      }

      resource.clients.resellers.create({ resellerName : $scope.newReseller.name }, updateData, function(data){
        console.log('Created reseller sucessfully.');
        $scope.closeDialog();
        $state.reload();
      }, function(data){
        $scope.newReseller.$resolved = false;
        console.log('Error creating reseller. See response below...');
        console.log(data);
        mdToast.show(mdToast.getSimple(data.status + ' - Não foi possível criar novo revendedor.', 5000));
      });      
    }

    $scope.saveEditDialog = function(reseller){
      $scope.currentReseller.$resolved = true;
      var service_names = [];
      for (idx in $scope.currentReseller.services){
        var service = $scope.currentReseller.services[idx];
        service_names.push(service.name);
      }

      updateData = {
        company : reseller.company,
        phone : reseller.phone,
        email : reseller.email,
        services : service_names
      };

      resource.clients.resellers.update({ resellerName : reseller.name }, updateData, function(data){
        console.log('Updated reseller sucessfully.');
        $state.reload();
        $mdDialog.hide();
      }, function(data){
        $scope.currentReseller.$resolved = false;
        console.log('Error updating reseller. See response below...');
        console.log(data);
        mdToast.show(mdToast.getSimple(data.status + ' - Não foi possível atualizar os dados do revendedor.', 5000));
      });
      
    }


    /**
     * Return the proper object when the append is called.
     */
    $scope.transformChip = function(chip) {
    //function transformChip(chip) {
      // If it is an object, it's already a known chip
      if (angular.isObject(chip)) {
        return chip;
      }
      // Otherwise, create a new one
      return { name: chip, service_desc: 'new' }
    }


    function loadServices() {
        if (Array.isArray($scope.services)){
        return $scope.services.map(function (service) {
          service._lowername = service.name.toLowerCase();
          service._lowerdesc = service.service_desc.toLowerCase();
          return service;
        });
      }
    }

    /**
    * Create filter function for a query string
    */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(service) {
        return (service._lowername.indexOf(lowercaseQuery) === 0) ||
            (service._lowerdesc.indexOf(lowercaseQuery) === 0);
      };}   

    /**
    * Search for services.
    */
    function querySearch (query) {
      var results = query ? $scope.servicesSearch.filter(createFilterFor(query)) : [];
      return results;
    }
  }

  app.controller("resellerDialogCtrl", resellerDialogCtrl);
  app.controller("resellerCtrl", resellerCtrl);
  
}());