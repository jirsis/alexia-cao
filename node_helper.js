const NodeHelper = require('node_helper');
const request = require('request-promise');
const cheerio = require('cheerio');
const pdfParser = require('pdf-parse');
const { Readable } = require('stream');
const fs = require('fs');
const os = require('os');
const dayjs = require('dayjs');
require('dayjs/locale/es');
const customParseFormat = require('dayjs/plugin/customParseFormat')
const puppeteer = require('puppeteer');
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
        let basePath = os.tmpdir();
        basePath = path.resolve("./modules/alexia-cao/");

        let jsonFile = basePath+'/menu-'+(new Date().getMonth()+1)+'.json';
        console.log(jsonFile+' exists?');
        if (fs.existsSync(jsonFile)) {
            console.log("yes");
            return this.loadMenuFile(jsonFile)
                .then(alexia.filterToday)
                .then(function(menu){
                    return menu;
                });
        }else{
            console.log("don't find the menu-**.json in the directory");
        }
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
        myMenu['course'] = alexia.config.course;
        return myMenu;
    },

    scrapSchoolSite: async function(url){
        alexia.log("scrap school site");
        const browser = await puppeteer.launch(this.config.browser);
        const page = await browser.newPage(); 
        alexia.log("screapper loaded");
        page.setViewport({width: 1366, height: 768});
        await page.goto(url);
        await page.click('#txtUsuario');
        await page.keyboard.type(alexia.config.username);
        await page.click('#txtPassword');
        await page.keyboard.type(alexia.config.password);
        await page.click('#btnAceptar');
        await page.waitForNavigation();
        await page.waitForSelector('#ctl00_tituloIncidencias', {visible: true});
        await page.click('#ctl00_tituloIncidencias');
        let entradasTotales;
        try{
            await page.waitForSelector('#ctl00_listadoIncidencias > li');
            entradasTotales = await page.$$('#ctl00_listadoIncidencias > li');
        }catch(error){
            console.log('timeout error, empty entradasTotales');
            entradasTotales = [];
        }
        return {entradasTotales: entradasTotales, browser: browser};

    },

    dailyActivity: async function(activity){
        let resumen = [];
        let entradasTotales = activity.entradasTotales;
        for (let entrada in entradasTotales){
            let date = await entradasTotales[entrada].$eval('.fecha_comentario > span', n => n.innerText);
            let tipo = await entradasTotales[entrada].$eval('h5', n => n.innerText);
            
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
            }else if(tipo === 'Merienda'){
                let merienda = await (await (await entradasTotales[entrada].$('li')).getProperty('title')).jsonValue();
                console.log(merienda);
                today.merienda = merienda.replace(/\n/g, ' ');
            }else if(tipo === 'Deposiciones'){
                let deposiciones = await (await (await entradasTotales[entrada].$('li')).getProperty('title')).jsonValue();
                today.deposiciones = deposiciones.replace(/\n/g, ' ');
            }else{
                console.log("+"+date + " -> "+tipo);     
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
                menu.deposiciones.label = activity.deposiciones;
                menu.deposiciones.quality = 2;
            }
        }
        
        

        return menu;
    },

    getTodayClass: async function(menu){
        alexia.log("get today class")
        let allIncidents = await alexia.scrapSchoolSite("http://web2.alexiaedu.com/ACWeb/LogOn.aspx?key=iJngi7tF4QU%253d");
        let dailyActivitiesResume = await alexia.dailyActivity(allIncidents);
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
