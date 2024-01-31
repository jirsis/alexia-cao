#!/bin/bash


#### curl 'https://menuak.ausolan.com/menu/menuMes/cargarPlatos?idMenu=23071274&idServicioTurno=11083510&calcularSiguiente=&fecha=Fri+Jan+26+2024+00%3A00%3A00+GMT%2B0100+(hora+est%C3%A1ndar+de+Europa+central)' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0' -H 'Accept: */*' -H 'Accept-Language: es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'X-Requested-With: XMLHttpRequest' -H 'DNT: 1' -H 'Connection: keep-alive' -H 'Referer: https://menuak.ausolan.com/menu/menuCentro' -H 'Cookie: JSESSIONID=6dB2P7fWZrS-RfG05Zzo2EAC.undefined; _ga=GA1.3.1596720451.1706258366; _gid=GA1.3.1010123082.1706258366' -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-origin' -H 'Pragma: no-cache' -H 'Cache-Control: no-cache' > menu-ausolan-ene2024.json

#### curl 'https://menuak.ausolan.com/menu/cargarIngredientes' -X POST -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0' -H 'Accept: */*' -H 'Accept-Language: es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'X-Requested-With: XMLHttpRequest' -H 'Origin: https://menuak.ausolan.com' -H 'DNT: 1' -H 'Connection: keep-alive' -H 'Referer: https://menuak.ausolan.com/menu/menuCentro' -H 'Cookie: JSESSIONID=6dB2P7fWZrS-RfG05Zzo2EAC.undefined; _ga=GA1.3.1596720451.1706258366; _gid=GA1.3.1010123082.1706258366' -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-origin' -H 'Pragma: no-cache' -H 'Cache-Control: no-cache' --data-raw 'idMenu=23071274&idPlatoVersion=1507239&idPlatoVersionGuarnicion=0&nombrePlato=ARROZ+CON+TOMATE' > menu-ausolan-08ene2024-1.json

HOME_DIR=febrero2024
FILE=$HOME_DIR/$HOME_DIR.json
ID_MENU="23129483"
JSESSIONID="HhbYxwb1J9ZGW85Ig2ClvaGR.undefined"

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
