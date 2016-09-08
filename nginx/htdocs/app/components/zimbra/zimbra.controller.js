(function(){
  var app = angular.module("jenovaApp");

  function zimbraCtrl($scope, $location, $rootScope, resource, mdToast, currentData, Dialog, $timeout, $q){
    // load
    cosResource = resource.cos;
    domainResource = resource.domains;
    reportResource = resource.reports
    accountResource = resource.accounts;
    accountListResource = resource.accountsList;
    
    dListLitsResource = resource.dlistList;
    dListResource = resource.dlist;
    $scope.dListAll = [];
    $scope.dListMembers = [];

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
      dlist : false,
      reports : false,
      cos : true
    }

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

    
    // Search Distribution Lists
    $scope.searchDList = function(query){
      if (!query){
        query = '';  
      }
      $scope.query.filter = query;
      return [];
    }

    // Get Dlists
    function getDlists(){
      var pathParams = {
          serviceName : $scope.currentDomain['zimbra_service_name'],
          domainName : $scope.currentDomain['name']
      }

      dListLitsResource.get(pathParams, function(data){
        $scope.dListAll = data.response.dlists;
        $scope.numItemsDlist = data.response.total;
      }, function(data){
        console.log('Error getting Dlists. See response below');
        console.log(data);
        openToast(data.status + ' - Não foi possível carregar listas de distribuição', 4, data.status);
      });
    }

    // Get Domain Report
    function getDomainReport() {
      $scope.userReport = [];
      $scope.userReport.$resolved = true;
      
      var pathParams = {
        serviceName : $scope.currentDomain['zimbra_service_name'],
        domainName : $scope.currentDomain['name']
      }

      
      reportResource.domain.get(pathParams, null,  function(data){
        console.log(data);
        for (cidx in data.response[0].accounts){
          $scope.userReport.push(data.response[0].accounts[cidx]);
        }

        $scope.userReport.$resolved = false;
        
      }, function(data){
        console.log('Error getting domain report. See response below');
        console.log(data);
        openToast(data.status + ' - Erro gerando relatório', 4, data.status);
      });
    }

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
    
      // Set the page to null so we know it is already being fetched.
      $scope.loadedPages[pageNumber] = null;
      var pageOffset = pageNumber * this.PAGE_SIZE;
      
      var pathParams = {
          serviceName : $scope.currentDomain['zimbra_service_name'],
          domainName : $scope.currentDomain['name'],
          limit : this.PAGE_SIZE,
          offset : pageOffset
      }

      accountListResource.get(pathParams, function(data){
        $scope.loadedPages[pageNumber] = [];
        for ( idx in data.response.accounts ){
          $scope.loadedPages[pageNumber].push(data.response.accounts[idx]);
        }
        $scope.numItems = $scope.numItems + data.response.total;
        $scope.loadedPages.$resolved = data.$resolved;
      }, function(data){
        console.log('Error getting users. See response below');
        console.log(data);
        openToast(data.status + ' - Não foi possível carregar usuários', 4, data.status);
      }); 
    };

    // Load zimbraDomainStatus
    function getZDomainStatus() {
      var pathParams = {
          serviceName : $scope.currentDomain['zimbra_service_name'],
          domainName : $scope.currentDomain['name']
      }

      domainResource.zstatus.get(pathParams, function(data){
        //console.log(data.response);
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
       if ( $scope.menu.users ){ 
        $scope.openDialog('app/components/zimbra/dialogs/user-edit.tmpl.html', currentAccount);
       }
       else{
         console.log(currentAccount);
       }
     }
   }
   
    $scope.openDialog = function(template_url, data) {
      Dialog.open(template_url, 'zimbraDialogCtrl', data, false);
    }

    $scope.openDListDialog = function(template_url, data) {
      Dialog.open(template_url, 'zimbraDListDialogCtrl', data, false);
    }

    // Get Distribution List Members
    $scope.getDListMembers = function(data) {
      $scope.currentDList = data;
      $scope.zimbraOverlayLoaderStatus = 'Carregando...'
      $scope.currentDList.members = [];
      $scope.currentDList.members.$resolved = false;

      pathParams = {
        serviceName : $scope.currentDomain['zimbra_service_name'],
        domainName : $scope.currentDomain['name'],
        dlistName : $scope.currentDList.name
      }


      dListResource.get(pathParams, function(data){
        $scope.currentDList.members = data.response.accounts;
        $scope.currentDList.members.$resolved = true;
      }, function(data){
        console.log('Error getting users. See response below');
        console.log(data);
        openToast(data.status + ' - Não foi possível carregar usuários', 4, data.status);
      });
      // Dialog.open(template_url, 'zimbraDListDialogCtrl', dListData, false);
    }

    $scope.removeFilter = function () {
      $scope.filter.show = false;
      $scope.query.filter = '';
      
      // ??
      // if($scope.filter.form.$dirty) {
      //   $scope.filter.form.$setPristine();
      // }
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
        $scope.menu.cos = true;
      }
      else if ( menu == 'dlist'){
        $scope.menu.dlist = true;
        $scope.zimbraOverlayLoaderStatus = ''

        getDlists();
      }
      else if ( menu == 'reports'){
        $scope.menu.reports = true;
        getDomainReport();
      }
    }

    //init constructors
    $scope.dynamicItems = new DynamicItems();
  }


// Dialog Distribution List Controller
function zimbraDListDialogCtrl($scope, $mdDialog, $state, data, currentData, mdToast){
  $scope.currentDList = data;
  $scope.currentDomain = currentData.domain;
  if ( ! $scope.currentDList ){
    $scope.currentDList = {
      name : null,
      members : []
    }
  }
  
  
  $scope.addDListMember = function(account){
    var member = {name : ''};
    if (indexByAccount($scope.currentDList.members, account.name) !== -1){
      openToast('Esta conta já é membro da lista!', 5, 409);
    } else {
      openToast(account.name + ' adicionado!', 4, 'OK');
      member.name = account.name;
      $scope.currentDList.members.push(member);
    }
  }

  $scope.removeDListMember = function(account){
    idx = indexByAccount($scope.currentDList.members, account.name);
    $scope.currentDList.members.splice(idx,1);
    openToast(account.name + ' removido!', 4, 'OK');
  }

  $scope.closeDialog = function() {
        // Disable loading at service desc state view
        // $scope.currentDomain.currentService.activeDialog = false;
        $state.reload();
        $mdDialog.hide();
  }

  $scope.updateDlist = function() {
    var dlistToUpdate = {
      dlist : $scope.currentDList.name,
      accounts: $scope.currentDList.members
    }

    pathParams = {
      serviceName : $scope.currentDomain['zimbra_service_name'],
      domainName : $scope.currentDomain['name'],
      dlistName  : $scope.currentDList.name
    }

    dListResource.update(pathParams, dlistToUpdate, function(data) {
      openToast('Salvo com sucesso!', 4, data.status);
      $scope.closeDialog();
    }, function(data) {
      var msg = data.status + ' - Não foi possível salvar as alterações.';
      openToast(msg, 4, data.status);
      console.log(data);
      $scope.zimbraOverlayLoader = false;
    })
  }

  $scope.createDList = function() {
    $scope.zimbraOverlayLoader = true;
    pathParams = {
        serviceName: $scope.currentDomain['zimbra_service_name'],
        domainName : $scope.currentDomain['name']
    }
    updateParams = {
      dlist : $scope.currentDList.name,
      accounts : $scope.currentDList.members
    }

    dListLitsResource.create(pathParams, updateParams, function(data) {
      openToast('Criado com sucesso!', 4, data.status);
      $scope.closeDialog();
      $scope.zimbraOverlayLoader = false;
    }, function(data) {
      var msg = data.status + ' - Não foi possível criar a lista de distribuição.';
      openToast(msg, 4, data.status);
      console.log(data);
      $scope.zimbraOverlayLoader = false;
    })
  }

  // Delete Distribution List
  $scope.deleteDList = function() {
    $scope.zimbraOverlayLoader = true;
    pathParams = {
        serviceName: $scope.currentDomain['zimbra_service_name'],
        domainName : $scope.currentDomain['name'],
        dlistName  : $scope.currentDList.name
    }
    
    dListResource.delete(pathParams, null, function(data) {
      openToast('Deletado com sucesso!', 4, data.status);
      $scope.closeDialog();
    }, function(data) {
      var msg = data.status + ' - Não foi possível deletar a lista de distribuição.';
      openToast(msg, 4, data.status);
      console.log(data);
      $scope.zimbraOverlayLoader = false;
      $scope.closeDialog();
    })
  }

  function openToast(msg, delay, status){
      delay = delay * 1000
      mdToast.show(mdToast.getSimple(msg, delay));
  }

  // Load users
  var DynamicItems = function(query) {
    /**
     * @type {!Object<?Array>} Data pages, keyed by page number (0-index).
     */
    this.query = query;
    $scope.loadedPages = {};

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
  
    // Set the page to null so we know it is already being fetched.
    $scope.loadedPages[pageNumber] = null;
    var pageOffset = pageNumber * this.PAGE_SIZE;
    
    var pathParams = {
        serviceName : $scope.currentDomain['zimbra_service_name'],
        domainName : $scope.currentDomain['name'],
        limit : this.PAGE_SIZE,
        offset : pageOffset
    }

    accountListResource.get(pathParams, function(data){
      $scope.loadedPages[pageNumber] = [];
      for ( idx in data.response.accounts ){
        $scope.loadedPages[pageNumber].push(data.response.accounts[idx]);
      }
      $scope.numItems = $scope.numItems + data.response.total;
      $scope.loadedPages.$resolved = data.$resolved;
    }, function(data){
      console.log('Error getting users. See response below');
      console.log(data);
      openToast(data.status + ' - Não foi possível carregar usuários', 4, data.status);
    }); 
  };
  
  //init constructors
  $scope.dynamicItems = new DynamicItems();

  // Check if user exists in Distribution List.
  function indexByAccount(list, name){
    for ( idx in list){
      if (list[idx].name == name){
        return idx;
      }
    }
    return -1;
  }

}

  // DIALOG CONTROLLER
function zimbraDialogCtrl($scope, $mdDialog, $state, data, currentData, mdToast){
  $scope.currentAccount = data;
  $scope.currentDomain = currentData.domain;
  $scope.firstCos = '';
  $scope.validateEmail = function(email) {
    re = /^[a-z0-9].*[a-z0-9]$/igm;
    indexAt = email.indexOf('@'); 

    if (indexAt == -1){
      validEmail = email + '@' + $scope.currentDomain['name'];
      $scope.currentAccount.name = validEmail;
    } else {
      validEmail = email;
      accountDomain = email.slice(indexAt+1,email.length);
      if (accountDomain !== $scope.currentDomain['name']) {
        $scope.accountForm.accountName.$setValidity("domainCheck", false);
      } else {
        $scope.accountForm.accountName.$setValidity("domainCheck", true);
      }
    }

    beforeAt = email.slice(0,indexAt);
    console.log(beforeAt);

    if (validEmail == '' || !re.test(beforeAt)) {
      $scope.accountForm.accountName.$setValidity("validEmail", false);
    } else {
      $scope.accountForm.accountName.$setValidity("validEmail", true);
    }

  }

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
        openToast('Conta criada com sucesso!', 4, data.status);
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
    if ($scope.firstCos == ""){
      $scope.firstCos = cos.name;
    }
    return false;
  }
  $scope.isCosFirstEnabled = function(cosName){
    if ($scope.firstCos == cosName){
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
  app.controller("zimbraDListDialogCtrl", zimbraDListDialogCtrl);
}());