(function(){
  
  var app = angular.module("jenovaApp");


  function serviceCtrl($scope, $mdDialog, $state, $rootScope, servicesResources, Dialog){
    $scope.services = [];

    if ( ! $scope.services.$resolved ){
      servicesResources.get({serviceName : 'all'}, function(data){
        for ( index in data.response){
          var service = data.response[index];

          service.created_at = Date(service.created_at);
          //TODO Live service status
          service.sla = '100.0';
          service.status = { desc : 'Todos os serviços estão operacionais', ico : 'done', color : '#00c853' };
          service.syncDisable = true;
          
          $scope.services.push(service);
        };

        $scope.services.$resolved = data.$resolved;
        
        console.log(data);
      }, function(data){
        console.log('Error getting services');
        console.log(data);

      });
    }

    $scope.isGlobalAdmin = !$rootScope._userData.global_admin;

    $scope.openDialog = function(template_url, data) {
      Dialog.open(template_url, 'serviceDialogCtrl', data);
    }

    $scope.closeDialog = function() {
      $mdDialog.hide();
    }

    /*
    *Delete Service
    */
    $scope.deleteService = function(currentService){
      servicesResources.remove({serviceName : currentService.name}, function(data){
        console.log('Service successfully deleted: ' + currentService.name);
        
        // Updating view
        $state.reload();
        $mdDialog.hide();

        console.log(data);
      }, function(data){
        console.log('Error delete service: ' + currentService.name);
        console.log(data);
      });
    }
  }

  function serviceDialogCtrl($scope, $mdConstant, $mdDialog, $rootScope, $state, Dialog, servicesResources, noticesResources, data){
    
    $scope.srv_types = ['ZIMBRA', 'MXHERO', 'DNS'];

    $scope.author = $rootScope._userData['user']['login'];
    
    $scope.notices_types = [
    { type: 'maintenance', desc: 'Manutenção Programada'},
    { type: 'resolved', desc: 'Resolvido'},
    { type: 'info', desc: 'Informativo'},
    { type: 'incident', desc: 'Incidente'}
    ];

    $scope.currentService = data;
    $scope.services = data;
     
    $scope.searchText = null;
    $scope.querySearch = querySearch;
    $scope.servicesSearch = loadServices();
    
    $scope.loadNotices = function(){

      // $scope.notices = {};
      var notice_settings = {
        maintenance : {
          ico : 'healing',
          color : 'orange',
          desc : 'Manutenção Programada'
        },
        incident : {
          ico : 'report_problem',
          color : 'red',
          desc : 'Incidente'
        },
        resolved : {
          ico : 'check',
          color : 'green',
          desc : 'Resolvido'
        },
        info : {
          ico: 'info',
          color : 'blue',
          desc : 'Informativo'
        }
      };

      $scope.notices = {};
      for ( sidx in $scope.services ){
        service_name = $scope.services[sidx].name;
        $scope.notices[service_name] = [];
        
        noticesResources.get({serviceName : service_name}, function(data){
          for ( index in data.response){
            var notice = data.response[index];

            notice.ico = notice_settings[notice.notice_type].ico;
            notice.ico_color = notice_settings[notice.notice_type].color;
            notice.type_desc = notice_settings[notice.notice_type].desc;
            $scope.notices[notice.service_name].push(notice);
            // console.log(notice);
          }
          console.log($scope.notices);

        }, function(data){
          console.log('Error getting notices');
          console.log(data);

        });
      }

      
 
    }

    /*
    *Create Notice
    */
    $scope.saveCreateNoticeDialog = function(newNotice){
      
      updateData = {
        author : $scope.author,
        started_at : newNotice.started_at,
        ended_at : newNotice.ended_at,
        notice_type : newNotice.notice_type,
        description : newNotice.description,
        sla_impact : newNotice.sla_impact
      };

      // console.log(updateData)

      noticesResources.create({serviceName : newNotice.service_name._lowername}, updateData, function(data){
        console.log('Notice successfully created');
        
        // Updating view
        $state.reload();
        $mdDialog.hide();

        console.log(data);
      }, function(data){
        console.log('Error creating notice: ');
        console.log(data);
      });
    }

    /*
    *Edit services
    */
    $scope.saveEditDialog = function(currentService){
      
      
      updateData = {
        service_host : currentService.service_host,
        service_desc : currentService.service_desc,
        service_type : currentService.service_type.toUpperCase(),
        service_url : currentService.service_url,
        service_api : currentService.service_api,
        credentials_identity : currentService.cred_identity,
        credentials_secret : currentService.cred_secret,
      };

      servicesResources.update({serviceName : currentService.name}, updateData, function(data){
        console.log('Service successfully created: ' + currentService.name);
        console.log(data);

        // Updating view
        $state.reload();
        $mdDialog.hide();


      }, function(data){
        console.log('Error creating new service: ' + currentService.name);
        console.log(data);
      });
    }



    /*
    *Create new services
    */
    $scope.saveCreateDialog = function(newService){
      
      updateData = {
        service_host : newService.host,
        service_desc : newService.desc,
        service_type : newService.type.toUpperCase(),
        service_url : newService.url,
        service_api : newService.api,
        credentials_identity : newService.cred_identity,
        credentials_secret : newService.cred_secret,
      };

      servicesResources.create({serviceName : newService.name}, updateData, function(data){
        console.log('Service successfully created: ' + newService.name);
        console.log(data);        
        // Updating view
        $state.reload();
        $mdDialog.hide();


      }, function(data){
        console.log('Error creating new service: ' + newService.name);
        console.log(data);
      });
    }


    function loadServices() {
        console.log($scope.services);

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
      console.log('createFilterFor:' + query);
      return function filterFn(service) {
        return (service._lowername.indexOf(lowercaseQuery) === 0) ||
            (service._lowerdesc.indexOf(lowercaseQuery) === 0);
      };}   

    /**
    * Search for services.
    */
    function querySearch (query) {
      console.log('querySearch ' + query);
      var results = query ? $scope.servicesSearch.filter(createFilterFor(query)) : [];
      return results;}




    $scope.closeDialog = function() {
      $mdDialog.hide();
    }

    $scope.openDialog = function(template_url, data) {
      Dialog.open(template_url, 'serviceDialogCtrl', data);
    }
  }


  app.controller("serviceCtrl", serviceCtrl);
  app.controller("serviceDialogCtrl", serviceDialogCtrl);
  
}());