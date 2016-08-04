(function(){
  var app = angular.module("jenovaApp");

  function dnsCtrl($scope, $stateParams, $rootScope, resource, Dialog, $state, $q, mdToast){
    var dnsSOAResource = resource.dns.soa;
    var dnsRecordResource = resource.dns.records;
    var dnsDeleteRecordResource = resource.dns.delRecord;

    $scope.dnsdata = [];
    $scope.domainName = $stateParams.domain;
    $scope.dnsOverlayLoader = true;
    $scope.dnsOverlayLoaderStatus = 'Carregando...'

    dnsSOAResource.get({domainName : $scope.domainName}, function(data){
      console.log('DNS records loaded succssfully.');
      for (index in data.records){
        var record = data.records[index];
        $scope.dnsdata.push(record);
      }
      $scope.dnsOverlayLoader = false;
    }, function(data){
      console.log('Error getting DNS records. See response below...');
      console.log(data);
      var msg = data.status + ' - Erro ao obter registros: ';
      if (data.status == 404){
        msg += 'Domínio ou registros não encontrados';
      }else{
        msg += 'Tente novamente ou mais tarde.';
      }
      mdToast.show(mdToast.getSimple(msg, 5000));
    });

    $scope.selected = [];
    $scope.filter = {
      options: {
        debounce: 500
      },
      form : ''
    };

    $scope.query = {
      filter: '',
      order: 'name',
      limit: 50,
      page: 1
    };

    var userData = $rootScope._userData;
    $scope.isAdmin = (userData.user.global_admin)
    $scope.isDnsWriteEnabled = !(userData.isAdmin || userData.permissions.dns.write);
    $scope.isDnsDeleteEnabled = !(userData.isAdmin || userData.permissions.dns.delete);
    $scope.isDnsEditEnabled = !(userData.isAdmin || userData.permissions.dns.edit);

    $scope.deleteRecord = function(){
      var deletePromises = [];
      var promise;
      for ( sidx in $scope.selected) {
        record = $scope.selected[sidx];
        tblidx = $scope.dnsdata.indexOf(record);
        if ( tblidx !== -1) { // only delete selected ones
          $scope.dnsdata.splice(tblidx, 1);
    
          deletePromises.push({ 
            pathParams : {
                domainName : $scope.domainName,
                typeName : record.type,
                recordName : record.name,
                contentName : record.content,
                ttlValue : record.ttl
            },
            fn : function(pathParams){
              var d = $q.defer();

              promise = dnsDeleteRecordResource.delete(pathParams,
                function(data){
                  console.log('deleted ' + pathParams.recordName + ' type ' + pathParams.typeName);
                  d.resolve();
                }, function(data) { 
                  console.log('Error deleting record. See response below...');
                  console.log(data);
                  var msg = data.status + ' - Erro ao deletar registro ' ;
                  msg += pathParams.recordName + ' do tipo ' + pathParams.typeName;
                  mdToast.show(mdToast.getSimple(msg, 5000));
              });
              return d.promise;
          }});
        }
      }

      chain = $q.when();
      angular.forEach(deletePromises, function(call) {
        chain = chain.then(function() {
          return call.fn(call.pathParams); 
        })
      });
      $scope.selected = [];
    };

    // in the future we may see a few built in alternate headers but in the mean time
    // you can implement your own search header and do something like
    $scope.search = function (predicate) {
      $scope.filter = predicate;
      $scope.deferred = $scope.dnsdata;
    };

    $scope.removeFilter = function () {
      $scope.filter.show = false;
      $scope.query.filter = '';
      
      if($scope.filter.form.$dirty) {
        $scope.filter.form.$setPristine();
      }
    };

    $scope.openDialog = function(template_url, data) {
      Dialog.open(template_url, 'dnsDialogCtrl', data);
    }

    $scope.$watch('query.filter', function (newValue, oldValue) {
      if(!oldValue) {
        bookmark = $scope.query.page;
      }
      if(newValue !== oldValue) {
        $scope.query.page = 1;
      }
      if(!newValue) {
        $scope.query.page = bookmark;
      }
    });
  }

  /**
  * DIALOG CONTROLLER 
  * TODO: Handle Exceptions
  **/
  function dnsDialogCtrl($scope, $stateParams, $rootScope, $mdDialog, $state, data, mdToast, dnsRecordResource, dnsBackupZonesResource) {
    $scope.dns_types = ['A', 'AAAA', 'MX', 'CNAME', 'SRV', 'TXT', 'PTR', 'NS']
    $scope.domainName = $stateParams.domain;

    if (data) {
      $scope.currentRecord = data;
      $scope.old_record = angular.copy($scope.currentRecord)
    }

    $scope.restores = [];
    $scope.restores_loaded = false;
    $scope.loadZoneRestores = function() {
      if ( ! $scope.restores_loaded ) {
        // get restores available
        dnsBackupZonesResource.get({domainName : $scope.domainName}, function(data){
          console.log('Loaded available backups successfully');
          for ( idx in data.backups ){        
            var restore = data.backups[idx];
            $scope.restores.push(restore);
          };
          $scope.restores_loaded = true;
      
        }, function(data){
          console.log('Error getting available backups. See response below...');
          console.log(data);
          var msg = data.status + ' - Erro ao obter backups';
          mdToast.show(mdToast.getSimple(msg, 5000));
        });
      }
    }

    $scope.restoreZoneDialog = function(restore) {
      var restoreData = {
        backup_id : restore.id
      }
      dnsBackupZonesResource.restore({domainName : $scope.domainName}, restoreData,function(data){
        console.log('Restored zone successfully.');
        // Updating view
        $state.reload();
        $mdDialog.hide();
      }, function(data){
        console.log('Error getting DNS Restores. See response below...');
        console.log(data);
        mdToast.show(mdToast.getSimple(data.status + ' - Erro ao restaurar zona', 5000));
      });
    }

    $scope.saveEditDialog = function(record) {
      $scope.currentRecord.$resolved = true;
      var updateData = {
        old_content : $scope.old_record.content || record.content,
        old_ttl : $scope.old_record.ttl || record.ttl,
        new_registry_name : record.name,
        new_content : record.content,
        new_ttl : record.ttl
      }

      pathParams = { domainName : $scope.domainName, typeName : $scope.old_record.type, recordName : $scope.old_record.name};
      dnsRecordResource.update( pathParams, updateData, function(data){
        console.log('Record sucessfully updated.');        
        // Updating view
        $state.reload();
        $mdDialog.hide();
      }, function(data){
        $scope.currentRecord.$resolved = false;
        console.log('Error updating dns record: ' + record.name);
        console.log(data);
        mdToast.show(mdToast.getSimple(data.status + ' - Erro ao editar registro', 5000));
      });
      
    }

    $scope.saveCreateDialog = function(){
      var updateData = {
        content : $scope.newRecord.content,
        ttl : $scope.newRecord.ttl
      }
      
      if ( $scope.newRecord.name == '@' ) {
        $scope.newRecord.name = $scope.domainName // add domain name if @ specified as record name.
      }

      pathParams = { 
        domainName : $scope.domainName, 
        typeName : $scope.newRecord.type, 
        recordName : $scope.newRecord.name
      };

      dnsRecordResource.create(pathParams, updateData, function(data){
        console.log('Create record sucessfully');
        $state.reload();
        $mdDialog.hide();
      }, function(data){
        $scope.newRecord.$resolved = false;
        console.log('Error creating DNS record. See response below...');
        console.log(data);
        mdToast.show(mdToast.getSimple(data.status + ' - Erro ao criar novo registro', 5000));
      });
    }

    $scope.closeDialog = function() {
      $mdDialog.hide();
    }
  }

  app.controller("dnsCtrl", dnsCtrl);
  app.controller("dnsDialogCtrl", dnsDialogCtrl);
  
}());