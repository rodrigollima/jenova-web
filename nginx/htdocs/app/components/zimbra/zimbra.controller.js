(function(){
  var app = angular.module("jenovaApp");

  function zimbraCtrl($scope, $location, $rootScope, resource, mdToast, currentData, Dialog, $timeout, $q){
    // load
    cosResource = resource.cos;
    domainResource = resource.domains;
    accountResource = resource.accounts;
    accountListResource = resource.accountsList;
    $scope.currentDomain = currentData.domain;
    $scope.zCOS = [];
    $scope.zimbraOverlayLoader=false; // set false when prod.
    $scope.zimbraOverlayLoaderStatus="Carregando...";
    $scope.searchText    = null;
    $scope.querySearch   = querySearch;
    $scope.loadedPages = {$resolved: true};
    $scope.zDomainStatus = { active : true, class : '' };

    $scope.menu = {
      users : true,
      dlist : false
    }

    // init functions
    getCOSLimits();
    getZDomainStatus();
    
    // when currentData is not present the following will not work.
    if(JSON.stringify($scope.currentDomain) === '{}') { //This will check if the object is empty
      return $location.path('/domain/');
    }
    
    /**
    * Permissions
    **/
    $scope.userData = $rootScope._userData;
    $scope.isAdmin = userData.user.admin || $scope.userData.user.global_admin

    // Change zimbraDomainStatus
    $scope.switchZStatus = function () {
      var pathParams = {
        serviceName : $scope.currentDomain['zimbra_service_name'],
        domainName : $scope.currentDomain['name']
      }

      var status;
      if ($scope.zDomainStatus.active){
        status = 'suspended';  
      }
      else {
        status = 'active';
      }
      var updateParams = {
        status : status
      };

      domainResource.zstatus.update(pathParams, updateParams,  function(data){ 
        openToast('Status alterado com sucesso', 4);
         if (status == 'active'){
           $scope.zDomainStatus.active = true;
           $scope.zDomainStatus.class = '';
         }
         else {
           $scope.zDomainStatus.active = false;
           $scope.zDomainStatus.class = 'md-accent';
         }
      }, function(data){
        console.log('Error updating zimbra domain status. See response below');
        console.log(data);
        openToast(data.status + ' - Não foi possível alterar status do domínio', 4, data.status);
      });

    }

    // Save Domain Account Limits
    $scope.updateCosLimits = function(){
      var pathParams = {
        serviceName : $scope.currentDomain['zimbra_service_name'],
        domainName : $scope.currentDomain['name']
      }

      var updateParams = {
        cos : $scope.zCOS
      };

      cosResource.domain.update(pathParams, updateParams,  function(data){ 
        openToast('Limites salvos', 4);
      }, function(data){
        console.log('Error setting COS limits. See response below');
        console.log(data);
        openToast(data.status + ' - Não foi possível salvar os limites de conta', 4, data.status);
      });

    }
    // Load users
    var DynamicItems = function(query) {
      /**
       * @type {!Object<?Array>} Data pages, keyed by page number (0-index).
       */
      this.query = query;
      $scope.loadedPages = {};

      /** @type {number} Total number of items. */
      $scope.numItems = 1;
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
      // Set the page to null so we know it is already being fetched.
      $scope.loadedPages[pageNumber] = null;
      var pageOffset = pageNumber * this.PAGE_SIZE;
      
      var pathParams = {
          serviceName : $scope.currentDomain['zimbra_service_name'],
          domainName : $scope.currentDomain['name']
      }

      accountListResource.get(pathParams, function(data){
        $scope.loadedPages[pageNumber] = [];
        for ( idx in data.response.accounts ){
          $scope.loadedPages[pageNumber].push(data.response.accounts[idx]);
        }
        $scope.numItems = data.response.total;
        $scope.loadedPages.$resolved = data.$resolved;

        if ($scope.loadedPages.$resolved){
          $scope.vrSize = getVirtualRepeatSize($scope.numItems);
        }
      }, function(data){
        console.log('Error getting users. See response below');
        console.log(data);
        openToast(data.status + ' - Não foi possível carregar usuários', 4, data.status);
      });
      // domainResource.clients.get({clientName : clientName, domainName : this.query, limit:this.PAGE_SIZE, offset:pageOffset}, function(data){
    };

    // Load zimbraDomainStatus
    function getZDomainStatus() {
      var pathParams = {
          serviceName : $scope.currentDomain['zimbra_service_name'],
          domainName : $scope.currentDomain['name']
      }

      domainResource.zstatus.get(pathParams, function(data){
        console.log(data.response);
         var status = data.response.status;
         if (status == 'active'){
           $scope.zDomainStatus.active = true;
           $scope.zDomainStatus.class = '';
         }
         else {
           $scope.zDomainStatus.active = false;
           $scope.zDomainStatus.class = 'md-accent';
         }
         
      }, function(data){
        console.log('Error getting domain status. See response below');
        console.log(data);
        $scope.zimbraOverlayLoaderStatus = 'Erro ao carregar status do domínio.'
        openToast(data.status + ' - Não foi possível carregar informações do domínio', 4, data.status);
      });
    }
    // Load COS Limits
    function getCOSLimits() {    
      var pathParams = {
          serviceName : $scope.currentDomain['zimbra_service_name'],
          domainName : $scope.currentDomain['name']
      }

      cosResource.domain.get(pathParams, function(data){ 
        for (cidx in data.response){
          var cos = data.response[cidx];
          cos.limit = parseInt(cos.limit); //string to int 
          $scope.zCOS.push(cos);
        }
        currentData.domain.cos = $scope.zCOS;
        $scope.zCOS.$resolved = true;
        $scope.zimbraOverlayLoaderStatus="Pronto!";
        $scope.zimbraOverlayLoader = false;
      }, function(data){
        console.log('Error getting COS. See response below');
        console.log(data);
        $scope.zimbraOverlayLoaderStatus = 'Erro ao carregar tipos de contas.'
        openToast(data.status + ' - Não foi possível carregar informações de limites de conta', 4, data.status);
      });  
    }
  
    // Open Zimbra Console
    $scope.openZimbraConsoleAdmin = function(domain){
      $scope.zimbraOverlayLoaderStatus = 'Carregando...'
      var hasZimbraService = false;
      for (idx in domain.services){
        if (domain.services[idx].service_type === 'ZIMBRA'){
          $scope.zimbraOverlayLoader = true;
          hasZimbraService = true;
          var serviceName = domain.services[idx].name;
          domainResource.zlogin.auth({serviceName : serviceName, domainName : domain.name}, null, function(data, getHeaders){
            $scope.zimbraOverlayLoader = false;
            $scope.zimbraOverlayLoaderStatus = 'Pronto!'
            // setTimeout waits for the ng-show directive in #overlay-loader kicks in
            $timeout(function() {
              window.open(getHeaders('Location'));
            }, 1000);
          }, function(data){
            $scope.zimbraOverlayLoaderStatus = data.status + ' - Erro!'
            $scope.zimbraOverlayLoader = false;
            console.log('Error loading zimbra admin console. See response below...');
            console.log(data);
          });
        }
      }
      if (!hasZimbraService){
        var msg = 'Não há nenhum serviço do tipo Zimbra associado ao domínio';
        openToast(msg, 2);
        console.log('Could not find any services ZIMBRA. See response below...');
        console.log(domain);
      }
    }

    // Search Zimbra Account
    function querySearch(query){
      var defer = $q.defer();
      searchAccounts(query).$promise.then(function(data){
        defer.resolve(data.response);
        return data.response;
      });
      return defer.promise;
    }

    function searchAccounts(query) {
      var results = [];

      pathParams = {
          serviceName : $scope.currentDomain['zimbra_service_name'],
          domainName : $scope.currentDomain['name'],
          accountName : query
      }
      return accountResource.get(pathParams, function(data){
        accounts = [];
        for (aidx in data.response){
          var account = data.response[aidx];
          accounts.push(account);
        }
        return data.response.filter(createFilterFor);
      }, function(data){
        console.log('Error getting accounts. See response below');
        console.log(data);
        openToast(data.status + ' - Não foi possível encontrar nenhum conta', 4, data.status);
        $scope.searched = true;
      });
    }

    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(account) {
        return (account.name.indexOf(lowercaseQuery) === 0);
      };
    }

   // Generic Functions
   $scope.openEditDiagFromSearch = function (currentAccount) {
     if (currentAccount != null && currentAccount.name){
       $scope.openDialog('app/components/zimbra/dialogs/user-edit.tmpl.html', currentAccount);
     }
   }
   function getVirtualRepeatSize(numItems){
      // 0 fakes index from 1. 7 items = 355px
      var sizes = [0, 65, 113, 160, 210, 260, 305, 355];
      var height = sizes[numItems];
      if (!height){
        height = 405;
      }
      return 'height: ' + height + 'px;';
    }

    $scope.openDialog = function(template_url, data) {
      Dialog.open(template_url, 'zimbraDialogCtrl', data, false);
    }

    function openToast(msg, delay, status){
      msg = getStatusCodeMessage(msg, status);
      delay = delay * 1000
      mdToast.show(mdToast.getSimple(msg, delay));
    }

    function getStatusCodeMessage(msg, status){
      if (status in [403, 401]){
        msg = 'Permissão negada';
      }
      return msg
    }
    
    $scope.switchMenu = function (menu) {
      // disable all
      for (midx in $scope.menu){
        $scope.menu[midx] = false;
      }

      if ( menu == 'users'){
        $scope.menu.users = true;
      }
      else if ( menu == 'dlist'){
        $scope.menu.dlist = true;
      }
    }

    //init constructors
    $scope.dynamicItems = new DynamicItems();
  }

  // DIALOG CONTROLLER
function zimbraDialogCtrl($scope, $mdDialog, $state, data, currentData, mdToast){
  $scope.currentAccount = data;
  $scope.currentDomain = currentData.domain;

  $scope.zStatus = [
      { zimbra : "active", desc : "Ativado"},
      { zimbra : "closed", desc : "Fechado"},
      { zimbra : "maintenance", desc :  "Manutenção"},
      { zimbra : "locked", desc : "Bloqueado"},
      { zimbra : "pending", desc : "Pendente"}
  ];

  // if ($scope.currentAccount){
  //   for (cidx in $scope.currentDomain.cos){
  //     var cos = $scope.currentDomain.cos[cidx];
  //     if (cos.id == $scope.currentAccount.zimbraCOSId){
  //       $scope.currentAccount.cosName = cos.name; 
  //     } 
  //   }
  // }

  // create Account
  $scope.createAccount = function(currentAccount){
    $scope.zimbraOverlayLoader = true;

      pathParams = {
          serviceName : $scope.currentDomain['zimbra_service_name'],
          domainName : $scope.currentDomain['name'],
          accountName : $scope.currentAccount.name
      }
      accountResource.create(pathParams, $scope.currentAccount, function(data) {
        openToast('Conta critada com sucesso!', 4, data.status);
        $scope.closeDialog();
      }, function(data) {
        var msg = data.status + ' - Não foi possível criar conta.';
        openToast(msg, 4, data.status);
        console.log(data);
        $scope.zimbraOverlayLoader = false;
      })
  }
  //update Account
  $scope.updateAccount = function(currentAccount){
      $scope.zimbraOverlayLoader = true;

      pathParams = {
          serviceName : $scope.currentDomain['zimbra_service_name'],
          domainName : $scope.currentDomain['name'],
          accountName : $scope.currentAccount.name
      }

      accountResource.update(pathParams, $scope.currentAccount, function(data) {
        openToast('Salvo com sucesso!', 4, data.status);
        $scope.closeDialog();
      }, function(data) {
        var msg = data.status + ' - Não foi possível salvar as alterações.';
        openToast(msg, 4, data.status);
        console.log(data);
        $scope.zimbraOverlayLoader = false;
      })
  }

  // delete Account
  $scope.deleteAccount = function(currentAccount){
    $scope.zimbraOverlayLoader = true;

      pathParams = {
          serviceName : $scope.currentDomain['zimbra_service_name'],
          domainName : $scope.currentDomain['name'],
          accountName : $scope.currentAccount.name
      }

      accountResource.delete(pathParams, null, function(data) {
        openToast('Conta deletada com sucesso!', 4, data.status);
        $scope.closeDialog();
      }, function(data) {
        var msg = data.status + ' - Não foi possível deletar conta.';
        openToast(msg, 4, data.status);
        console.log(data);
        $scope.zimbraOverlayLoader = false;
      })
  }

  // Generic Functions
  $scope.isCosLimitReached = function(cos){
    if (cos.limit <= cos.users && cos.limit != 0 ){
      return true;
    }
    return false;
  }
  $scope.closeDialog = function() {
      // Disable loading at service desc state view
      // $scope.currentDomain.currentService.activeDialog = false;
      $state.reload();
      $mdDialog.hide();
    }
  function openToast(msg, delay, status){
      msg = getStatusCodeMessage(msg, status);
      delay = delay * 1000
      mdToast.show(mdToast.getSimple(msg, delay));
    }

  function getStatusCodeMessage(msg, status){
    if (status in [403, 401]){
      msg = 'Permissão negada';
    }
    return msg
  }
}
  app.controller("zimbraCtrl", zimbraCtrl);
  app.controller("zimbraDialogCtrl", zimbraDialogCtrl);
}());