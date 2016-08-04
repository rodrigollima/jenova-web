/**
 * Load states for application
 * more info on UI-Router states can be found at
 * https://github.com/angular-ui/ui-router/wiki
 */
(function(){
    var app = angular.module("jenovaApp");

    app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
        // any unknown URLS go to 404
        $urlRouterProvider.otherwise('/404');
        $stateProvider
            .state('login', {
                url: '/login',
                views : {
                    main : {
                        templateUrl: 'app/components/home/login.view.html',
                        controller: 'loginCtrl',
                    }
                }
            })
            .state('home', {
                url: '/',
                views : {
                    nav : {
                        templateUrl : 'app/shared/navbar.view.html'
                    },
                    main : {
                        templateUrl: 'app/components/home/home.view.html',
                        controller: 'homeCtrl',
                        authenticate: true
                    }
                }
            })
            .state('dns', {
                url: '/dns/:domain',
                views : {
                    nav : {
                        templateUrl : 'app/shared/navbar.view.html'
                    },
                    main : {
                        templateUrl: 'app/components/dns/dns.view.html',
                        controller: 'dnsCtrl',
                        authenticate: true
                    }
                }
            })
            .state('service', {
                url: '/service',
                views : {
                    nav : {
                        templateUrl : 'app/shared/navbar.view.html'
                    },
                    main : {
                        templateUrl: 'app/components/service/service.view.html',
                        controller: 'serviceCtrl',
                        authenticate: true
                    }
                }
            })
            .state('domain', {
                url: '/domain/:domain',
                views : {
                    nav : {
                        templateUrl : 'app/shared/navbar.view.html'
                    },
                    main : {
                        templateUrl: 'app/components/domain/domain.view.html',
                        controller: 'domainCtrl',
                        authenticate: true
                    }
                }
            })
            .state('zimbra', {
              url: '/zimbra/:domain',
              views : {
                  nav : {
                      templateUrl : 'app/shared/navbar.view.html'
                  },
                  main : {
                      templateUrl: 'app/components/zimbra/zimbra.view.html',
                      controller: 'zimbraCtrl',
                      authenticate: true
                  }
              }
            })
            .state('clientDomain', {
                url: '/client/:client/domains',
                views : {
                    nav : {
                        templateUrl : 'app/shared/navbar.view.html'
                    },
                    main : {
                        templateUrl: 'app/components/domain/domain.view.html',
                        controller: 'domainCtrl',
                        authenticate: true
                    }
                }
            })
            .state('resellerDomain', {
                url: '/reseller/:reseller/domains',
                views : {
                    nav : {
                        templateUrl : 'app/shared/navbar.view.html'
                    },
                    main : {
                        templateUrl: 'app/components/domain/domain.view.html',
                        controller: 'domainCtrl',
                        authenticate: true
                    }
                }
            })
            .state('user', {
                url: '/user',
                views : {
                    nav : {
                        templateUrl : 'app/shared/navbar.view.html'
                    },
                    main : {
                        templateUrl: 'app/components/user/user.view.html',
                        controller: 'userCtrl',
                        authenticate: true
                    }
                }
            })
            .state('client', {
                url: '/client',
                views : {
                    nav : {
                        templateUrl : 'app/shared/navbar.view.html'
                    },
                    main : {
                        templateUrl: 'app/components/client/client.view.html',
                        controller: 'clientCtrl',
                        authenticate: true
                    }
                }
            })
            .state('reseller', {
                url: '/reseller',
                views : {
                    nav : {
                        templateUrl : 'app/shared/navbar.view.html'
                    },
                    main : {
                        templateUrl: 'app/components/reseller/reseller.view.html',
                        controller: 'resellerCtrl',
                        authenticate: true
                    }
                }
            })
            .state('404', {
                url: '/404',
                views : {
                    nav : {
                        templateUrl : 'app/shared/navbar.view.html'
                    },
                    main : {
                        templateUrl: 'app/shared/404.html'
                    }
                }
            });

    }]);
}());
