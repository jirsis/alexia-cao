const NodeHelper = require('node_helper');
const request = require('request-promise');
const cheerio = require('cheerio');
const { Readable } = require('stream');
const fs = require('fs');
const os = require('os');
const dayjs = require('dayjs');
require('dayjs/locale/es');
const customParseFormat = require('dayjs/plugin/customParseFormat')
const path = require("path");
//require('request-debug')(request);

var alexia = {
    cookies: [],
    alexiaResponse: {},
    helper: {},

    config: {},

    log: function(msg){
        if(this.config.debug){
            console.log(msg);
        }
    },

    loadMenuFile: function(menuFileJson){
        let json = fs.readFileSync(menuFileJson);
        let menu = JSON.parse(json);
        return new Promise((resolve, reject) => {
            resolve(menu);
        });
    },

    getTodayMenu: function(){
        alexia.log("get today menu;");
        let thisMonth=(new Date().getMonth()+1);
        let jsonUrl = 'https://raw.githubusercontent.com/jirsis/alexia-cao/master/menu-'+thisMonth+'.json';
        return request(jsonUrl)
        .then(function(menuString){
            let jsonMenu = JSON.parse(menuString);
            return jsonMenu;
        })
        .then(alexia.filterToday)
        .then(function(menu){
            return menu;
        })
        .catch(function(err){
            return {
                "course": alexia.config.course,
                "day": new Date().getDate(),  
                "month": thisMonth,  
                "firstDish": {  
                  "label": "no encontré"
                },  
                "secondDish": {  
                  "label": "el menú"
                },  
                "dessertDish": {  
                  "label": "de hoy"
                }
            }

        });
    },
    
    isNumeric: function(line){
        return line.length > 0  && !isNaN(line);
    },

    isMonth: function(lines, id){
        let equals =false;
        let monthNumber = lines[id];
        let monthName = lines[id+1];
        let formattedMonth = dayjs().month(monthNumber-1).format("MMMM");
        equals = monthName.toLowerCase() === formattedMonth.toLowerCase();
        return equals;
    },

    isAlergics: function(line){
        regex = /^(\d|,)*$/;
        return line !== '' && regex.test(line); 
    },

    filterToday: function(menu){
        alexia.log("filterToday");
        let myMenu = {};
        let todayMenu = menu.length-1;
        let foundIt = false;
        let today = new Date().getDate();
        while(!foundIt && todayMenu >= 0){
            if(menu[todayMenu].day <= today){
                foundIt = true;
                myMenu = menu[todayMenu];
            }else{
                todayMenu--;
            }
        }

        if(todayMenu<0){
            myMenu = menu[0];
        }

        myMenu['course'] = alexia.config.course;
        return myMenu;
    },

    dailyActivity: async function(activity){
        let resumen = [];
        let entradasTotales = activity.entradasTotales;
        let observacionesComida = '';
        let dateLimit = undefined;
        
        for (let entrada in entradasTotales){
            let date = await entradasTotales[entrada].$eval('.fecha_comentario > span', n => n.innerText);
            let tipo = await entradasTotales[entrada].$eval('h5', n => n.innerText);
            
            if (dateLimit === undefined){
                dateLimit = date;
            }

            if (dateLimit !== date){
                break;
            }

            let today = resumen[date]===undefined?{}:resumen[date];
            
            today['date'] = date;
            if(tipo === 'Observaciones'){
                let observaciones = await (await (await entradasTotales[entrada].$('.observaciones_notificaciones')).getProperty('title')).jsonValue();
                today['observaciones']=observaciones.replace(/\n/g, ' ');
            }else if(tipo === 'Siesta'){
                let siesta = await (await (await entradasTotales[entrada].$('li')).getProperty('title')).jsonValue();
                today.siesta = siesta.replace(/\n/g, ' ');
            }else if(tipo === 'Comida'){
                let comida = await (await (await entradasTotales[entrada].$('li')).getProperty('title')).jsonValue();
                today.comida = comida.replace(/\n/g, ' ');
                observacionesComida = await entradasTotales[entrada].$eval('.observaciones_notificaciones', n => n.innerText);
            }else if(tipo === 'Merienda'){
                let merienda = await (await (await entradasTotales[entrada].$('p')).getProperty('title')).jsonValue();
                today.merienda = merienda.replace(/\n/g, ' ');
            }else if(tipo === 'Deposiciones'){
                let deposiciones = await (await (await entradasTotales[entrada].$('li')).getProperty('title')).jsonValue();
                today.deposiciones = deposiciones.replace(/\n/g, ' ');
            }else{
                console.log("+"+date + " -> "+tipo);     
            }   
    
            if(observacionesComida !== ''){
                today['observaciones'] = today['observaciones'] + '<br> comida: '+observacionesComida;   
                observacionesComida = '';
            }
            resumen[date]=today;
        }
        await activity.browser.close();
        return resumen;
    },

    mixMenuWithActivity: function(menu, dailyActivitiesResume){
        const formatDate = 'MMMM/D';
        dayjs.extend(customParseFormat);
        dayjs.locale('es');
        let menuDate = dayjs(dayjs().year()+'-'+menu.day+'-'+menu.month, 'YYYY-D-M').format(formatDate).toLowerCase();
        
        for (let idActivity in dailyActivitiesResume){
            let activity = dailyActivitiesResume[idActivity];
            let activityDate = activity.date.toLowerCase();
            
            if(activityDate === menuDate){
                menu.teacherComments = activity.observaciones?activity.observaciones:'';
                
                menu.firstDish.quality = activity.comida==='Normal'?2:'undefined';
                menu.secondDish.quality = menu.firstDish.quality;
                menu.dessertDish.quality = menu.firstDish.quality;
                menu.nap.label = activity.siesta?activity.siesta:'';
                menu.nap.quality = activity.siesta === 'Sí'?2:-1;
                menu.snack.label = activity.merienda?activity.merienda:'';
                menu.snack.quality = activity.merienda?menu.firstDish.quality:-1;
                menu.deposiciones.label = activity.deposiciones===undefined?'No':activity.deposiciones;
                menu.deposiciones.quality = menu.deposiciones.label==='No'?-1:2;
            }
        }

        return menu;
    },

    getTodayClass: async function(menu){
        alexia.log("get today class")
        //let dailyActivitiesResume = await alexia.dailyActivity(allIncidents);
        let dailyActivitiesResume = {};
        menu = alexia.mixMenuWithActivity(menu, dailyActivitiesResume);

        return menu;
    },

    chain: function(username, password, schoolCode, alexia_helper){
        this.helper = alexia_helper;
        this.log('chain started '+username+"/"+schoolCode);
        
        return alexia.getTodayMenu()
            .then(alexia.getTodayClass)
            .then(function(menu){
                alexia.log("menu: "+ JSON.stringify(menu));
                return menu;
            });
    },
}

module.exports = NodeHelper.create({
    start: function() {
        console.log(this.name + ' node_helper is started!');
    },

    updateAlexiaData: function(alexia_config, node_helper){
        alexia.config = alexia_config;
        alexia.log('alexia updated: '+new Date());
        alexia.chain(alexia_config.username, alexia_config.password, alexia_config.schoolCode, node_helper)
            .then(function(response){
                alexia.log('end of chain updateAlexiaData then ALEXIA-CAO_WAKE_UP event sended');
                alexia.log(response);
                node_helper.sendSocketNotification('ALEXIA-CAO_WAKE_UP', response);
                setInterval(function update(){  
                    alexia.log('alexia updated: '+new Date());
                    alexia.chain(alexia_config.username, alexia_config.password, alexia_config.schoolCode, node_helper)
                        .then(function(response){
                            alexia.log('end of chain updateAlexiaData then ALEXIA-CAO_WAKE_UP event sended');
                            alexia.log(response);
                            node_helper.sendSocketNotification('ALEXIA-CAO_WAKE_UP', response);  
                        });
                }, alexia_config.updateInterval);
            });
    },

    socketNotificationReceived: function(notification, payload) {
        const alexia_nodehelper = this;        
        if ( notification === 'ALEXIA-CAO_STARTED' ){

            setTimeout(this.updateAlexiaData, 
                payload.initialLoadDelay, 
                payload,
                alexia_nodehelper);     
        }
    }
});
