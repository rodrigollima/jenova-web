(function(){
  var app = angular.module("jenovaApp");

  function resellerCtrl($scope, $location, $rootScope, $state, Dialog, resource, mdToast){
    //$scope.currentReseller = { company : 'Carregando revendedores...' };
    $scope.currentUser = $rootScope._userData.user;
    $scope.resellerBodyMenu = false;
    $scope.isMainMenu = false;
    $scope.hasResellerViewPerms = false;
    
    $scope.loadedPages = {$resolved: false};

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
    
    function getVirtualRepeatSize(numItems){
      // 0 fakes index from 1. 7 items = 355px
      var sizes = [0, 65, 113, 160, 210, 260, 305, 355];
      var height = sizes[numItems];
      if (!height && height != 0){
        height = 405;
      }
      return 'height: ' + height + 'px;';
    }

    // Load reseller
    var DynamicItems = function(query) {
      /**
       * @type {!Object<?Array>} Data pages, keyed by page number (0-index).
       */
      this.query = query;
      // $scope.loadedPages = {};

      /** @type {number} Total number of items. */
      $scope.numItems = 0;
      /** @const {number} Number of items to fetch per request. */
      this.PAGE_SIZE = 25;
      this.fetchPage_();
      // this.fetchNumItems_();
    };
    
    DynamicItems.prototype.getItemAtIndex = function(index) {
      var pageNumber = Math.floor(index / this.PAGE_SIZE);
      var page = $scope.loadedPages[pageNumber];

      if (page) {
        return page[index % this.PAGE_SIZE];
      } else if (page !== null) {
        if (pageNumber > 0){
          /* Will only fetch next page if the previous page has size of the PAGE_SIZE limit.
          Prevents unwanted requests. */
          var prevPageNumber = Math.max(0, pageNumber - 1);
          if ($scope.loadedPages[prevPageNumber].length == this.PAGE_SIZE){
            this.fetchPage_(pageNumber);
          }
        }else{
          this.fetchPage_(pageNumber);
        }
      }
    };
    DynamicItems.prototype.getLength = function() {
      return $scope.numItems;
    };
    DynamicItems.prototype.fetchPage_ = function(pageNumber) {
      if (!pageNumber){
        pageNumber = 0;
      }
      var pageOffset = pageNumber * this.PAGE_SIZE;
      var pathParams = {
        resellerName : this.query,
        limit : this.PAGE_SIZE,
        offset : pageOffset
      }

      // Set the page to null so we know it is already being fetched.
      $scope.loadedPages[pageNumber] = null;
            
      resource.clients.resellers.get(pathParams, function(data){
        $scope.loadedPages[pageNumber] = data.response.resellers;
        $scope.numItems = $scope.numItems + data.response.resellers.length;
        $scope.loadedPages.$resolved = data.$resolved;
        if ($scope.loadedPages.$resolved){
          $scope.vrSize = getVirtualRepeatSize($scope.numItems);
        }
      }, function(data){
        console.log('Error loading resellers. See response below...');
        console.log(data);
        mdToast.show(mdToast.getSimple(data.status + ' - Não foi possível obter a lista de revendedores', 4000));
      });
    };

    $scope.searchReseller = function (query) {
      // vrSize=0 prevents rendering problems when searching and re-searching
      $scope.vrSize = 0;
      $scope.dynamicItems = new DynamicItems(query);
    }
    //init constructors
    $scope.dynamicItems = new DynamicItems();


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

    $scope.checkResellerName = function(name){
      $scope.userForm.name.$setValidity("nameExists", true);
      resource.clients.resellers.get({resellerName : name}, function(data){
        $scope.userForm.name.$setValidity("nameExists", false);
      });
    }

    $scope.checkLogin = function(){
      $scope.userForm.login.$setValidity("loginInUse", true);
      resource.users.get({userName : $scope.newReseller.login}, function(data){
        $scope.userForm.login.$setValidity("loginInUse", false);
      });
    }

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