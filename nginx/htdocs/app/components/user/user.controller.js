(function(){
  var app = angular.module("jenovaApp");

  /* TODO: Expire user session when setting a new PERM
  */
  function userCtrl($scope, $rootScope, $mdDialog, $state, Dialog, tokenPayload, userResource, userPermResource){
    $scope.users = null;
    $scope.currentUser = { name : 'Carregando usuários...' };
    $scope.userBodyMenu = false;
    $scope.selectedUser = null;
    var queryUsername = $rootScope._userData.user.login;
    if ($rootScope._userData.user.admin || $rootScope._userData.user.global_admin){
      queryUsername = '';
    }
    userResource.get({userName : queryUsername}, function(data){
      $scope.users = null;
      // ng-repeat expect an array, otherwise will fail
      if (!Array.isArray(data.response.users)){
        $scope.users = [data.response.users];
      }else{
        $scope.users = data.response.users;  
      }

      $scope.users.$resolved = data.$resolved;

      if (data.$resolved){
        $scope.userBodyMenu = true;
      }
      for (index in $scope.users){
        if ($scope.users[index].global_admin){
          $scope.users[index].icon = 'public';
        }else if ($scope.users[index].admin){
          $scope.users[index].icon = 'supervisor_account';
        }
        
        $scope.users[index].permissions = 
          tokenPayload.loadPermissions($scope.users[index].permissions);
      }
      $scope.currentUser = $rootScope._userData.user;
    });

    $scope.selected = [];
    
    $scope.isMainMenu = false;
    $scope.permBodyMenu = false;
    $scope.settingsBodyMenu = false;
    $scope.mailRegistered = 'sandro.mello@inova.net';

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
    
    var userData = $rootScope._userData
    $scope.isAdmin = userData.user.admin || userData.user.global_admin;
    $scope.isWriteUserEnabled = !($scope.isAdmin || userData.permissions.users.write);
    $scope.isDeleteUserEnabled = !($scope.isAdmin || userData.permissions.users.delete);
    $scope.isEditUserEnabled = !($scope.isAdmin || userData.permissions.users.edit);
    $scope.isPermissionsEnabled = !($scope.isAdmin || userData.permissions.permissions.read);

    $scope.filterExpression = function(perm){
      return perm;
    }

    $scope.deleteUser = function(user_login){
      $scope.users.$resolved = false;
      userResource.delete({userName : user_login}, function(data){
        $state.reload();
      }, function(data){ 
        console.log('Error deleting user: ' + user_login);
        console.log(data);        
      });
    }

    $scope.blkUsrSwt = null;
    $scope.updateUser = function(key, value, type) {
      type = typeof type !== 'undefined' ? type : 'switch';
      $scope.blkUsrSwt = true;
      var updateData = {
        enabled : $scope.currentUser.enabled,
        admin : $scope.currentUser.admin,
        api_enabled : $scope.currentUser.api_enabled
      }
      // We invert this to lock the switch. Must release only when the update is done!
      if (type === 'switch'){
        $scope.currentUser[key] = !(value);
      }else{
        // Invert because it's a button, must trigger inverse value when clicked
        updateData[key] = !(value);
      }

      userResource.update({userName : $scope.currentUser.login}, updateData, function(data){
        // Here we release the loading spinner and the switches
        $scope.blkUsrSwt = null;
        if (type !== 'switch'){
          value = !(value);
        }

        $scope.currentUser[key] = value;
        if ($scope.currentUser.global_admin){
          $scope.currentUser.icon = 'public';
        }else if ($scope.currentUser.admin){
          $scope.currentUser.icon = 'supervisor_account';
        }else{
          $scope.currentUser.icon = 'person_outline';
        }
      }, function(data){
        $scope.blkUsrSwt = null;
      });
    }

    $scope.blkUsrPermSwt = null;
    $scope.updateUserPerms = function(scope, perm_name){
      $scope.blkUsrPermSwt = true;
      var updateData = {
        read : $scope.currentUser.permissions[scope].read,
        write : $scope.currentUser.permissions[scope].write,
        delete : $scope.currentUser.permissions[scope].delete,
        edit : $scope.currentUser.permissions[scope].edit
      }
      $scope.currentUser.permissions[scope][perm_name] = !($scope.currentUser.permissions[scope][perm_name])
      userPermResource.update({userName : $scope.currentUser.login, scopeName : scope}, updateData, function(data){
        // Here we release the loading spinner and the switches
        $scope.blkUsrPermSwt = null;
        $scope.currentUser.permissions[scope][perm_name] = updateData[perm_name];
      }, function(data){
        // Show TOAST ACTION on ERROR
        //$rootScope.$broadcast("showActionToast", {msg : 'Erro ao habilitar/desabilitar função', delay : 4000});
        $scope.blkUsrPermSwt = null;
      });
    }
    
    $scope.removeMainMenu = function(){
      $scope.isMainMenu = false;
      $scope.settingsBodyMenu = false;
      $scope.permBodyMenu = false;
      $scope.apiBodyMenu = false;
      $scope.userBodyMenu = true;
    }

    $scope.removeFilter = function () {
      $scope.filter.show = false;
      $scope.query.filter = '';
      
      if($scope.filter.form.$dirty) {
        $scope.filter.form.$setPristine();
      }
    }

    $scope.showMainMenu = function(user){
      $scope.currentUser = user;
      $scope.isManageServiceEnabled = (user.login === $rootScope._userData.user.login);
      $scope.userSelected = user.login;

      $scope.removeFilter();
      $scope.isMainMenu = true;
      $scope.userBodyMenu = true;
    }

    $scope.focusSearch = function(){
      $scope.focusOn = true;
      return $scope.focusOn;
    }

    $scope.showBodyMenu = function(menuType){
      if (menuType === 'settings'){
        $scope.settingsBodyMenu = true;
        $scope.permBodyMenu = false;
        $scope.userBodyMenu = false;
        $scope.apiBodyMenu = false;
      }else if (menuType === 'permissions'){
        $scope.settingsBodyMenu = false;
        $scope.permBodyMenu = true;
        $scope.userBodyMenu = false;
        $scope.apiBodyMenu = false;
      }else if (menuType === 'api'){
        $scope.apiBodyMenu = true;
        $scope.settingsBodyMenu = false;
        $scope.permBodyMenu = false;
        $scope.userBodyMenu = false;
      }
    }

    $scope.openDialog = function (template_url, data) {
      //var url = 'app/components/user/user-diag.tmpl.html';
      Dialog.open(template_url, 'userDialogCtrl', data);
    }

  }

  /** 
  * DIALOG CONTROLLER 
  **/
  function userDialogCtrl($scope, $mdDialog, $rootScope, $state, $q, data, userResource, resource){
    var clientResource = resource.clients;

    $scope.newUser = { 
      restrictAccess : true,
      globaladmin : false,
      admin : false,
      enableapi : false
    };

    $scope.currentUser = $rootScope._userData.user;
    if (data){
      // variable bind to view
      $scope.editUser = JSON.parse(JSON.stringify(data));
      $scope.editUser.password1 = null;
    }
    $scope.selectedItem  = null;
    $scope.searchText    = null;
    $scope.querySearch   = querySearch;


    $scope.closeDialog = function() {
      $mdDialog.hide();
    }

    $scope.saveCreateDialog = function(){
      var createData = {
        client_name : $scope.newUser.client.value,
        name : $scope.newUser.name,
        email : $scope.newUser.email,
        password : $scope.newUser.password1,
        enable_api : $scope.newUser.enableapi,
        global_admin : $scope.newUser.globaladmin,
        admin : $scope.newUser.admin
      };

      userResource.create({ userName : $scope.newUser.login }, createData, function(data){
        $state.reload();
        $mdDialog.hide();
      }, function(data){
        console.log('Error creating new user');
        console.log(data);
      });

    }

    $scope.saveEditDialog = function(user){
      var updateData = {
        name : user.name,
        email : user.email,
        enable_api : user.api_enabled,
        admin : user.admin
      };

      if (user.password1){
        updateData['password'] = user.password1;
      }

      // Only admin can change client name
      if ($scope.currentUser.global_admin || $scope.currentUser.admin){
        if (user.client.name){
          updateData['client_name'] = user.client.name.display;  
        }
      }

      userResource.update({ userName : user.login }, updateData, function(data){
        $state.reload();
        $mdDialog.hide();
      }, function(data){
        console.log('Error updating new user' + user.login);
        console.log(data);
      });
    }

    function querySearch(query) {
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
        if ($rootScope._userData.user.reseller){
          resellerName = $rootScope._userData.user.reseller.name;
        }
        else {
          resellerName = $rootScope._userData.user.client.reseller.name;
        }
        

        return clientResource.clients.get({resellerName : resellerName, clientName : query}, function(data){
          var clients = data.response.clients;
          data.response = clients.map(function(client){
            return {
              value : client.name.toLowerCase(),
              display : client.name + ' : ' + client.company
            };
          })
        });

      }
      else {
        return clientResource.clients_ga.get({clientName : query}, function(data){
          var clients = data.response.clients;
          data.response = clients.map(function(client){
            console.log(client);
            return {
              value : client.name.toLowerCase(),
              display : client.name + ' : ' + client.company
            };
          })
        });
      }
    }

    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(state) {
        return (state.value.indexOf(lowercaseQuery) === 0);
      };
    }
  }

  app.controller("userDialogCtrl", userDialogCtrl);
  app.controller("userCtrl", userCtrl);
  
}());