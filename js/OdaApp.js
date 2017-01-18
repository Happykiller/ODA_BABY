/* global er */
//# sourceURL=OdaApp.js
// Library of tools for the exemple
/**
 * @author FRO
 * @date 15/05/08
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
                $.Oda.Router.addRoute("home", {
                    "path" : "partials/home.html",
                    "title" : "home.title",
                    "urls" : ["","home"],
                    "middleWares":["support","auth"],
                    "dependencies" : ["dataTables"]
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
            "Home": {
                /**
                 * @returns {$.Oda.App.Controller.Home}
                 */
                start: function () {
                    try {
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
                                var objDataTable = $.Oda.Tooling.objDataTableFromJsonArray(data);
                                var strhtml = '<table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered hover" id="tabActivities">';
                                strhtml += '<tfoot><tr><th>1</th><th oda-attr="select" oda-attr-value="category">2</th><th oda-attr="select" oda-attr-value="subcategory">3</th><th oda-attr="none">4</th><th oda-attr="none">5</th><th oda-attr="select" oda-attr-value="location">6</th><th oda-attr="select" oda-attr-value="consultant">7</th><th>8</th><th>9</th></tr></tfoot></table>';
                                $('#divTabActivities').html(strhtml);

                                var oTable = $('#tabActivities').dataTable({
                                    "sPaginationType": "full_numbers",
                                    "aaData": objDataTable.data,
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
                                                return row[objDataTable.entete["customer"]].name;
                                            },
                                            "aTargets": [0]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[objDataTable.entete["category"]];
                                            },
                                            "aTargets": [1]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[objDataTable.entete["subcategory"]];
                                            },
                                            "aTargets": [2]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                if (type === 'display') {
                                                    return $.Oda.Date.dateFormat(row[objDataTable.entete["workDate"]], 'dd/mm/yyyy');
                                                }else{
                                                    return row[objDataTable.entete["workDate"]];
                                                }
                                            },
                                            "aTargets": [3]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[objDataTable.entete["workHours"]];
                                            },
                                            "aTargets": [4]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[objDataTable.entete["location"]];
                                            },
                                            "aTargets": [5]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[objDataTable.entete["consultant"]];
                                            },
                                            "aTargets": [6]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[objDataTable.entete["description"]];
                                            },
                                            "aTargets": [7]
                                        },
                                        {
                                            "mRender": function (data, type, row) {
                                                return row[objDataTable.entete["customerDescription"]];
                                            },
                                            "aTargets": [8]
                                        }
                                    ]
                                });

                                // DataTable
                                var table = $('#tabActivities').DataTable();

                                $('#tabActivities tbody').on('click', 'tr', function () {
                                    if ($(this).hasClass('selected')) {
                                        $(this).removeClass('selected');
                                    }
                                    else {
                                        table.$('tr.selected').removeClass('selected');
                                        $(this).addClass('selected');
                                    }
                                });

                                $("#tabActivities tfoot th").each(function (i) {
                                    var valOdaAttri = $(this).attr("oda-attr");
                                    if (valOdaAttri == "select") {
                                        var odaAttriValue = $(this).attr("oda-attr-value");
                                        var indexColl = objDataTable.entete[odaAttriValue];
                                        var select = $('<select data-mini="true"><option></option></select>')
                                            .appendTo($(this).empty())
                                            .on('change', function () {
                                                var val = $(this).val();
                                                table.column(i)
                                                    .search(val ? '^' + $(this).val() + '$' : val, true, false)
                                                    .draw();
                                            });

                                        var coll = table.column(indexColl);
                                        try{
                                            var datas = coll.data().unique().sort();
                                            datas.each(function (d, j) {
                                                select.append('<option value="' + d + '">' + d + '</option>');
                                            });
                                        }catch(e){
                                            $(this).empty()
                                            console.error('error for build list with the coll:'+odaAttriValue);
                                        }
                                    } else if (valOdaAttri !== "none") {
                                        $('<input type="text" placeholder="Search" size="4"/>')
                                            .appendTo($(this).empty())
                                            .on('keyup change', function () {
                                                table
                                                    .column(i)
                                                    .search(this.value)
                                                    .draw();
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
                }
            }
        }
    };

    // Initialize
    _init();

})();
