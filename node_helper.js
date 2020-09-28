const NodeHelper = require('node_helper');
const request = require('request-promise');
const cheerio = require('cheerio');
const pdfParser = require('pdf-parse');
const { Readable } = require('stream');
const fs = require('fs');
const os = require('os');
//require('request-debug')(request);

var alexia = {
    baseUrl: 'https://kindermygarden.schooltivity.com', 
    cookies: [],
    alexiaResponse: {},
    helper: {},

    config: {},

    log: function(msg){
        if(this.config.debug){
            console.log(msg);
        }
    },

    getTodayMenu: function(){
        alexia.log("get today menu;");
        return this.menuHtmlPage()
            .then(alexia.extractMenuUrl)
            .then(alexia.downloadPdf)
            .then(alexia.extractPdfInfo)
            .then(alexia.buildMonthMenu)
            .then(alexia.saveJsonMonthMenu)
            .then(alexia.filterToday)
            .then(function(menu){
                return menu;
            });
    },
    
    menuHtmlPage: function(){
        alexia.log("menu html page");
        return request.get(
            { url: 'http://www.colegio-alameda.com/comedor/',
              resolveWithFullResponse: true,
              simple: false
            }
        );
    },

    extractMenuUrl: function(menuPage){
        alexia.log("extract menu url");
        const page = cheerio.load(menuPage.body);
        let url = page('a.qbutton:nth-child(1)').attr('href');
        alexia.log("menu url: "+url);
        return new Promise((resolve, reject) => {
            resolve(url);
        });
    },


    downloadPdf: function(menuUrlPdf){
        alexia.log("download pdf");
        alexia.log(menuUrlPdf);
        return request.get(
            { url: menuUrlPdf,
              resolveWithFullResponse: true,
              simple: false,
              encoding: null
            }
        );
    },

    extractPdfInfo: function(menuPdfResponse){
        alexia.log("extract pdf info");
        return pdfParser(menuPdfResponse.body)
            .then(function(data){
                return data.text;
            })
            .catch(function(err){
                alexia.log(err);
            });
        
    },
    
    isNumeric: function(line){
        return line.length > 0  && !isNaN(line);
    },

    isMonth: function(lines, id){
        let equals =false;
		let monthNumber = lines[id];
		let monthName = lines[id+1];
		let localDate = new Date('2011-'+monthNumber+'-01');
        let formattedMonth = localDate.toLocaleString("default", { month: "long" });
        equals = monthName.toLowerCase() === formattedMonth.toLowerCase(); 
		return equals;
    },

    isAlergics: function(line){
        regex = /^(\d|,)*$/;
        return line !== '' && regex.test(line); 
    },

    dish: function(lines, id){
        let endDish = false;
        let name = '';
		while(id < lines.length && lines[id] !== '' && !alexia.isNumeric(lines[id]) && !endDish) {
			if(alexia.isAlergics(lines[id])) {
				endDish = true;
			}
			name = name.concat(lines[id++], ' ');
		}
		if(endDish) {
			id--;
        }
        const splitNameRegex = /\/|\./;
        const clearDoubleSpacesRegex = /\s\s+/g;
		return {
            'name': name.split(splitNameRegex)[0].trim().replace(clearDoubleSpacesRegex, ' '),
            'next': id
        }
    }, 

    buildMonthMenu: function(text){
        alexia.log("build month menu");
        alexia.log(text);

        let menu = [];
        var lines = text.split('\n');
        let month = '';
        
        for (var id = 3; id < lines.length; id++) {
			if (alexia.isNumeric(lines[id])) {
				if(alexia.isMonth(lines, id)) {
                    month = lines[id];
					break;
				}
                var day = lines[id++];
                
				var firstDishResult =  alexia.dish(lines, id);
                id = firstDishResult.next;
                var firstDish = firstDishResult.name;
				
				var secondDishResult =  alexia.dish(lines, id+1);
                id = secondDishResult.next;
                var secondDish = secondDishResult.name;
				
                var dessertDish = '';
                
				if(alexia.isNumeric(lines[id])){
					dessertDish = secondDish;
					secondDish = '';
					id --;
				}else {
                    var dessertDishResult = alexia.dish(lines, id+1);
                    dessertDish = dessertDishResult.name;
                    id = dessertDishResult.next-1;
				}
				
				menu.push({
                    'day': day,
                    'month': undefined,
                    'firstDish': firstDish,
                    'secondDish': secondDish,
                    'dessertDish': dessertDish,
                });
			}
        }
        menu.forEach(m => {m.month=month});
        return menu;
    },

    saveJsonMonthMenu: function(menu){
        alexia.log("saveJsonMenu");
        let jsonFile = os.tmpdir()+'/menu-'+menu[0].month+'json';
        alexia.log('-> '+jsonFile);
        fs.writeFileSync(jsonFile, JSON.stringify(menu, null, 2));
        return menu;
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

    chain: function(username, password, schoolCode, alexia_helper){
        this.helper = alexia_helper;
        this.log('chain started '+username+"/"+schoolCode);
        this.cookies = [];
        
        return alexia.getTodayMenu()
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
