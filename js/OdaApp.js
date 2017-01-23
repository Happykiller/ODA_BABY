/* global er */
//# sourceURL=OdaApp.js
// Library of tools for the exemple
/**
 * @author FRO
 * @date 17/01/22
 */

(function() {
    'use strict';

    var
        /* version */
        VERSION = '0.1'
    ;
    
    ////////////////////////// PRIVATE METHODS ////////////////////////
    /**
     * @name _init
     * @desc Initialize
     */
    function _init() {
        $.Oda.Event.addListener({name : "oda-fully-loaded", callback : function(e){
            $.Oda.App.startApp();
        }});
    }

    ////////////////////////// PUBLIC METHODS /////////////////////////
    $.Oda.App = {
        /* Version number */
        version: VERSION,
        
        /**
         * @returns {$.Oda.App}
         */
        startApp: function () {
            try {
                $.Oda.Router.addDependencies("alasql", {
                    ordered : true,
                    "list" : [
                        { "elt" : $.Oda.Context.rootPath + $.Oda.Context.vendorName + "/alasql/dist/alasql.min.js", "type" : "script"}
                    ]
                });

                $.Oda.Router.addRoute("home", {
                    "path" : "partials/home.html",
                    "title" : "home.title",
                    "urls" : ["","home"],
                    "middleWares":["support","auth"],
                    "dependencies" : ["dataTables", "alasql", "hightcharts"]
                });

                $.Oda.Router.startRooter();

                return this;
            } catch (er) {
                $.Oda.Log.error("$.Oda.App.startApp : " + er.message);
                return null;
            }
        },

        "Controller" : {
            BonitaSession: {},
            BonitaActivities: [],
            BonitaActivitiesObjTable: [],
            BonitaActivitiesFilters: {},
            BonitaActivitiesTable: {},
            "Home": {
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                start: function () {
                    try {
                        $.Oda.App.Controller.BonitaSession = $.Oda.Storage.get("bonitaSession", {});
                        if($.Oda.App.Controller.BonitaSession.apiToken === undefined){
                            var strHtml = $.Oda.Display.TemplateHtml.create({
                                template : "tlpDivLogBonita"
                            });
                            $.Oda.Display.render({id:"divMain", html: strHtml});
                            $.Oda.Scope.Gardian.add({
                                    id : "gLogBonita",
                                    listElt : ["logBonita", "passBonita"],
                                    function : function(e){
                                        if( ($("#logBonita").data("isOk"))
                                            && ($("#passBonita").data("isOk")) 
                                        ){
                                            $("#submit").btEnable();
                                        }else{
                                            $("#submit").btDisable();
                                        }
                                    }
                                });
                        }else{
                            $.Oda.App.Controller.Home.drawFormActivities();
                        }
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.start : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                logBonita: function () {
                    try {
                        $.ajax({
                            url: $.Oda.BonitaContext.host + "loginservice?tenant="+$.Oda.BonitaContext.tenantId,
                            type: "POST",
                            data: {
                                username: $("#logBonita").val(),
                                password: $("#passBonita").val(),
                                redirect: false
                            },
                            xhrFields: {withCredentials: true},
                            success: function(data, textStatus, jqXHR) {
                                $.ajax({
                                    url: $.Oda.BonitaContext.host + "API/system/session/1",
                                    type: "GET",
                                    xhrFields: {withCredentials: true},
                                    success: function(data, textStatus, jqXHR) {
                                        $.Oda.App.Controller.BonitaSession.apiToken = jqXHR.getResponseHeader('X-Bonita-API-Token');
                                        $.Oda.App.Controller.BonitaSession.sessionInfo = data;
                                        $.Oda.Storage.set("bonitaSession", $.Oda.App.Controller.BonitaSession, 3600);
                                        $.Oda.App.Controller.Home.drawFormActivities();
                                    }
                                });
                            },
                            error: function(jqXHR, textStatus, errorThrown) {
                                $.Oda.Display.Notification.errorI8n("home.errorLogBonita");
                            }
                        });
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.logBonita : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                drawFormActivities: function () {
                    try {
                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template : "tlpDivActivities",
                            scope: {
                                endDate: $.Oda.Date.dateFormat(new Date(), "yyyy-mm-dd")
                            }
                        });
                        $.Oda.Display.render({id:"divMain", html: strHtml});
                        $.Oda.Scope.Gardian.add({
                                id : "gActivities",
                                listElt : ["startDate", "endDate"],
                                function : function(e){
                                    if( ($("#startDate").data("isOk"))
                                        && ($("#endDate").data("isOk")) 
                                    ){
                                        $("#submit").btEnable();
                                    }else{
                                        $("#submit").btDisable();
                                        $("#divTabActivities").html("");
                                        $("#divMenuReports").html("");
                                        $("#divReport").html("");
                                    }
                                }
                            });
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.drawFormActivities : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                displayActivities: function () {
                    try {
                        $("#divMenuReports").html("");
                        $("#divReport").html("");
                        var startDate = $("#startDate").val();
                        var endDate = $("#endDate").val();
                        $.Oda.Display.loading({elt :$("#divTabActivities")});
                        $.ajax({
                            url: $.Oda.BonitaContext.host + "API/bdm/businessData/com.delivery.bonitasoft.WorkLog?p=0&c=50000&q=findByDates&f=initDate="+$.Oda.Date.dateFormat(startDate, "yyyy-mm-dd")+"&f=endDate="+$.Oda.Date.dateFormat(endDate, "yyyy-mm-dd"),
                            type: "GET",
                            contentType: "application/json",
                            /*passing the X-Bonita-API-Token for the CSRF security filter*/
                            headers: {'X-Bonita-API-Token': $.Oda.App.Controller.BonitaSession.apiToken},
                            xhrFields: {withCredentials: true},
                            success: function(data, textStatus, jqXHR) {
                                if(data.length > 0){
                                    $.Oda.App.Controller.Home.displayMenuReport();
                                }

                                $.Oda.App.Controller.BonitaActivities = data;
                                $.Oda.App.Controller.BonitaActivitiesObjTable = $.Oda.Tooling.objDataTableFromJsonArray(data);
                                var strhtml = '<table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered hover" id="tabActivities">';
                                strhtml += '<tfoot><tr>'; 
                                strhtml += '<th oda-attr-value="customer"></th>'; 
                                strhtml += '<th oda-attr="select" oda-attr-value="category"></th>'; 
                                strhtml += '<th oda-attr-value="subcategory"></th>'; 
                                strhtml += '<th oda-attr="none"></th>'; 
                                strhtml += '<th oda-attr="sum" oda-attr-value="workHours"></th>'; 
                                strhtml += '<th oda-attr="select" oda-attr-value="location"></th>'; 
                                strhtml += '<th oda-attr-value="consultant"></th>'; 
                                strhtml += '<th oda-attr-value="description"></th>'; 
                                strhtml += '<th oda-attr-value="customerDescription"></th>'; 
                                strhtml += '</tr></tfoot></table>';
                                $('#divTabActivities').html(strhtml);

                                $.Oda.App.Controller.BonitaActivitiesTable = $('#tabActivities').DataTable({
                                    "sPaginationType": "full_numbers",
                                    "aaData": $.Oda.App.Controller.BonitaActivitiesObjTable.data,
                                    "aaSorting": [[3, 'desc']],
                                    "aoColumns": [
                                        {"sTitle": "customer"},
                                        {"sTitle": "category"},
                                        {"sTitle": "subcategory"},
                                        {"sTitle": "workDate", "sClass": "dataTableColCenter"},
                                        {"sTitle": "workHours", "sClass": "dataTableColCenter", "sWidth" : "50px"},
                                        {"sTitle": "location", "sWidth" : "50px"},
                                        {"sTitle": "consultant", "sClass": "dataTableColCenter", "sWidth" : "50px"},
                                        {"sTitle": "description"},
                                        {"sTitle": "customerDescription"}
                                    ],
                                    "aoColumnDefs": [
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[$.Oda.App.Controller.BonitaActivitiesObjTable.entete["customer"]].name;
                                            },
                                            "aTargets": [0]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[$.Oda.App.Controller.BonitaActivitiesObjTable.entete["category"]];
                                            },
                                            "aTargets": [1]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[$.Oda.App.Controller.BonitaActivitiesObjTable.entete["subcategory"]];
                                            },
                                            "aTargets": [2]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                if (type === 'display') {
                                                    return $.Oda.Date.dateFormat(row[$.Oda.App.Controller.BonitaActivitiesObjTable.entete["workDate"]], 'dd/mm/yyyy');
                                                }else{
                                                    return row[$.Oda.App.Controller.BonitaActivitiesObjTable.entete["workDate"]];
                                                }
                                            },
                                            "aTargets": [3]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[$.Oda.App.Controller.BonitaActivitiesObjTable.entete["workHours"]];
                                            },
                                            "aTargets": [4]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[$.Oda.App.Controller.BonitaActivitiesObjTable.entete["location"]];
                                            },
                                            "aTargets": [5]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[$.Oda.App.Controller.BonitaActivitiesObjTable.entete["consultant"]];
                                            },
                                            "aTargets": [6]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                var desc = row[$.Oda.App.Controller.BonitaActivitiesObjTable.entete["description"]];
                                                var str = $.Oda.Tooling.replaceAll({str : desc, find : 'Description: ', by : ''});
                                                return str;
                                            },
                                            "aTargets": [7]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                var desc = row[$.Oda.App.Controller.BonitaActivitiesObjTable.entete["customerDescription"]];
                                                var str = $.Oda.Tooling.replaceAll({str : desc, find : 'Customer Description: ', by : ''});
                                                return str;
                                            },
                                            "aTargets": [8]
                                        }
                                    ]
                                });

                                $("#tabActivities tfoot th").each(function (i) {
                                    var valOdaAttri = $(this).attr("oda-attr");
                                    var odaAttriValue = $(this).attr("oda-attr-value");
                                    var indexColl = $.Oda.App.Controller.BonitaActivitiesObjTable.entete[odaAttriValue];
                                    if(odaAttriValue !== undefined){
                                        $.Oda.App.Controller.BonitaActivitiesFilters[odaAttriValue] = "";
                                    }
                                    if (valOdaAttri == "select") {
                                        var select = $('<select data-mini="true" oda-filter="'+odaAttriValue+'"><option></option></select>')
                                            .appendTo($(this).empty())
                                            .on('change', function () {
                                                var odaAttriValue = $(this).attr("oda-filter");
                                                var val = $(this).val();
                                                $.Oda.App.Controller.BonitaActivitiesFilters[odaAttriValue] = val;
                                                $.Oda.App.Controller.BonitaActivitiesTable.column(i)
                                                    .search(val ? '^' + $(this).val() + '$' : val, true, false)
                                                    .draw();
                                                $.Oda.App.Controller.Home.displayTotal();
                                            });

                                        var coll = $.Oda.App.Controller.BonitaActivitiesTable.column(indexColl);
                                        try{
                                            var datas = coll.data().unique().sort();
                                            datas.each(function (d, j) {
                                                select.append('<option value="' + d + '">' + d + '</option>');
                                            });
                                        }catch(e){
                                            $(this).empty()
                                            console.error('error for build list with the coll:'+odaAttriValue);
                                        }
                                    } else if (valOdaAttri === "sum") {
                                        $(this).html("<span id='totalDays'></span>");
                                        $.Oda.App.Controller.Home.displayTotal();
                                    } else if (valOdaAttri !== "none") {
                                        $('<input oda-filter="'+odaAttriValue+'" type="text" placeholder="Search" size="4"/>')
                                            .appendTo($(this).empty())
                                            .on('keyup change', function () {
                                                var odaAttriValue = $(this).attr("oda-filter");
                                                var val = $(this).val();
                                                $.Oda.App.Controller.BonitaActivitiesFilters[odaAttriValue] = val;
                                                $.Oda.App.Controller.BonitaActivitiesTable
                                                    .column(i)
                                                    .search(val)
                                                    .draw();
                                                $.Oda.App.Controller.Home.displayTotal();
                                            });
                                    } else {
                                        $(this).empty();
                                    }
                                });
                            },
                            error: function(jqXHR, textStatus, errorThrown) {
                                console.log('error updating user info');
                            }
                        });
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.displayActivities : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                displayMenuReport: function () {
                    try {
                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template : "tlpDivMenuReports"
                        });
                        $.Oda.Display.render({id:"divMenuReports", html: strHtml});
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.displayMenuReport : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                displayReportCamCategory: function () {
                    try {
                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template : "tlpDivReportCamCategory"
                        });
                        $.Oda.Display.render({id:"divReport", html: strHtml});

                        var strFilters = "";
                        for(var key in $.Oda.App.Controller.BonitaActivitiesFilters){
                            var filter = $.Oda.App.Controller.BonitaActivitiesFilters[key];
                            if(filter !== ""){
                                switch(key) {
                                    case "customer":
                                        strFilters += " AND customer->displayName like '%"+filter+"%' ";
                                        break;
                                    case "subcategory":
                                    case "consultant":
                                    case "description":
                                    case "customerDescription":
                                        strFilters += " AND "+key+" like '%"+filter+"%' ";
                                        break;
                                    case "category":
                                    case "location":
                                        strFilters += " AND "+key+" = '"+filter+"' ";
                                        break;
                                }
                            }
                        }
                        var req = "SELECT category as name, COUNT(*) AS y FROM ? WHERE 1=1 "+strFilters+" AND category not in ('TIME_OFF') GROUP BY category";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);

                        Highcharts.chart('divGraph', {
                            chart: {
                                plotBackgroundColor: null,
                                plotBorderWidth: null,
                                plotShadow: false,
                                type: 'pie'
                            },
                            title: {
                                text: $.Oda.I8n.get("home","camCategory")
                            },
                            tooltip: {
                                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                            },
                            plotOptions: {
                                pie: {
                                    allowPointSelect: true,
                                    cursor: 'pointer',
                                    dataLabels: {
                                        enabled: true,
                                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                        style: {
                                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                        }
                                    }
                                }
                            },
                            series: [{
                                name: 'cate',
                                colorByPoint: true,
                                data: result
                            }]
                        });
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.displayReportCamCategory : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                displayTotal: function () {
                    try {
                        var sum = 0;
                        var indexColl = $.Oda.App.Controller.BonitaActivitiesObjTable.entete["workHours"];
                        var coll = $.Oda.App.Controller.BonitaActivitiesTable.column(indexColl,  { search:'applied' });
                        var datas = coll.data();
                        datas.each(function (d, j) {
                            sum += parseInt(d);
                        });
                        var days = $.Oda.Tooling.arrondir(sum / 8,2);
                        $('#totalDays').text(days + " MD");
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.displayTotal : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                displayReportBillable: function () {
                    try {
                        var datas = {};

                        var delivery = {
                            workTime:0,
                            exp:0,
                            billable:0
                        };

                        var req = "SELECT SUM(workHours) as workTime FROM ? WHERE 1=1 AND category not in ('TIME_OFF', 'TRIP', 'EXTERNAL_HELP')";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);
                        delivery.workTime = result[0].workTime;

                        var req = "SELECT SUM(workHours) as exp FROM ? WHERE 1=1 AND category in ('EXP')";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);
                        delivery.exp = result[0].exp;

                        delivery.billable = $.Oda.Tooling.arrondir((delivery.exp / delivery.workTime) * 100, 2);

                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template : "tlpDivReportBillable",
                            scope: {
                                averageBillable: delivery.billable
                            }
                        });
                        $.Oda.Display.render({id:"divReport", html: strHtml});

                        var req = "SELECT SUM(workHours) as workTime, consultant FROM ? WHERE 1=1 AND category not in ('TIME_OFF', 'TRIP', 'EXTERNAL_HELP') GROUP BY consultant";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);

                        for(var index in result){
                            var elt = result[index];
                            datas[elt.consultant] = {
                                workTime:elt.workTime,
                                exp:0,
                                billable:0
                            }
                        }

                        var req = "SELECT SUM(workHours) as exp, consultant FROM ? WHERE 1=1 AND category in ('EXP') GROUP BY consultant";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);

                        for(var index in result){
                            var elt = result[index];
                            datas[elt.consultant].exp = elt.exp;
                        }

                        for(var key in datas){
                            var elt = datas[key];
                            elt.billable = $.Oda.Tooling.arrondir((elt.exp / elt.workTime) * 100, 2);
                        }

                        var tabDatas = [];
                        for(var key in datas){
                            var elt = datas[key];
                            elt.name = key;
                            tabDatas.push(elt);
                        }

                        var tabDatasOrder = $.Oda.Tooling.order({
                            collection: tabDatas, compare: function(elt1, elt2){
                                if(elt1.billable < elt2.billable){
                                    return 1;
                                }else if(elt1.billable > elt2.billable){
                                    return -1;
                                }else{
                                    return 0;
                                }
                            }
                        });

                        var cate = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            cate.push(elt.name);
                        }

                        var seriesWorkTime = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            seriesWorkTime.push(elt.workTime);
                        }

                        var seriesExp = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            seriesExp.push(elt.exp);
                        }

                        Highcharts.chart('divGraph', {
                            chart: {
                                type: 'column'
                            },
                            title: {
                                text: $.Oda.I8n.get("home","grapBillable")
                            },
                            xAxis: {
                                categories: cate
                            },
                            yAxis: {
                                min: 0,
                                stackLabels: {
                                    enabled: true,
                                    formatter: function () {
                                        for(var index in tabDatasOrder){
                                            var elt = tabDatasOrder[index];
                                            if((elt.workTime + elt.exp) === this.total){
                                                break;
                                            }
                                        }
                                        return elt.billable+"%";
                                    },
                                    style: {
                                        fontWeight: 'bold',
                                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                                    }
                                }
                            },
                            legend: {
                                align: 'right',
                                x: -30,
                                verticalAlign: 'top',
                                y: 25,
                                floating: true,
                                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
                                borderColor: '#CCC',
                                borderWidth: 1,
                                shadow: false
                            },
                            tooltip: {
                                headerFormat: '<b>{point.x}</b><br/>',
                                pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
                            },
                            plotOptions: {
                                column: {
                                    stacking: 'normal',
                                    dataLabels: {
                                        enabled: true,
                                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
                                    }
                                }
                            },
                            series: [{
                                name: 'workTime',
                                data: seriesWorkTime
                            }, {
                                name: 'exp',
                                data: seriesExp
                            }]
                        });

                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.displayReportBillable : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                displayReportAllExp: function () {
                    try {
                        var datas = {};

                        var delivery = {
                            workTime:0,
                            exp:0,
                            billable:0
                        };

                        var req = "SELECT SUM(workHours) as workTime FROM ? WHERE 1=1 AND category not in ('TIME_OFF', 'TRIP', 'EXTERNAL_HELP')";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);
                        delivery.workTime = result[0].workTime;

                        var req = "SELECT SUM(workHours) as exp FROM ? WHERE 1=1 AND category in ('EXP', 'EXP-FREE')";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);
                        delivery.exp = result[0].exp;

                        delivery.billable = $.Oda.Tooling.arrondir((delivery.exp / delivery.workTime) * 100, 2);

                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template : "tlpDivReportAllExp",
                            scope: {
                                averageAllExp: delivery.billable
                            }
                        });
                        $.Oda.Display.render({id:"divReport", html: strHtml});

                        var req = "SELECT SUM(workHours) as workTime, consultant FROM ? WHERE 1=1 AND category not in ('TIME_OFF', 'TRIP', 'EXTERNAL_HELP') GROUP BY consultant";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);

                        for(var index in result){
                            var elt = result[index];
                            datas[elt.consultant] = {
                                workTime:elt.workTime,
                                exp:0,
                                billable:0
                            }
                        }

                        var req = "SELECT SUM(workHours) as exp, consultant FROM ? WHERE 1=1 AND category in ('EXP', 'EXP-FREE') GROUP BY consultant";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);

                        for(var index in result){
                            var elt = result[index];
                            datas[elt.consultant].exp = elt.exp;
                        }

                        for(var key in datas){
                            var elt = datas[key];
                            elt.billable = $.Oda.Tooling.arrondir((elt.exp / elt.workTime) * 100, 2);
                        }

                        var tabDatas = [];
                        for(var key in datas){
                            var elt = datas[key];
                            elt.name = key;
                            tabDatas.push(elt);
                        }

                        var tabDatasOrder = $.Oda.Tooling.order({
                            collection: tabDatas, compare: function(elt1, elt2){
                                if(elt1.billable < elt2.billable){
                                    return 1;
                                }else if(elt1.billable > elt2.billable){
                                    return -1;
                                }else{
                                    return 0;
                                }
                            }
                        });

                        var cate = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            cate.push(elt.name);
                        }

                        var seriesWorkTime = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            seriesWorkTime.push(elt.workTime);
                        }

                        var seriesExp = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            seriesExp.push(elt.exp);
                        }

                        Highcharts.chart('divGraph', {
                            chart: {
                                type: 'column'
                            },
                            title: {
                                text: $.Oda.I8n.get("home","grapAllExp")
                            },
                            xAxis: {
                                categories: cate
                            },
                            yAxis: {
                                min: 0,
                                stackLabels: {
                                    enabled: true,
                                    formatter: function () {
                                        for(var index in tabDatasOrder){
                                            var elt = tabDatasOrder[index];
                                            if((elt.workTime + elt.exp) === this.total){
                                                break;
                                            }
                                        }
                                        return elt.billable+"%";
                                    },
                                    style: {
                                        fontWeight: 'bold',
                                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                                    }
                                }
                            },
                            legend: {
                                align: 'right',
                                x: -30,
                                verticalAlign: 'top',
                                y: 25,
                                floating: true,
                                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
                                borderColor: '#CCC',
                                borderWidth: 1,
                                shadow: false
                            },
                            tooltip: {
                                headerFormat: '<b>{point.x}</b><br/>',
                                pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
                            },
                            plotOptions: {
                                column: {
                                    stacking: 'normal',
                                    dataLabels: {
                                        enabled: true,
                                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
                                    }
                                }
                            },
                            series: [{
                                name: 'workTime',
                                data: seriesWorkTime
                            }, {
                                name: 'exp',
                                data: seriesExp
                            }]
                        });
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.displayReportAllExp : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                displayReportTrip: function () {
                    try {
                        var datas = {};

                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template : "tlpDivReportTrip"
                        });
                        $.Oda.Display.render({id:"divReport", html: strHtml});

                        var req = "SELECT SUM(workHours) as sumTrip, consultant FROM ? WHERE 1=1 AND category = 'TRIP' AND customer->displayName != 'Bonitasoft' GROUP BY consultant";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);

                        for(var index in result){
                            var elt = result[index];
                            datas[elt.consultant] = {
                                sumTrip: elt.sumTrip
                            }
                        }

                        var req = "SELECT SUM(workHours) as sumOnSite, consultant FROM ? WHERE 1=1 AND category != 'TRIP' and location = 'ONSITE' AND customer->displayName != 'Bonitasoft' GROUP BY consultant";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);

                        for(var index in result){
                            var elt = result[index];
                            if(datas[elt.consultant] === undefined){
                                datas[elt.consultant] = {
                                    sumTrip: 0
                                };
                            }
                            datas[elt.consultant].sumOnSite = elt.sumOnSite;
                        }

                        var tabDatas = [];
                        for(var key in datas){
                            var elt = datas[key];
                            if(elt.sumOnSite === undefined){
                                elt.sumOnSite = 0;
                            }
                            elt.name = key;
                            tabDatas.push(elt);
                        }

                        var tabDatasOrder = $.Oda.Tooling.order({
                            collection: tabDatas, compare: function(elt1, elt2){
                                if((elt1.sumTrip+elt1.sumOnSite) < (elt2.sumTrip+elt2.sumOnSite)){
                                    return 1;
                                }else if((elt1.sumTrip+elt1.sumOnSite) > (elt2.sumTrip+elt2.sumOnSite)){
                                    return -1;
                                }else{
                                    return 0;
                                }
                            }
                        });

                        var cate = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            cate.push(elt.name);
                        }

                        var seriesTrip = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            seriesTrip.push(elt.sumTrip);
                        }

                        var seriesOnSite = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            seriesOnSite.push(elt.sumOnSite);
                        }

                        Highcharts.chart('divGraph', {
                            chart: {
                                type: 'column'
                            },
                            title: {
                                text: $.Oda.I8n.get("home","graphTrip")
                            },
                            xAxis: {
                                categories: cate
                            },
                            yAxis: {
                                min: 0,
                                stackLabels: {
                                    enabled: true,
                                    style: {
                                        fontWeight: 'bold',
                                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                                    }
                                }
                            },
                            legend: {
                                align: 'right',
                                x: -30,
                                verticalAlign: 'top',
                                y: 25,
                                floating: true,
                                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
                                borderColor: '#CCC',
                                borderWidth: 1,
                                shadow: false
                            },
                            tooltip: {
                                headerFormat: '<b>{point.x}</b><br/>',
                                pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
                            },
                            plotOptions: {
                                column: {
                                    stacking: 'normal',
                                    dataLabels: {
                                        enabled: true,
                                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
                                    }
                                }
                            },
                            series: [{
                                name: 'trip',
                                data: seriesTrip
                            }, {
                                name: 'onSite',
                                data: seriesOnSite
                            }]
                        });
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.displayReportTrip : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                displayReportCustomers: function () {
                    try {
                        var datas = {};

                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template : "tlpDivReportCustomers"
                        });
                        $.Oda.Display.render({id:"divReport", html: strHtml});

                        var req = "SELECT count(DISTINCT(customer->displayName)) as nb, consultant FROM ? WHERE 1=1 AND customer->displayName != 'Bonitasoft' GROUP BY consultant";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);

                        var tabDatasOrder = $.Oda.Tooling.order({
                            collection: result, compare: function(elt1, elt2){
                                if(elt1.nb < elt2.nb){
                                    return 1;
                                }else if(elt1.nb > elt2.nb){
                                    return -1;
                                }else{
                                    return 0;
                                }
                            }
                        });

                        var cate = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            cate.push(elt.consultant);
                        }

                        var series = [];
                        for(var index in tabDatasOrder){
                            var elt = tabDatasOrder[index];
                            series.push(elt.nb);
                        }

                        Highcharts.chart('divGraph', {
                            chart: {
                                type: 'bar'
                            },
                            title: {
                                text: $.Oda.I8n.get("home","graphCustomers")
                            },
                            xAxis: {
                                categories: cate
                            },
                            yAxis: {
                                min: 0
                            },
                            plotOptions: {
                                bar: {
                                    dataLabels: {
                                        enabled: true
                                    }
                                }
                            },
                            legend: {
                                layout: 'vertical',
                                align: 'right',
                                verticalAlign: 'top',
                                x: -40,
                                y: 80,
                                floating: true,
                                borderWidth: 1,
                                backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
                                shadow: true
                            },
                            credits: {
                                enabled: false
                            },
                            series: [{
                                name: $.Oda.I8n.get("home","graphCustomers"),
                                data: series
                            }]
                        });
                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.displayReportCustomers : " + er.message);
                        return null;
                    }
                },
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                displayReportExpTimeSlice: function () {
                    try {
                        var datas = {};

                        var strHtml = $.Oda.Display.TemplateHtml.create({
                            template : "tlpDivReportExpTimeSlice"
                        });
                        $.Oda.Display.render({id:"divReport", html: strHtml});

                        for(var index in $.Oda.App.Controller.BonitaActivities){
                            var elt = $.Oda.App.Controller.BonitaActivities[index];
                            var href = elt.customer.links[0].href;
                            var tabHref = href.split("/");
                            var idDeliv = tabHref[tabHref.length-2];
                            elt.idDeliv = idDeliv;
                        }

                        var req = "SELECT workHours, consultant, count(*) as nb FROM ? WHERE 1=1 AND category = 'EXP' GROUP BY workHours, consultant";
                        var result = alasql(req,[$.Oda.App.Controller.BonitaActivities]);

                        var req = "SELECT DISTINCT workHours FROM ? ORDER BY workHours asc";
                        var workHours = alasql(req,[result]);

                        var tabWorkHours = [];
                        var tabIndexWorkHours = {};
                        for(var index in workHours){
                            tabIndexWorkHours[workHours[index].workHours] = index;
                            tabWorkHours.push(workHours[index].workHours);
                        }

                        var req = "SELECT DISTINCT consultant FROM ? ORDER BY consultant";
                        var consultants = alasql(req,[result]);

                        var tabConsultants = [];
                        for(var index in consultants){
                            tabConsultants.push(consultants[index].consultant);
                        }

                        var series = [];
                        var seriesO = [];

                        for(var indexConsultant in tabConsultants){
                            var serie = {
                                name: tabConsultants[indexConsultant],
                                data: []
                            }
                            series.push(serie);

                            seriesO[tabConsultants[indexConsultant]] = {};
                            for(var indexWorkHours in tabWorkHours){
                                seriesO[tabConsultants[indexConsultant]][tabWorkHours[indexWorkHours]] = 0;
                            }
                        }

                        for(var index in result){
                            var elt = result[index];
                            seriesO[elt.consultant][elt.workHours] = elt.nb;
                        }

                        var index = 0;
                        for(var keyConsultant in seriesO){
                            for(var keyHours in seriesO[keyConsultant]){
                                series[index].data[tabIndexWorkHours[keyHours]] = seriesO[keyConsultant][keyHours];
                            }
                            index++;
                        }

                        Highcharts.chart('divGraph', {
                            chart: {
                                type: 'column'
                            },
                            title: {
                                text: $.Oda.I8n.get("home","graphExpTimeSlice")
                            },
                            xAxis: {
                                categories: tabWorkHours,
                                crosshair: true
                            },
                            yAxis: {
                                min: 0
                            },
                            plotOptions: {
                                column: {
                                    pointPadding: 0.2,
                                    borderWidth: 0
                                }
                            },
                            series: series
                        });

                        return this;
                    } catch (er) {
                        $.Oda.Log.error("$.Oda.App.Controller.Home.displayReportExpTimeSlice : " + er.message);
                        return null;
                    }
                },
            }
        }
    };

    // Initialize
    _init();

})();
