### Install Node + NPM

https://docs.npmjs.com/getting-started/installing-node

#### Install http-server

```bash
npm install http-server -g
cd jenova-web && bower -f install
```

```bash
cd jenova-web
# development mode (prevent cache of dialogs. use incognito mode)
http-server -c1
```

### Configuration instructions

For now you need to use a hostname in your hosts pointing to jenova api

```bash
# /etc/hosts
dockerhost -> ip-of-your-docker
```
