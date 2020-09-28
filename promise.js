var request = require('request-promise');
//require('request-debug')(request);

var kmg = {
    token: '',
    baseUrl: 'https://kindermygarden.schooltivity.com', 
    cookies: [],
    entries: [],

    _include_response: function(body, response, resolveWithFullResponse) {
        return {status: response.statusCode, headers: response.headers, body: body};
    },

    loginGuest: function(guestToken){
        kmg.token = guestToken;
        return request.post(
            { url: kmg.baseUrl+'/sign-in/guest/',
              form: {guest_code: kmg.token},
              transform: kmg._include_response
        });
    },

    students: function(loginResponse){
        const cookiesToSet = loginResponse.response.headers['set-cookie'];
        this.cookies = cookiesToSet
            .filter( (cookie) => { 
                return cookie.split(';')[0];
            });
        return request.get({
            uri: kmg.baseUrl + '/api/parents/students/',
            transform: kmg._include_response,
            headers: {
                'Cookie': this.cookies
            }
        });
    },

    entries: function(studentsResponse){
        const entries = JSON.parse(studentsResponse.body);
        const studentId = entries[0].id;
        const uri = '/api/agendas/student/{id-student}/entries/'.replace('{id-student}', studentId);

        return request.get({
            uri: kmg.baseUrl + uri,
            transform: kmg._include_response,
            headers: {
                'Cookie': this.cookies
            }
        });
    },

    process: function(entriesResponse){
        return new Promise((resolve, reject) => {
            this.entries = JSON.parse(entriesResponse.body)[0];
            resolve();
        });
    },

    logout: function(){
        return request.get({
            uri: kmg.baseUrl + '/logout/',
            transform: kmg._include_response,
            headers: {
                'Cookie': this.cookies
            }
        });
    }
};

function main(){
    this.cookies = [];
    return kmg.loginGuest('')
        .catch(kmg.students)
        .then(kmg.entries)
        .then(kmg.process)
        .then(kmg.logout);
};

main().then(function(){
    console.log(JSON.stringify(this.entries, null, 2));
    return ;
});
