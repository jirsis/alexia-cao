/* Magic Mirror
 * Module: alexia-cao
 *
 * By Iñaki Reta Sabarrós https://github.com/jirsis
 * MIT Licensed.
 */

Module.register('alexia-cao', {
    defaults: {
		username: '',
		password: '',
        schoolCode: '',

        animationSpeed: 2000,

        initialLoadDelay: 1000,
        updateInterval: 60*60*1000, //1 check by hour, by default
        debug: true,
        headerSize: 36,

        browser: {},

    },

    requiresVersion: '2.1.0',

    getStyles: function() {
		return [
            'alexia-cao.css',
            'icons-embedded.css'
        ];
    },

    getScripts: function () {
		return [
		    'https://use.fontawesome.com/releases/v5.14.0/js/all.js'
		];
    },

    start: function(){
        Log.log('Starting module: ' + this.name);
        this.socketNotificationReceived('ALEXIA-CAO_STARTED', this.config);
        this.loaded = false;
    },

    processAlexiaCAOAgendaInformation: function(agendaData){
        this.agendaInfo = agendaData;
        this.show(this.config.animationSpeed, {lockString:this.identifier});
        this.loaded=true;
        this.updateDom(this.config.animationSpeed);
    },

    getDom: function() {
        var wrapper = document.createElement('div');
        if (this.config.guest_token === '') {
			return this.alexiaCAONotConfigurated(wrapper);
		}
		if (!this.loaded) {
			return this.alexiaCAONotLoaded(wrapper);
        }

        if(this.error){
            wrapper.innerHTML = this.name + ': '+this.error;
            wrapper.className = 'dimmed light small';
            this.error = undefined;
		    return wrapper;
        }
        var table = document.createElement('table');
        table.className = 'small';
    
        console.log(this.agendaInfo);

        this.fillLogoRow(table, this.agendaInfo);
        this.fillTodayQuote(table, this.agendaInfo);
        this.fillLunchRow(table, this.agendaInfo);
        this.fillCourse(table, this.agendaInfo, 'snack','icon-sandwich');
        this.fillCourse(table, this.agendaInfo, 'nap','icon-zzz');
        this.fillCourse(table, this.agendaInfo, 'deposiciones','icon-poo');
        
        
        this.fillTeacherNote(table, this.agendaInfo);

        return table;
    },

    fillLogoRow: function(table, agenda){
        var row = document.createElement('tr');
        var cell = document.createElement('td');
        var img = document.createElement('img');

        cell.colSpan = 5;
        img.src = '/modules/alexia-cao/logo-full.png';
        img.width = 200;
        cell.appendChild(img);
        row.appendChild(cell);
        table.appendChild(row);
    },

    fillTodayQuote: function(table, agendaInfo){
        var row = document.createElement('tr');
        var td = document.createElement('td');
        td.colSpan = 5;
        td.align = 'center';

        var date = document.createElement('span');
        const now = new Date(2020, agendaInfo.month-1, 1);
        const month = now.toLocaleString('default', { month: 'short' });
        date.innerHTML = agendaInfo.course + " - " +agendaInfo.day+ " "+month;
        td.appendChild(date);

        row.appendChild(td);
        table.appendChild(row);
    },

    fillLunchRow: function(table, agenda){
        this.fillCourse(table, agenda, 'firstDish', 'icon-main-course');
        this.fillCourse(table, agenda, 'secondDish', 'icon-second-course');
        this.fillCourse(table, agenda, 'dessertDish', 'icon-apple');
    },

    fillCourse: function(table, agenda, dish, icon){
        var courseRow = document.createElement("tr");
        courseRow.className = 'bright ';
        this.fillFoodIcon(courseRow, icon, 1, 'left');
        this.fillFoodCell(courseRow, agenda[dish].label, 3, 'right');
        this.fillFoodQuality(courseRow, agenda[dish].quality);  
        table.appendChild(courseRow);
    },

    fillFoodCell: function(row, foodData, span, align){
        var cell = document.createElement('td');
        cell.colSpan = span;
        cell.className = ' align-'+align+' cell-hyphens';
        cell.innerHTML = foodData;
        row.appendChild(cell);
    },

    fillFoodIcon: function(row, icon, span, align){
        var cell = document.createElement('td');
        cell.colSpan = span;
        cell.className = ['icon-'+align].join(' ')+' icon-up';
        var iconCell = document.createElement('span');
        iconCell.className = icon;
        cell.appendChild(iconCell);
        row.appendChild(cell);
    },

    fillFoodQuality: function(row, foodData){
        var cell = document.createElement('td');
        cell.colSpan = 1;
        cell.className = ' icon-left icon-up';

        var span = document.createElement('span');
        span.className = this.mapQuality(foodData);

        cell.appendChild(span);
        cell.appendChild(span);
        row.appendChild(cell);
    },


    fillTeacherNote: function(table, agenda){
        var row = document.createElement('tr');
        var note = document.createElement('td');
        var p = document.createElement('p');
        p.style = 'max-width: 300px';

        note.colSpan=5;
        note.align = 'center';

        if ( agenda.teacherComments ){
            var teacherNote = document.createElement('span');
            teacherNote.innerHTML = agenda.teacherComments;
            p.appendChild(teacherNote);
        }

        note.appendChild(p);
        row.appendChild(note);
        table.appendChild(row);
    },

    mapQuality: function(data){
        const mapper = {
            '-2': 'fas fa-genderless', //todavia no se sabe -> vacio
            '-1': 'far fa-times-circle', // no
            0: 'far fa-frown-open', // poco
            1: 'far fa-meh', // regular
            2: 'far fa-laugh-beam', // bien
            3: 'far fa-grin-tongue-squint', //repitio
            
            'undefined': 'fas fa-question-circle'
        }
        var quality = mapper[data];
        if (quality === undefined ){
            console.log('entry value -> ' + data);
            quality = mapper['undefined'];
        }
        return quality;
    },

    alexiaCAONotConfigurated: function(wrapper){
        wrapper.innerHTML = 'Please set the correct <i>credentials (user/password/school code)</i> in the config for module: ' + this.name + '.';
		wrapper.className = 'dimmed light small';
		return wrapper;
    },

    alexiaCAONotLoaded: function(wrapper){
        wrapper.innerHTML = this.name + ' '+this.translate('LOADING');
		wrapper.className = 'dimmed light small';
		return wrapper;
    },

    showError: function(errorDescription){
        this.error = errorDescription;
        Log.info(errorDescription);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === 'ALEXIA-CAO_STARTED'){
            this.sendSocketNotification(notification, payload);
        } else if(notification === 'ALEXIA-CAO_WAKE_UP'){
            this.processAlexiaCAOAgendaInformation(payload);
        }
    },
});
