var NodeHelper = require('node_helper');
var request = require('request-promise');
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
    
    chain: function(token, alexia_helper){
        this.helper = alexia_helper;
        this.log('chain started '+token);
        this.cookies = [];
        this.alexiaResponse = {};
        return this.login(username, password, schoolCode)
            .then(alexia.home)
            .then(alexia.incidencias)
            .then(alexia.process)
            .then(alexia.logout)
            .then(function(){
                return this.alexiaResponse;
            });
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
        kmg.log('students');    
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

    updateKindergardenData: function(kmg_config, node_helper){
        kmg.config = kmg_config;
        kmg.log('kmg updated: '+new Date());
        kmg.chain(kmg_config.guest_token, node_helper)
            .then(function(response){
                node_helper.sendSocketNotification('KMG_WAKE_UP', response);
                setInterval(function update(){  
                    kmg.log('kmg updated: '+new Date());
                    kmg.chain(kmg_config.guest_token, node_helper)
                    .then(function(response){
                        node_helper.sendSocketNotification('KMG_WAKE_UP', response);  
                    });
                }, kmg_config.updateInterval);
            });
    },

    socketNotificationReceived: function(notification, payload) {
        const kmg_nodehelper = this;        
        if ( notification === 'KMG_STARTED' ){

            setTimeout(this.updateKindergardenData, 
                payload.initialLoadDelay, 
                payload,
                kmg_nodehelper);     
        }
    }
});
