#!/bin/bash


HOME_DIR=abril2024
FILE=$HOME_DIR/$HOME_DIR.json
ID_MENU="23855337"
JSESSIONID="0DAMUXJTrAxUdj-SmkcsPtdk.undefined"

for plato in $(cat $FILE | jq ".listadoPlatos[].primerosPlatos[].idPlatoVersion" - | sort | uniq); do
	curl 'https://menuak.ausolan.com/menu/cargarIngredientes' -X POST -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0' -H 'Accept: */*' -H 'Accept-Language: es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'X-Requested-With: XMLHttpRequest' -H 'Origin: https://menuak.ausolan.com' -H 'Connection: keep-alive' -H 'Referer: https://menuak.ausolan.com/menu/menuCentro' -H "Cookie: JSESSIONID=$JSESSIONID;"  --data-raw "idMenu=$ID_MENU&idPlatoVersion=$plato" > $HOME_DIR/primeros/$plato.json
	sleep 1
done

for plato in $(cat $FILE | jq ".listadoPlatos[].segundosPlatos[].idPlatoVersion" - | sort | uniq); do
	curl 'https://menuak.ausolan.com/menu/cargarIngredientes' -X POST -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0' -H 'Accept: */*' -H 'Accept-Language: es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'X-Requested-With: XMLHttpRequest' -H 'Origin: https://menuak.ausolan.com' -H 'Connection: keep-alive' -H 'Referer: https://menuak.ausolan.com/menu/menuCentro' -H "Cookie: JSESSIONID=$JSESSIONID;"  --data-raw "idMenu=$ID_MENU&idPlatoVersion=$plato" > $HOME_DIR/segundos/$plato.json
	sleep 1
done


for plato in $(cat $FILE | jq ".listadoPlatos[].postres[].idPlatoVersion" - | sort | uniq ); do
	curl 'https://menuak.ausolan.com/menu/cargarIngredientes' -X POST -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0' -H 'Accept: */*' -H 'Accept-Language: es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'X-Requested-With: XMLHttpRequest' -H 'Origin: https://menuak.ausolan.com' -H 'Connection: keep-alive' -H 'Referer: https://menuak.ausolan.com/menu/menuCentro' -H "Cookie: JSESSIONID=$JSESSIONID;"  --data-raw "idMenu=$ID_MENU&idPlatoVersion=$plato" > $HOME_DIR/postres/$plato.json
	sleep 1
done

for plato in $(cat $FILE | jq ".listadoPlatos[].pan.idPlatoVersion" - | sort | uniq ); do
	curl 'https://menuak.ausolan.com/menu/cargarIngredientes' -X POST -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0' -H 'Accept: */*' -H 'Accept-Language: es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'X-Requested-With: XMLHttpRequest' -H 'Origin: https://menuak.ausolan.com' -H 'Connection: keep-alive' -H 'Referer: https://menuak.ausolan.com/menu/menuCentro' -H "Cookie: JSESSIONID=$JSESSIONID;"  --data-raw "idMenu=$ID_MENU&idPlatoVersion=$plato" > $HOME_DIR/pan/$plato.json
	sleep 1
done
