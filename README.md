# Jenova Web
Jenova is an open source project to manage in one place Zimbra, mxHero and PowerDNS services. 
This gives the abillity for administrators configure and manage multiple Zimbra clusters and grant 
permissions to users administrate their domains at scale with different users roles, global admins, reseller admins 
and client admins.

## Supported Platforms
 - Zimbra Network Edition 8.5 +
 - Zimbra OSE 8.5 +
 - Mxhero 2.2.4
 - PowerDNS 3.4

## Demo

[![Alt text for your video](http://img.youtube.com/vi/U7jRiZUXggA/0.jpg)](https://www.youtube.com/watch?v=U7jRiZUXggA)

## Development Environment

This instructions will help you to build the development environment.

### Requirements
 - docker and docker-compose
 - bower

```bash
$ git clone https://github.com/inova-tecnologias/jenova-web.git
$ cd jenova-web/nginx/htdocs/
$ bower install
```

create self signed certificates

```bash
$ openssl req \
       -newkey rsa:2048 -nodes -keyout mydomain.key \
       -x509 -days 365 -out mydomain.crt
```

> Make sure you change the API Host on `app/app.module.js` to the host you've deployed [jenova](https://github.com/inova-tecnologias/jenova)

```js
  .constant('APIHOST', 'https://localhost:8443');
```


Build and run

```bash
$ docker-compose build && docker-compose up
```

## Docker Images
If you want only run Jenova in your server,  docker pull on this image available in [Docker Hub](https://hub.docker.com/r/inova/jenova-web/).