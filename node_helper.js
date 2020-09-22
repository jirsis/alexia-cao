var NodeHelper = require('node_helper');
var request = require('request-promise');
require('request-debug')(request);

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
    
    chain: function(username, password, schoolCode, alexia_helper){
        this.helper = alexia_helper;
        this.log('chain started '+username+"/"+schoolCode);
        this.cookies = [];
        this.alexiaResponse = {};
        /*return this.login(username, password, schoolCode)
            .then(alexia.home)
            .then(alexia.incidencias)
            .then(alexia.process)
            .then(alexia.logout)
            .then(function(){
                return this.alexiaResponse;
            });
            */
           return {
               'date': '2020-09-22',
               'course': 'Infantil 3B',
               'lunch': {
                   'entry': 'Comida',
                   'status': 2,
               },
               'nap': {
                   'entry': 'Siesta',
                   'status': -1
               },
               'snack':{
                   'entry': 'Merienda',
                    'status': 2
               },
               'teacherComments': 'Hoy ha empezado a tener clase con teacher Sara y con Samila. Se lo ha pasado muy bien'
               
            };
    },
    
    login: function(username, password, schoolCode){
        this.log('login: '+alexia.baseUrl+'->'+username+'/'+schoolCode);
        return request.post(
            { url: alexia.baseUrl+'/sign-in/guest/',
              form: {guest_code: guestToken},
              resolveWithFullResponse: true,
              simple: false
            }
        );
    },

    home: function(loginResponse){
        return loginResponse;
    },

    incidencias: function(incidenciasResponse){
        return incidenciasResponse;
    },

    

    students: function(loginResponse){
        alexia.log('students');    
        const cookiesToSet = loginResponse.headers['set-cookie'];
        
        this.cookies = cookiesToSet
            .filter( (cookie) => { 
                return cookie.split(';')[0];
            });
        return request.get({
            uri: kmg.baseUrl + '/api/parents/students/',
            resolveWithFullResponse: true,
            headers: {
                'Cookie': this.cookies
            }
        });
    },

    entries: function(studentsResponse){
        kmg.log('entries');
        const entriesKindergarden = JSON.parse(studentsResponse.body);
        const studentId = entriesKindergarden[0].id;
        const classId = entriesKindergarden[0].classroom_id;
        const uri = '/api/agendas/student/{id-student}/{id-class}/entries/?timetracking=true'
            .replace('{id-student}', studentId)
            .replace('{id-class}', classId);
        kmg.log(uri);
        return request.get({
            uri: kmg.baseUrl + uri,
            resolveWithFullResponse: true,
            headers: {
                'Cookie': this.cookies
            }
        });
    },

    process: function(entriesResponse){
        kmg.log('process');
        
        return new Promise((resolve, reject) => {
            this.kmgResponse = JSON.parse(entriesResponse.body).entries[0];
            resolve();
        });
    },

    logout: function(){
        kmg.log('logout');
        kmg.log(this.kmgResponse);
        return request.get({
            uri: kmg.baseUrl + '/logout/',
            resolveWithFullResponse: true,
            headers: {
                'Cookie': this.cookies
            }
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
        hello = alexia.chain(alexia_config.username, alexia_config.password, alexia_config.schoolCode, node_helper);
        node_helper.sendSocketNotification('ALEXIA-CAO_WAKE_UP', hello);
            /*.then(function(response){
                node_helper.sendSocketNotification('ALEXIA-CAO_WAKE_UP', response);
                setInterval(function update(){  
                    alexia.log('alexia updated: '+new Date());
                    alexia.chain(alexia_config.username, alexia_config.password, alexia_config.schoolCode, node_helper)
                        .then(function(response){
                            node_helper.sendSocketNotification('ALEXIA-CAO_WAKE_UP', response);  
                        });
                }, alexia_config.updateInterval);
            });*/            
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
