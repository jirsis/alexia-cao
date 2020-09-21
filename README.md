# alexia-cao
Show Colegio Alameda de Osuna information in MagicMirror2

## Comedor

*http://www.colegio-alameda.com/comedor/ -> Ver menú*

```
https://www.npmjs.com/package/pdfreader
https://www.npmjs.com/package/pdf2json
```


## Información diaria

- login: http://web2.alexiaedu.com/ACWeb/LogOn.aspx?key=iJngi7tF4QU%253d
  user / password
- home: https://web2.alexiaedu.com/ACWeb/paginas/Home/HomeMetro.aspx
- incidencias: https://web2.alexiaedu.com/ACWeb/paginas/Fichas/FichaAlumno.aspx?GuidAlumno=02a900a4-0b3e-d796-5519-f42432e5d708&IndexTabPropuesta=17
  * comida
  * merienda
  * observaciones
  * siesta
- logoff


## Flujo

1. arranca el módulo y configura eventos
1. arranca la ejecución
1. comprueba que existe ```/tmp/menu-YYYY.MM.json```
   * NO: 
      1. descargar el pdf del menu 
      1. convertirlo a json
      1. guardar el json en ```/tmp/menu-YYYY.MM.json```
1. existe el menu
1. recupera el menu del día actual
1. login en alexia
1. comprobar que estamos en la landing
1. ir a incidencias
1. recuperar incidencias de:
    * comida
    * merienda
    * observacviones
    * siesta
1. logout
1. esperar a la siguiente ejecución