(function(){
  var app = angular.module("jenovaApp");

  function domainCtrl($scope, $state, $location, $rootScope, $stateParams, $timeout, Dialog, resource, mdToast, $q, currentData){
    $scope.loadedPages = {$resolved: true};
    $scope.infoHint = false;
    $scope.infoNotFoundHint = false;
    $scope.selected = [];
    $scope.showmenu = null;
    $scope.packages = null;
    $scope.domainListOff = false;
    $scope.zimbraOverlayLoader = false;
    var domainResource = resource.domains;
    var accountResource = resource.accounts;
    


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


    /**
    * Permissions
    **/
    $scope.userData = $rootScope._userData;
    $scope.isAdmin = userData.user.admin || $scope.userData.user.global_admin
    $scope.isSyncEnabled = !($scope.userData.user.global_admin);
    $scope.isManageServiceEnabled = !($scope.userData.user.global_admin || $scope.userData.user.admin);
    $scope.isManageZimbraDelegatedEnabled = !($scope.isAdmin || $scope.userData.permissions.zimbra_login_delegated.edit);
    $scope.isDeleteDomainEnabled = !($scope.isAdmin || $scope.userData.permissions.domain.delete);
    $scope.infoHint = $scope.userData.user.global_admin;
    $scope.isWriteDomainEnabled = isWriteDomainEnabled();



    $scope.setHint = function(state, notFound){
      if (!$rootScope._userData.user.global_admin){
        return false;
      }
      $scope.infoHint = state;
		}

    function isWriteDomainEnabled(){
      result = $scope.isAdmin || $scope.userData.permissions.domain.write;
      if (!result){
        return false;
      }
      return true;
    }



    // $scope.openAddZimbraUser = function(){
    //   $scope.zimbraAccountOn = true;
    // }

    // $scope.saveEditGrid = function(currentAccount){
    //   $scope.zimbraOverlayLoaderStatus = 'Salvando...'
    //   $scope.zimbraOverlayLoader = true;

    //   pathParams = {
    //       serviceName : $scope.currentDomain['zimbra_service_name'],
    //       domainName : $scope.currentDomain['name'],
    //       accountName : $scope.currentAccount.name
    //   }

    //   accountResource.update(pathParams, currentAccount, function(data) {
    //     $scope.zimbraOverlayLoaderStatus = 'Pronto!'
    //     $scope.zimbraOverlayLoader = false;
    //   }, function(data) {
    //     var msg = data.status + ' - Não foi possível salvar as alterações.';
    //     openToast(msg, 4, data.status);
    //     console.log(data);
    //     $scope.zimbraOverlayLoader = false;
    //   })
    // }


    function openToast(msg, delay, status){
      msg = getStatusCodeMessage(msg, status);
      delay = delay * 1000
      mdToast.show(mdToast.getSimple(msg, delay));
    }


    $scope.deleteDomain = function(domain){
      var pathParams = {
        clientName : domain.client,
        domainName : domain.name
      }

      domainResource.clients.delete(pathParams, function(data){
          mdToast.show(mdToast.getSimple('Dominio deletado com sucesso!', 8000));
          $state.reload();
        }, function(data){
          console.log('Error deleting domain. See response below...');
          console.log(data);
          var msg = ' - Erro ao deletar domínio.';
          mdToast.show(mdToast.getSimple(data.status + msg, 8000));
      });

    }

    $scope.searchHint = true;
    function checkServiceEnabled(serviceName) {
      if ((!($scope.isAdmin || $scope.userData.permissions.dns.read) && serviceName == 'DNS')){
        return true;
      }
      for ( idx in $scope.currentDomain.services){
        if ($scope.currentDomain.services[idx].service_type == 'DNS'){
          $rootScope.domainName = $scope.currentDomain.name;
          return false;
        }
      }
      return true;
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

    function getVirtualRepeatSize(numItems){
      // 0 fakes index from 1. 7 items = 355px
      var sizes = [0, 65, 113, 160, 210, 260, 305, 355];
      var height = sizes[numItems];
      if (!height){
        height = 405;
      }
      return 'height: ' + height + 'px;';
    }

    $scope.changeServiceState = function(templateUrl, domain, state) {
      var service = state.service;
      state.taskExecuted = true;
      state.enabled = !state.enabled; // Freeze enabled state
      state.activeDialog = true; // Activate switch loading
      domain.currentService = state;
      $scope.openDialog(templateUrl, domain);
    }

    $scope.getDomainState = function(domain){
      $scope.loadedPages.$resolved = false;
      domainResource.states.get({clientName : domain.client, domainName: domain.name}, function(data){
        // Main Loader
        $scope.loadedPages.$resolved = true;
        $scope.currentDomain.states = data.response.domains.states;
        // Show/Hide service states
        $scope.currentDomain.states.$resolved = data.$resolved;
        console.log('Loaded domain service states sucessfull!');
      }, function(data){
        // Main Loader
        $scope.loadedPages.$resolved = true;
        console.log('Error loading services state. See response below...');
        var msg = data.status + ' - Erro ao carregar status dos serviços';
        openToast(msg, 4, data.status);
        console.log(data);
      });
    }

    $scope.isZimbraDelegatedEnabled = function(){
      var result = true;
      if ($scope.currentDomain){
        if (!($scope.isAdmin || $scope.userData.permissions.zimbra_login_delegated.read)){
          result = false;
        }
        for ( idx in $scope.currentDomain.services){
          if ($scope.currentDomain.services[idx].service_type == 'ZIMBRA'){
            $scope.currentDomain.zimbra_service_name = $scope.currentDomain.services[idx].name
            result = false;
          }
        }
      }
      var mdIco = 'assets/img/icons/zimbra-logo-black.svg';
      if (result){
        mdIco = 'assets/img/icons/zimbra-logo-grey.svg';
      }
      return {
        content : result,
        mdIco : mdIco
      };
    }


    $scope.startMenu = function(domain, menuType, event){
      $scope.domainListOff = true;
      if (menuType === 'settings'){
        $scope.mxheroMenuOn = false;
        $scope.zimbraMenuOn = false;
        $scope.settingsMenuOn = true;
        $location.path('/domain/' + domain);
      }else if (menuType === 'mxhero'){
        $scope.settingsMenuOn = false;
        $scope.zimbraMenuOn = false;
        $scope.mxheroMenuOn = true;
      }else if (menuType === 'zimbra'){
        $scope.settingsMenuOn = false;
        $scope.mxheroMenuOn = false;
        $scope.zimbraMenuOn = true;
        // currentDomain.states.$resolved = false;
      }

    }

    $scope.focusSearch = function(){
      $scope.focusOn = true;
      return $scope.focusOn;
    }

    $scope.goToDns = function(domain){
      return $location.path('/dns/' + domain);
    }

    $scope.goToZimbra = function(domain){
      return $location.path('/zimbra/' + domain);
    }

    $scope.showMainMenu = function(domain){
      $scope.currentDomain = domain;
      currentData.domain = $scope.currentDomain;
      $scope.removeFilter();
      $scope.showmenu = true;
      $scope.isDnsEnabled = checkServiceEnabled('DNS');
      $scope.selected_domain = domain.name;
    }

    $scope.removeMenu = function(){
      delete $scope.showmenu;
      delete $scope.selected_domain;
      delete $scope.domainListOff;
      delete $scope.settingsMenuOn;
      delete $scope.mxheroMenuOn;
      delete $scope.shopMenuOn;
      delete $scope.zimbraMenuOn;
      delete $scope.zimbraAccountOn;
      $location.path('/domain/');
      // $state.reload();
    }

    $scope.removeFilter = function (reload) {
      $scope.filter.show = false;
      $scope.query.filter = '';
      if (reload){
        $state.reload();
      }
      if($scope.filter.form.$dirty) {
        $scope.filter.form.$setPristine();
      }
    };

    $scope.openDialog = function(template_url, data) {
      Dialog.open(template_url, 'domainDialogCtrl', data, false);
    }

    $scope.searchDomain = function (query) {
      // vrSize=0 prevents rendering problems when searching and re-searching
      $scope.vrSize = 0;
      $scope.setHint(false);
      $scope.dynamicItems = new DynamicItems(query);
      
    }

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
      //this.fetchNumItems_();
    };

    // Required.
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

    // Required.
    DynamicItems.prototype.getLength = function() {
      return $scope.numItems;
    };

    DynamicItems.prototype.fetchPage_ = function(pageNumber) {
      // Set the page to null so we know it is already being fetched.
      $scope.loadedPages[pageNumber] = null;
      var pageOffset = pageNumber * this.PAGE_SIZE;
      var resellerName = null;
      if ($stateParams.reseller){
        resellerName = $stateParams.reseller;
      }else if ($scope.userData.user.reseller){
        // It's a reseller login
        resellerName = $scope.userData.user.reseller.name;
      }else if($scope.userData.user.client){
        // It's a normal admin user
        resellerName = $scope.userData.user.client.reseller.name;
      }

      // get client name
      var clientName = null;
      if ($stateParams.client){
        clientName = $stateParams.client;
      }else if($scope.userData.user.client){
        clientName = $scope.userData.user.client.name;
      }

      // client request
      //var clientName = $stateParams.client;
      if ( clientName ) {
        domainResource.clients.get({clientName : clientName, domainName : this.query, limit:this.PAGE_SIZE, offset:pageOffset}, function(data){
          $scope.infoHint = false;
          console.log('Getting all domain from client sucessfull!');
          // This is when we have a domain in path ex: http://dockerhost:8080/#/domain/domain.io
          if ($stateParams.domain) {
            $scope.currentDomain = data.response.domains[0];
            $scope.showMainMenu($scope.currentDomain);
            $scope.startMenu($scope.currentDomain.name, 'settings');
            $scope.getDomainState($scope.currentDomain);
          }

          $scope.loadedPages[pageNumber] = [];
          //$scope.loadedPages. = data.response.domains.length;

          for ( idx in data.response.domains ){
            $scope.loadedPages[pageNumber].push(data.response.domains[idx]);
          }
          $scope.numItems = data.response.total;
          $scope.loadedPages.$resolved = data.$resolved;
          if ($scope.loadedPages.$resolved){
            $scope.vrSize = getVirtualRepeatSize($scope.numItems);
          }
        }, function(data){
          $scope.infoHint = true;
          $scope.infoNotFoundHint = true;
          var msg = data.status + ' - Não foi possível carregar os dominios.';
          openToast(msg, 4, data.status);
          $scope.loadedPages.$resolved = true;
          console.log('Error getting domains, response below...');
          console.log(data);
        });
      }else if (resellerName || ($scope.isAdmin && this.query)){
        // reseller request, must bring all domains from the reseller
        domainResource.resellers.get({resellerName : resellerName, domainName : this.query, limit:this.PAGE_SIZE, offset:pageOffset}, function(data){
          $scope.infoHint = false;
          console.log('Getting all reseller domains sucessfull!');

          // This is when we have a domain in path ex: http://dockerhost:8080/#/domain/domain.io
          if ($stateParams.domain) {
            $scope.currentDomain = data.response.domains[0];
            $scope.showMainMenu($scope.currentDomain);
            $scope.startMenu($scope.currentDomain.name, 'settings');
            $scope.getDomainState($scope.currentDomain);
          }

          $scope.loadedPages[pageNumber] = [];

          for ( idx in data.response.domains ){
            $scope.loadedPages[pageNumber].push(data.response.domains[idx]);
          }
          $scope.numItems = data.response.total;

          $scope.loadedPages.$resolved = data.$resolved;
          if ($scope.loadedPages.$resolved){
            $scope.vrSize = getVirtualRepeatSize($scope.numItems);
          }
          
        }, function(data){
          $scope.infoHint = true;
          $scope.infoNotFoundHint = true;
          var msg = data.status + ' - Não foi possível carregar os dominios.';
          openToast(msg, 4, data.status);
          $scope.loadedPages.$resolved = true;
          console.log('Error getting domains, See the response below...');
          console.log(data);
        });
      } else {
        $scope.loadedPages.$resolved = true;
      }
    };

    // Search domains
    if ($stateParams.client || $stateParams.reseller || !$scope.isAdmin){
      $scope.dynamicItems = new DynamicItems();
      
      // Hide search hint message
      $scope.setHint(false);
    } else if ($stateParams.domain) {
      $scope.dynamicItems = new DynamicItems($stateParams.domain);
      // Hide search hint message
      $scope.setHint(false);
    }

  }

  /**
  * DIALOG CONTROLLER
  **/
  function domainDialogCtrl($scope, $mdDialog, $rootScope, $q, $interval, $state, data, resource, mdToast, $location){

    $scope.currentUser = $rootScope._userData.user;
    $scope.selectedItem  = null;
    $scope.searchText    = null;
    $scope.querySearch   = querySearch;
    $scope.querySearchClients   = querySearchClients;
    $scope.warningEdit = true;
    $scope.currentDomain = data;

    var clientResource = resource.clients;
    var domainResource = resource.domains;
    // Change the state button dynamic
    $scope.disableActivateButton = { name: 'ativar', ngDisable: false, action : null, activateOK : false };
    $scope.deactivateServiceButton = { ngDisable : false, syncing : false };

    $scope.syncDomain = false;
    $scope.syncDomainZimbra = false;
    $scope.syncDomainZimbraDelegated = false;

    // only if changing service state
    if ( $scope.currentDomain && data.currentService ){
      $scope.isCurrentServiceEnable = data.currentService.enabled;
      if ($scope.currentDomain.currentService.service.service_type == 'ZIMBRA'){
        $scope.isZimbraService = true;
      }else if ($scope.currentDomain.currentService.service.service_type == 'DNS'){
        $scope.isDnsService = true;
      }else if ($scope.currentDomain.currentService.service.service_type == 'MXHERO'){
        $scope.isMxheroService = true;
      }
    }
    // otherwise it means add domain dialog
    else {
      if ($location.path().startsWith('/client')){
        $scope.newDomain = { 'clientName' : $location.path().split('/')[2] };
      }
      else{
       if ( ! $scope.currentUser.global_admin && $scope.currentUser.client ){
        $scope.newDomain = { 'clientName' : $scope.currentUser.client.name }
       }
      }
    }

    function querySearchClients(query) {

      // prevent duplicated search when selecting the result
      if ($scope.searched){
        return {};
      }

      var defer = $q.defer();
      searchClients(query).$promise.then(function(data){
        defer.resolve(data.response);
        return data.response;
      });
      $scope.searched = true;

      return defer.promise;
    }

    function searchClients(query) {
      var results = [];
      // Global Admin query (get all resellers/clients)
      resellerName = ''

      // It is not a global admin user, it must belong to a client or reseller
      if (!$rootScope._userData.user.global_admin){
        resellerName = $rootScope._userData.user.reseller.name || $rootScope._userData.user.client.reseller.name

        return clientResource.clients.get({resellerName : resellerName}, function(data){
          clients = [];
          console.log(data);

          for (cidx in data.response.clients){
            var client = data.response.clients[cidx];
            clients.push(client.name);
          }

          data.response = clients.map(function(client){
            return {
              value : client.toLowerCase(),
              display : client
            };
          }).filter(createFilterFor(query));
        });

      }
      else {
        return clientResource.resellers.get({resellerName : resellerName}, function(data){
          clients = [];
          for (ridx in data.response.resellers){
            var resellers = data.response.resellers[ridx];
            for (cidx in resellers.clients){
              var client = resellers.clients[cidx];
              clients.push(client.name)
            }
          }

          data.response = clients.map(function(client){
            return {
              value : client.toLowerCase(),
              display : client
            };
          }).filter(createFilterFor(query));
        });
      }
    }


    $scope.saveCreateDialog = function(){

      var pathParams = {
        clientName : $scope.newDomain.clientName.value || $scope.newDomain.clientName,
        domainName : $scope.newDomain.domainName
      }
      domainResource.clients.create(pathParams, {}, function(data){
          mdToast.show(mdToast.getSimple('Dominio criado com sucesso!', 8000));
          $scope.closeDialog();
          $location.path('/domain/' + $scope.newDomain.domainName);
        }, function(data){
          console.log('Error creating domain. See response below...');
          console.log(data);
          var msg = ' - Erro ao criar domínio.';
          mdToast.show(mdToast.getSimple(data.status + msg, 8000));
      });
    }

    $scope.closeDialog = function() {
      // Disable loading at service desc state view
      // $scope.currentDomain.currentService.activeDialog = false;
      $mdDialog.hide();
      $state.reload();
    }

    $scope.setTaskInfo = function(state, taskId){
      var params = {taskType : 'createdele gatedzimbra', jobId : taskId}
      domainResource.tasks.get(params, function(data){
        state.taskState = data['response']['task_state'];
        state.taskExecuted = data['response']['task_executed'];
      });
    }

    $scope.continueDeactivateDialog = function() {
      $scope.currentDomain.currentService.enabled = true;
      $scope.deactivateServiceButton = { syncing: true, ngDisable: true };
      var service = $scope.currentDomain.currentService.service
      if (service.service_type == 'ZIMBRA'){
        var params = { serviceName : service.name, domainName : $scope.currentDomain.name, sync : '1' };
        domainResource.sync.delete(params, function(data){
          console.log('delete completed');
          $scope.currentDomain.currentService.enabled = false;
          $scope.deactivateServiceButton.ngDisable = true;
          $scope.closeDialog();
        }, function(data){
          console.log('Error deactivating service. See response below...');
          console.log(data);
          var msg = ' - Erro ao desativar serviço. Verifique se não há objetos associados ao domínio.';
          mdToast.show(mdToast.getSimple(data.status + msg, 8000));
          $scope.deactivateServiceButton.syncing = false;
          $scope.deactivateServiceButton.ngDisable = false;
        });
      } else {
        domainResource.sync.delete({serviceName : service.name, domainName : $scope.currentDomain.name }, function(data){
          console.log('Domain Deactivate Service finished!');
          $scope.currentDomain.currentService.enabled = false;
          $scope.closeDialog();
        },function(data){
          console.log('Error deactivating service. See response below...');
          console.log(data);
          $scope.deactivateServiceButton.syncing = false;
          $scope.deactivateServiceButton.ngDisable = false;
          var msg = ' - Erro ao desativar serviço. Verifique se não há objetos associados ao domínio.';
          mdToast.show(mdToast.getSimple(data.status + msg, 8000));
        });
      }
    }

    $scope.continueActivateDialog = function(action) {
      // All states must be cleaned, so the view can be animated again
      $scope.syncDomain = false;
      $scope.syncDomainZimbra = false;
      $scope.syncDomainZimbraDelegated = false;

      var service = $scope.currentDomain.currentService.service;
      if (service.service_type == 'ZIMBRA'){
        $scope.warningEdit = false;

        var steps = {
          domainSync : function(){
            $scope.disableActivateButton.ngDisable = true;
            var deferred = $q.defer();
            console.log('STEP1 - Domain Sync started...');
            $scope.syncDomain = false;
            domainResource.sync.update({serviceName : service.name, domainName : $scope.currentDomain.name }, {},
              function(data){
                console.log('STEP1 - Domain Sync finished!');
                $scope.currentDomain.currentService.tasks = data['response']['tasks_id'];
                $scope.syncDomain = true;
                deferred.resolve();
            }, function(data){
              console.log('STEP1 - Could not start sync. See response below...');
              console.log(data);
              $scope.disableActivateButton.name = 'reprocessar';
              // Toast notification
              mdToast.show(mdToast.getSimple(data.status + ' - Erro ao iniciar sincronização.', 4000));
            });
            return deferred.promise;
          },
          createUpdateDomain : function(){
            var stop = $interval(function(interval){
              var deferred = $q.defer();
              // [0] - createzimbradomains task
              taskId = $scope.currentDomain.currentService.tasks[0];
              taskType = 'createzimbradomains';
              $scope.syncDomainZimbra = false;

              domainResource.tasks.get({taskType : taskType, jobId : taskId}, function(data){
                if (data['response']['task_state'] === 'SUCCESS'){
                  $scope.syncDomainZimbra = { color : 'color:#33691e', ico : 'check'};
                  console.log('STEP2 - Success createzimbradomains!');
                  $interval.cancel(stop);
                }
              }, function(data){
                console.log('STEP2 - Error obtaining task status. See response below...');
                console.log(data);
                $scope.disableActivateButton.name = 'reprocessar';
                $scope.disableActivateButton.ngDisable = false;
                // Toast notification
                mdToast.show(mdToast.getSimple(data.status + ' - Erro ao obter status de sincronização.', 4000));
                $interval.cancel(stop);
              });
              if (interval == 6){
                console.log('STEP3 - Timeout');
                $scope.disableActivateButton.name = 'reprocessar';
                $scope.disableActivateButton.ngDisable = false;
                $scope.syncDomainZimbra = { color : 'color:red', ico : 'close' };
                mdToast.show(mdToast.getSimple('Timeout! Não foi possível ativar o serviço.', 6000));
                $interval.cancel(stop);
              }
              deferred.resolve();
              return deferred.promise;
            }, 3000);
            return stop;
          },
          createDelegatedZimbra : function(){
            var stop = $interval(function(interval){
              var deferred = $q.defer();
              // [0] - createdelegatedzimbra task
              taskId = $scope.currentDomain.currentService.tasks[1];
              taskType = 'createdelegatedzimbra';
              $scope.syncDomainZimbraDelegated = false;
              domainResource.tasks.get({taskType : taskType, jobId : taskId}, function(data){
                if (data['response']['task_state'] === 'SUCCESS'){
                  $scope.currentDomain.currentService.enabled = true;
                  $scope.syncDomainZimbraDelegated = { color : 'color:#33691e', ico : 'check' };
                  console.log('STEP3 - Success createdelegatedzimbra!');
                  // Enable service, last step executed successfully
                  $scope.disableActivateButton.ngDisable = true;
                  $scope.disableActivateButton.activateOK = true;
                  $interval.cancel(stop);
                }
              }, function(data){
                console.log('STEP3 - Error obtaining task status. See response below...');
                console.log(data);
                $scope.disableActivateButton.name = 'reprocessar';
                $scope.disableActivateButton.ngDisable = false;
                // Toast notification
                mdToast.show(mdToast.getSimple(data.status + ' - Erro ao obter status de sincronização.', 4000));
                $interval.cancel(stop);
              });
              if (interval == 7){
                console.log('STEP3 - Timeout');
                $scope.disableActivateButton.name = 'reprocessar';
                $scope.disableActivateButton.ngDisable = false;
                mdToast.show(mdToast.getSimple('Timeout! Não foi possível ativar o serviço.', 4000));
                $scope.syncDomainZimbraDelegated = { color : 'color:red', ico : 'close' };
                $interval.cancel(stop);
              }
              deferred.resolve();
              return deferred.promise;
            }, 2000);
            return stop;
          }
        }

        angular.forEach(steps, function(fn, key){
          $q.when().then(function(){
            fn();
          });
        });
      } else {
        //TODO: treat errors
        domainResource.sync.update({serviceName : service.name, domainName : $scope.currentDomain.name }, {},
          function(data){
            $scope.currentDomain.currentService.enabled = true;
            $scope.closeDialog();
            console.log('Service Activate!');
        }, function(data){
          console.log('Error updating service. See response below');
          console.log(data);
          mdToast.show(mdToast.getSimple(data.status + ' - Erro alterar estado do serviço.', 4000));
        });
      }
    }

    function querySearch(query){
      // prevent duplicated search when selecting the result
      if ($scope.searched){
        return {};
      }
      var defer = $q.defer();
      searchResellers(query).$promise.then(function(data){
        defer.resolve(data.response);
        return data.response;
      });
      $scope.searched = true;
      return defer.promise;
    }

    function searchResellers(query) {
      var results = [];
      // Global Admin query (get all resellers/clients)
      resellerName = ''
      // It is not a global admin user, it must belong to a client or reseller
      if (!$rootScope._userData.user.global_admin){
        resellerName = $rootScope._userData.user.reseller || $rootScope._userData.user.client.reseller.name
      }

      return clientResource.resellers.get({resellerName : resellerName}, function(data){
        resellers = [];
        for (ridx in data.response.resellers){
          var reseller = data.response.resellers[ridx];
          resellers.push(reseller.name);
        }

        data.response = resellers.map(function(r){
          return {
            value : r.toLowerCase(),
            display : r
          };
        }).filter(createFilterFor(query));

      });
    }

    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(reseller) {
        return (reseller.value.indexOf(lowercaseQuery) === 0);
      };
    }
  }

  app.controller("domainDialogCtrl", domainDialogCtrl);
  app.controller("domainCtrl", domainCtrl);

}());
