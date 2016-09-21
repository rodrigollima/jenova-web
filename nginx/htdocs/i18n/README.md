# [JENOVA i18n](https://github.com/inova-tecnologias/jenova-web/issues/26)
WIP!

How to contribute for internationalization?

  - Configure the app to your language in app.module.js
  ``` 
    ...
        $translateProvider.preferredLanguage(en-us)
    ...      
  ```
  - If you create a new view, you have that add the resolver of tranlation in app.states.js
  ```
    ...
       resolve: {
                translatePartialLoader: ['$translate', '$translatePartialLoader', 
                function ($translate, $translatePartialLoader) {
                    $translatePartialLoader.addPart('mynewview');
                    return $translate.refresh();
                }]
        }
    ...
  ```
  - Now create a json file (mynewview.json) in folder i18n/your_lang/mynewview.json like this:
      - If you add support to a new language, create the folder in i18n naming with using ISO locale, 
  ```
    {
        "key_word": "Key word"
    }
  ```
  - In your template html, translate like this:
  ```
      <p>{{'key_word' | translate}}</p>
  ```
  - Finaly, verify if the your language exists in app/components/language/language.service.js
  ```
    ...
        .constant('LANGUAGES', [
            'en-us',
            'pt-br'
        ]
  ```
  - if you want to translate in the controller do so:
  ```
      function yourCtrl(..., $filter){
          var $translate = $filter('translate');
          $scope.title = $translate('title');
      }
      
  ```