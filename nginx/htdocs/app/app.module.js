/**
 * Load modules for application
 */
var app = angular.module('jenovaApp', [
      'ui.router',
      'ngMaterial',
      'md.data.table',
      'ngMessages',
      'angular-jwt',
      'ngAnimate',
      'ngResource'
  ])
  .constant('APIHOST', 'https://localhost:8443');

app.factory('Dialog', ['$mdDialog', function DialogFactory ($mdDialog) {
  return {
    open: function (url, ctrl, data, clickOutsideToClose) {
      // Default true
      clickOutsideToClose = typeof clickOutsideToClose !== 'undefined' ? clickOutsideToClose : true;

      return $mdDialog.show({
        autoWrap : true,
        clickOutsideToClose : clickOutsideToClose,
        templateUrl: url,
        controller: ctrl,
        locals: {
          data : data
        }
      });
    },
  }
}]);

app.factory('mdToast', function($mdToast){
  var mdToast = $mdToast;
  mdToast.getSimple = function(msg, delay){
    var simple = $mdToast.simple()
      .textContent(msg)
      .action('OK')
      .hideDelay(0)
      .highlightAction(true);
    if (delay){
      simple.hideDelay(delay);
    }
    return simple;
  }
  return mdToast;
});

app.factory('authInterceptor', function($rootScope, $q, $window){
  return {
    hasToken : function(){
      if ($window.sessionStorage.token) {
        //alert($window.sessionStorage.token);
        return true;
      }
      return false;

    },
    expireToken : function(){
      delete $window.sessionStorage.token;
    },
    request : function (config) {
      //console.log('HERE INTERCEPTOR');
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
      }
      return config;
    },
    response : function (response) {
      if (response.status == 401){
        // handle the case where the user is not authenticated
      }
      return response || $q.when(response);
    }
  };
});

app.factory('tokenPayload', function($window, jwtHelper) {
  function loadPermissions(permissions){
    var defaultPermissions = {
      dns : {
        scopeName : 'DNS'
      },
      domain : {
        scopeName : 'Domínios'
      },
      client : {
        scopeName : 'Cliente'
      },
      users : {
        scopeName : 'Usuários'
      },
      zimbra_login_delegated : {
        scopeName : 'Login Delegado Zimbra'
      },
      permissions : {
        scopeName : 'Permissões'
      }
    };

    var perms = ['read', 'write', 'edit', 'delete'];
    for (perm in perms){
      defaultPermissions[perms[perm]] = false;
    }

    for (index in permissions){
      try{
        perm = permissions[index];
        //console.log(perm);
        defaultPermissions[perm.scope.name] = {
          read : perm.read,
          write : perm.write,
          edit : perm.edit,
          delete : perm.delete,
          scopeName : defaultPermissions[perm.scope.name].scopeName
        };
      }catch (err){
        console.log('Error setting permission, using default. ' + err);
      }
    }
    return defaultPermissions;

  }
  return {

    data : function() {
      var token = jwtHelper.decodeToken($window.sessionStorage.token);
      if (!token.user){
        delete $window.sessionStorage.token;
        //return $location.path('/login');
      }

      //var data = {permissions : token.user.permissions}
      permissions = loadPermissions(token.user.permissions);
      token.user.permissions = permissions;

      return {
        user : token.user,
        permissions : permissions,
        isAdmin : token.user.admin || token.user.global_admin
      }
    },
    loadPermissions : loadPermissions
  };
});

// DEPRECATED - remove later
app.factory('authResource', function($resource, APIHOST) {
  return $resource(APIHOST + '/login', null, {
    'post' : { method : 'POST' }
  });
});

// DEPRECATED - remove later
app.factory('userResource', function($resource, APIHOST) {
  return $resource(APIHOST + '/users/:userName', null, {
    'update' : { method : 'PUT' },
    'create' : { method : 'POST' }
  });
});

// DEPRECATED - remove later
app.factory('userPermResource', function($resource, APIHOST) {
  return $resource(APIHOST + '/scopes/:scopeName/users/:userName/permissions', null, {
    'update' : { method : 'PUT' }
  });
});

// DEPRECATED - remove later
app.factory('dnsSOAResource', function($resource, APIHOST) {
  //TODO: remove hard coded service name.
  // Today only one dns can be managed.
  return $resource(APIHOST + '/service/dns/zone/:domainName', null, {});
});

// DEPRECATED - remove later
app.factory('dnsDeleteRecordResource', function($resource, APIHOST) {
  //TODO: remove hard coded service name.
  // Today only one dns can be managed.
  return $resource(APIHOST + '/service/dns/zone/:domainName/type/:typeName/name/:recordName/content/:contentName/ttl/:ttlValue', null, {});
});

// DEPRECATED - remove later
app.factory('dnsRecordResource', function($resource, APIHOST) {
  //TODO: remove hard coded service name.
  return $resource(APIHOST + '/service/dns/zone/:domainName/type/:typeName/name/:recordName', null, {
    'update' : { method : 'PUT' },
    'create' : { method : 'POST'}
  });
});

// DEPRECATED - remove later
app.factory('dnsBackupZonesResource', function($resource, APIHOST) {
  //TODO: remove hard coded service name.
  return $resource(APIHOST + '/service/dns/zone/:domainName/backup', null , {
    'restore' : { method : 'PUT' }
  });
});

// DEPRECATED - remove later
app.factory('servicesResources', function($resource, APIHOST) {
  return $resource(APIHOST + '/service/:serviceName', null, {
    'create' : { method : 'POST' },
    'update' : { method : 'PUT' },
    'remove' : { method : 'DELETE' }
  });
});

// DEPRECATED - remove later
app.factory('noticesResources', function($resource, APIHOST, $q) {
  return $resource(APIHOST + '/service/:serviceName/notices/', null, {
    'create' : { method : 'POST' },
    'update' : { method : 'PUT' },
    'remove' : { method : 'DELETE' }
  });
});

// DEPRECATED - remove later
app.factory('clientResource', function($resource, APIHOST) {
  return {
    resellers : $resource(APIHOST + '/resellers/:resellerName', null, {
      'update' : { method : 'PUT' },
      'create' : { method: 'POST' }
    }),
    clients : $resource(APIHOST + '/resellers/:resellerName/clients/:clientName', null, {
      'update' : { method : 'PUT' },
      'create' : { method: 'POST' }
    }),
  };
});

// TODO Refactoring $scope.current[Domain|Reseller|Service] for routing porpuse.
app.factory("currentData",function(){
  return {
    domain : {},
    service : {},
    reseller : {},
  }
})

// TODO: Refactoring resources
app.factory('resource', function($resource, APIHOST) {
  return {
    cos : {
      domain : $resource(APIHOST + '/services/:serviceName/domains/:domainName/cos', null, {
        'update' : { method : 'PUT' },
      })
    },
    // reports
    reports : {
      reseller : $resource(APIHOST + '/reports/:resellerName', null, {}), 
      domain : $resource(APIHOST + '/reports/domains/:domainName/services/:serviceName', null, {})
    },
    //accountsResource
    accounts : $resource(APIHOST + '/services/:serviceName/domains/:domainName/accounts/:accountName', null, {
      'update' : { method : 'PUT' },
      'create' : { method : 'POST'}
    }),

    //accountsListResource
    accountsList : $resource(APIHOST + '/services/:serviceName/domains/:domainName/accounts', null, {}),

    //domainResource
    domains : {
      clients : $resource(APIHOST + '/clients/:clientName/domains/:domainName', null, {
        'create' : { method : 'POST' },
        'update' : { method : 'PUT' },
        'delete' : { method : 'DELETE' }

      }),
      resellers : $resource(APIHOST + '/resellers/:resellerName/domains/:domainName', null, {}),
      states : $resource(APIHOST + '/clients/:clientName/domains/:domainName/services', null, {}),
      sync : $resource(APIHOST + '/services/:serviceName/domains/:domainName', null, {
        'update' : { method : 'PUT' },
        'delete' : { method : 'DELETE' }
      }),
      tasks : $resource(APIHOST + '/tasks/:taskType/id/:jobId'),
      zstatus : $resource(APIHOST + '/services/:serviceName/domains/:domainName/status', null, {
        'update' : { method : 'PUT' },
      }),
      zlogin : $resource(APIHOST + '/services/:serviceName/domains/:domainName/preauth', null, {
        'auth' : { method : 'GET' }
      }),
    },

    //clientResource
    clients : {
      resellers : $resource(APIHOST + '/resellers/:resellerName', null, {
        'update' : { method : 'PUT' },
        'create' : { method: 'POST' }
      }),
      clients : $resource(APIHOST + '/resellers/:resellerName/clients/:clientName', null, {
        'update' : { method : 'PUT' },
        'create' : { method: 'POST' }
      }),
    },
    //noticeResource
    notices : $resource(APIHOST + '/service/:serviceName/notices/', null, {
      'create' : { method : 'POST' },
      'update' : { method : 'PUT' },
      'remove' : { method : 'DELETE' }
    }),
    //serviceResource
    services: $resource(APIHOST + '/service/:serviceName', null, {
      'create' : { method : 'POST' },
      'update' : { method : 'PUT' },
      'remove' : { method : 'DELETE' }
    }),
    //userResource
    users: $resource(APIHOST + '/users/:userName', null, {
      'update' : { method : 'PUT' },
      'create' : { method : 'POST' }
    }),
    //scopeResource
    scopes: $resource(APIHOST + '/scopes/:scopeName/users/:userName/permissions', null, {
      'update' : { method : 'PUT' }
    }),
    //authResource
    auth: $resource(APIHOST + '/login', null, {
      'post' : { method : 'POST' }
    }),
    //dnsResource
    dns : {
      soa : $resource(APIHOST + '/service/dns/zone/:domainName', null, {}),
      backups : $resource(APIHOST + '/service/dns/zone/:domainName/backup', null , {
        'restore' : { method : 'PUT' }
      }),
      records : $resource(APIHOST + '/service/dns/zone/:domainName/type/:typeName/name/:recordName', null, {
        'update' : { method : 'PUT' },
        'create' : { method : 'POST'}
      }),
      delRecord : $resource(APIHOST + '/service/dns/zone/:domainName/type/:typeName/name/:recordName/content/:contentName/ttl/:ttlValue', null, {})
    }
  };
});

app.run(function($rootScope, $location, $window){
  // Redirect to login if route requires auth and you're not logged in
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
    if ($location.url() !== '/login' && !$window.sessionStorage.token){
      //$rootScope.returnToState = toState.url;
      //$rootScope.returnToStateParams = toParams.Id;
      //$location.path('/login');
      return $location.path('/login');
    }
  });
});

/** Focus INPUT on click **/
app.directive('focusMe', function($timeout) {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.focusMe, function(value) {
        if(value === true) {
          $timeout(function() {
            element[0].focus();
            scope[attrs.focusMe] = false;
          },0);
        }
      });
    }
  };
});

app.directive('compareTo', [function() {
  return {
    require: "ngModel",
    scope: {
      otherModelValue: "=compareTo"
    },
    link: function(scope, element, attributes, ngModel) {

      ngModel.$validators.compareTo = function(modelValue) {
        // If both are null or undefined, skip check
        if (modelValue === undefined || modelValue === null
          && scope.otherModelValue === undefined || scope.otherModelValue === null){
          return true;
        }
        return modelValue == scope.otherModelValue;
      };

      scope.$watch("otherModelValue", function() {
        ngModel.$validate();
      });
    }
  };
}]);

app.config(function($httpProvider){
  $httpProvider.interceptors.push('authInterceptor');

});

app.config(function($mdThemingProvider){
  $mdThemingProvider.theme('default')
    .primaryPalette('blue')
});
